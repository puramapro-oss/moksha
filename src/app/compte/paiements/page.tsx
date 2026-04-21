'use client'

/**
 * MOKSHA V7.1 — /compte/paiements (Stripe Connect Embedded)
 * Site link : "Paiements"
 * Component : ConnectPayments (historique des paiements reçus en tant que vendeur)
 */

import { ConnectPayments } from '@stripe/react-connect-js'
import ConnectProvider from '@/components/wallet/ConnectProvider'
import { CreditCard } from 'lucide-react'

export default function ComptePaiementsPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-[#FF6B35]/15 p-2.5">
          <CreditCard className="h-5 w-5 text-[#FF6B35]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Paiements</h2>
          <p className="text-sm text-white/60">
            Historique des paiements reçus (primes, KARMA, bourses, marketplace).
          </p>
        </div>
      </header>

      <ConnectProvider publishableKey={publishableKey}>
        <div className="glass p-6">
          <ConnectPayments />
        </div>
      </ConnectProvider>
    </div>
  )
}
