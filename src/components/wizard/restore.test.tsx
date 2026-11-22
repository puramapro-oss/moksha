// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WizardEntreprise from '@/components/wizard/WizardEntreprise'
import WizardAssociation from '@/components/wizard/WizardAssociation'
import { createView, deferred } from '@/test/view'

const { auth, navigate } = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, isAuthenticated: false, loading: false },
  navigate: vi.fn(),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: navigate }) }))
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> },
}))

const cases = [
  { name: 'entreprise', key: 'moksha_wizard_entreprise', Component: WizardEntreprise,
    draft: { denomination: 'Entreprise conservée', dirigeant: { prenom: 'Alice' }, __step: 1 }, value: 'Entreprise conservée' },
  { name: 'association', key: 'moksha_wizard_assoc', Component: WizardAssociation,
    draft: { nom: 'Association conservée', bureau: { president: { prenom: 'Alice' } }, __step: 1 }, value: 'Association conservée' },
]
let view: ReturnType<typeof createView>

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  sessionStorage.clear()
  auth.user = null
  auth.isAuthenticated = false
  auth.loading = false
  navigate.mockClear()
  view = createView()
})
afterEach(async () => { await view.close(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe.each(cases)('restauration du wizard $name', ({ key, Component, draft, value }) => {
  it('hydrate le HTML serveur sans perdre le brouillon ou écrire les valeurs vides initiales', async () => {
    sessionStorage.setItem(key, JSON.stringify(draft))
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const mismatch = vi.fn()
    await view.hydrate(renderToString(<Component />), <Component />, mismatch)
    expect(mismatch).not.toHaveBeenCalled()
    expect(Array.from(view.host.querySelectorAll('input')).map((field) => field.value)).toContain(value)
    const writes = write.mock.calls.filter(([storageKey]) => storageKey === key).map(([, raw]) => JSON.parse(raw))
    expect(writes.length).toBeGreaterThan(0)
    for (const stored of writes) expect(stored.denomination ?? stored.nom).toBe(value)
    const stored = JSON.parse(sessionStorage.getItem(key)!)
    expect(stored.__step).toBe(1)
    if (key.endsWith('entreprise')) expect(stored.dirigeant).toMatchObject({ prenom: 'Alice', nationalite: 'Française' })
    else expect(stored.bureau).toMatchObject({ president: { prenom: 'Alice', email: '' }, tresorier: { prenom: '' } })
  })

  it('revendique le brouillon anonyme puis le conserve sans le montrer au compte suivant', async () => {
    sessionStorage.setItem(key, JSON.stringify(draft))
    auth.user = { id: 'account-a' }
    auth.isAuthenticated = true
    await view.render(<Component />)
    expect(JSON.parse(sessionStorage.getItem(key)!).__ownerId).toBe('account-a')
    const claimed = sessionStorage.getItem(key)
    auth.user = { id: 'account-b' }
    await view.render(<Component />)
    expect(view.host.querySelector('[role="alert"]')?.textContent).toContain('autre compte')
    expect(view.host.querySelectorAll('input')).toHaveLength(0)
    expect(sessionStorage.getItem(key)).toBe(claimed)
    auth.user = { id: 'account-a' }
    await view.render(<Component />)
    expect(Array.from(view.host.querySelectorAll('input')).map((field) => field.value)).toContain(value)
  })

  it('ne monte ni ne réécrit un formulaire détenu par une autre identité', async () => {
    const claimed = JSON.stringify({ ...draft, __ownerId: 'account-a' })
    sessionStorage.setItem(key, claimed)
    auth.user = { id: 'account-b' }
    auth.isAuthenticated = true
    await view.render(<Component />)
    expect(view.host.querySelector('[role="alert"]')).not.toBeNull()
    expect(sessionStorage.getItem(key)).toBe(claimed)
  })

  it('ne réémet ni ne nettoie un ancien dépôt après la bascule vers un autre compte', async () => {
    const pending = deferred<Response>()
    const request = vi.fn<typeof fetch>().mockReturnValueOnce(pending.promise)
    vi.stubGlobal('fetch', request)
    const finalStep = key.endsWith('entreprise') ? 5 : 4
    sessionStorage.setItem(key, JSON.stringify({ ...draft, __step: finalStep, accept_cgv: true, __ownerId: 'account-a' }))
    auth.user = { id: 'account-a' }
    auth.isAuthenticated = true
    await view.render(<Component />)
    const submit = Array.from(view.host.querySelectorAll('button')).find((button) => button.textContent?.includes('Déposer mon dossier'))!
    expect(submit.disabled).toBe(false)
    await act(async () => { submit.click(); submit.click() })
    expect(request).toHaveBeenCalledOnce()
    const payload = JSON.parse(request.mock.calls[0][1]!.body as string)
    expect(payload.wizard_data.__ownerId).toBeUndefined()
    expect(payload.wizard_data.__step).toBeUndefined()
    auth.user = { id: 'account-b' }
    await view.render(<Component />)
    sessionStorage.setItem(key, JSON.stringify({ ...draft, __ownerId: 'account-b' }))
    await view.render(<Component />)
    const current = sessionStorage.getItem(key)
    await act(async () => { pending.resolve(new Response(JSON.stringify({ id: 'old-dossier' }), { status: 200 })) })
    expect(navigate).not.toHaveBeenCalled()
    expect(request).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem(key)).toBe(current)
  })

  it('récupère un brouillon malformé avec un formulaire utilisable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    sessionStorage.setItem(key, '{invalid')
    await view.render(<Component />)
    expect(view.host.querySelectorAll('button').length).toBeGreaterThan(0)
    const saved = JSON.parse(sessionStorage.getItem(key)!)
    expect(saved.__step).toBe(0)
  })

  it('reste utilisable lorsque le navigateur refuse le stockage', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage denied') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage denied') })
    await act(async () => { await view.render(<Component />) })
    expect(view.host.querySelectorAll('button').length).toBeGreaterThan(0)
    expect(view.host.textContent).not.toContain('Chargement du formulaire')
  })
})
