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
  attestation_url?: string
  error?: string
  fallback?: boolean
  fallback_url?: string
}

export type WizardPayload = {
  forme?: string
  mode?: 'standard' | 'express'
  denomination?: string
  nom_commercial?: string
  activite?: string
  code_ape?: string
  adresse?: string
  type_local?: string
  capital?: number
  apport_type?: string
  dirigeant?: {
    prenom?: string
    nom?: string
    date_naissance?: string
    nationalite?: string
    adresse?: string
  }
  // Association
  type?: string
  nom?: string
  objet?: string
  bureau?: Record<string, { prenom?: string; nom?: string; email?: string }>
}

// Formalité de création d'entreprise — délégation INPI via Pappers Services
export async function deposerINPI(
  wizard: WizardPayload,
  documents: Array<{ nom: string; type: string; file_url: string }> = []
): Promise<DepotINPIResult> {
  const token = process.env.PAPPERS_API_KEY
  if (!token) {
    return {
      ok: false,
      error: 'PAPPERS_API_KEY manquante',
      fallback: true,
      fallback_url: getINPIFallbackUrl(wizard),
    }
  }

  // Payload normalisé pour Pappers Services
  const payload = {
    type: 'creation_entreprise',
    forme_juridique: wizard.forme,
    denomination: wizard.denomination,
    nom_commercial: wizard.nom_commercial,
    objet_social: wizard.activite,
    code_ape: wizard.code_ape,
    adresse_siege: wizard.adresse,
    type_local: wizard.type_local,
    capital_social: wizard.capital,
    type_apport: wizard.apport_type,
    dirigeant: wizard.dirigeant,
    mode: wizard.mode ?? 'standard',
    documents: documents.map((d) => ({ nom: d.nom, type: d.type, url: d.file_url })),
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/api/pappers/webhook`,
  }

  try {
    const res = await fetch(`${PAPPERS_SERVICES_BASE}/formalites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-API-Token': token,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      // Fallback gracieux — on renvoie l'URL de repli pour que le client continue
      return {
        ok: false,
        error: `Pappers HTTP ${res.status}: ${text.slice(0, 200)}`,
        fallback: true,
        fallback_url: getINPIFallbackUrl(wizard),
      }
    }

    const data = (await res.json()) as {
      reference?: string
      dossier_id?: string
      tracking_url?: string
      url?: string
    }
    return {
      ok: true,
      reference: data.reference || data.dossier_id,
      tracking_url: data.tracking_url || data.url,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur inconnue',
      fallback: true,
      fallback_url: getINPIFallbackUrl(wizard),
    }
  }
}

// Déclaration association en préfecture — stub Pappers Services (ou fallback service-public.fr)
export async function deposerAssociation(wizard: WizardPayload): Promise<DepotINPIResult> {
  const token = process.env.PAPPERS_API_KEY
  if (!token) {
    return {
      ok: false,
      error: 'PAPPERS_API_KEY manquante',
      fallback: true,
      fallback_url: 'https://www.service-public.fr/associations/vosdroits/R1757',
    }
  }
  const payload = {
    type: 'creation_association',
    type_association: wizard.type,
    nom: wizard.nom,
    objet: wizard.objet,
    adresse_siege: wizard.adresse,
    bureau: wizard.bureau,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/api/pappers/webhook`,
  }
  try {
    const res = await fetch(`${PAPPERS_SERVICES_BASE}/formalites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-API-Token': token,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      return {
        ok: false,
        error: `Pappers HTTP ${res.status}`,
        fallback: true,
        fallback_url: 'https://www.service-public.fr/associations/vosdroits/R1757',
      }
    }
    const data = (await res.json()) as { reference?: string; dossier_id?: string; tracking_url?: string }
    return { ok: true, reference: data.reference || data.dossier_id, tracking_url: data.tracking_url }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur inconnue',
      fallback: true,
      fallback_url: 'https://www.service-public.fr/associations/vosdroits/R1757',
    }
  }
}

// Annonce légale — Pappers Services
export async function publierAnnonceLegale(wizard: WizardPayload): Promise<DepotINPIResult> {
  const token = process.env.PAPPERS_API_KEY
  if (!token) return { ok: false, error: 'PAPPERS_API_KEY manquante' }
  try {
    const res = await fetch(`${PAPPERS_SERVICES_BASE}/annonces-legales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-API-Token': token,
      },
      body: JSON.stringify({
        type_annonce: 'constitution',
        denomination: wizard.denomination,
        forme_juridique: wizard.forme,
        capital_social: wizard.capital,
        adresse_siege: wizard.adresse,
        objet: wizard.activite,
        dirigeant: wizard.dirigeant,
      }),
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = (await res.json()) as { reference?: string; attestation_url?: string }
    return { ok: true, reference: data.reference, attestation_url: data.attestation_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

// Polling statut d'une formalité déposée
export type StatusPollResult = {
  ok: boolean
  statut?: 'brouillon' | 'documents_generes' | 'en_traitement' | 'depose_inpi' | 'accepte' | 'refuse' | 'regularisation'
  avancement?: number
  motif?: string
  kbis_url?: string
}

export async function getDemarcheStatus(reference: string): Promise<StatusPollResult> {
  const token = process.env.PAPPERS_API_KEY
  if (!token) return { ok: false }
  try {
    const res = await fetch(`${PAPPERS_SERVICES_BASE}/formalites/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-API-Token': token,
      },
    })
    if (!res.ok) return { ok: false }
    const data = (await res.json()) as {
      statut?: string
      avancement?: number
      motif?: string
      kbis_url?: string
      documents?: Array<{ type: string; url: string }>
    }
    const mapStatut = (s?: string): StatusPollResult['statut'] => {
      switch (s) {
        case 'en_cours':
        case 'processing':
          return 'en_traitement'
        case 'deposed':
        case 'soumis':
          return 'depose_inpi'
        case 'accepted':
        case 'validee':
          return 'accepte'
        case 'rejected':
        case 'refusee':
          return 'refuse'
        case 'correction':
        case 'regularisation':
          return 'regularisation'
        default:
          return 'en_traitement'
      }
    }
    const kbisDoc = data.documents?.find((d) => d.type === 'kbis' || d.type === 'extrait_kbis')
    return {
      ok: true,
      statut: mapStatut(data.statut),
      avancement: data.avancement,
      motif: data.motif,
      kbis_url: data.kbis_url || kbisDoc?.url,
    }
  } catch {
    return { ok: false }
  }
}

// --- Fallback gracieux INPI ---
export function getINPIFallbackUrl(wizard?: WizardPayload): string {
  const base = 'https://procedures.inpi.fr/'
  if (!wizard) return base
  // Prefill query params qui peuvent être récupérés par le site INPI
  const params = new URLSearchParams()
  if (wizard.denomination) params.set('denomination', wizard.denomination)
  if (wizard.forme) params.set('forme', wizard.forme)
  return `${base}?${params.toString()}`
}
