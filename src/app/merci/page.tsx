import Link from 'next/link'
import Logo from '@/components/shared/Logo'
import { PartyPopper } from 'lucide-react'

export const metadata = { title: 'Merci — MOKSHA' }

export default function Merci() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <header className="border-b border-white/5 py-5">
        <div className="mx-auto max-w-5xl px-6">
          <Logo />
        </div>
      </header>
      <section className="mx-auto max-w-2xl px-6 pt-20 text-center">
        <PartyPopper className="mx-auto mb-4 h-14 w-14 text-[#FFD700]" />
        <h1 className="font-display text-5xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          Merci <span className="moksha-gradient-text">infiniment</span>
        </h1>
        <p className="mt-4 text-white/60">
          Ton paiement est confirmé. Tu peux maintenant profiter de toute la puissance de MOKSHA.
        </p>
        <Link
          href="/dashboard"
          className="mt-10 inline-block rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-8 py-4 font-bold text-[#070B18]"
        >
          Accéder à mon dashboard
        </Link>
      </section>
    </main>
  )
}
