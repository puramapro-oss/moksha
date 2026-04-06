import Link from 'next/link'
import WizardEntreprise from '@/components/wizard/WizardEntreprise'
import Logo from '@/components/shared/Logo'

export const metadata = {
  title: 'Créer mon entreprise — MOKSHA',
  description: 'Wizard de création d\'entreprise en 6 étapes : SASU, SAS, SARL, EURL, SCI, Micro.',
}

export default function CreerEntreprise() {
  return (
    <main className="relative z-10 min-h-screen pb-20">
      <header className="border-b border-white/5 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Logo />
          <Link
            href="/demarrer"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ← Retour
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <WizardEntreprise />
      </div>
    </main>
  )
}
