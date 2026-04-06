import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import LandingNav from '@/components/layout/LandingNav'
import { Building2, Users, Bot, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Démarrer — MOKSHA',
  description: 'Choisis la voie qui te convient : entreprise, association ou conseil JurisIA.',
}

const choices = [
  {
    icon: Building2,
    title: 'Créer mon entreprise',
    description: 'SASU, SAS, SARL, EURL, SCI, Micro. Dépôt INPI automatique, Kbis sous 5-10 jours.',
    href: '/creer/entreprise',
    gradient: 'from-[#FF6B35] to-[#FFD700]',
    duration: '10 min',
    price: 'Dès 49€',
  },
  {
    icon: Users,
    title: 'Créer mon association',
    description: 'Association loi 1901. Statuts, PV AG constitutive, déclaration préfecture, JOAFE.',
    href: '/creer/association',
    gradient: 'from-[#FFD700] to-[#5DCAA5]',
    duration: '8 min',
    price: 'Dès 29€',
  },
  {
    icon: Bot,
    title: 'Je veux être conseillé',
    description: "JurisIA analyse ton projet et te recommande la meilleure forme juridique selon ta situation.",
    href: '/auth?next=/dashboard/jurisia',
    gradient: 'from-[#5DCAA5] to-[#FF6B35]',
    duration: '5 min',
    price: 'Gratuit',
  },
]

export default function Demarrer() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <section className="pt-32 pb-20 md:pt-40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h1
              className="font-display text-4xl font-extrabold md:text-6xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Par où <span className="moksha-gradient-text">commences-tu</span> ?
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-white/60">
              Choisis la voie. MOKSHA s&apos;occupe du reste.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {choices.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="glass glass-hover group relative flex h-full flex-col p-8"
              >
                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} shadow-[0_0_30px_-10px_rgba(255,107,53,0.5)] transition-transform group-hover:scale-110`}
                >
                  <c.icon className="h-7 w-7 text-[#070B18]" />
                </div>
                <h3 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {c.title}
                </h3>
                <p className="mb-6 flex-1 text-sm text-white/60">{c.description}</p>
                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs">
                  <div className="flex gap-3">
                    <span className="text-white/50">⏱ {c.duration}</span>
                    <span className="text-[#FFD700]">{c.price}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#FF6B35] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
