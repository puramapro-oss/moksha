'use client'

/**
 * MOKSHA V7.1 — /compte/virements (Stripe Connect Embedded)
 * Site link : "Virements"
 * Component : ConnectPayouts (liste des virements, fréquence, IBAN)
 */

import { ConnectPayouts } from '@stripe/react-connect-js'
import ConnectProvider from '@/components/wallet/ConnectProvider'
import { ArrowDownToLine } from 'lucide-react'

export default function CompteVirementsPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-[#FF3D00]/15 p-2.5">
          <ArrowDownToLine className="h-5 w-5 text-[#FF3D00]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Virements</h2>
          <p className="text-sm text-white/60">
            Historique des retraits vers ton IBAN et paramètres de fréquence.
          </p>
        </div>
      </header>

      <ConnectProvider publishableKey={publishableKey}>
        <div className="glass p-6">
          <ConnectPayouts />
        </div>
      </ConnectProvider>

      <p className="text-[12px] text-white/40">
        Frais Stripe prélevés à chaque virement. Purama ne prend aucune commission sur tes retraits.
      </p>
    </div>
  )
}
