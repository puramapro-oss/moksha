import Link from 'next/link'
import Logo from '@/components/shared/Logo'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Finaliser ma démarche — MOKSHA',
  description: "Finalise ta démarche de création en quelques clics.",
}

export default function Formalites() {
  return (
    <main className="relative z-10 min-h-screen">
      <header className="border-b border-white/5 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Logo />
          <Link
            href="/demarrer"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ← Accueil
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-2xl px-6 pt-20 text-center">
        <Sparkles className="mx-auto mb-6 h-14 w-14 text-[#FFB300]" />
        <h1 className="font-display text-4xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          Ton dossier est <span className="moksha-gradient-text">presque prêt</span>
        </h1>
        <p className="mt-4 text-white/60">
          Connecte-toi ou crée ton compte pour poursuivre : génération des documents, signature électronique, dépôt automatique.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth?next=/dashboard"
            className="rounded-2xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-8 py-4 font-bold text-[#070B18] transition hover:scale-[1.03]"
          >
            Créer mon compte
          </Link>
          <Link
            href="/auth?next=/dashboard"
            className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-medium text-white transition hover:bg-white/10"
          >
            Se connecter
          </Link>
        </div>
      </section>
    </main>
  )
}
