'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-7xl">⚠️</div>
      <h1
        className="mb-3 font-display text-3xl font-extrabold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Une erreur est survenue
      </h1>
      <p className="mb-8 max-w-md text-sm text-white/60">
        Le feu a vacillé mais il ne s&apos;éteint pas. Réessaie ou reviens à l&apos;accueil.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 font-bold text-[#070B18] transition hover:scale-[1.03]"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10"
        >
          Accueil
        </Link>
      </div>
    </main>
  )
}
