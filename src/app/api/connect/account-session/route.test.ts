/**
 * MOKSHA V7.1 — Tests route /api/connect/account-session (F3.7)
 * Couvre : auth required, not-onboarded, success (client_secret retourné).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks doivent précéder les imports de la route.
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/stripe-connect', () => ({
  createAccountSession: vi.fn(),
}))

import { POST } from './route'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { createAccountSession } from '@/lib/stripe-connect'

const mockedServer = vi.mocked(createServerSupabaseClient)
const mockedSvc = vi.mocked(createServiceClient)
const mockedSession = vi.mocked(createAccountSession)

function mockAuth(user: { id: string; email: string } | null) {
  mockedServer.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

function mockAccountRow(row: { stripe_account_id: string } | null) {
  mockedSvc.mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

describe('POST /api/connect/account-session', () => {
  beforeEach(() => {
    mockedServer.mockReset()
    mockedSvc.mockReset()
    mockedSession.mockReset()
  })

  it('retourne 401 si non authentifié', async () => {
    mockAuth(null)
    const res = await POST()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/authentifié/i)
  })

  it('retourne 404 si compte Connect non initialisé', async () => {
    mockAuth({ id: 'user-1', email: 'u@test.fr' })
    mockAccountRow(null)
    const res = await POST()
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/Connect/)
    expect(body.hint).toBeDefined()
  })

  it('retourne 200 + client_secret si compte existe', async () => {
    mockAuth({ id: 'user-1', email: 'u@test.fr' })
    mockAccountRow({ stripe_account_id: 'acct_123' })
    mockedSession.mockResolvedValueOnce({
      client_secret: 'as_secret_abc',
      expires_at: 1700000000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.client_secret).toBe('as_secret_abc')
    expect(body.stripe_account_id).toBe('acct_123')
    expect(body.expires_at).toBe(1700000000)
    expect(mockedSession).toHaveBeenCalledWith('acct_123')
  })

  it('retourne 500 si Stripe throw', async () => {
    mockAuth({ id: 'user-1', email: 'u@test.fr' })
    mockAccountRow({ stripe_account_id: 'acct_123' })
    mockedSession.mockRejectedValueOnce(new Error('Stripe down'))

    const res = await POST()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Stripe down')
  })
})
