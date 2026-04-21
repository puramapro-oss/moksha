'use client'

/**
 * MOKSHA V7.1 — /compte/soldes (Stripe Connect Embedded)
 * Site link : "Soldes"
 * Component : ConnectBalances (soldes disponibles / en attente + instant payouts)
 */

import { ConnectBalances } from '@stripe/react-connect-js'
import ConnectProvider from '@/components/wallet/ConnectProvider'
import { Wallet } from 'lucide-react'

export default function CompteSoldesPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-[#FF6B35]/15 p-2.5">
          <Wallet className="h-5 w-5 text-[#FF6B35]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Soldes</h2>
          <p className="text-sm text-white/60">
            Fonds disponibles, en attente et virements instantanés.
          </p>
        </div>
      </header>

      <ConnectProvider publishableKey={publishableKey}>
        <div className="glass p-6">
          <ConnectBalances />
        </div>
      </ConnectProvider>
    </div>
  )
}
