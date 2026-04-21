/**
 * MOKSHA V7.1 — OpenTimestamps Bitcoin (remplace OriginStamp Tezos retired mai 2025)
 * Source: CLAUDE.md V7.1 §36.2 + STRIPE_CONNECT_KARMA_V4.md V4.1
 *
 * Architecture :
 * - hashContent : SHA-256 standard côté Node natif (crypto)
 * - stampHash : envoie hash aux Calendar Servers OpenTimestamps publics
 *   (Aletsch, Eternity Wall, etc.) — preuve incomplète au retour, ancrée
 *   ensuite dans Bitcoin (~1-2h pour première confirmation)
 * - verifyProof : vérifie qu'un hash a été ancré dans Bitcoin et retourne
 *   blockHeight + timestamp Unix
 * - Audit & terme UI : "Preuve blockchain Purama" (jamais "OpenTimestamps" ni "Bitcoin")
 *
 * Aucune clé API — protocole décentralisé, calendar servers publics gratuits.
 * Vulnérabilités transitives connues (crypto-js PBKDF2 weak, bn.js infinite loop,
 * web3<=1.5.2 dompurify) — usage server-side admin-only sur du contenu maîtrisé,
 * impact écarté. À surveiller pour upgrade quand fork TS-first dispo.
 */

import OpenTimestamps from 'javascript-opentimestamps'
import crypto from 'crypto'

export interface StampResult {
  /** Hash SHA-256 du contenu (hex). */
  contentHash: string
  /** Preuve OpenTimestamps sérialisée en base64 (à stocker en DB). */
  proof: string
  /** Calendar servers ayant accepté la stamp. */
  calendars: string[]
  /** Au stamping initial, l'ancrage Bitcoin n'est pas encore complet (~1-2h). */
  pendingBitcoin: boolean
  stampedAt: string
}

export interface VerifyResult {
  verified: boolean
  /** Hauteur du bloc Bitcoin contenant l'ancrage (si vérifié). */
  blockHeight?: number
  /** Timestamp Unix du bloc (si vérifié). */
  timestamp?: Date
  /** Litecoin / Ethereum si ancrés ailleurs (rare pour MOKSHA). */
  altChains?: { name: string; height: number; timestamp: Date }[]
  /** Si la preuve est encore incomplète (calendar server pas encore ancré dans Bitcoin). */
  pendingUpgrade: boolean
  error?: string
}

/**
 * Hash SHA-256 d'un contenu UTF-8 (hex lowercase 64 chars).
 * Source de vérité cryptographique du règlement / preuve.
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Crée un hash binaire (Buffer) directement utilisable par OpenTimestamps.
 */
function hashBytes(content: string): Buffer {
  return crypto.createHash('sha256').update(content, 'utf8').digest()
}

/**
 * Horodate un contenu sur les Calendar Servers OpenTimestamps publics.
 * Retourne une preuve base64 à stocker en DB. La preuve est INCOMPLETE
 * tant que Bitcoin n'a pas confirmé (~1-2h). Appeler upgrade ultérieurement.
 *
 * @param content - texte à horodater (règlement, preuve mission, etc.)
 * @returns proof base64 + métadonnées
 * @throws si tous les calendar servers échouent
 */
export async function stampContent(content: string): Promise<StampResult> {
  const contentHash = hashContent(content)
  const hash = hashBytes(content)
  const detachedFile = OpenTimestamps.DetachedTimestampFile.fromHash(
    new OpenTimestamps.Ops.OpSHA256(),
    hash,
  )
  await OpenTimestamps.stamp(detachedFile)
  const proofBytes = detachedFile.serializeToBytes()
  const proof = Buffer.from(proofBytes).toString('base64')
  return {
    contentHash,
    proof,
    calendars: ['alice.btc.calendar.opentimestamps.org', 'bob.btc.calendar.opentimestamps.org', 'finney.calendar.eternitywall.com'],
    pendingBitcoin: true,
    stampedAt: new Date().toISOString(),
  }
}

/**
 * Vérifie qu'une preuve correspond bien au contenu et qu'elle est ancrée
 * dans Bitcoin (ou autre blockchain compatible OpenTimestamps).
 *
 * @param content - contenu original (re-hashé en SHA-256 pour comparaison)
 * @param proofBase64 - preuve sérialisée stockée en DB
 */
export async function verifyContent(content: string, proofBase64: string): Promise<VerifyResult> {
  try {
    const hash = hashBytes(content)
    const detachedOriginal = OpenTimestamps.DetachedTimestampFile.fromHash(
      new OpenTimestamps.Ops.OpSHA256(),
      hash,
    )
    const proofBytes = Buffer.from(proofBase64, 'base64')
    const detachedProof = OpenTimestamps.DetachedTimestampFile.deserialize(proofBytes)
    const result = await OpenTimestamps.verify(detachedProof, detachedOriginal)
    if (result.bitcoin) {
      return {
        verified: true,
        blockHeight: result.bitcoin.height,
        timestamp: new Date(result.bitcoin.timestamp * 1000),
        pendingUpgrade: false,
      }
    }
    if (result.litecoin || result.ethereum) {
      const alt = result.litecoin
        ? { name: 'litecoin', height: result.litecoin.height, timestamp: new Date(result.litecoin.timestamp * 1000) }
        : { name: 'ethereum', height: result.ethereum!.height, timestamp: new Date(result.ethereum!.timestamp * 1000) }
      return { verified: true, altChains: [alt], pendingUpgrade: false }
    }
    // Aucune blockchain ancrée → preuve probablement encore en attente
    return {
      verified: false,
      pendingUpgrade: true,
      error: 'Preuve pas encore ancrée dans Bitcoin (upgrade nécessaire ~1-2h après stamp)',
    }
  } catch (e) {
    return {
      verified: false,
      pendingUpgrade: false,
      error: e instanceof Error ? e.message : 'Vérification impossible',
    }
  }
}

/**
 * Tente de récupérer la preuve complète depuis les calendar servers
 * (à appeler ~1h après stampContent pour finaliser l'ancrage Bitcoin).
 * Retourne la nouvelle preuve base64 si upgrade réussi, ou null si toujours pending.
 */
export async function upgradeProof(
  content: string,
  proofBase64: string,
): Promise<{ upgraded: boolean; proof?: string; error?: string }> {
  try {
    const hash = hashBytes(content)
    const proofBytes = Buffer.from(proofBase64, 'base64')
    const detached = OpenTimestamps.DetachedTimestampFile.deserialize(proofBytes)
    // Garantit que le hash est cohérent (sécurité)
    const expectedHash = OpenTimestamps.DetachedTimestampFile.fromHash(
      new OpenTimestamps.Ops.OpSHA256(),
      hash,
    )
    if (Buffer.compare(Buffer.from(detached.fileHash()), Buffer.from(expectedHash.fileHash())) !== 0) {
      return { upgraded: false, error: 'Hash mismatch entre contenu et preuve' }
    }
    const changed = await OpenTimestamps.upgrade(detached)
    if (!changed) return { upgraded: false }
    const newProofBytes = detached.serializeToBytes()
    return { upgraded: true, proof: Buffer.from(newProofBytes).toString('base64') }
  } catch (e) {
    return { upgraded: false, error: e instanceof Error ? e.message : 'Upgrade impossible' }
  }
}

// Exposé pour tests
export const __testables = {
  hashBytes,
}
