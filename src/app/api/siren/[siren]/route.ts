/**
 * MOKSHA V7.1 — GET /api/siren/[siren]
 * Source: CLAUDE.md V7.1 §36.1
 *
 * Récupère une unité légale INSEE Sirene avec cache 30j (7j fallback) + rate-limit 25/min.
 * Retourne UniteLegaleInfo normalisé MOKSHA (incl. siret_siege si dispo).
 *
 * Status codes idem /api/siret.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getSiren } from '@/lib/insee'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siren: string }> },
) {
  const { siren } = await params
  if (!siren) {
    return NextResponse.json({ error: 'SIREN manquant dans l\'URL' }, { status: 400 })
  }

  const result = await getSiren(siren)

  if (result.ok) {
    return NextResponse.json(
      { ok: true, unite_legale: result.info },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      },
    )
  }

  const httpStatus = (() => {
    switch (result.error.kind) {
      case 'invalid_format':
        return 400
      case 'not_found':
        return 404
      case 'rate_limited':
        return 429
      case 'auth':
        return 502
      case 'network':
      default:
        return 502
    }
  })()

  return NextResponse.json(
    { ok: false, error: result.error.kind, message: result.error.message },
    { status: httpStatus },
  )
}
