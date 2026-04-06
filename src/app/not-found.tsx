import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-7xl">🔥</div>
      <h1
        className="mb-3 font-display text-5xl font-extrabold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span className="moksha-gradient-text">404</span>
      </h1>
      <p className="mb-8 max-w-md text-white/60">
        Cette page n&apos;existe pas ou a été déplacée. Pas de panique, ton empire t&apos;attend ailleurs.
      </p>
      <Link
        href="/"
        className="rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 font-bold text-[#070B18] transition hover:scale-[1.03]"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  )
}
