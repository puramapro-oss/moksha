'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import type { StripeConnectInstance } from '@stripe/connect-js'
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
  ConnectPayouts,
} from '@stripe/react-connect-js'
import { Shield, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  publishableKey: string
}

type ConnectStatus = {
  exists: boolean
  onboarding_completed: boolean
  payouts_enabled: boolean
  charges_enabled?: boolean
}

export default function ConnectOnboarding({ publishableKey }: Props) {
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null)
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/connect/onboard', { method: 'POST' })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(body.error ?? 'Impossible de démarrer le KYC')
    }
    const data = (await res.json()) as { client_secret: string }
    return data.client_secret
  }, [])

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/connect/status', { cache: 'no-store' })
      if (!res.ok) throw new Error('status error')
      const data = (await res.json()) as ConnectStatus
      setStatus(data)
    } catch {
      setStatus({ exists: false, onboarding_completed: false, payouts_enabled: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const startOnboarding = useCallback(async () => {
    setStarting(true)
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
      setInstance(inst)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur Stripe Connect')
    } finally {
      setStarting(false)
    }
  }, [publishableKey, fetchClientSecret])

  if (loading) {
    return (
      <div className="glass flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (status?.onboarding_completed) {
    return (
      <div className="glass p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-[#5DCAA5]/20 p-3">
            <CheckCircle2 className="h-6 w-6 text-[#5DCAA5]" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold">Compte Stripe Connect actif</h3>
            <p className="mt-1 text-sm text-white/60">
              Ton identité est vérifiée. Tu peux recevoir tes gains en euros réels et retirer vers ton compte bancaire.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#5DCAA5]/10 px-3 py-1 text-[#5DCAA5]">✓ KYC vérifié</span>
              {status.payouts_enabled && <span className="rounded-full bg-[#5DCAA5]/10 px-3 py-1 text-[#5DCAA5]">✓ Retraits activés</span>}
            </div>
          </div>
        </div>
        {instance && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <h4 className="mb-3 text-sm font-semibold text-white/70">Mes virements</h4>
            <ConnectComponentsProvider connectInstance={instance}>
              <ConnectPayouts />
            </ConnectComponentsProvider>
          </div>
        )}
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="glass p-8 text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-[#FF6B35]" />
        <h3 className="font-display text-xl font-bold">Active ton compte Stripe Connect</h3>
        <p className="mt-2 text-sm text-white/60">
          Nécessaire pour recevoir tes primes et tes gains en euros réels sur ton compte bancaire.
        </p>
        <ul className="mx-auto mt-5 max-w-md space-y-2 text-left text-[13px] text-white/70">
          <li>✓ Vérification d&apos;identité rapide (CNI ou passeport)</li>
          <li>✓ 2 minutes chrono — 100% chiffré</li>
          <li>✓ Frais retrait à partir de 2,30€ (≈4,8% à 50€)</li>
          <li>✓ Licence EMI passportée FR — zéro agrément Purama</li>
        </ul>
        <button
          onClick={startOnboarding}
          disabled={starting}
          className="mt-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
        >
          {starting ? 'Démarrage...' : 'Vérifier mon identité'}
        </button>
        <p className="mt-3 text-[11px] text-white/40">
          💡 Astuce : retire à partir de 50€ pour payer moins de frais.
          Frais prélevés par Stripe, pas par Purama. Purama ne prend aucune commission.
        </p>
      </div>
    )
  }

  return (
    <div className="glass p-6">
      <ConnectComponentsProvider connectInstance={instance}>
        <ConnectAccountOnboarding
          onExit={() => {
            void loadStatus()
            toast.success('KYC terminé — tes données sont en cours de vérification')
          }}
        />
      </ConnectComponentsProvider>
    </div>
  )
}
