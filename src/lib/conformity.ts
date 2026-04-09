// MOKSHA — calcul du score de conformité (10 critères)
type StructureRow = {
  id: string
  user_id: string
  type: 'entreprise' | 'association'
  forme: string | null
  denomination: string | null
  siren: string | null
  adresse_siege: string | null
  capital_social: number | null
  statut: string
  code_ape: string | null
  activite: string | null
  kbis_url: string | null
}

// On accepte n'importe quel client Supabase (browser/server/service-role)
// — l'API publique utilisée ici est commune.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export type ConformityChecks = {
  denomination: boolean
  siege: boolean
  ape: boolean
  activite: boolean
  capital: boolean
  immatricule: boolean
  kbis: boolean
  statut_ok: boolean
  docs: boolean
  rappels: boolean
}

export async function computeStructureScore(sb: AnySupabase, s: StructureRow) {
  const checks: ConformityChecks = {
    denomination: !!s.denomination,
    siege: !!s.adresse_siege,
    ape: !!s.code_ape,
    activite: !!s.activite,
    capital: s.type === 'entreprise' ? (s.capital_social ?? 0) > 0 : true,
    immatricule: s.type === 'entreprise' ? !!s.siren : true,
    kbis: s.statut === 'accepte' ? !!s.kbis_url : true,
    statut_ok: s.statut !== 'refuse',
    docs: true,
    rappels: true,
  }
  const { count: docCount } = await sb
    .from('moksha_documents')
    .select('id', { count: 'exact', head: true })
    .eq('structure_id', s.id)
  checks.docs = (docCount ?? 0) >= 2
  const { count: lateCount } = await sb
    .from('moksha_rappels')
    .select('id', { count: 'exact', head: true })
    .eq('structure_id', s.id)
    .eq('statut', 'actif')
    .lt('date_echeance', new Date().toISOString().slice(0, 10))
  checks.rappels = (lateCount ?? 0) === 0
  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / 10) * 100)
  const color = score >= 80 ? 'vert' : score >= 50 ? 'orange' : 'rouge'
  return { score, color, checks }
}
