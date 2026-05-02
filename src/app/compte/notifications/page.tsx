'use client'

/**
 * MOKSHA V7.1 — /compte/notifications (Stripe Connect Embedded)
 * Site link : "Bannière notification"
 * Component : ConnectNotificationBanner (alertes KYC / documents manquants)
 */

import { ConnectNotificationBanner } from '@stripe/react-connect-js'
import ConnectProvider from '@/components/wallet/ConnectProvider'
import { Bell } from 'lucide-react'

export default function ComptNotificationsPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-[#FF3D00]/15 p-2.5">
          <Bell className="h-5 w-5 text-[#FF3D00]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Notifications</h2>
          <p className="text-sm text-white/60">
            Alertes Stripe sur ton compte (KYC, documents manquants, virements bloqués).
          </p>
        </div>
      </header>

      <ConnectProvider publishableKey={publishableKey}>
        <div className="glass p-6">
          <ConnectNotificationBanner />
        </div>
      </ConnectProvider>

      <p className="text-[12px] text-white/40">
        Tant qu&apos;aucune alerte n&apos;apparaît, ton compte est en règle.
      </p>
    </div>
  )
}
