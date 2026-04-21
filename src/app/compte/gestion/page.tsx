'use client'

/**
 * MOKSHA V7.1 — /compte/gestion (Stripe Connect Embedded)
 * Site link : "Gestion du compte"
 * Component : ConnectAccountManagement (profil, identité, représentant, docs)
 */

import { ConnectAccountManagement } from '@stripe/react-connect-js'
import ConnectProvider from '@/components/wallet/ConnectProvider'
import { Settings } from 'lucide-react'

export default function CompteGestionPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-[#FF6B35]/15 p-2.5">
          <Settings className="h-5 w-5 text-[#FF6B35]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Gestion du compte</h2>
          <p className="text-sm text-white/60">
            Met à jour ton identité, ton représentant et tes informations fiscales.
          </p>
        </div>
      </header>

      <ConnectProvider publishableKey={publishableKey}>
        <div className="glass p-6">
          <ConnectAccountManagement />
        </div>
      </ConnectProvider>
    </div>
  )
}
