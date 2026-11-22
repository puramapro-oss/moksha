import { act, StrictMode, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, vi } from 'vitest'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { useAuth } from './useAuth'

type SessionReply = { data: { session: Session | null }; error: { message: string } | null }
type ProfileReply = { data: Profile | null; error: { message: string } | null }
type Listener = (event: AuthChangeEvent, session: Session | null) => void | Promise<void>

const { getSession, readProfile, subscribe, unsubscribe, source, listeners, callbackResults, lock, logout } = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<SessionReply>>(),
  logout: vi.fn<() => Promise<{ error: null }>>(),
  readProfile: vi.fn<(userId: string) => Promise<ProfileReply>>(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  source: { session: null as Session | null },
  listeners: new Set<Listener>(),
  callbackResults: [] as (void | Promise<void>)[],
  lock: { active: false, readsDuringCallback: 0 },
}))

vi.mock('@/lib/supabase', () => {
  const client = {
    auth: {
      getSession,
      signOut: logout,
      onAuthStateChange: (callback: Listener) => {
        subscribe(callback)
        listeners.add(callback)
        return { data: { subscription: { unsubscribe: () => {
          unsubscribe(callback)
          listeners.delete(callback)
        } } } }
      },
    },
    from: () => {
      if (lock.active) lock.readsDuringCallback++
      let userId = ''
      const query = {
        select: () => query,
        eq: (_key: string, id: string) => { userId = id; return query },
        single: () => readProfile(userId),
      }
      return query
    },
  }
  return { createClient: () => client }
})

function session(id: string, token = `token-${id}`, email = `${id}@example.test`): Session {
  return {
    access_token: token, refresh_token: `refresh-${id}`, token_type: 'bearer', expires_in: 3600,
    user: { id, email, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
  }
}

function profile(id: string, extra: Partial<Profile> = {}): Profile {
  return {
    id, email: `${id}@example.test`, full_name: null, avatar_url: null, plan: 'gratuit',
    stripe_customer_id: null, stripe_subscription_id: null, referral_code: '', referred_by: null,
    jurisia_questions_today: 0, jurisia_reset_date: '2026-11-22', is_admin: false,
    is_super_admin: false, tutorial_completed: false, created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z', ...extra,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}

type Snapshot = ReturnType<typeof useAuth>
let latest: Snapshot
let snapshots: Snapshot[]
let root: Root
let host: HTMLDivElement
let mounted: boolean

function Probe() {
  const auth = useAuth()
  useLayoutEffect(() => {
    latest = auth
    snapshots.push(auth)
  })
  return <div>{auth.user?.id ?? 'anonymous'}</div>
}

async function mount(strict = false) {
  mounted = true
  await act(async () => { root.render(strict ? <StrictMode><Probe /></StrictMode> : <Probe />) })
}

async function drain() {
  await act(async () => { await vi.runOnlyPendingTimersAsync() })
}

function dispatch(event: AuthChangeEvent, nextSession: Session | null) {
  source.session = nextSession
  lock.active = true
  try {
    for (const callback of [...listeners]) {
      const result = callback(event, nextSession)
      callbackResults.push(result)
      // Keep baseline failures observable without leaving unhandled test promises.
      if (result) void result.catch(() => {})
    }
  } finally {
    lock.active = false
  }
}

async function emit(event: AuthChangeEvent, nextSession: Session | null) {
  await act(async () => { dispatch(event, nextSession) })
}

beforeEach(() => {
  vi.resetAllMocks()
  listeners.clear()
  callbackResults.length = 0
  lock.active = false
  lock.readsDuringCallback = 0
  source.session = null
  logout.mockResolvedValue({ error: null })
  getSession.mockImplementation(async () => ({ data: { session: source.session }, error: null }))
  readProfile.mockImplementation(async (id) => ({ data: profile(id), error: null }))
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  mounted = false
  snapshots = []
})

afterEach(async () => {
  if (mounted) await act(async () => { root.unmount() })
  host.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function rerender() {
  await act(async () => { root.render(<Probe />) })
}

async function unmount() {
  await act(async () => { root.unmount() })
  mounted = false
}

export { logout,
  getSession, readProfile, subscribe, source, listeners, callbackResults, lock,
  session, profile, deferred, latest, snapshots, mount, drain, dispatch, emit, rerender, unmount,
}
export type { SessionReply, ProfileReply }
