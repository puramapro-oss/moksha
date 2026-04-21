/**
 * MOKSHA V7.1 — GET /api/reglement/verify/[id]
 * Source: CLAUDE.md V7.1 §36.2
 *
 * Vérification publique d'un règlement horodaté OpenTimestamps Bitcoin.
 * Endpoint utilisé par la page /reglement (UI "Vérifier la preuve") et
 * exploitable par tout tiers (huissier, juge, journaliste).
 *
 * Récupère le règlement par id, re-télécharge le contenu canonique,
 * vérifie hash + ancrage Bitcoin via OpenTimestamps.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyContent, hashContent, upgradeProof } from '@/lib/opentimestamps'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'ID règlement requis' }, { status: 400 })
  }

  const svc = createServiceClient()
  const { data: reglement, error } = await svc
    .from('moksha_reglements')
    .select('id, version, content_hash, opentimestamps_proof, blockchain, bitcoin_block_height, bitcoin_block_timestamp, content_url, originstamp_hash, originstamp_proof_url, published_at')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 })
  if (!reglement) return NextResponse.json({ error: 'Règlement introuvable' }, { status: 404 })

  // Cas 1 : OpenTimestamps preuve disponible → vérification cryptographique live
  if (reglement.opentimestamps_proof) {
    const url = req.nextUrl.searchParams.get('content_url') ?? reglement.content_url
    let content: string | null = null
    if (url) {
      try {
        const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
        const res = await fetch(fullUrl)
        if (res.ok) content = await res.text()
      } catch {
        content = null
      }
    }

    if (!content) {
      return NextResponse.json(
        {
          ok: true,
          version: reglement.version,
          content_hash: reglement.content_hash,
          blockchain: reglement.blockchain,
          stamp_status: reglement.bitcoin_block_height ? 'confirmed' : 'pending_anchor',
          bitcoin_block_height: reglement.bitcoin_block_height,
          bitcoin_block_timestamp: reglement.bitcoin_block_timestamp,
          message: 'Contenu original indisponible — vérification via hash uniquement.',
          note: 'Pour vérifier, hash SHA-256 du règlement original doit égaler content_hash.',
        },
        { headers: { 'Cache-Control': 'public, max-age=300' } },
      )
    }

    // Re-hash + comparaison
    const localHash = hashContent(content)
    const hashMatch = localHash === reglement.content_hash

    if (!hashMatch) {
      return NextResponse.json(
        {
          ok: false,
          verified: false,
          error: 'hash_mismatch',
          message: `Le contenu actuel ne correspond pas au hash horodaté (publié: ${reglement.content_hash}, calculé: ${localHash}).`,
        },
        { status: 200 },
      )
    }

    const verifyResult = await verifyContent(content, reglement.opentimestamps_proof)

    // Si pending et upgrade_attempted assez ancien, on tente un upgrade léger
    let upgradedProof: string | undefined
    if (!verifyResult.verified && verifyResult.pendingUpgrade && reglement.opentimestamps_proof) {
      const upgrade = await upgradeProof(content, reglement.opentimestamps_proof)
      if (upgrade.upgraded && upgrade.proof) {
        upgradedProof = upgrade.proof
        await svc
          .from('moksha_reglements')
          .update({
            opentimestamps_proof: upgrade.proof,
            upgrade_attempted_at: new Date().toISOString(),
            upgrade_count: 1,
          })
          .eq('id', reglement.id)
        // Re-vérifie avec la preuve upgraded
        const reverify = await verifyContent(content, upgrade.proof)
        if (reverify.verified) {
          await svc
            .from('moksha_reglements')
            .update({
              bitcoin_block_height: reverify.blockHeight,
              bitcoin_block_timestamp: reverify.timestamp?.toISOString(),
            })
            .eq('id', reglement.id)
          return NextResponse.json({
            ok: true,
            verified: true,
            version: reglement.version,
            content_hash: reglement.content_hash,
            hash_match: true,
            blockchain: 'bitcoin',
            stamp_status: 'confirmed',
            bitcoin_block_height: reverify.blockHeight,
            bitcoin_block_timestamp: reverify.timestamp,
            upgraded_now: true,
          })
        }
      }
    }

    return NextResponse.json({
      ok: true,
      verified: verifyResult.verified,
      version: reglement.version,
      content_hash: reglement.content_hash,
      hash_match: true,
      blockchain: 'bitcoin',
      stamp_status: verifyResult.verified ? 'confirmed' : 'pending_anchor',
      bitcoin_block_height: verifyResult.blockHeight ?? reglement.bitcoin_block_height,
      bitcoin_block_timestamp: verifyResult.timestamp ?? reglement.bitcoin_block_timestamp,
      pending_upgrade: verifyResult.pendingUpgrade,
      upgraded_now: Boolean(upgradedProof),
      verification_message: verifyResult.error ?? null,
    })
  }

  // Cas 2 : règlement legacy OriginStamp Tezos → renvoie le proof_url historique
  if (reglement.originstamp_hash) {
    return NextResponse.json({
      ok: true,
      verified: null,
      version: reglement.version,
      content_hash: reglement.content_hash,
      blockchain: reglement.blockchain ?? 'tezos',
      stamp_status: 'legacy_tezos',
      legacy_proof_url: reglement.originstamp_proof_url,
      message: 'Règlement horodaté avant migration V7.1 — vérification via verify.originstamp.com',
    })
  }

  // Cas 3 : règlement sans aucune preuve (incohérent, sécurité)
  return NextResponse.json({
    ok: true,
    verified: false,
    version: reglement.version,
    content_hash: reglement.content_hash,
    stamp_status: 'unstamped',
    message: 'Règlement non horodaté.',
  })
}
