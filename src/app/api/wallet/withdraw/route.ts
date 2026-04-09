import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { WALLET_MIN_WITHDRAWAL } from '@/lib/constants'
import { sendEmail } from '@/lib/resend'

export const runtime = 'nodejs'

const ibanRegex = /^FR\d{2}[A-Z0-9 ]{20,30}$/i

const Schema = z.object({
  iban: z.string().min(15).max(40).regex(ibanRegex, 'IBAN français invalide (FR…)'),
  bic: z.string().min(8).max(11),
  titulaire: z.string().min(2).max(120),
  amount: z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = Schema.safeParse({
      ...body,
      iban: typeof body.iban === 'string' ? body.iban.replace(/\s+/g, '').toUpperCase() : body.iban,
      amount: Number(body.amount),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Données invalides' }, { status: 400 })
    }
    const { iban, bic, titulaire, amount } = parsed.data

    if (amount < WALLET_MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum ${WALLET_MIN_WITHDRAWAL}€` }, { status: 400 })
    }

    // Solde disponible
    const svc = createServiceClient()
    const { data: txs } = await svc
      .from('moksha_wallet_transactions')
      .select('type, amount, statut')
      .eq('user_id', user.id)

    const solde = (txs || []).reduce((sum, t) => {
      if (t.statut !== 'completed' && t.type !== 'retrait') return sum
      const a = Number(t.amount)
      if (t.type === 'retrait') {
        // pending ou completed: réduit le solde
        return sum - Math.abs(a)
      }
      return sum + a
    }, 0)

    if (amount > solde) {
      return NextResponse.json({ error: `Solde insuffisant (${solde.toFixed(2)}€)` }, { status: 400 })
    }

    // Mutex naïf : empêcher 2 demandes pending simultanées
    const { data: existingPending } = await svc
      .from('moksha_wallet_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'retrait')
      .eq('statut', 'pending')
      .limit(1)
    if (existingPending && existingPending.length > 0) {
      return NextResponse.json({ error: 'Une demande de retrait est déjà en attente' }, { status: 409 })
    }

    // Insertion transaction pending (montant négatif)
    const { error: insErr } = await svc.from('moksha_wallet_transactions').insert({
      user_id: user.id,
      type: 'retrait',
      amount: -Math.abs(amount),
      description: `Retrait IBAN ${iban.slice(0, 4)}…${iban.slice(-4)} — ${titulaire}`,
      statut: 'pending',
    })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    // Notification user
    await svc.from('moksha_notifications').insert({
      user_id: user.id,
      type: 'wallet',
      titre: 'Demande de retrait reçue',
      message: `Ta demande de retrait de ${amount.toFixed(2)}€ a été enregistrée. Versement sous 3 jours ouvrés.`,
      action_url: '/dashboard/wallet',
    })

    // Email admin
    await sendEmail({
      to: 'matiss.frasne@gmail.com',
      subject: `[MOKSHA] Retrait ${amount.toFixed(2)}€ — ${user.email}`,
      html: `
        <h2>Nouvelle demande de retrait</h2>
        <p><strong>Utilisateur :</strong> ${user.email}</p>
        <p><strong>Montant :</strong> ${amount.toFixed(2)} €</p>
        <p><strong>Titulaire :</strong> ${titulaire}</p>
        <p><strong>IBAN :</strong> ${iban}</p>
        <p><strong>BIC :</strong> ${bic}</p>
        <p>Va dans /admin/wallet pour valider ou refuser.</p>
      `,
    })

    return NextResponse.json({ ok: true, message: 'Demande enregistrée. Versement sous 3 jours ouvrés.' })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
