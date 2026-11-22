// Shared fixture for the real gratitude page; only auth, storage and notifications are simulated.
import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, vi } from 'vitest'
import GratitudePage from './page'

type Entry = { id: string; content: string; created_at: string }
type ReadReply = { data: Entry[] | null; error: { message: string } | null }
type WriteReply = { error: { message: string } | null; status?: number }

const { read, insert, notify, reportError, auth } = vi.hoisted(() => ({
  read: vi.fn<(userId: string) => Promise<ReadReply>>(),
  insert: vi.fn<(row: { user_id: string; content: string }) => Promise<WriteReply>>(),
  notify: vi.fn(),
  reportError: vi.fn(),
  auth: {
    user: { id: 'member-a' } as { id: string } | null,
    profile: { id: 'member-a' } as { id: string } | null,
    loading: false,
  },
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('sonner', () => ({ toast: { success: notify, error: reportError } }))
vi.mock('@/lib/supabase', () => {
  const client = {
    from: () => {
      let userId = ''
      const query = {
        select: () => query,
        eq: (_column: string, value: string) => { userId = value; return query },
        order: () => query,
        limit: () => read(userId),
        insert,
      }
      return query
    },
  }
  return { createClient: () => client }
})

let host: HTMLDivElement
let root: Root

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}

function entry(id: string, content: string): Entry {
  return { id, content, created_at: new Date().toISOString() }
}

async function render(strict = false) {
  await act(async () => {
    root.render(strict ? <StrictMode><GratitudePage /></StrictMode> : <GratitudePage />)
  })
}

function input() {
  return host.querySelector<HTMLInputElement>('input[aria-label="Gratitude du jour"]')!
}

function saveButton() {
  return host.querySelector<HTMLButtonElement>('button[aria-label="Enregistrer la gratitude"]')!
}

async function type(value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function enter(times = 1) {
  await act(async () => {
    for (let i = 0; i < times; i++) {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }
  })
}

async function switchAccount(userId: string | null, profileId: string | null = userId) {
  auth.user = userId ? { id: userId } : null
  auth.profile = profileId ? { id: profileId } : null
  await render()
}

beforeEach(() => {
  vi.resetAllMocks()
  read.mockResolvedValue({ data: [], error: null })
  insert.mockResolvedValue({ error: null, status: 201 })
  auth.user = { id: 'member-a' }
  auth.profile = { id: 'member-a' }
  auth.loading = false
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => { root.unmount() })
  host.remove()
  vi.unstubAllGlobals()
})

export {
  auth, deferred, enter, entry, host, input, insert,
  notify, read, render, saveButton, switchAccount, type,
}
export type { ReadReply, WriteReply }
