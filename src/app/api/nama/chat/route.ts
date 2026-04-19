import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getNamaBusinessSystemPrompt } from '@/lib/nama-business'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODEL = process.env.ANTHROPIC_MODEL_MAIN || 'claude-sonnet-4-6'
const MODEL_FAST = process.env.ANTHROPIC_MODEL_FAST || 'claude-haiku-4-5-20251001'

let _anthropic: Anthropic | null = null
function anthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' })
  }
  return _anthropic
}

interface ChatBody {
  message: string
  conversation_id?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = (await req.json()) as ChatBody
    if (!body.message || body.message.length < 2) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }
    if (body.message.length > 4000) {
      return NextResponse.json({ error: 'Message trop long (max 4000 caractères)' }, { status: 400 })
    }

    const svc = createServiceClient()
    const { data: profile } = await svc
      .from('moksha_profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle<{ plan: string }>()

    const isPaying = profile?.plan && profile.plan !== 'gratuit'
    const model = isPaying ? MODEL : MODEL_FAST
    const maxTokens = isPaying ? 4096 : 1024

    // Quota freemium: 10 msg/j
    if (!isPaying) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const { count } = await svc
        .from('moksha_nama_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user')
        .gte('created_at', dayStart.toISOString())
      if ((count ?? 0) >= 10) {
        return NextResponse.json(
          { error: 'Quota gratuit atteint (10 msg/jour). Passe Premium pour illimité.' },
          { status: 402 },
        )
      }
    }

    // Conversation (nouveau ou existant)
    let conversationId = body.conversation_id ?? null
    if (!conversationId) {
      const { data: conv } = await svc
        .from('moksha_jurisia_conversations') // réutilise table existante
        .insert({ user_id: user.id, titre: body.message.slice(0, 80) })
        .select('id')
        .single<{ id: string }>()
      conversationId = conv?.id ?? null
    }

    // Historique (derniers 20 messages)
    const { data: history } = conversationId
      ? await svc
          .from('moksha_jurisia_messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(20)
      : { data: null }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content),
      })),
      { role: 'user' as const, content: body.message },
    ]

    // Insert user message
    if (conversationId) {
      await svc.from('moksha_jurisia_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: body.message,
      })
    }

    // Streaming SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiStream = anthropic().messages.stream({
            model,
            max_tokens: maxTokens,
            system: getNamaBusinessSystemPrompt(),
            messages,
          })

          let fullText = ''
          for await (const event of aiStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text
              fullText += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
            }
          }

          // Insert assistant message
          if (conversationId && fullText) {
            await svc.from('moksha_jurisia_messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullText,
            })
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: conversationId })}\n\n`),
          )
          controller.close()
        } catch (e) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: e instanceof Error ? e.message : 'stream error' })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur NAMA' }, { status: 500 })
  }
}
