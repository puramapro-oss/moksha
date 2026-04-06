'use client'

import Link from 'next/link'
import { Flame } from 'lucide-react'

export default function CTAFinal() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="glass relative overflow-hidden p-12 text-center md:p-16">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#FF6B35] opacity-20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-4xl font-extrabold md:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
              Prêt à te <span className="moksha-gradient-text">libérer</span> ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/60">
              Rejoins les entrepreneurs qui ont choisi la voie la plus rapide, la plus fluide, la plus libre.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/demarrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-8 py-4 text-base font-bold text-[#070B18] shadow-[0_0_50px_-5px_rgba(255,107,53,0.6)] transition hover:scale-[1.03]"
              >
                <Flame className="h-5 w-5" />
                Créer mon entreprise maintenant
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-semibold text-white/80 underline-offset-4 transition hover:text-white hover:underline"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
