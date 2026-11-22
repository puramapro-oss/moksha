import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { REGLEMENT_CONTENT } from '@/app/reglement/content'
import { GET } from './route'

const mocks = vi.hoisted(() => ({
  single: vi.fn(),
  from: vi.fn(),
  verify: vi.fn(),
  upgrade: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ createServiceClient: () => ({ from: mocks.from }) }))
vi.mock('@/lib/constants', () => ({ APP_URL: 'https://moksha.purama.dev' }))
vi.mock('@/lib/opentimestamps', () => ({
  hashContent: (content: string) => crypto.createHash('sha256').update(content).digest('hex'),
  verifyContent: mocks.verify,
  upgradeProof: mocks.upgrade,
}))

const hash = (content: string) => crypto.createHash('sha256').update(content).digest('hex')
const base = {
  id: 'reglement-test', version: '1.0', content_hash: hash(REGLEMENT_CONTENT),
  opentimestamps_proof: 'offline-fixture', content_url: '/reglement?v=1.0',
  blockchain: 'bitcoin', bitcoin_block_height: null, bitcoin_block_timestamp: null,
}
const fetchMock = vi.fn<typeof fetch>()
function record(patch: Record<string, unknown> = {}) {
  mocks.single.mockResolvedValue({ data: { ...base, ...patch }, error: null })
}
async function request(url = 'https://moksha.purama.dev/api/reglement/verify/reglement-test') {
  return GET(new NextRequest(url), { params: Promise.resolve({ id: 'reglement-test' }) })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://configured-project.supabase.co')
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: mocks.single }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  mocks.from.mockReturnValue(query)
  record()
  mocks.verify.mockResolvedValue({ verified: true, pendingUpgrade: false, blockHeight: 900000 })
  mocks.upgrade.mockResolvedValue({ upgraded: false })
  fetchMock.mockResolvedValue(new Response(REGLEMENT_CONTENT))
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('public regulation verification: server-side request boundaries', () => {
  it.each([
    'http://169.254.169.254/latest/meta-data/', 'http://127.0.0.1:3000/admin',
    'http://[::1]/', 'http://2130706433/', 'https://outside.example/document',
    '//outside.example/document', '/api/internal/action', '',
  ])('refuses the public content_url override %s before accessing data or network', async destination => {
    const url = new URL('https://moksha.purama.dev/api/reglement/verify/reglement-test')
    url.searchParams.set('content_url', destination)
    const response = await request(url.href)
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it.each([
    'https://moksha.purama.dev/api/reglement/verify/reglement-test',
    'https://attacker.example/api/reglement/verify/reglement-test',
  ])('verifies raw canonical text independently of the request origin %s', async origin => {
    const response = await request(origin)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ verified: true, hash_match: true })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mocks.verify).toHaveBeenCalledWith(REGLEMENT_CONTENT, base.opentimestamps_proof)
  })

  it('supports the absolute canonical page without hashing its rendered HTML', async () => {
    record({ content_url: 'https://moksha.purama.dev/reglement?v=1.0' })
    expect(await (await request()).json()).toMatchObject({ verified: true, hash_match: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    'http://169.254.169.254/latest/meta-data/', 'http://127.0.0.1/',
    'https://outside.example/document', '//outside.example/document',
    'https://moksha.purama.dev@outside.example/reglement',
    'https://user:password@moksha.purama.dev/reglement',
    'https://moksha.purama.dev/api/internal/action',
    'https://configured-project.supabase.co/storage/v1/object/sign/private/file',
    'https://configured-project.supabase.co/rest/v1/private_table',
    'https://configured-project.supabase.co.evil.example/storage/v1/object/public/rules/a.txt',
    '/reglement\\unexpected', '/regle\nment', 'file:///etc/passwd',
  ])('leaves unapproved stored source %s unverified without fetching it', async destination => {
    record({ content_url: destination, bitcoin_block_height: 800000 })
    const response = await request()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ verified: false, stamp_status: 'unavailable', recorded_stamp_status: 'confirmed' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('downloads only the configured public storage object with bounded non-redirecting fetch', async () => {
    const url = 'https://configured-project.supabase.co/storage/v1/object/public/reglements/v1.txt'
    record({ content_url: url })
    const response = await request()
    expect(await response.json()).toMatchObject({ verified: true, hash_match: true })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [destination, options] = fetchMock.mock.calls[0]
    expect(String(destination)).toBe(url)
    expect(options).toMatchObject({ redirect: 'error', credentials: 'omit', cache: 'no-store' })
    expect(options?.signal).toBeInstanceOf(AbortSignal)
    expect(mocks.verify).toHaveBeenCalledWith(REGLEMENT_CONTENT, base.opentimestamps_proof)
  })

  it('does not follow a storage redirect into the private network', async () => {
    record({ content_url: 'https://configured-project.supabase.co/storage/v1/object/public/reglements/v1.txt' })
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'http://169.254.169.254/' } }))
    expect(await (await request()).json()).toMatchObject({ verified: false, stamp_status: 'unavailable' })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('rejects an oversized storage response before verification and cancels the stream', async () => {
    record({ content_url: 'https://configured-project.supabase.co/storage/v1/object/public/reglements/v1.txt' })
    const cancel = vi.fn()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1)) },
      cancel,
    })
    fetchMock.mockResolvedValue(new Response(stream))
    expect(await (await request()).json()).toMatchObject({ verified: false, stamp_status: 'unavailable' })
    expect(cancel).toHaveBeenCalledOnce()
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('keeps a transport failure unverified even if a historical block height exists', async () => {
    record({ content_url: 'https://configured-project.supabase.co/storage/v1/object/public/reglements/v1.txt', bitcoin_block_height: 800000 })
    fetchMock.mockRejectedValue(new Error('offline transport failure'))
    expect(await (await request()).json()).toMatchObject({ verified: false, stamp_status: 'unavailable', recorded_stamp_status: 'confirmed' })
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('does not verify a proof when the canonical content hash has changed', async () => {
    record({ content_hash: hash('a previous version') })
    expect(await (await request()).json()).toMatchObject({ verified: false, error: 'hash_mismatch' })
    expect(mocks.verify).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
