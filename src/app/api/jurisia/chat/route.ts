import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getJurisIASystemPrompt } from '@/lib/claude'

export const runtime = 'nodejs'
export const maxDuration = 120

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' })
}

export async function POST(req: NextRequest) {
  try {
    const { messages, conversation_id } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Quota check
    const { data: profile } = await supabase
      .from('moksha_profiles')
      .select('plan, jurisia_questions_today, jurisia_reset_date')
      .eq('id', user.id)
      .single()

    if (profile) {
      const today = new Date().toISOString().slice(0, 10)
      if (profile.jurisia_reset_date !== today) {
        await supabase
          .from('moksha_profiles')
          .update({ jurisia_questions_today: 0, jurisia_reset_date: today })
          .eq('id', user.id)
        profile.jurisia_questions_today = 0
      }
      if (profile.plan === 'gratuit' && (profile.jurisia_questions_today ?? 0) >= 3) {
        return NextResponse.json(
          { error: 'Limite gratuite atteinte (3 questions/jour). Passe à Autopilote pour un accès illimité.' },
          { status: 429 }
        )
      }
    }

    const isFree = profile?.plan === 'gratuit'
    const model = isFree ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-20250514'
    const maxTokens = isFree ? 2048 : 8192

    // Save user msg if conversation_id + auto-titrer la 1re question
    if (conversation_id) {
      const lastUser = messages[messages.length - 1]
      if (lastUser?.role === 'user') {
        await supabase.from('moksha_jurisia_messages').insert({
          conversation_id,
          role: 'user',
          content: lastUser.content,
        })
        // Si c'est le 1er message, mettre le titre = 1ère question (60 chars)
        if (messages.length === 1) {
          const titre = lastUser.content.slice(0, 60).trim() + (lastUser.content.length > 60 ? '…' : '')
          await supabase
            .from('moksha_jurisia_conversations')
            .update({ titre })
            .eq('id', conversation_id)
        }
      }
    }

    const stream = getAnthropic().messages.stream({
      model,
      max_tokens: maxTokens,
      system: getJurisIASystemPrompt(),
      messages,
    })

    const encoder = new TextEncoder()
    let fullText = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullText += event.delta.text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()

          // Persist assistant message
          if (conversation_id) {
            await supabase.from('moksha_jurisia_messages').insert({
              conversation_id,
              role: 'assistant',
              content: fullText,
            })
          }
          // Increment quota
          if (profile) {
            await supabase
              .from('moksha_profiles')
              .update({ jurisia_questions_today: (profile.jurisia_questions_today ?? 0) + 1 })
              .eq('id', user.id)
          }
        } catch (e) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: e instanceof Error ? e.message : 'Erreur' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
