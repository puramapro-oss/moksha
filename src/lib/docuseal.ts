/**
 * DocuSeal client — signature électronique FranceConnect+ / eIDAS
 * Docs : https://www.docuseal.com/docs/api
 *
 * Supporte :
 *  1. DocuSeal Cloud (api.docuseal.com) avec DOCUSEAL_API_KEY
 *  2. DocuSeal self-hosted (DOCUSEAL_URL + DOCUSEAL_API_KEY)
 *  3. Mode local / fallback : génération d'une page de signature interne MOKSHA
 */

const CLOUD_BASE = 'https://api.docuseal.com'

function getBase() {
  return process.env.DOCUSEAL_URL?.replace(/\/$/, '') || CLOUD_BASE
}

export type DocuSealTemplate = { id: number; name: string }
export type DocuSealSubmission = {
  id: number
  slug: string
  status: 'pending' | 'completed' | 'declined' | 'expired'
  audit_log_url?: string
  combined_document_url?: string
  submitters: Array<{
    id: number
    email: string
    status: string
    slug: string
    embed_src?: string
  }>
}

export type CreateSubmissionArgs = {
  template_id?: number
  documents?: Array<{ name: string; file_url: string }>
  submitter: {
    email: string
    name: string
    role?: string
  }
  fields?: Record<string, string | number>
  send_email?: boolean
  metadata?: Record<string, string>
}

type HttpHeaders = Record<string, string>

function headers(): HttpHeaders {
  const key = process.env.DOCUSEAL_API_KEY
  const h: HttpHeaders = { 'Content-Type': 'application/json' }
  if (key) h['X-Auth-Token'] = key
  return h
}

export function isDocuSealConfigured(): boolean {
  return !!process.env.DOCUSEAL_API_KEY
}

/** Crée une soumission (submission) pour signature. */
export async function createSubmission(args: CreateSubmissionArgs): Promise<{
  ok: boolean
  submission?: DocuSealSubmission
  embed_url?: string
  sign_url?: string
  error?: string
}> {
  if (!isDocuSealConfigured()) {
    // Fallback : on renvoie l'URL de signature interne MOKSHA (mode standalone)
    return {
      ok: true,
      sign_url: `/signer/${encodeURIComponent(args.metadata?.demarche_id || 'demo')}`,
    }
  }

  try {
    const body = {
      template_id: args.template_id,
      documents: args.documents,
      submitters: [
        {
          email: args.submitter.email,
          name: args.submitter.name,
          role: args.submitter.role || 'Signataire',
          values: args.fields,
          send_email: args.send_email ?? false,
        },
      ],
      metadata: args.metadata || {},
      send_email: args.send_email ?? false,
    }
    const res = await fetch(`${getBase()}/submissions`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const t = await res.text()
      return { ok: false, error: `DocuSeal HTTP ${res.status}: ${t.slice(0, 200)}` }
    }
    const data = (await res.json()) as DocuSealSubmission | DocuSealSubmission[]
    const submission = Array.isArray(data) ? data[0] : data
    const submitter = submission.submitters?.[0]
    return {
      ok: true,
      submission,
      embed_url: submitter?.embed_src,
      sign_url: submitter?.embed_src || `${getBase().replace('/api', '')}/s/${submitter?.slug}`,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur DocuSeal' }
  }
}

/** Récupère le statut d'une submission. */
export async function getSubmission(id: number): Promise<DocuSealSubmission | null> {
  if (!isDocuSealConfigured()) return null
  try {
    const res = await fetch(`${getBase()}/submissions/${id}`, { headers: headers() })
    if (!res.ok) return null
    return (await res.json()) as DocuSealSubmission
  } catch {
    return null
  }
}

/** Vérifie la signature HMAC d'un webhook DocuSeal (header X-DocuSeal-Signature) */
export async function verifyWebhook(payload: string, signature: string | null): Promise<boolean> {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET
  if (!secret || !signature) return !secret // si pas de secret configuré, on accepte
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return hex === signature.replace(/^sha256=/, '')
  } catch {
    return false
  }
}
