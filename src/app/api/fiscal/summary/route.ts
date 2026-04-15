import { NextResponse, type NextRequest } from 'next/server'
import { jsPDF } from 'jspdf'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const year = Number(url.searchParams.get('year') || new Date().getFullYear())

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const sb = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'moksha' } }
    )
    const yearStart = `${year}-01-01`
    const yearEnd = `${year + 1}-01-01`

    const { data: txs } = await sb
      .from('moksha_wallet_transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .eq('statut', 'completed')
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd)

    const totals = (txs ?? []).reduce(
      (acc, t) => {
        const amt = Number(t.amount || 0)
        if (t.type === 'prime') acc.primes += amt
        else if (t.type === 'commission') acc.parrainage += amt
        else acc.autres += amt
        return acc
      },
      { primes: 0, parrainage: 0, autres: 0 }
    )
    const total = totals.primes + totals.parrainage + totals.autres

    const { data: profile } = await sb
      .from('moksha_profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('MOKSHA — Récapitulatif annuel', 20, 20)
    doc.setFontSize(11)
    doc.text(`Année : ${year}`, 20, 32)
    doc.text(`Utilisateur : ${profile?.full_name || profile?.email || user.email}`, 20, 40)
    doc.text(`Email : ${profile?.email || user.email}`, 20, 48)

    doc.setFontSize(13)
    doc.text('Gains perçus :', 20, 68)
    doc.setFontSize(11)
    doc.text(`Primes de bienvenue : ${totals.primes.toFixed(2)} €`, 28, 80)
    doc.text(`Commissions de parrainage : ${totals.parrainage.toFixed(2)} €`, 28, 88)
    doc.text(`Autres gains : ${totals.autres.toFixed(2)} €`, 28, 96)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL ${year} : ${total.toFixed(2)} €`, 28, 108)
    doc.setFont('helvetica', 'normal')

    doc.setFontSize(9)
    const note = [
      'Ce document est généré automatiquement et destiné à faciliter ta déclaration.',
      `Seuil de déclaration : 3 000€/an. En dessous, aucune obligation.`,
      'Au-dessus : case 5NG sur impots.gouv.fr, abattement 34% automatique.',
      'MOKSHA — SASU PURAMA, 8 Rue de la Chapelle, 25560 Frasne, art. 293B CGI.',
    ]
    note.forEach((l, i) => doc.text(l, 20, 130 + i * 6))

    const blob = doc.output('arraybuffer')
    return new NextResponse(Buffer.from(blob), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="moksha-recap-${year}.pdf"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
