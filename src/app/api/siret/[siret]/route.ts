/**
 * MOKSHA V7.1 — GET /api/siret/[siret]
 * Source: CLAUDE.md V7.1 §36.1
 *
 * Récupère un établissement INSEE Sirene avec cache 30j (7j fallback) + rate-limit 25/min.
 * Retourne EtablissementInfo normalisé MOKSHA.
 *
 * Status codes:
 * - 200 OK         : établissement trouvé (cache ou live)
 * - 400 Bad Req    : format SIRET invalide (Luhn ou longueur)
 * - 404 Not Found  : SIRET inexistant au répertoire
 * - 429 Too Many   : rate-limit INSEE saturé + fallback indisponible
 * - 502 Bad Gateway: auth INSEE échouée + fallback indisponible
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getSiret } from '@/lib/insee'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siret: string }> },
) {
  const { siret } = await params
  if (!siret) {
    return NextResponse.json({ error: 'SIRET manquant dans l\'URL' }, { status: 400 })
  }

  const result = await getSiret(siret)

  if (result.ok) {
    return NextResponse.json(
      { ok: true, etablissement: result.info },
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
