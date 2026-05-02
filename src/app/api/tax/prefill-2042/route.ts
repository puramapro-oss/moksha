import { NextResponse, type NextRequest } from 'next/server'
import { jsPDF } from 'jspdf'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * GET /api/tax/prefill-2042?year=2026
 * V4 Flow 2 — Génère PDF 2042-C-PRO pré-rempli case 5KU/5NG (BNC régime micro).
 * Abattement 34% auto. User valide en 10 secondes sur impots.gouv.fr.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const year = Number(url.searchParams.get('year') || new Date().getFullYear() - 1)

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const svc = createServiceClient()
    const { data: profileRow } = await svc
      .from('moksha_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle<{ full_name: string | null; email: string | null }>()

    const { data: taxProfile } = await svc
      .from('moksha_user_tax_profiles')
      .select('profile_type')
      .eq('user_id', user.id)
      .maybeSingle<{ profile_type: string }>()

    const yearStart = `${year}-01-01`
    const yearEnd = `${year + 1}-01-01`

    const { data: txs } = await svc
      .from('moksha_wallet_transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .eq('statut', 'completed')
      .eq('direction', 'credit')
      .gte('created_at', yearStart)
      .lt('created_at', yearEnd)

    const totals = (txs ?? []).reduce(
      (acc, t) => {
        const amt = Number(t.amount || 0)
        if (String(t.type).startsWith('prime_')) acc.primes += amt
        else if (String(t.type).startsWith('referral_')) acc.parrainage += amt
        else if (String(t.type).startsWith('karma_prize_')) acc.karma += amt
        else if (t.type === 'bourse_inclusion') acc.bourse += amt
        else acc.autres += amt
        return acc
      },
      { primes: 0, parrainage: 0, karma: 0, bourse: 0, autres: 0 },
    )
    const totalBrut = totals.primes + totals.parrainage + totals.karma + totals.autres // bourse exclue (subvention Asso)
    const abattement = totalBrut * 0.34
    const imposable = totalBrut - abattement

    // Génération PDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(255, 61, 0)
    doc.text('MOKSHA', 15, 20)
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Pré-remplissage 2042-C-PRO · Année ${year}`, 15, 27)
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 27, { align: 'right' })

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200)
    doc.line(15, 32, pageWidth - 15, 32)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Identité', 15, 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Nom / Prénom : ${profileRow?.full_name || '[à compléter]'}`, 15, 50)
    doc.text(`Email : ${profileRow?.email || user.email || '[à compléter]'}`, 15, 57)
    doc.text(`Profil fiscal Purama : ${taxProfile?.profile_type || 'non défini'}`, 15, 64)

    // Revenus
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Revenus Purama (BNC régime micro)', 15, 80)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    let y = 90
    const rows: Array<[string, number]> = [
      ['Primes de bienvenue (abonnements)', totals.primes],
      ['Commissions de parrainage', totals.parrainage],
      ['Gains KARMA (jeux-concours)', totals.karma],
      ['Autres revenus Purama', totals.autres],
    ]
    for (const [label, amount] of rows) {
      doc.text(label, 15, y)
      doc.text(`${amount.toFixed(2)} €`, pageWidth - 15, y, { align: 'right' })
      y += 7
    }
    doc.setDrawColor(200, 200, 200)
    doc.line(15, y, pageWidth - 15, y)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL revenus bruts', 15, y)
    doc.text(`${totalBrut.toFixed(2)} €`, pageWidth - 15, y, { align: 'right' })
    y += 10

    doc.setFont('helvetica', 'normal')
    doc.text('Abattement forfaitaire 34 %', 15, y)
    doc.text(`- ${abattement.toFixed(2)} €`, pageWidth - 15, y, { align: 'right' })
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 61, 0)
    doc.text('Revenu imposable à reporter (case 5KU/5NG)', 15, y)
    doc.text(`${imposable.toFixed(2)} €`, pageWidth - 15, y, { align: 'right' })
    y += 15

    // Instructions
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Comment déclarer en 10 secondes', 15, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const instructions = [
      '1. Connecte-toi sur impots.gouv.fr → Espace particulier → Mes revenus.',
      '2. Déclaration 2042-C-PRO → "Revenus non commerciaux non professionnels".',
      `3. Case 5NG (régime micro BNC) : reporte ${totalBrut.toFixed(2)} €.`,
      '4. Ton avis d\'imposition appliquera l\'abattement 34 % automatiquement.',
      '5. Garde ce PDF comme justificatif (valide 10 ans, RGPD).',
    ]
    for (const line of instructions) {
      doc.text(line, 15, y)
      y += 6
    }

    // Mention légale
    y = doc.internal.pageSize.getHeight() - 25
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(
      'Document généré automatiquement par MOKSHA (SASU PURAMA, RCS Besançon, 8 Rue de la Chapelle, 25560 Frasne).',
      pageWidth / 2,
      y,
      { align: 'center' },
    )
    doc.text(
      'Ce document est informatif. Seule l\'administration fiscale fait foi. Consulte un expert-comptable si nécessaire.',
      pageWidth / 2,
      y + 5,
      { align: 'center' },
    )

    // Enregistre la déclaration
    await svc.from('moksha_tax_declarations').upsert(
      {
        user_id: user.id,
        year,
        period: `${year}-annual`,
        declaration_type: '2042_C_PRO',
        amount_declared_eur: imposable,
        status: 'draft',
      },
      { onConflict: 'user_id,year,period,declaration_type' },
    )

    const pdfBuffer = doc.output('arraybuffer')
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="moksha-2042-c-pro-${year}.pdf"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur génération PDF'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
