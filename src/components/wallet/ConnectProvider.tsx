'use client'

/**
 * MOKSHA V7.1 — ConnectProvider wrapper réutilisable
 * Source: CLAUDE.md V7.1 §36.5
 *
 * Wrap les pages /compte/* avec un ConnectComponentsProvider initialisé
 * via /api/connect/account-session. Gère states loading / error / unauth /
 * not-onboarded de façon uniforme.
 *
 * Usage :
 *   <ConnectProvider publishableKey={pk}>
 *     <ConnectPayouts />  // ou tout autre composant Embedded
 *   </ConnectProvider>
 */

import { ReactNode, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import type { StripeConnectInstance } from '@stripe/connect-js'
import { ConnectComponentsProvider } from '@stripe/react-connect-js'
import { Loader2, ShieldAlert, Wallet } from 'lucide-react'

interface Props {
  publishableKey: string
  children: ReactNode
  /** Personnalisation du fallback si compte Connect pas encore créé. */
  notOnboardedTitle?: string
  notOnboardedHint?: string
}

export default function ConnectProvider({
  publishableKey,
  children,
  notOnboardedTitle = 'Compte Connect non initialisé',
  notOnboardedHint = 'Active ton compte pour recevoir tes gains en euros réels.',
}: Props) {
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'not_onboarded' | 'unauth' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/connect/account-session', { method: 'POST' })
    if (res.status === 401) throw new Error('UNAUTH')
    if (res.status === 404) throw new Error('NOT_ONBOARDED')
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error ?? 'AccountSession indisponible')
    }
    const data = (await res.json()) as { client_secret: string }
    return data.client_secret
  }, [])

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const inst = loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret,
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#FF6B35',
              colorText: '#ffffff',
              colorBackground: '#0D1225',
              colorDanger: '#ef4444',
              buttonPrimaryColorBackground: '#FF6B35',
              buttonPrimaryColorText: '#070B18',
              fontFamily: 'DM Sans, system-ui, sans-serif',
              borderRadius: '12px',
            },
          },
        })
        // loadConnectAndInitialize ne lève pas immédiatement si fetchClientSecret échoue,
        // mais déclenche le fetch en interne. On vérifie en parallèle :
        await fetchClientSecret()
        if (mounted) {
          setInstance(inst)
          setState('ready')
        }
      } catch (e) {
        if (!mounted) return
        const msg = e instanceof Error ? e.message : 'Erreur inconnue'
        if (msg === 'UNAUTH') setState('unauth')
        else if (msg === 'NOT_ONBOARDED') setState('not_onboarded')
        else {
          setState('error')
          setErrorMessage(msg)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [publishableKey, fetchClientSecret])

  if (state === 'loading') {
    return (
      <div className="glass flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (state === 'unauth') {
    return (
      <div className="glass p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-amber-400" />
        <h2 className="font-display text-lg font-bold">Connexion requise</h2>
        <p className="mt-2 text-sm text-white/60">
          Connecte-toi pour accéder à ton compte Stripe Connect.
        </p>
        <Link
          href="/auth?next=/dashboard/wallet/connect"
          className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-2.5 text-sm font-bold text-[#070B18]"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  if (state === 'not_onboarded') {
    return (
      <div className="glass p-8 text-center">
        <Wallet className="mx-auto mb-3 h-8 w-8 text-[#FF6B35]" />
        <h2 className="font-display text-lg font-bold">{notOnboardedTitle}</h2>
        <p className="mt-2 text-sm text-white/60">{notOnboardedHint}</p>
        <Link
          href="/dashboard/wallet/connect"
          className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-2.5 text-sm font-bold text-[#070B18]"
        >
          Activer mon compte
        </Link>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="glass p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <h2 className="font-display text-lg font-bold">Erreur Stripe Connect</h2>
        <p className="mt-2 text-sm text-white/60">{errorMessage ?? 'Une erreur est survenue.'}</p>
      </div>
    )
  }

  return (
    <ConnectComponentsProvider connectInstance={instance!}>
      {children}
    </ConnectComponentsProvider>
  )
}
