// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BreathePage from '@/app/(dashboard)/dashboard/breathe/page'

type Reply = { error: { message: string } | null; status: number }

const { insert, notify, auth } = vi.hoisted(() => ({
  insert: vi.fn<(row: unknown) => Promise<Reply>>(),
  notify: vi.fn(),
  auth: { user: { id: 'test-member' }, profile: { id: 'test-member' } as { id: string } | null },
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('sonner', () => ({ toast: { success: notify } }))
vi.mock('@/lib/supabase', () => {
  const history = {
    select: () => history,
    eq: () => history,
    order: () => history,
    limit: () => Promise.resolve({ data: [] }),
    insert,
  }
  const client = { from: () => history }
  return { createClient: () => client }
})

let host: HTMLDivElement
let root: Root

async function clickButton(name: string) {
  const button = Array.from(host.querySelectorAll('button')).find(
    (item) => (item.getAttribute('aria-label') || item.textContent)?.trim() === name,
  )
  expect(button, name).toBeDefined()
  await act(async () => { button!.click() })
}

async function tick(seconds: number) {
  await act(async () => { vi.advanceTimersByTime(seconds * 1000) })
}

async function reachSaveThreshold() {
  await clickButton('Démarrer la respiration')
  await tick(180)
  expect(insert).toHaveBeenCalledTimes(1)
}

function holdReply() {
  let complete!: (reply: Reply) => void
  insert.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve }))
  return async () => act(async () => { complete({ error: null, status: 201 }) })
}

beforeEach(async () => {
  vi.resetAllMocks()
  auth.user.id = 'test-member'
  auth.profile = { id: 'test-member' }
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  await act(async () => { root.render(<BreathePage />) })
})

afterEach(async () => {
  await act(async () => { root.unmount() })
  host.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('sauvegarde de la séance de respiration', () => {
  it('enregistre exactement 180 secondes et 9 cycles sans effet intermédiaire', async () => {
    const confirm = holdReply()
    await clickButton('Démarrer la respiration')
    await tick(179)
    expect(insert).not.toHaveBeenCalled()
    await tick(1)
    expect(insert).toHaveBeenCalledExactlyOnceWith({
      user_id: 'test-member', cycles: 9, duration_seconds: 180, points_earned: 50,
    })
    await confirm()
  })

  it('conserve la séance lorsque seul le profil du même membre se recharge', async () => {
    const confirm = holdReply()
    await clickButton('Démarrer la respiration')
    await tick(100)
    auth.profile = null
    await act(async () => { root.render(<BreathePage />) })
    auth.profile = { id: 'test-member' }
    await act(async () => { root.render(<BreathePage />) })
    await tick(80)
    expect(insert).toHaveBeenCalledExactlyOnceWith({
      user_id: 'test-member', cycles: 9, duration_seconds: 180, points_earned: 50,
    })
    await confirm()
  })

  it('ne compte pas le temps passé en pause', async () => {
    await clickButton('Démarrer la respiration')
    await tick(100)
    await clickButton('Mettre la respiration en pause')
    await tick(100)
    expect(insert).not.toHaveBeenCalled()
    await clickButton('Démarrer la respiration')
    const confirm = holdReply()
    await tick(80)
    expect(insert).toHaveBeenCalledOnce()
    await confirm()
  })

  it('attend la réponse et ne duplique pas la sauvegarde en cours', async () => {
    const confirm = holdReply()
    await reachSaveThreshold()
    await tick(5)
    expect(insert).toHaveBeenCalledTimes(1)
    expect(host.textContent).toContain('Enregistrement en cours')
    await confirm()
    expect(host.textContent).toContain('Séance enregistrée')
    expect(notify).toHaveBeenCalledOnce()
  })

  it('ignore la réponse d’une séance réinitialisée même si la suivante attend déjà sa réponse', async () => {
    const confirmFirst = holdReply()
    const confirmSecond = holdReply()
    await reachSaveThreshold()
    await clickButton('Réinitialiser la séance')
    await clickButton('Démarrer la respiration')
    await tick(180)
    expect(insert).toHaveBeenCalledTimes(2)
    await confirmFirst()
    expect(host.textContent).toContain('Enregistrement en cours')
    expect(notify).not.toHaveBeenCalled()
    await confirmSecond()
    expect(host.textContent).toContain('Séance enregistrée')
    expect(notify).toHaveBeenCalledOnce()
  })

  it('ignore une réponse après un changement de membre', async () => {
    const confirm = holdReply()
    await reachSaveThreshold()
    auth.user.id = 'second-test-member'
    auth.profile = { id: 'second-test-member' }
    await act(async () => { root.render(<BreathePage />) })
    await confirm()
    expect(host.textContent).not.toContain('Séance enregistrée')
    expect(notify).not.toHaveBeenCalled()
  })

  it.each([0, 408, 409, 502])('ne répète pas une écriture non confirmée (statut %d)', async (status) => {
    insert.mockResolvedValueOnce({ error: { message: 'indéterminé' }, status })
    await reachSaveThreshold()
    await tick(20)
    expect(host.textContent).toContain('Enregistrement non confirmé')
    expect(host.textContent).not.toContain('Réessayer l’enregistrement')
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('traite une exception de transport comme une réponse non confirmée', async () => {
    insert.mockRejectedValueOnce(new Error('Connexion interrompue'))
    await reachSaveThreshold()
    await tick(5)
    expect(host.textContent).toContain('Enregistrement non confirmé')
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('attend une action explicite pour réessayer après un refus certain', async () => {
    insert.mockResolvedValueOnce({ error: { message: 'refusé' }, status: 403 })
    await reachSaveThreshold()
    await tick(20)
    expect(insert).toHaveBeenCalledTimes(1)
    const confirm = holdReply()
    await clickButton('Réessayer l’enregistrement')
    expect(insert).toHaveBeenCalledTimes(2)
    await confirm()
    expect(host.textContent).toContain('Séance enregistrée')
  })
})
