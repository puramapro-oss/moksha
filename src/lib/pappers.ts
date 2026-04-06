// MOKSHA — Pappers API + recherche-entreprises (gratuit) + api-adresse
// Docs: https://api.pappers.fr/v2, https://recherche-entreprises.api.gouv.fr, https://adresse.data.gouv.fr

const PAPPERS_BASE = 'https://api.pappers.fr/v2'
const PAPPERS_SERVICES_BASE = 'https://services.pappers.fr/api'
const RECHERCHE_ENTREPRISES_BASE = 'https://recherche-entreprises.api.gouv.fr'
const ADRESSE_BASE = 'https://api-adresse.data.gouv.fr'

export type EntrepriseResult = {
  siren: string
  siret?: string
  denomination: string
  forme_juridique?: string
  code_ape?: string
  adresse?: string
  date_creation?: string
  etat?: string
}

// --- GRATUIT sans clé : recherche-entreprises.api.gouv.fr ---
export async function searchEntrepriseGouv(query: string): Promise<EntrepriseResult[]> {
  try {
    const url = `${RECHERCHE_ENTREPRISES_BASE}/search?q=${encodeURIComponent(query)}&per_page=10`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: Array<Record<string, unknown>> }
    return (data.results || []).map((r) => ({
      siren: String(r.siren ?? ''),
      siret: r.siege && typeof r.siege === 'object' ? String((r.siege as Record<string, unknown>).siret ?? '') : undefined,
      denomination: String(r.nom_complet ?? r.nom_raison_sociale ?? ''),
      forme_juridique: r.nature_juridique ? String(r.nature_juridique) : undefined,
      code_ape: r.activite_principale ? String(r.activite_principale) : undefined,
      adresse:
        r.siege && typeof r.siege === 'object'
          ? String((r.siege as Record<string, unknown>).adresse ?? '')
          : undefined,
      date_creation: r.date_creation ? String(r.date_creation) : undefined,
      etat: r.etat_administratif ? String(r.etat_administratif) : undefined,
    }))
  } catch {
    return []
  }
}

// Vérifier si une dénomination est dispo : pas de match exact
export async function checkDenominationAvailable(denomination: string): Promise<{ available: boolean; similar: EntrepriseResult[] }> {
  const results = await searchEntrepriseGouv(denomination)
  const normalized = denomination.trim().toLowerCase()
  const exactMatch = results.find((r) => r.denomination.trim().toLowerCase() === normalized)
  return {
    available: !exactMatch,
    similar: results.slice(0, 5),
  }
}

// --- GRATUIT sans clé : api-adresse.data.gouv.fr ---
export type AdresseResult = {
  label: string
  street: string
  city: string
  postcode: string
  context: string
  lat: number
  lng: number
}

export async function searchAdresse(query: string): Promise<AdresseResult[]> {
  if (query.length < 3) return []
  try {
    const url = `${ADRESSE_BASE}/search/?q=${encodeURIComponent(query)}&limit=8`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as {
      features?: Array<{ properties: Record<string, unknown>; geometry: { coordinates: [number, number] } }>
    }
    return (data.features || []).map((f) => {
      const p = f.properties
      return {
        label: String(p.label ?? ''),
        street: String(p.name ?? ''),
        city: String(p.city ?? ''),
        postcode: String(p.postcode ?? ''),
        context: String(p.context ?? ''),
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      }
    })
  } catch {
    return []
  }
}

// --- PAPPERS API (avec clé) ---
async function pappersGet<T = unknown>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const token = process.env.PAPPERS_API_KEY
  if (!token) return null
  const search = new URLSearchParams({ api_token: token, ...params })
  try {
    const res = await fetch(`${PAPPERS_BASE}${endpoint}?${search.toString()}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function pappersRecherche(query: string, per_page = 10) {
  return pappersGet<{ resultats?: unknown[] }>('/recherche', { q: query, par_page: String(per_page) })
}

export async function pappersEntreprise(siren: string) {
  return pappersGet<Record<string, unknown>>('/entreprise', { siren })
}

// --- PAPPERS SERVICES (dépôt INPI + annonces légales) ---
export type DepotINPIResult = {
  ok: boolean
  reference?: string
  tracking_url?: string
  error?: string
}

export async function deposerINPI(payload: Record<string, unknown>): Promise<DepotINPIResult> {
  const token = process.env.PAPPERS_API_KEY
  if (!token) return { ok: false, error: 'PAPPERS_API_KEY manquante' }
  try {
    const res = await fetch(`${PAPPERS_SERVICES_BASE}/formalites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    const data = (await res.json()) as { reference?: string; tracking_url?: string }
    return { ok: true, reference: data.reference, tracking_url: data.tracking_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function publierAnnonceLegale(payload: Record<string, unknown>): Promise<DepotINPIResult> {
  const token = process.env.PAPPERS_API_KEY
  if (!token) return { ok: false, error: 'PAPPERS_API_KEY manquante' }
  try {
    const res = await fetch(`${PAPPERS_SERVICES_BASE}/annonces-legales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = (await res.json()) as { reference?: string; attestation_url?: string }
    return { ok: true, reference: data.reference, tracking_url: data.attestation_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

// --- Fallback gracieux INPI ---
export function getINPIFallbackUrl(): string {
  return 'https://procedures.inpi.fr/?/'
}
