'use client'

/**
 * MOKSHA V7.1 — /compte/configuration (Stripe Connect Embedded)
 * Site link : "Configuration"
 * Component : ConnectAccountManagement (paramètres avancés, branding, préférences)
 *
 * Note : Stripe ne fournit pas de composant "configuration" dédié — on réutilise
 * AccountManagement qui expose l'ensemble des préférences du compte.
 */

import { ConnectAccountManagement } from '@stripe/react-connect-js'
import ConnectProvider from '@/components/wallet/ConnectProvider'
import { Cog } from 'lucide-react'

export default function CompteConfigurationPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-[#FF6B35]/15 p-2.5">
          <Cog className="h-5 w-5 text-[#FF6B35]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Configuration</h2>
          <p className="text-sm text-white/60">
            Préférences de compte, branding, notifications Stripe et paramètres avancés.
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
