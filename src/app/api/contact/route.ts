import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100),
  email: z.string().email('Email invalide'),
  subject: z.string().min(3, 'Objet trop court').max(200),
  message: z.string().min(10, 'Message trop court').max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ContactSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Données invalides'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { name, email, subject, message } = parsed.data
    const supabase = createServiceClient()

    await supabase.from('moksha_contact_messages').insert({
      name,
      email,
      subject,
      message,
      sent_at: new Date().toISOString(),
      responded: false,
    })

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'MOKSHA <contact@purama.dev>',
          to: 'matiss.frasne@gmail.com',
          subject: `[MOKSHA Contact] ${subject}`,
          html: `<p><strong>De :</strong> ${name} (${email})</p><p><strong>Sujet :</strong> ${subject}</p><p>${message.replace(/\n/g, '<br>')}</p>`,
        }),
      })
    }

    return NextResponse.json({ message: 'Message envoyé. On te répond sous 24h.' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur. Réessaie ou écris à matiss.frasne@gmail.com' }, { status: 500 })
  }
}
