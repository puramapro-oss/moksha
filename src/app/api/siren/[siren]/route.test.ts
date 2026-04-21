/**
 * MOKSHA V7.1 — Tests route /api/siren/[siren] (F1.11)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/insee', () => ({
  getSiren: vi.fn(),
}))

import { GET } from './route'
import { getSiren } from '@/lib/insee'

const mockedGetSiren = vi.mocked(getSiren)

const mockUniteLegale = {
  siren: '732829320',
  denomination: 'APPLE FRANCE',
  forme_juridique: 'SAS',
  forme_juridique_code: '5710',
  code_naf: '46.51Z',
  libelle_naf: null,
  etat: 'A' as const,
  date_creation: '1981-08-25',
  siret_siege: '73282932000074',
  source: 'insee' as const,
  fetched_at: new Date().toISOString(),
}

function makeReq() {
  return new NextRequest(new URL('http://localhost/api/siren/732829320'))
}

describe('GET /api/siren/[siren]', () => {
  beforeEach(() => {
    mockedGetSiren.mockReset()
  })

  it('retourne 200 + unite_legale quand getSiren OK', async () => {
    mockedGetSiren.mockResolvedValueOnce({ ok: true, info: mockUniteLegale })
    const res = await GET(makeReq(), { params: Promise.resolve({ siren: '732829320' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true, unite_legale: mockUniteLegale })
  })

  it('retourne 400 sur invalid_format', async () => {
    mockedGetSiren.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'invalid_format', message: 'SIREN invalide' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siren: '12345' }) })
    expect(res.status).toBe(400)
  })

  it('retourne 404 sur not_found', async () => {
    mockedGetSiren.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'not_found', message: 'SIREN non trouvé' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siren: '999999999' }) })
    expect(res.status).toBe(404)
  })

  it('retourne 429 sur rate_limited', async () => {
    mockedGetSiren.mockResolvedValueOnce({
      ok: false,
      error: { kind: 'rate_limited', message: 'Quota INSEE saturé' },
    })
    const res = await GET(makeReq(), { params: Promise.resolve({ siren: '732829320' }) })
    expect(res.status).toBe(429)
  })

  it('retourne 400 si SIREN vide', async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ siren: '' }) })
    expect(res.status).toBe(400)
  })

  it('inclut siret_siege dans la réponse', async () => {
    mockedGetSiren.mockResolvedValueOnce({ ok: true, info: mockUniteLegale })
    const res = await GET(makeReq(), { params: Promise.resolve({ siren: '732829320' }) })
    const body = await res.json()
    expect(body.unite_legale.siret_siege).toBe('73282932000074')
  })
})
