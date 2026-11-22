// @vitest-environment jsdom
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Wallet from '@/app/(dashboard)/dashboard/wallet/page'
import Rappels from '@/app/(dashboard)/dashboard/rappels/page'
import ProofVault from '@/app/(dashboard)/dashboard/proofvault/page'
import Abonnement from '@/app/(dashboard)/dashboard/parametres/abonnement/page'
import { createView, deferred } from '@/test/view'

type Reply = { data: unknown; error: { message: string } | null }
const { auth, read } = vi.hoisted(() => ({
  auth: { isAuthenticated: true, user: { id: 'account-a' }, profile: { id: 'account-a', plan: 'premium' } as { id: string; plan: string } | null },
  read: vi.fn<(table: string, userId: string) => Promise<Reply>>(),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('@/lib/supabase', () => {
  const client = {
    from(table: string) {
      let userId = auth.user.id
      const query = {
        select: () => query,
        eq: (_column: string, id: string) => { userId = id; return query },
        order: () => query,
        limit: () => query,
        maybeSingle: () => read(table, userId),
        then: (resolve: (value: Reply) => unknown, reject?: (error: unknown) => unknown) => read(table, userId).then(resolve, reject),
      }
      return query
    },
  }
  return { createClient: () => client }
})

const cases = [
  { Component: Wallet, table: 'moksha_wallet_transactions' },
  { Component: Rappels, table: 'moksha_rappels' },
  { Component: ProofVault, table: 'moksha_documents' },
]
const row = (label: string) => ({
  id: label, description: label, nom: label, titre: label, type: 'bonus', amount: 100, statut: 'completed',
  created_at: '2026-01-01', date_echeance: '2026-12-01', file_url: '/example.pdf', file_size: 100, scanner_score: 'parfait',
})
let view: ReturnType<typeof createView>
beforeEach(() => {
  auth.user = { id: 'account-a' }
  auth.profile = { id: 'account-a', plan: 'premium' }
  read.mockReset().mockResolvedValue({ data: [], error: null })
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  view = createView()
})
afterEach(async () => { await view.close(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe.each(cases)('isolation des lectures $table', ({ Component, table }) => {
  it('ignore la réponse de A et conserve exclusivement les données de B', async () => {
    const first = deferred<Reply>()
    const second = deferred<Reply>()
    read.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    await view.render(<Component />)
    auth.user = { id: 'account-b' }
    auth.profile = { id: 'account-b', plan: 'premium' }
    await view.render(<Component />)
    await act(async () => { second.resolve({ data: [row('B-only-data')], error: null }) })
    await act(async () => { first.resolve({ data: [row('A-only-data')], error: null }) })
    expect(read).toHaveBeenCalledWith(table, 'account-b')
    expect(view.host.textContent).toContain('B-only-data')
    expect(view.host.textContent).not.toContain('A-only-data')
  })

  it('ne réinitialise pas les données pour le rechargement du profil du même utilisateur', async () => {
    read.mockResolvedValueOnce({ data: [row('A-only-data')], error: null })
    await view.render(<Component />)
    auth.profile = null
    await view.render(<Component />)
    expect(view.host.textContent).toContain('A-only-data')
    expect(read).toHaveBeenCalledOnce()
  })
})

describe('wallet et abonnement', () => {
  it('conserve le calcul du solde et ferme un retrait lors d’un changement de compte', async () => {
    read.mockResolvedValueOnce({ data: [row('credit'), { ...row('pending-credit'), amount: 50, statut: 'pending' }, { ...row('withdrawal'), type: 'retrait', amount: -20, statut: 'pending' }], error: null })
    await view.render(<Wallet />)
    expect(view.host.textContent).toContain('80.00 €')
    const withdraw = Array.from(view.host.querySelectorAll('button')).find((button) => button.textContent?.includes('Demander un retrait'))!
    await act(async () => { withdraw.click() })
    expect(view.host.querySelector('form')).not.toBeNull()
    auth.user = { id: 'account-b' }
    auth.profile = { id: 'account-b', plan: 'gratuit' }
    await view.render(<Wallet />)
    expect(view.host.querySelector('form')).toBeNull()
    expect(view.host.textContent).not.toContain('80.00 €')
  })

  it('sort du chargement et montre le refus de lecture du wallet', async () => {
    read.mockRejectedValueOnce(new Error('network failure'))
    await view.render(<Wallet />)
    expect(view.host.querySelector('[role="alert"]')?.textContent).toContain('Chargement impossible')
    expect(view.host.querySelector('.skeleton')).toBeNull()
  })

  it('actualise l’affichage au seuil exact des 30 jours sans nouvelle interaction', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    const start = Date.parse('2026-10-01T00:00:00Z')
    vi.setSystemTime(start + 30 * 24 * 3600 * 1000 - 1000)
    read.mockResolvedValueOnce({ data: { id: 'subscription-a', status: 'active', started_at: new Date(start).toISOString(), stripe_subscription_id: 'stripe-a' }, error: null })
    await view.render(<Abonnement />)
    expect(view.host.textContent).toContain('dans 1 jours')
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(view.host.textContent).toContain('✅ maintenant')
  })
})
