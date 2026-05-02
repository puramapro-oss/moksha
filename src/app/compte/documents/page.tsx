'use client'

/**
 * MOKSHA V7.1 — /compte/documents (Stripe Connect Embedded)
 * Site link : "Documents"
 * Component : ConnectDocuments (reçus, factures, attestations fiscales)
 */

import { ConnectDocuments } from '@stripe/react-connect-js'
import ConnectProvider from '@/components/wallet/ConnectProvider'
import { FileText } from 'lucide-react'

export default function CompteDocumentsPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-[#FF3D00]/15 p-2.5">
          <FileText className="h-5 w-5 text-[#FF3D00]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">Documents</h2>
          <p className="text-sm text-white/60">
            Reçus de virements, factures Stripe, attestations fiscales.
          </p>
        </div>
      </header>

      <ConnectProvider publishableKey={publishableKey}>
        <div className="glass p-6">
          <ConnectDocuments />
        </div>
      </ConnectProvider>
    </div>
  )
}
