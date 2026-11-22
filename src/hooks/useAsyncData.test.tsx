// @vitest-environment jsdom
import { act, StrictMode, useLayoutEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createView, deferred } from '@/test/view'
import { useAsyncData } from './useAsyncData'

let view: ReturnType<typeof createView>
let latest: ReturnType<typeof useAsyncData<string>>
const seen: Array<string | null> = []

function Probe({ loader }: { loader: () => Promise<string> }) {
  const result = useAsyncData(loader)
  useLayoutEffect(() => { latest = result; seen.push(result.data) })
  return <div>{result.loading ? 'pending' : result.error !== null ? 'failed' : result.data}</div>
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  view = createView()
  seen.length = 0
})
afterEach(async () => { await view.close(); vi.unstubAllGlobals() })

describe('réception des données externes', () => {
  it('attend le transport puis publie sa donnée', async () => {
    const request = deferred<string>()
    await view.render(<Probe loader={() => request.promise} />)
    expect(view.host.textContent).toBe('pending')
    await act(async () => { request.resolve('ready') })
    expect(view.host.textContent).toBe('ready')
  })

  it('retire l’ancienne identité dès le premier commit du nouveau chargeur', async () => {
    const first = vi.fn(async () => 'account-a')
    await view.render(<Probe loader={first} />)
    expect(latest.data).toBe('account-a')
    const second = deferred<string>()
    seen.length = 0
    await view.render(<Probe loader={() => second.promise} />)
    expect(seen).not.toContain('account-a')
    expect(latest.data).toBeNull()
    await act(async () => { second.resolve('account-b') })
    expect(latest.data).toBe('account-b')
  })

  it('ignore une ancienne réponse après un changement de chargeur', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    await view.render(<Probe loader={() => first.promise} />)
    await view.render(<Probe loader={() => second.promise} />)
    await act(async () => { second.resolve('account-b') })
    await act(async () => { first.resolve('account-a') })
    expect(latest.data).toBe('account-b')
  })

  it('ne laisse pas une ancienne actualisation remplacer la plus récente', async () => {
    const older = deferred<string>()
    const newer = deferred<string>()
    const loader = vi.fn(async () => 'initial')
    await view.render(<Probe loader={loader} />)
    loader.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)
    await act(async () => { void latest.refresh(); void latest.refresh() })
    await act(async () => { newer.resolve('newer') })
    await act(async () => { older.resolve('older') })
    expect(latest.data).toBe('newer')
  })

  it('sort du chargement après un rejet puis permet une reprise explicite', async () => {
    const loader = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue('recovered')
    await view.render(<Probe loader={loader} />)
    expect(latest.loading).toBe(false)
    expect(view.host.textContent).toBe('failed')
    await act(async () => { await latest.refresh() })
    expect(latest.data).toBe('recovered')
    expect(latest.error).toBeNull()
  })

  it('ignore une erreur obsolète après une réussite récente', async () => {
    const older = deferred<string>()
    const loader = vi.fn<() => Promise<string>>().mockReturnValueOnce(older.promise).mockResolvedValue('newer')
    await view.render(<Probe loader={loader} />)
    await act(async () => { await latest.refresh() })
    await act(async () => { older.reject(new Error('old failure')) })
    expect(latest.data).toBe('newer')
    expect(latest.error).toBeNull()
  })

  it('ne publie ni ne relance une lecture après démontage', async () => {
    const pending = deferred<string>()
    const loader = vi.fn(() => pending.promise)
    await view.render(<Probe loader={loader} />)
    const oldRefresh = latest.refresh
    await view.close()
    const count = seen.length
    await act(async () => { pending.resolve('late'); await oldRefresh() })
    expect(seen).toHaveLength(count)
    expect(loader).toHaveBeenCalledOnce()
  })

  it('invalide la première lecture du double abonnement Strict Mode', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const loader = vi.fn<() => Promise<string>>().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    await view.render(<StrictMode><Probe loader={loader} /></StrictMode>)
    await act(async () => { second.resolve('current'); first.resolve('obsolete') })
    expect(latest.data).toBe('current')
  })
})
