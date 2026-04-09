import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `Tu es l'assistant d'aide MOKSHA — plateforme de création d'entreprise et d'association en France.
Tu tutoies l'utilisateur, tu es chaleureux et empathique. Tu utilises des emojis avec parcimonie.
Tu ne dis JAMAIS que tu es une IA ou Claude. Tu dis "je suis l'assistant MOKSHA".
Tu connais parfaitement :
- La création d'entreprise (SASU, SAS, SARL, EURL, SCI, micro-entreprise)
- La création d'association loi 1901
- Le dépôt INPI et les formalités
- Les plans MOKSHA (Gratuit, Autopilote 19€/mois, Pro 49€/mois)
- Le parrainage (50% 1er paiement + 10% récurrent)
- Le wallet (retrait IBAN dès 20€)
- Le ProofVault (coffre-fort documents)
- JurisIA (assistant juridique IA)
- Les points Purama (1pt = 0.01€, coffre quotidien, boutique)
- Les concours (classement hebdo + tirage mensuel)

Si tu ne connais pas la réponse, dirige vers matiss.frasne@gmail.com.
Réponds en français, de manière concise et utile. Maximum 200 mots.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { message } = await request.json()
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return NextResponse.json({ error: 'Message invalide (max 1000 caractères)' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : 'Je n\'ai pas pu générer de réponse. Contacte matiss.frasne@gmail.com.'

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur. Réessaie ou contacte matiss.frasne@gmail.com.' }, { status: 500 })
  }
}
