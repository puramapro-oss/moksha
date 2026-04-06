import Link from 'next/link'
import Logo from '@/components/shared/Logo'
import WizardAssociation from '@/components/wizard/WizardAssociation'

export const metadata = {
  title: 'Créer mon association — MOKSHA',
  description: 'Création d\'association loi 1901 en 5 étapes : statuts, bureau, siège, déclaration préfecture automatique.',
}

export default function CreerAssociation() {
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
        <WizardAssociation />
      </div>
    </main>
  )
}
