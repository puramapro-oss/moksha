// @vitest-environment jsdom
import { act, StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Formalites from '@/app/creer/formalites/page'
import { createView, deferred } from '@/test/view'

const { auth, router, notify } = vi.hoisted(() => ({
  auth: { user: { id: 'account-a' } as { id: string } | null, loading: false },
  router: { replace: vi.fn() }, notify: vi.fn(),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('sonner', () => ({ toast: { success: notify } }))
vi.mock('@/components/shared/Logo', () => ({ default: () => <span>Logo</span> }))

const key = 'moksha_wizard_entreprise'
const request = vi.fn<typeof fetch>()
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
let view: ReturnType<typeof createView>

beforeEach(() => {
  vi.clearAllMocks()
  request.mockReset().mockResolvedValue(response({}))
  auth.user = { id: 'account-a' }
  auth.loading = false
  sessionStorage.clear()
  sessionStorage.setItem(key, JSON.stringify({ denomination: 'Dossier conservé', __step: 5 }))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('fetch', request)
  view = createView()
})
afterEach(async () => { await view.close(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('finalisation du brouillon après authentification', () => {
  it('crée et dépose une seule fois malgré le double abonnement Strict Mode', async () => {
    const pending = deferred<Response>()
    request.mockReturnValueOnce(pending.promise)
    await view.render(<StrictMode><Formalites /></StrictMode>)
    expect(request).toHaveBeenCalledOnce()
    expect(JSON.parse(request.mock.calls[0][1]!.body as string)).toEqual({ type: 'entreprise', wizard_data: { denomination: 'Dossier conservé' } })
    await act(async () => { pending.resolve(response({ id: 'dossier-a' })) })
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1][0]).toBe('/api/demarches/dossier-a/deposer')
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/dashboard/demarches/dossier-a')
    expect(notify).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem(key)).toBeNull()
  })

  it('réutilise la création en cours pendant une actualisation du même compte', async () => {
    const pending = deferred<Response>()
    request.mockReturnValueOnce(pending.promise)
    await view.render(<Formalites />)
    auth.loading = true
    await view.render(<Formalites />)
    auth.user = { id: 'account-a' }
    auth.loading = false
    await view.render(<Formalites />)
    expect(request).toHaveBeenCalledOnce()
    await act(async () => { pending.resolve(response({ id: 'dossier-a' })) })
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/dashboard/demarches/dossier-a')
  })

  it('refuse de réémettre le brouillon d’un ancien compte après une bascule', async () => {
    const first = deferred<Response>()
    request.mockReturnValueOnce(first.promise)
    await view.render(<Formalites />)
    const claimed = sessionStorage.getItem(key)
    expect(JSON.parse(claimed!).__ownerId).toBe('account-a')
    auth.user = { id: 'account-b' }
    await view.render(<Formalites />)
    expect(request).toHaveBeenCalledOnce()
    expect(view.host.textContent).toContain('appartient à un autre compte')
    await act(async () => { first.resolve(response({ id: 'dossier-a' })) })
    expect(request).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(key)).toBe(claimed)
  })

  it('conserve l’association distincte lorsqu’une entreprise a été soumise', async () => {
    const other = JSON.stringify({ nom: 'Autre brouillon', __step: 2 })
    sessionStorage.setItem('moksha_wizard_assoc', other)
    request.mockResolvedValueOnce(response({ id: 'dossier-a' }))
    await view.render(<Formalites />)
    expect(sessionStorage.getItem(key)).toBeNull()
    expect(sessionStorage.getItem('moksha_wizard_assoc')).toBe(other)
  })

  it('ne transmet pas le brouillon si son propriétaire ne peut pas être persisté', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage denied') })
    await view.render(<Formalites />)
    expect(request).not.toHaveBeenCalled()
    expect(view.host.textContent).toContain('storage denied')
    write.mockRestore()
  })

  it('refuse également un propriétaire étranger au premier montage', async () => {
    sessionStorage.setItem(key, JSON.stringify({ denomination: 'Privé', __ownerId: 'account-b' }))
    await view.render(<Formalites />)
    expect(request).not.toHaveBeenCalled()
    expect(view.host.textContent).toContain('appartient à un autre compte')
  })

  it('conserve une nouvelle modification du brouillon arrivée pendant la création', async () => {
    const pending = deferred<Response>()
    request.mockReturnValueOnce(pending.promise)
    await view.render(<Formalites />)
    const newer = JSON.stringify({ denomination: 'Nouveau brouillon', __step: 1 })
    sessionStorage.setItem(key, newer)
    await act(async () => { pending.resolve(response({ id: 'dossier-a' })) })
    expect(sessionStorage.getItem(key)).toBe(newer)
  })

  it('présente un rejet sans répéter la création au prochain rendu', async () => {
    request.mockRejectedValueOnce(new Error('network failure'))
    await view.render(<Formalites />)
    expect(view.host.textContent).toContain('network failure')
    auth.user = { id: 'account-a' }
    await view.render(<Formalites />)
    expect(request).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem(key)).not.toBeNull()
  })

  it('ne crée rien pour un brouillon illisible', async () => {
    sessionStorage.setItem(key, '{invalid')
    await view.render(<Formalites />)
    expect(request).not.toHaveBeenCalled()
    expect(view.host.textContent).toContain('étape rate')
    expect(sessionStorage.getItem(key)).toBe('{invalid')
  })

  it('revient au tableau de bord lorsqu’aucun brouillon n’est présent', async () => {
    sessionStorage.clear()
    await view.render(<Formalites />)
    expect(request).not.toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/dashboard')
  })
})
