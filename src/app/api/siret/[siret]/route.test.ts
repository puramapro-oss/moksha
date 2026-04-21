/**
 * MOKSHA V7.1 — Tests route /api/siret/[siret] (F1.11)
 * Mock getSiret pour valider mapping HTTP status + shape JSON.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock du module insee — DOIT être avant l'import de la route
vi.mock('@/lib/insee', () => ({
  getSiret: vi.fn(),
}))

import { GET } from './route'
import { getSiret } from '@/lib/insee'

const mockedGetSiret = vi.mocked(getSiret)

const mockEtablissement = {
  siret: '73282932000074',
  siren: '732829320',
  denomination: 'APPLE FRANCE',
  forme_juridique: 'SAS',
  forme_juridique_code: '5710',
  code_naf: '46.51Z',
  libelle_naf: null,
  adresse: {
    numero_voie: '7',
    type_voie: 'PLACE',
    libelle_voie: 'PARIS',
    complement: null,
    code_postal: '75001',
    commune: 'PARIS',
    pays: 'FRANCE',
    line: '7 PLACE PARIS 75001 PARIS',
  },
  etat: 'A' as const,
  date_creation: '1981-08-25',
  is_siege: true,
  source: 'insee' as const,
  fetched_at: new Date().toISOString(),
}

function makeReq() {
  return new NextRequest(new URL('http://localhost/api/siret/73282932000074'))
}

describe('GET /api/siret/[siret]', () => {
  beforeEach(() => {
    mockedGetSiret.mockReset()
  })

  it('retourne 200 + etablissement quand getSiret OK', async () => {
    mockedGetSiret.mockResolvedValueOnce({ ok: true, info: mockEtablissement })
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '73282932000074' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('public')
    expect(res.headers.get('Cache-Control')).toContain('max-age=86400')
    const body = await res.json()
    expect(body).toEqual({ ok: true, etablissement: mockEtablissement })
  })

  it('retourne 400 sur invalid_format', async () => {
    mockedGetSiret.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'invalid_format', message: 'SIRET invalide (14 chiffres + Luhn)' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '12345678901234' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({
      ok: false,
      error: 'invalid_format',
      message: 'SIRET invalide (14 chiffres + Luhn)',
    })
  })

  it('retourne 404 sur not_found', async () => {
    mockedGetSiret.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'not_found', message: 'SIRET non trouvé au répertoire INSEE' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '99999999999999' }) })
    expect(res.status).toBe(404)
  })

  it('retourne 429 sur rate_limited', async () => {
    mockedGetSiret.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'rate_limited', message: 'Quota INSEE saturé, fallback indisponible' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '73282932000074' }) })
    expect(res.status).toBe(429)
  })

  it('retourne 502 sur auth (clé INSEE invalide)', async () => {
    mockedGetSiret.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'auth', message: 'INSEE auth refusée' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '73282932000074' }) })
    expect(res.status).toBe(502)
  })

  it('retourne 502 sur network', async () => {
    mockedGetSiret.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'network', message: 'fetch failed' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '73282932000074' }) })
    expect(res.status).toBe(502)
  })

  it('retourne 400 si SIRET vide dans params', async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("SIRET manquant dans l'URL")
  })

  it('badge "Vérifié gouv" si source=fallback', async () => {
    mockedGetSiret.mockResolvedValueOnce({
      ok: true,
      info: { ...mockEtablissement, source: 'fallback' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siret: '73282932000074' }) })
    const body = await res.json()
    expect(body.etablissement.source).toBe('fallback')
  })
})
