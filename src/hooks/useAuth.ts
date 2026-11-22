'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import type { Profile } from '@/types'
import type { Session } from '@supabase/supabase-js'

type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ session: null, profile: null, loading: true })
  const stateRef = useRef(state)
  const activeRef = useRef(false)
  const generationRef = useRef(0)
  const profileRequestRef = useRef<symbol | null>(null)
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  const publish = useCallback((next: AuthState) => {
    // Auth events can arrive several times before React commits a render.
    stateRef.current = next
    setState(next)
  }, [])

  const invalidateProfile = useCallback(() => {
    const generation = ++generationRef.current
    profileRequestRef.current = null
    if (profileTimerRef.current !== null) clearTimeout(profileTimerRef.current)
    profileTimerRef.current = null
    return generation
  }, [])

  const fetchProfile = useCallback(async (userId: string, generation: number) => {
    if (!activeRef.current || generationRef.current !== generation || stateRef.current.session?.user.id !== userId) return
    if (profileTimerRef.current !== null) {
      clearTimeout(profileTimerRef.current)
      profileTimerRef.current = null
    }
    const request = Symbol()
    profileRequestRef.current = request
    publish({ ...stateRef.current, profile: null, loading: true })

    let nextProfile: Profile | null = null
    try {
      const { data, error } = await supabase
        .from('moksha_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data?.id === userId) nextProfile = data as Profile
    } catch {
      // A failed profile read must release loading without retaining old roles.
    }
    if (!activeRef.current || generationRef.current !== generation || profileRequestRef.current !== request) return
    profileRequestRef.current = null
    publish({ ...stateRef.current, profile: nextProfile, loading: false })
  }, [supabase, publish])

  useEffect(() => {
    let active = true
    let receivedAuthEvent = false
    let receivedUserEvent = false
    activeRef.current = true

    const applySession = (nextSession: Session | null, refreshProfile = false) => {
      const session = nextSession?.user?.id ? nextSession : null
      const current = stateRef.current
      const sameSession = current.session?.user.id === session?.user.id && current.session?.access_token === session?.access_token
      if (session && sameSession && !refreshProfile && (current.profile || profileRequestRef.current || profileTimerRef.current !== null)) {
        publish({ ...current, session })
        return
      }

      const generation = invalidateProfile()
      publish({ session, profile: null, loading: !!session })
      if (session) {
        // Supabase awaits auth callbacks under a lock: defer other client calls.
        profileTimerRef.current = setTimeout(() => {
          profileTimerRef.current = null
          void fetchProfile(session.user.id, generation)
        }, 0)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active || (event === 'INITIAL_SESSION' && receivedUserEvent)) return
        receivedAuthEvent = true
        if (event !== 'INITIAL_SESSION') receivedUserEvent = true
        applySession(session, event === 'USER_UPDATED')
      }
    )

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (active && !receivedAuthEvent) applySession(error ? null : data.session)
      } catch {
        if (active && !receivedAuthEvent) applySession(null)
      }
    }
    void getSession()

    return () => {
      active = false
      activeRef.current = false
      invalidateProfile()
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, publish, invalidateProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error }
  }, [supabase])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
    // A document navigation clears authenticated state and caches held in memory.
    window.location.assign(new URL('/auth', window.location.origin).toString())
  }, [supabase])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/parametres`,
    })
    return { error }
  }, [supabase])

  const refetch = useCallback(async () => {
    const userId = stateRef.current.session?.user.id
    if (userId) await fetchProfile(userId, generationRef.current)
  }, [fetchProfile])

  const { session, profile, loading } = state
  const user = session?.user ?? null

  return {
    user, profile, session, loading,
    signIn, signUp, signInWithGoogle, signOut, resetPassword, refetch,
    isAuthenticated: !!user,
    isSuperAdmin: user?.email === SUPER_ADMIN_EMAIL || profile?.is_super_admin === true,
    isAdmin: profile?.is_admin === true || profile?.is_super_admin === true,
    plan: (profile?.plan ?? 'gratuit') as Profile['plan'],
  }
}
