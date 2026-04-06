'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Flame } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function PaiementClient() {
  const params = useSearchParams()
  const plan = params.get('plan') || 'autopilote'
  const interval = params.get('interval') || 'mensuel'
  const { profile, isAuthenticated, loading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  async function checkout() {
    if (!isAuthenticated) {
      window.location.href = `/auth?next=/paiement?plan=${plan}`
      return
    }
    setRedirecting(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      if (!res.ok) throw new Error('Checkout impossible')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      setRedirecting(false)
    }
  }

  useEffect(() => {
    if (!loading && profile?.plan && profile.plan !== 'gratuit') {
      toast.info(`Tu es déjà sur le plan ${profile.plan}`)
    }
  }, [loading, profile?.plan])

  const prices = {
    autopilote: { mensuel: 19, annuel: 180 },
    pro: { mensuel: 49, annuel: 468 },
  } as const
  const price = prices[plan as 'autopilote' | 'pro']?.[interval as 'mensuel' | 'annuel'] ?? 19

  return (
    <section className="mx-auto max-w-xl px-6 pt-32 pb-20">
      <div className="glass p-10 text-center">
        <Flame className="mx-auto mb-4 h-10 w-10 text-[#FF6B35]" />
        <h1 className="font-display text-4xl font-extrabold capitalize" style={{ fontFamily: 'var(--font-display)' }}>
          MOKSHA <span className="moksha-gradient-text">{plan}</span>
        </h1>
        <p className="mt-2 text-sm text-white/60 capitalize">{interval}</p>
        <div className="my-8 text-5xl font-extrabold">
          {price} <span className="text-2xl">€</span>
          <span className="ml-1 text-sm text-white/50">/{interval === 'annuel' ? 'an' : 'mois'}</span>
        </div>
        <button
          onClick={checkout}
          disabled={redirecting}
          className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-4 text-base font-bold text-[#070B18] disabled:opacity-50"
        >
          {redirecting ? 'Redirection...' : 'Continuer vers Stripe →'}
        </button>
        <p className="mt-4 text-[10px] text-white/40">
          Paiement sécurisé via Stripe. Essai gratuit 14 jours, annulable à tout moment.
        </p>
      </div>
    </section>
  )
}
