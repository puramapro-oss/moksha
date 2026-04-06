import { Suspense } from 'react'
import PaiementClient from '@/components/shared/PaiementClient'
import LandingNav from '@/components/layout/LandingNav'

export const metadata = { title: 'Paiement — MOKSHA' }

export default function Paiement() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <Suspense fallback={<div className="pt-40 text-center text-white/60">Chargement...</div>}>
        <PaiementClient />
      </Suspense>
    </main>
  )
}
