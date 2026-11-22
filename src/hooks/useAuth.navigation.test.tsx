// @vitest-environment jsdom
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { deferred, drain, latest, logout, mount, session, source } from './useAuth.test-support'

describe('navigation après déconnexion', () => {
  it('attend Supabase puis efface le stockage avant une navigation documentaire sur la même origine', async () => {
    source.session = session('member-a')
    const reply = deferred<{ error: null }>()
    logout.mockReturnValueOnce(reply.promise)
    await mount()
    await drain()
    localStorage.setItem('logout-test', 'stored')
    document.cookie = 'logout-test=cookie; path=/'
    const originalWindow = window
    const navigate = vi.fn()
    const navigationWindow = Object.create(window) as Window
    Object.defineProperty(navigationWindow, 'location', { value: { origin: 'https://moksha.example.test:8443', assign: navigate } })
    vi.stubGlobal('window', navigationWindow)
    let result!: Promise<void>
    await act(async () => { result = latest.signOut() })
    expect(localStorage.getItem('logout-test')).toBe('stored')
    expect(navigate).not.toHaveBeenCalled()
    navigate.mockImplementation(() => {
      expect(localStorage.length).toBe(0)
      expect(document.cookie).not.toContain('logout-test=')
    })
    await act(async () => {
      reply.resolve({ error: null })
      await result
      vi.stubGlobal('window', originalWindow)
    })
    expect(navigate).toHaveBeenCalledExactlyOnceWith('https://moksha.example.test:8443/auth')
  })

  it('conserve le comportement existant lorsqu’un transport de déconnexion échoue', async () => {
    await mount()
    logout.mockRejectedValueOnce(new Error('network failure'))
    localStorage.setItem('logout-test', 'preserved')
    await expect(latest.signOut()).rejects.toThrow('network failure')
    expect(localStorage.getItem('logout-test')).toBe('preserved')
    localStorage.removeItem('logout-test')
  })
})
