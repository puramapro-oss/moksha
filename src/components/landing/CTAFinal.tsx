'use client'

import Link from 'next/link'
import { Flame } from 'lucide-react'

export default function CTAFinal() {
  return (
    <section className="moksha-section">
      <div className="moksha-container max-w-4xl">
        <div className="glass relative overflow-hidden p-8 text-center sm:p-12 md:p-16">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF6B35] opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FFD700] opacity-10 blur-3xl" />
          <div className="relative">
            <h2 className="moksha-h2 mx-auto max-w-[16ch] text-balance">
              Prêt à te <span className="moksha-gradient-text">libérer</span> ?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-white/60">
              Crée ton entreprise en quelques minutes. Sans paperasse, sans appel, sans surprise.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/demarrer"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-7 py-3.5 text-[15px] font-semibold text-[#070B18] shadow-[0_8px_40px_-10px_rgba(255,107,53,0.7)] transition hover:shadow-[0_12px_50px_-8px_rgba(255,215,0,0.6)] sm:w-auto"
              >
                <Flame className="h-4 w-4" />
                Démarrer maintenant
              </Link>
              <Link
                href="#pricing"
                className="text-[13.5px] font-semibold text-white/70 underline-offset-4 transition hover:text-white hover:underline"
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
