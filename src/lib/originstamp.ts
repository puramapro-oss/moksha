/**
 * MOKSHA V4 — OriginStamp integration (Tezos free tier)
 * Source of truth: ~/purama/STRIPE_CONNECT_KARMA_V4.md §Règlement
 *
 * OriginStamp.com free tier:
 * - 1000 timestamps/mois gratuits
 * - Blockchain Tezos (pas de fee utilisateur)
 * - Preuve SHA-256 → proof_url public
 *
 * Fallback gracieux: si ORIGINSTAMP_API_KEY absent, stocke le hash SHA-256
 * localement (validité cryptographique préservée, preuve blockchain différée).
 */

import crypto from 'crypto'

export interface StampResult {
  contentHash: string
  originstampHash: string | null
  proofUrl: string | null
  blockchain: string
  fallback: boolean
}

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex')
}

/**
 * Horodate un contenu sur OriginStamp (Tezos).
 * Fallback gracieux si ORIGINSTAMP_API_KEY absent.
 */
export async function stampContent(content: string): Promise<StampResult> {
  const contentHash = hashContent(content)
  const apiKey = process.env.ORIGINSTAMP_API_KEY

  if (!apiKey) {
    // Pas de clé = hash local seulement (sera rattrapé quand clé disponible)
    return {
      contentHash,
      originstampHash: null,
      proofUrl: null,
      blockchain: 'pending',
      fallback: true,
    }
  }

  try {
    const res = await fetch('https://api.originstamp.com/v4/timestamp/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        hash_sha256: contentHash,
        comment: 'MOKSHA règlement jeux-concours',
        notifications: [],
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return {
        contentHash,
        originstampHash: null,
        proofUrl: null,
        blockchain: 'pending',
        fallback: true,
      }
    }

    const data = (await res.json()) as { data?: { hash_string?: string } }
    const hash = data.data?.hash_string ?? contentHash
    return {
      contentHash,
      originstampHash: hash,
      proofUrl: `https://verify.originstamp.com/#/${hash}`,
      blockchain: 'tezos',
      fallback: false,
    }
  } catch {
    return {
      contentHash,
      originstampHash: null,
      proofUrl: null,
      blockchain: 'pending',
      fallback: true,
    }
  }
}

/**
 * Tente de rattraper les règlements non-stampés (tâche CRON ou admin).
 */
export async function verifyStamp(hash: string): Promise<{ verified: boolean; blockchain: string | null }> {
  const apiKey = process.env.ORIGINSTAMP_API_KEY
  if (!apiKey) return { verified: false, blockchain: null }

  try {
    const res = await fetch(`https://api.originstamp.com/v4/timestamp/${hash}`, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return { verified: false, blockchain: null }
    const data = (await res.json()) as { data?: { timestamps?: Array<{ private?: boolean; submitted_at?: number }> } }
    const verified = (data.data?.timestamps?.length ?? 0) > 0
    return { verified, blockchain: verified ? 'tezos' : null }
  } catch {
    return { verified: false, blockchain: null }
  }
}
