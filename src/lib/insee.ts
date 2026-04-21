/**
 * MOKSHA V7.1 — INSEE Sirene API V3.11
 * Source: CLAUDE.md V7.1 §36.1 + STRIPE_CONNECT_KARMA_V4.md V4.1
 *
 * Architecture:
 * - Validation Luhn (SIREN/SIRET) + exception La Poste (SIREN 356 000 000)
 * - Token-bucket 25 req/min (INSEE free tier = 30/min, marge 5 req/min)
 * - Cache Supabase table moksha_siret_cache / moksha_siren_cache
 *   TTL 30j si source=insee, 7j si source=fallback (recherche-entreprises gouv)
 * - Audit calls dans moksha_insee_calls (observabilité + debug rate-limit)
 * - Fallback gracieux vers recherche-entreprises.api.gouv.fr (anonyme)
 *
 * Endpoints:
 * - GET https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}
 * - GET https://api.insee.fr/entreprises/sirene/V3.11/siren/{siren}
 * - Header: X-INSEE-Api-Key-Integration: {INSEE_API_KEY}
 */

import { createServiceClient as buildServiceClient } from './supabase'

type Svc = ReturnType<typeof buildServiceClient>

// ═══════════════════════════════════════════════════════════════════
// TYPES NORMALISÉS (stables côté MOKSHA même si INSEE change)
// ═══════════════════════════════════════════════════════════════════

export type EtablissementInfo = {
  siret: string
  siren: string
  denomination: string
  forme_juridique: string
  forme_juridique_code: string
  code_naf: string
  libelle_naf: string | null
  adresse: {
    numero_voie: string | null
    type_voie: string | null
    libelle_voie: string | null
    complement: string | null
    code_postal: string
    commune: string
    pays: string
    line: string
  }
  etat: 'A' | 'F'
  date_creation: string | null
  is_siege: boolean
  source: 'insee' | 'fallback'
  fetched_at: string
}

export type UniteLegaleInfo = {
  siren: string
  denomination: string
  forme_juridique: string
  forme_juridique_code: string
  code_naf: string
  libelle_naf: string | null
  etat: 'A' | 'C'
  date_creation: string | null
  siret_siege: string | null
  source: 'insee' | 'fallback'
  fetched_at: string
}

export type InseeError =
  | { kind: 'invalid_format'; message: string }
  | { kind: 'not_found'; message: string }
  | { kind: 'rate_limited'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'auth'; message: string }

// ═══════════════════════════════════════════════════════════════════
// FORMES JURIDIQUES INSEE (codes catégorieJuridique → label FR)
// Ref: https://www.insee.fr/fr/information/2028129 (nomenclature 2023)
// ═══════════════════════════════════════════════════════════════════

const FORMES_JURIDIQUES: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '2110': 'Indivision',
  '2120': 'Indivision entre personnes physiques',
  '2220': 'Société créée de fait',
  '2310': 'Société en participation',
  '2385': 'Société en participation entre personnes physiques',
  '2410': 'Fiducie',
  '2900': 'Autre groupement de droit privé non doté de la personnalité morale',
  '3110': 'Représentation commerciale étrangère',
  '3120': 'Société étrangère',
  '3205': 'Organisation internationale',
  '5191': 'Société de caution mutuelle',
  '5202': 'Société en nom collectif',
  '5203': 'Société en nom collectif',
  '5306': 'Société en commandite simple',
  '5307': 'Société en commandite simple',
  '5308': 'Société en commandite par actions',
  '5309': 'Société en commandite par actions',
  '5320': 'SNC',
  '5370': 'Société en commandite simple',
  '5385': 'Société en commandite simple',
  '5410': 'SARL',
  '5415': 'SARL d\'économie mixte',
  '5422': 'SARL immobilière',
  '5426': 'SARL à capital variable',
  '5430': 'SARL coopérative',
  '5431': 'SARL coopérative de construction',
  '5432': 'SARL d\'intérêt collectif agricole',
  '5443': 'SARL unipersonnelle',
  '5451': 'SARL coopérative agricole',
  '5453': 'SARL coopérative artisanale',
  '5454': 'SARL coopérative d\'intérêt maritime',
  '5455': 'SARL coopérative de transport',
  '5458': 'SARL coopérative ouvrière de production (SCOP)',
  '5459': 'SARL union de sociétés coopératives',
  '5460': 'Autre SARL coopérative',
  '5470': 'SARL de pêche artisanale',
  '5485': 'SARL',
  '5498': 'EURL',
  '5499': 'SARL',
  '5505': 'SA à participation ouvrière à conseil d\'administration',
  '5510': 'SA à conseil d\'administration',
  '5515': 'SA d\'économie mixte à conseil d\'administration',
  '5520': 'Fonds à forme sociétale à conseil d\'administration',
  '5522': 'SA immobilière à conseil d\'administration',
  '5525': 'SA immobilière de gestion à conseil d\'administration',
  '5530': 'SA coopérative à conseil d\'administration',
  '5531': 'SA coopérative de construction à conseil d\'administration',
  '5532': 'SA coopérative HLM à conseil d\'administration',
  '5558': 'SA coopérative ouvrière de production (SCOP)',
  '5560': 'Autre SA coopérative à conseil d\'administration',
  '5585': 'SA à conseil d\'administration',
  '5599': 'SA à conseil d\'administration',
  '5605': 'SA à participation ouvrière à directoire',
  '5610': 'SA à directoire',
  '5615': 'SA d\'économie mixte à directoire',
  '5620': 'Fonds à forme sociétale à directoire',
  '5622': 'SA immobilière à directoire',
  '5625': 'SA immobilière de gestion à directoire',
  '5630': 'SA coopérative à directoire',
  '5631': 'SA coopérative de construction à directoire',
  '5632': 'SA coopérative HLM à directoire',
  '5642': 'SA d\'attribution à directoire',
  '5670': 'SA de crédit immobilier à directoire',
  '5685': 'SA à directoire',
  '5699': 'SA à directoire',
  '5710': 'SAS',
  '5720': 'SASU',
  '5770': 'Société d\'exercice libéral par actions simplifiée',
  '5785': 'Société d\'exercice libéral par actions simplifiée',
  '5800': 'Société européenne',
  '6100': 'Caisse d\'épargne et de prévoyance',
  '6210': 'Groupement européen d\'intérêt économique',
  '6220': 'Groupement d\'intérêt économique',
  '6316': 'Coopérative d\'utilisation de matériel agricole en commun',
  '6317': 'Société coopérative agricole',
  '6318': 'Union de sociétés coopératives agricoles',
  '6411': 'Société d\'assurance à forme mutuelle',
  '6521': 'SCPI',
  '6532': 'Société civile d\'exploitation agricole',
  '6533': 'GAEC',
  '6534': 'Groupement foncier agricole',
  '6535': 'Groupement agricole foncier',
  '6536': 'Groupement forestier',
  '6537': 'Société civile d\'exploitation agricole',
  '6538': 'Groupement foncier et rural',
  '6539': 'Société civile d\'exploitation forestière',
  '6540': 'SCI',
  '6541': 'SCI de construction-vente',
  '6542': 'Société civile d\'attribution',
  '6543': 'Société civile coopérative de construction',
  '6544': 'Société civile d\'accession progressive à la propriété',
  '6551': 'Société civile de moyens',
  '6554': 'Société civile de placement collectif immobilier',
  '6558': 'Société civile d\'attribution',
  '6560': 'Autre société civile',
  '6561': 'SCP d\'avocats',
  '6562': 'SCP d\'avocats aux conseils',
  '6563': 'SCP d\'avoués d\'appel',
  '6564': 'SCP d\'huissiers',
  '6565': 'SCP de notaires',
  '6566': 'SCP de commissaires-priseurs',
  '6567': 'SCP de greffiers de tribunal de commerce',
  '6568': 'SCP de conseils juridiques',
  '6569': 'SCP de commissaires aux comptes',
  '6571': 'SCP de médecins',
  '6572': 'SCP de dentistes',
  '6573': 'SCP d\'infirmiers',
  '6574': 'SCP de masseurs-kinésithérapeutes',
  '6575': 'SCP de directeurs de laboratoire',
  '6576': 'SCP de vétérinaires',
  '6577': 'SCP de géomètres experts',
  '6578': 'SCP d\'architectes',
  '6585': 'Autre société civile professionnelle',
  '6588': 'Société civile laitière',
  '6589': 'Société civile de moyens',
  '6595': 'Caisse locale de crédit mutuel',
  '6596': 'Caisse de crédit agricole mutuel',
  '6597': 'Société civile à capital variable',
  '6598': 'Autre société civile',
  '6599': 'Société civile',
  '6901': 'Autre personne morale de droit privé',
  '7111': 'Autorité constitutionnelle',
  '7112': 'Autorité administrative ou publique indépendante',
  '7113': 'Ministère',
  '7120': 'Service central d\'un ministère',
  '7150': 'Service du ministère de la défense',
  '7160': 'Service déconcentré à compétence nationale d\'un ministère (hors défense)',
  '7171': 'Service déconcentré de l\'État à compétence régionale',
  '7172': 'Service déconcentré de l\'État à compétence départementale',
  '7179': 'Autre service déconcentré de l\'État',
  '7190': 'Ecole nationale',
  '7210': 'Commune',
  '7220': 'Département',
  '7225': 'Collectivité d\'outre-mer',
  '7229': 'Autre collectivité territoriale',
  '7230': 'Région',
  '7312': 'Commune associée',
  '7313': 'Section de commune',
  '7314': 'Ensemble urbain',
  '7321': 'Association syndicale autorisée',
  '7322': 'Association foncière urbaine',
  '7323': 'Association foncière de remembrement',
  '7331': 'Établissement public local d\'enseignement',
  '7340': 'Pôle métropolitain',
  '7341': 'Secteur de commune',
  '7342': 'District urbain',
  '7343': 'Communauté urbaine',
  '7344': 'Métropole',
  '7345': 'SIVOM',
  '7346': 'Communauté de communes',
  '7347': 'Communauté d\'agglomération',
  '7348': 'Communauté ou syndicat d\'agglomération nouvelle',
  '7349': 'Autre établissement public local de coopération non spécialisé ou entente',
  '7351': 'Institution interdépartementale',
  '7352': 'Institution interrégionale',
  '7353': 'SIVU',
  '7354': 'Syndicat mixte fermé',
  '7355': 'Syndicat mixte ouvert',
  '7356': 'Commission syndicale pour la gestion des biens indivis des communes',
  '7357': 'Pôle d\'équilibre territorial et rural',
  '7361': 'Centre communal d\'action sociale',
  '7362': 'Caisse des écoles',
  '7363': 'Caisse de crédit municipal',
  '7364': 'EPA hospitalier',
  '7365': 'Syndicat interhospitalier',
  '7366': 'EPA autre',
  '7371': 'Office public d\'habitation à loyer modéré (OPHLM)',
  '7372': 'Service départemental d\'incendie et de secours',
  '7373': 'Établissement public local social et médico-social',
  '7378': 'Établissement public local pour la gestion d\'un domaine de pêche',
  '7379': 'Autre EPA local ou institution locale',
  '7381': 'Organisme consulaire',
  '7382': 'EPIC de l\'État',
  '7383': 'EPIC',
  '7384': 'Autre EPA national',
  '7385': 'Autre établissement public administratif national',
  '7389': 'Établissement public national',
  '7410': 'GIP',
  '7430': 'Établissement public des cultes d\'Alsace-Lorraine',
  '7450': 'Établissement public administratif, cercle et foyer dans les armées',
  '7470': 'GIP',
  '7490': 'Autre personne morale de droit administratif',
  '8110': 'Régime général de la sécurité sociale',
  '8120': 'Régime spécial de la sécurité sociale',
  '8130': 'Institution de retraite complémentaire',
  '8140': 'Mutualité sociale agricole',
  '8150': 'Régime maladie des non-salariés non agricoles',
  '8160': 'Régime vieillesse ne dépendant pas du régime général',
  '8170': 'Régime d\'assurance chômage',
  '8190': 'Autre régime de prévoyance sociale',
  '8210': 'Mutuelle',
  '8250': 'Assurance mutuelle agricole',
  '8290': 'Autre organisme mutualiste',
  '8310': 'Comité central d\'entreprise',
  '8311': 'Comité social et économique (CSE)',
  '8320': 'Comité d\'établissement',
  '8410': 'Syndicat de salariés',
  '8420': 'Syndicat patronal',
  '8450': 'Ordre professionnel ou assimilé',
  '8470': 'Centre technique industriel ou comité professionnel du développement économique',
  '8490': 'Autre organisme professionnel',
  '8510': 'Institution de prévoyance',
  '8520': 'Institution de retraite supplémentaire',
  '9110': 'Syndicat de copropriété',
  '9150': 'Association syndicale libre',
  '9220': 'Association déclarée',
  '9221': 'Association déclarée d\'insertion par l\'économique',
  '9222': 'Association intermédiaire',
  '9223': 'Groupement d\'employeurs',
  '9224': 'Association d\'avocats à responsabilité professionnelle individuelle',
  '9230': 'Association non déclarée',
  '9240': 'Congrégation',
  '9260': 'Association de droit local',
  '9300': 'Fondation',
  '9900': 'Autre personne morale de droit privé non dénommée ailleurs',
  '9970': 'Groupement de coopération sanitaire à gestion publique',
}

function labelFormeJuridique(code: string | null | undefined): string {
  if (!code) return 'Non communiqué'
  return FORMES_JURIDIQUES[code] ?? `Catégorie juridique ${code}`
}

// ═══════════════════════════════════════════════════════════════════
// VALIDATION SIRET / SIREN (Luhn + exception La Poste)
// ═══════════════════════════════════════════════════════════════════

const SIREN_LA_POSTE = '356000000'

export function formatSiret(input: string): string {
  return input.replace(/\s+/g, '').replace(/[^0-9]/g, '')
}

export function formatSiren(input: string): string {
  return input.replace(/\s+/g, '').replace(/[^0-9]/g, '')
}

/**
 * Validation Luhn standard (mod 10) — algorithme utilisé pour SIREN
 * et SIRET (sauf La Poste, voir isValidSiret).
 */
function luhnCheck(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10)
    if (double) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    double = !double
  }
  return sum % 10 === 0
}

export function isValidSiren(siren: string): boolean {
  const s = formatSiren(siren)
  if (s.length !== 9) return false
  return luhnCheck(s)
}

export function isValidSiret(siret: string): boolean {
  const s = formatSiret(siret)
  if (s.length !== 14) return false
  // Exception La Poste : SIREN 356000000, règle = somme des 14 chiffres multiple de 5
  if (s.startsWith(SIREN_LA_POSTE)) {
    const sum = s.split('').reduce((acc, d) => acc + parseInt(d, 10), 0)
    return sum % 5 === 0
  }
  return luhnCheck(s)
}

// ═══════════════════════════════════════════════════════════════════
// TOKEN BUCKET — rate-limit 25 req/min (INSEE free tier = 30/min)
// Module-scope singleton (per-instance en serverless Vercel)
// ═══════════════════════════════════════════════════════════════════

class TokenBucket {
  private tokens: number
  private readonly capacity: number
  private readonly refillPerMs: number
  private lastRefill: number

  constructor(capacity: number, refillPerMinute: number) {
    this.capacity = capacity
    this.tokens = capacity
    this.refillPerMs = refillPerMinute / 60_000
    this.lastRefill = Date.now()
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const add = elapsed * this.refillPerMs
    this.tokens = Math.min(this.capacity, this.tokens + add)
    this.lastRefill = now
  }

  /**
   * Tente de consommer 1 jeton. Si indisponible, attend le temps nécessaire
   * pour régénérer 1 jeton (au plus `maxWaitMs` ms, sinon rejette).
   */
  async take(maxWaitMs = 10_000): Promise<boolean> {
    this.refill()
    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }
    const msToNextToken = Math.ceil((1 - this.tokens) / this.refillPerMs)
    if (msToNextToken > maxWaitMs) return false
    await new Promise((resolve) => setTimeout(resolve, msToNextToken))
    this.refill()
    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }
    return false
  }

  available(): number {
    this.refill()
    return this.tokens
  }
}

const inseeBucket = new TokenBucket(25, 25)

// ═══════════════════════════════════════════════════════════════════
// SUPABASE SERVICE CLIENT (server-side, schema moksha, service_role)
// ═══════════════════════════════════════════════════════════════════

function getServiceClient(): Svc {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role non configuré (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis)')
  }
  return buildServiceClient()
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT — log appel dans moksha_insee_calls
// ═══════════════════════════════════════════════════════════════════

type AuditParams = {
  endpoint: 'siret' | 'siren'
  identifier: string
  status_code?: number | null
  duration_ms: number
  cache_hit: boolean
  rate_limited: boolean
  fallback_used: boolean
  error?: string | null
}

async function logCall(svc: Svc, params: AuditParams): Promise<void> {
  try {
    await svc.from('moksha_insee_calls').insert({
      endpoint: params.endpoint,
      identifier: params.identifier,
      status_code: params.status_code ?? null,
      duration_ms: params.duration_ms,
      cache_hit: params.cache_hit,
      rate_limited: params.rate_limited,
      fallback_used: params.fallback_used,
      error: params.error ?? null,
    })
  } catch {
    // Audit non-bloquant — un échec log ne doit pas casser la requête user
  }
}

// ═══════════════════════════════════════════════════════════════════
// CACHE — read/write moksha_siret_cache et moksha_siren_cache
// ═══════════════════════════════════════════════════════════════════

const TTL_INSEE_SECONDS = 30 * 24 * 3600
const TTL_FALLBACK_SECONDS = 7 * 24 * 3600

async function readSiretCache(svc: Svc, siret: string): Promise<EtablissementInfo | null> {
  const { data } = await svc
    .from('moksha_siret_cache')
    .select('siret, siren, payload, source, fetched_at, expires_at')
    .eq('siret', siret)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (!data) return null
  // Bump last_hit_at non-bloquant (observabilité, pas critique)
  svc
    .from('moksha_siret_cache')
    .update({ last_hit_at: new Date().toISOString() })
    .eq('siret', siret)
    .then(() => null, () => null)
  return data.payload as EtablissementInfo
}

async function writeSiretCache(
  svc: Svc,
  info: EtablissementInfo,
  ttlSeconds: number,
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
  await svc.from('moksha_siret_cache').upsert(
    {
      siret: info.siret,
      siren: info.siren,
      payload: info,
      source: info.source,
      fetched_at: info.fetched_at,
      expires_at: expiresAt,
      hit_count: 0,
      last_hit_at: null,
    },
    { onConflict: 'siret' },
  )
}

async function readSirenCache(svc: Svc, siren: string): Promise<UniteLegaleInfo | null> {
  const { data } = await svc
    .from('moksha_siren_cache')
    .select('siren, payload, source, fetched_at, expires_at')
    .eq('siren', siren)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (!data) return null
  return data.payload as UniteLegaleInfo
}

async function writeSirenCache(
  svc: Svc,
  info: UniteLegaleInfo,
  ttlSeconds: number,
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
  await svc.from('moksha_siren_cache').upsert(
    {
      siren: info.siren,
      payload: info,
      source: info.source,
      fetched_at: info.fetched_at,
      expires_at: expiresAt,
      hit_count: 0,
      last_hit_at: null,
    },
    { onConflict: 'siren' },
  )
}

// ═══════════════════════════════════════════════════════════════════
// INSEE SIRENE V3.11 — fetch + normalisation
// ═══════════════════════════════════════════════════════════════════

// V7.1 patch 21/04/2026 — nouveau portail INSEE :
// l'ancien `/entreprises/sirene/V3.11` retourne "url deprecated, visit https://portail-api.insee.fr/"
// La base actuelle est `/api-sirene/3.11/`.
const INSEE_BASE = 'https://api.insee.fr/api-sirene/3.11'
const FETCH_TIMEOUT_MS = 8_000

type InseeEtablissement = {
  siret?: string
  siren?: string
  etablissementSiege?: boolean
  dateCreationEtablissement?: string
  uniteLegale?: {
    denominationUniteLegale?: string | null
    denominationUsuelle1UniteLegale?: string | null
    sigleUniteLegale?: string | null
    nomUniteLegale?: string | null
    prenom1UniteLegale?: string | null
    categorieJuridiqueUniteLegale?: string
    activitePrincipaleUniteLegale?: string
    etatAdministratifUniteLegale?: string
    dateCreationUniteLegale?: string | null
  }
  adresseEtablissement?: {
    numeroVoieEtablissement?: string | null
    typeVoieEtablissement?: string | null
    libelleVoieEtablissement?: string | null
    complementAdresseEtablissement?: string | null
    codePostalEtablissement?: string | null
    libelleCommuneEtablissement?: string | null
    libellePaysEtrangerEtablissement?: string | null
  }
  periodesEtablissement?: Array<{ etatAdministratifEtablissement?: string }>
}

type InseeUniteLegale = {
  siren?: string
  dateCreationUniteLegale?: string | null
  periodesUniteLegale?: Array<{
    denominationUniteLegale?: string | null
    nomUniteLegale?: string | null
    prenom1UniteLegale?: string | null
    categorieJuridiqueUniteLegale?: string
    activitePrincipaleUniteLegale?: string
    etatAdministratifUniteLegale?: string
    nicSiegeUniteLegale?: string | null
  }>
}

function denominationFromUniteLegale(u: {
  denominationUniteLegale?: string | null
  denominationUsuelle1UniteLegale?: string | null
  sigleUniteLegale?: string | null
  nomUniteLegale?: string | null
  prenom1UniteLegale?: string | null
}): string {
  if (u.denominationUniteLegale) return u.denominationUniteLegale
  if (u.denominationUsuelle1UniteLegale) return u.denominationUsuelle1UniteLegale
  if (u.nomUniteLegale) {
    return [u.prenom1UniteLegale, u.nomUniteLegale].filter(Boolean).join(' ').trim()
  }
  if (u.sigleUniteLegale) return u.sigleUniteLegale
  return 'Dénomination non communiquée'
}

function normalizeAdresse(a: NonNullable<InseeEtablissement['adresseEtablissement']>): EtablissementInfo['adresse'] {
  const numero = a.numeroVoieEtablissement ?? null
  const type = a.typeVoieEtablissement ?? null
  const libelle = a.libelleVoieEtablissement ?? null
  const codePostal = a.codePostalEtablissement ?? ''
  const commune = a.libelleCommuneEtablissement ?? ''
  const pays = a.libellePaysEtrangerEtablissement ?? 'FRANCE'
  const parts = [numero, type, libelle].filter(Boolean).join(' ').trim()
  const line = [parts, codePostal, commune].filter(Boolean).join(' ').trim()
  return {
    numero_voie: numero,
    type_voie: type,
    libelle_voie: libelle,
    complement: a.complementAdresseEtablissement ?? null,
    code_postal: codePostal,
    commune,
    pays,
    line,
  }
}

function mapInseeEtablissement(e: InseeEtablissement, source: 'insee' | 'fallback'): EtablissementInfo {
  const unite = e.uniteLegale ?? {}
  const formeCode = unite.categorieJuridiqueUniteLegale ?? ''
  const etatRaw = unite.etatAdministratifUniteLegale ?? 'A'
  const derniereEtatEtab = e.periodesEtablissement?.[0]?.etatAdministratifEtablissement
  const etat: 'A' | 'F' = derniereEtatEtab === 'F' || etatRaw === 'C' ? 'F' : 'A'
  return {
    siret: String(e.siret ?? ''),
    siren: String(e.siren ?? ''),
    denomination: denominationFromUniteLegale(unite),
    forme_juridique: labelFormeJuridique(formeCode),
    forme_juridique_code: formeCode,
    code_naf: unite.activitePrincipaleUniteLegale ?? '',
    libelle_naf: null,
    adresse: e.adresseEtablissement ? normalizeAdresse(e.adresseEtablissement) : {
      numero_voie: null, type_voie: null, libelle_voie: null, complement: null,
      code_postal: '', commune: '', pays: 'FRANCE', line: '',
    },
    etat,
    date_creation: unite.dateCreationUniteLegale ?? e.dateCreationEtablissement ?? null,
    is_siege: e.etablissementSiege === true,
    source,
    fetched_at: new Date().toISOString(),
  }
}

function mapInseeUniteLegale(u: InseeUniteLegale, source: 'insee' | 'fallback'): UniteLegaleInfo {
  const periode = u.periodesUniteLegale?.[0] ?? {}
  const formeCode = periode.categorieJuridiqueUniteLegale ?? ''
  const etatRaw = periode.etatAdministratifUniteLegale ?? 'A'
  const etat: 'A' | 'C' = etatRaw === 'C' ? 'C' : 'A'
  const nic = periode.nicSiegeUniteLegale ?? null
  const siretSiege = nic && u.siren ? `${u.siren}${nic}` : null
  return {
    siren: String(u.siren ?? ''),
    denomination: denominationFromUniteLegale(periode),
    forme_juridique: labelFormeJuridique(formeCode),
    forme_juridique_code: formeCode,
    code_naf: periode.activitePrincipaleUniteLegale ?? '',
    libelle_naf: null,
    etat,
    date_creation: u.dateCreationUniteLegale ?? null,
    siret_siege: siretSiege,
    source,
    fetched_at: new Date().toISOString(),
  }
}

async function fetchInseeSiret(siret: string, apiKey: string): Promise<{
  ok: true
  info: EtablissementInfo
  status: number
} | {
  ok: false
  status: number | null
  error: string
  rateLimited: boolean
}> {
  try {
    const res = await fetch(`${INSEE_BASE}/siret/${siret}`, {
      headers: {
        'X-INSEE-Api-Key-Integration': apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 429) return { ok: false, status: 429, error: 'INSEE rate-limit', rateLimited: true }
    if (res.status === 404) return { ok: false, status: 404, error: 'SIRET inconnu INSEE', rateLimited: false }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status, error: 'INSEE auth refusée', rateLimited: false }
    }
    if (!res.ok) return { ok: false, status: res.status, error: `INSEE HTTP ${res.status}`, rateLimited: false }
    const json = (await res.json()) as { etablissement?: InseeEtablissement }
    if (!json.etablissement) return { ok: false, status: res.status, error: 'Réponse INSEE vide', rateLimited: false }
    return { ok: true, info: mapInseeEtablissement(json.etablissement, 'insee'), status: res.status }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, status: null, error: msg, rateLimited: false }
  }
}

async function fetchInseeSiren(siren: string, apiKey: string): Promise<{
  ok: true
  info: UniteLegaleInfo
  status: number
} | {
  ok: false
  status: number | null
  error: string
  rateLimited: boolean
}> {
  try {
    const res = await fetch(`${INSEE_BASE}/siren/${siren}`, {
      headers: {
        'X-INSEE-Api-Key-Integration': apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 429) return { ok: false, status: 429, error: 'INSEE rate-limit', rateLimited: true }
    if (res.status === 404) return { ok: false, status: 404, error: 'SIREN inconnu INSEE', rateLimited: false }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status, error: 'INSEE auth refusée', rateLimited: false }
    }
    if (!res.ok) return { ok: false, status: res.status, error: `INSEE HTTP ${res.status}`, rateLimited: false }
    const json = (await res.json()) as { uniteLegale?: InseeUniteLegale }
    if (!json.uniteLegale) return { ok: false, status: res.status, error: 'Réponse INSEE vide', rateLimited: false }
    return { ok: true, info: mapInseeUniteLegale(json.uniteLegale, 'insee'), status: res.status }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, status: null, error: msg, rateLimited: false }
  }
}

// ═══════════════════════════════════════════════════════════════════
// FALLBACK — recherche-entreprises.api.gouv.fr (anonyme, gratuit)
// ═══════════════════════════════════════════════════════════════════

type GouvEntreprise = {
  siren?: string
  nom_complet?: string
  nom_raison_sociale?: string
  nature_juridique?: string
  activite_principale?: string
  date_creation?: string
  etat_administratif?: string
  siege?: {
    siret?: string
    numero_voie?: string
    type_voie?: string
    libelle_voie?: string
    complement_adresse?: string
    code_postal?: string
    libelle_commune?: string
    etat_administratif?: string
  }
}

async function fetchGouvBySiret(siret: string): Promise<EtablissementInfo | null> {
  try {
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siret)}&per_page=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) return null
    const data = (await res.json()) as { results?: GouvEntreprise[] }
    const e = data.results?.[0]
    if (!e) return null
    const siege = e.siege ?? {}
    const parts = [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(' ').trim()
    const line = [parts, siege.code_postal, siege.libelle_commune].filter(Boolean).join(' ').trim()
    return {
      siret: siege.siret ?? siret,
      siren: String(e.siren ?? siret.slice(0, 9)),
      denomination: e.nom_complet ?? e.nom_raison_sociale ?? 'Dénomination non communiquée',
      forme_juridique: labelFormeJuridique(e.nature_juridique ?? ''),
      forme_juridique_code: e.nature_juridique ?? '',
      code_naf: e.activite_principale ?? '',
      libelle_naf: null,
      adresse: {
        numero_voie: siege.numero_voie ?? null,
        type_voie: siege.type_voie ?? null,
        libelle_voie: siege.libelle_voie ?? null,
        complement: siege.complement_adresse ?? null,
        code_postal: siege.code_postal ?? '',
        commune: siege.libelle_commune ?? '',
        pays: 'FRANCE',
        line,
      },
      etat: (siege.etat_administratif ?? e.etat_administratif) === 'F' ? 'F' : 'A',
      date_creation: e.date_creation ?? null,
      is_siege: true,
      source: 'fallback',
      fetched_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

async function fetchGouvBySiren(siren: string): Promise<UniteLegaleInfo | null> {
  try {
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siren)}&per_page=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) return null
    const data = (await res.json()) as { results?: GouvEntreprise[] }
    const e = data.results?.[0]
    if (!e || String(e.siren) !== siren) return null
    return {
      siren: String(e.siren),
      denomination: e.nom_complet ?? e.nom_raison_sociale ?? 'Dénomination non communiquée',
      forme_juridique: labelFormeJuridique(e.nature_juridique ?? ''),
      forme_juridique_code: e.nature_juridique ?? '',
      code_naf: e.activite_principale ?? '',
      libelle_naf: null,
      etat: e.etat_administratif === 'C' ? 'C' : 'A',
      date_creation: e.date_creation ?? null,
      siret_siege: e.siege?.siret ?? null,
      source: 'fallback',
      fetched_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════
// API PUBLIQUE — getSiret / getSiren avec cache + rate-limit + fallback
// ═══════════════════════════════════════════════════════════════════

export async function getSiret(siretInput: string): Promise<
  { ok: true; info: EtablissementInfo } | { ok: false; error: InseeError }
> {
  const t0 = Date.now()
  const siret = formatSiret(siretInput)

  if (!isValidSiret(siret)) {
    return { ok: false, error: { kind: 'invalid_format', message: 'SIRET invalide (14 chiffres + Luhn)' } }
  }

  let svc: Svc
  try {
    svc = getServiceClient()
  } catch (e) {
    return { ok: false, error: { kind: 'network', message: e instanceof Error ? e.message : 'Supabase non configuré' } }
  }

  // 1. Cache
  const cached = await readSiretCache(svc, siret).catch(() => null)
  if (cached) {
    await logCall(svc, {
      endpoint: 'siret', identifier: siret, duration_ms: Date.now() - t0,
      cache_hit: true, rate_limited: false, fallback_used: cached.source === 'fallback',
    })
    return { ok: true, info: cached }
  }

  const apiKey = process.env.INSEE_API_KEY

  // 2. INSEE (si clé + rate-limit ok)
  if (apiKey) {
    const allowed = await inseeBucket.take(5_000)
    if (!allowed) {
      // Bucket saturé → bascule fallback direct
      const fallback = await fetchGouvBySiret(siret)
      await logCall(svc, {
        endpoint: 'siret', identifier: siret, duration_ms: Date.now() - t0,
        cache_hit: false, rate_limited: true, fallback_used: true,
        error: fallback ? null : 'fallback vide (bucket saturé)',
      })
      if (fallback) {
        await writeSiretCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
        return { ok: true, info: fallback }
      }
      return { ok: false, error: { kind: 'rate_limited', message: 'Quota INSEE saturé, fallback indisponible' } }
    }

    const insee = await fetchInseeSiret(siret, apiKey)
    if (insee.ok) {
      await writeSiretCache(svc, insee.info, TTL_INSEE_SECONDS).catch(() => null)
      await logCall(svc, {
        endpoint: 'siret', identifier: siret, duration_ms: Date.now() - t0,
        status_code: insee.status, cache_hit: false, rate_limited: false, fallback_used: false,
      })
      return { ok: true, info: insee.info }
    }

    if (insee.status === 404) {
      await logCall(svc, {
        endpoint: 'siret', identifier: siret, duration_ms: Date.now() - t0,
        status_code: 404, cache_hit: false, rate_limited: false, fallback_used: false,
        error: 'not_found',
      })
      return { ok: false, error: { kind: 'not_found', message: 'SIRET non trouvé au répertoire INSEE' } }
    }

    if (insee.status === 401 || insee.status === 403) {
      // Clé révoquée → fallback
      const fallback = await fetchGouvBySiret(siret)
      await logCall(svc, {
        endpoint: 'siret', identifier: siret, duration_ms: Date.now() - t0,
        status_code: insee.status, cache_hit: false, rate_limited: false, fallback_used: true,
        error: insee.error,
      })
      if (fallback) {
        await writeSiretCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
        return { ok: true, info: fallback }
      }
      return { ok: false, error: { kind: 'auth', message: insee.error } }
    }

    // 429 ou 5xx ou network → fallback
    const fallback = await fetchGouvBySiret(siret)
    await logCall(svc, {
      endpoint: 'siret', identifier: siret, duration_ms: Date.now() - t0,
      status_code: insee.status ?? null, cache_hit: false, rate_limited: insee.rateLimited, fallback_used: true,
      error: insee.error,
    })
    if (fallback) {
      await writeSiretCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
      return { ok: true, info: fallback }
    }
    return { ok: false, error: { kind: insee.rateLimited ? 'rate_limited' : 'network', message: insee.error } }
  }

  // 3. Pas de clé INSEE → fallback direct
  const fallback = await fetchGouvBySiret(siret)
  await logCall(svc, {
    endpoint: 'siret', identifier: siret, duration_ms: Date.now() - t0,
    cache_hit: false, rate_limited: false, fallback_used: true,
    error: fallback ? null : 'no insee key + fallback empty',
  })
  if (fallback) {
    await writeSiretCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
    return { ok: true, info: fallback }
  }
  return { ok: false, error: { kind: 'not_found', message: 'SIRET introuvable' } }
}

export async function getSiren(sirenInput: string): Promise<
  { ok: true; info: UniteLegaleInfo } | { ok: false; error: InseeError }
> {
  const t0 = Date.now()
  const siren = formatSiren(sirenInput)

  if (!isValidSiren(siren)) {
    return { ok: false, error: { kind: 'invalid_format', message: 'SIREN invalide (9 chiffres + Luhn)' } }
  }

  let svc: Svc
  try {
    svc = getServiceClient()
  } catch (e) {
    return { ok: false, error: { kind: 'network', message: e instanceof Error ? e.message : 'Supabase non configuré' } }
  }

  const cached = await readSirenCache(svc, siren).catch(() => null)
  if (cached) {
    await logCall(svc, {
      endpoint: 'siren', identifier: siren, duration_ms: Date.now() - t0,
      cache_hit: true, rate_limited: false, fallback_used: cached.source === 'fallback',
    })
    return { ok: true, info: cached }
  }

  const apiKey = process.env.INSEE_API_KEY

  if (apiKey) {
    const allowed = await inseeBucket.take(5_000)
    if (!allowed) {
      const fallback = await fetchGouvBySiren(siren)
      await logCall(svc, {
        endpoint: 'siren', identifier: siren, duration_ms: Date.now() - t0,
        cache_hit: false, rate_limited: true, fallback_used: true,
      })
      if (fallback) {
        await writeSirenCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
        return { ok: true, info: fallback }
      }
      return { ok: false, error: { kind: 'rate_limited', message: 'Quota INSEE saturé, fallback indisponible' } }
    }

    const insee = await fetchInseeSiren(siren, apiKey)
    if (insee.ok) {
      await writeSirenCache(svc, insee.info, TTL_INSEE_SECONDS).catch(() => null)
      await logCall(svc, {
        endpoint: 'siren', identifier: siren, duration_ms: Date.now() - t0,
        status_code: insee.status, cache_hit: false, rate_limited: false, fallback_used: false,
      })
      return { ok: true, info: insee.info }
    }

    if (insee.status === 404) {
      await logCall(svc, {
        endpoint: 'siren', identifier: siren, duration_ms: Date.now() - t0,
        status_code: 404, cache_hit: false, rate_limited: false, fallback_used: false,
        error: 'not_found',
      })
      return { ok: false, error: { kind: 'not_found', message: 'SIREN non trouvé au répertoire INSEE' } }
    }

    if (insee.status === 401 || insee.status === 403) {
      const fallback = await fetchGouvBySiren(siren)
      await logCall(svc, {
        endpoint: 'siren', identifier: siren, duration_ms: Date.now() - t0,
        status_code: insee.status, cache_hit: false, rate_limited: false, fallback_used: true,
        error: insee.error,
      })
      if (fallback) {
        await writeSirenCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
        return { ok: true, info: fallback }
      }
      return { ok: false, error: { kind: 'auth', message: insee.error } }
    }

    const fallback = await fetchGouvBySiren(siren)
    await logCall(svc, {
      endpoint: 'siren', identifier: siren, duration_ms: Date.now() - t0,
      status_code: insee.status ?? null, cache_hit: false, rate_limited: insee.rateLimited, fallback_used: true,
      error: insee.error,
    })
    if (fallback) {
      await writeSirenCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
      return { ok: true, info: fallback }
    }
    return { ok: false, error: { kind: insee.rateLimited ? 'rate_limited' : 'network', message: insee.error } }
  }

  const fallback = await fetchGouvBySiren(siren)
  await logCall(svc, {
    endpoint: 'siren', identifier: siren, duration_ms: Date.now() - t0,
    cache_hit: false, rate_limited: false, fallback_used: true,
  })
  if (fallback) {
    await writeSirenCache(svc, fallback, TTL_FALLBACK_SECONDS).catch(() => null)
    return { ok: true, info: fallback }
  }
  return { ok: false, error: { kind: 'not_found', message: 'SIREN introuvable' } }
}

// Exposé pour tests + observabilité
export const __testables = {
  TokenBucket,
  inseeBucket,
  labelFormeJuridique,
  luhnCheck,
  TTL_INSEE_SECONDS,
  TTL_FALLBACK_SECONDS,
}
