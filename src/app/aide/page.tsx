import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import LandingNav from '@/components/layout/LandingNav'
import FAQ from '@/components/landing/FAQ'
import { LifeBuoy, MessageSquare, Bot, Mail, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Aide & FAQ — MOKSHA',
  description:
    "Trouve la réponse à tes questions sur la création d'entreprise, le dépôt INPI, les délais, la garantie zéro refus.",
}

const channels = [
  {
    icon: Bot,
    title: 'JurisIA',
    text: 'Agent juridique IA, citations Legifrance, gratuit 3 questions/jour.',
    href: '/auth?next=/dashboard/jurisia',
    cta: 'Poser ma question',
  },
  {
    icon: Mail,
    title: 'Contact humain',
    text: 'Une question complexe ? Écris-nous, on répond sous 24h.',
    href: '/contact',
    cta: 'Écrire',
  },
  {
    icon: MessageSquare,
    title: 'Chatbot in-app',
    text: 'Chat support IA disponible 24/7 dans le dashboard.',
    href: '/auth?next=/dashboard/aide',
    cta: 'Ouvrir le chat',
  },
]

export default function Aide() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />

      <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-40">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="moksha-eyebrow-chip mb-6">
            <LifeBuoy className="h-3.5 w-3.5 text-[#FFB300]" />
            <span>Centre d&apos;aide MOKSHA</span>
          </div>
          <h1
            className="moksha-h1 text-balance"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.25rem, 5vw + 0.4rem, 3.5rem)',
            }}
          >
            On <span className="moksha-gradient-text">t&apos;aide</span> à te lancer
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/65 sm:text-base">
            Réponses aux questions fréquentes, contact humain, chatbot IA et JurisIA.
            Choisis ton canal — on est là.
          </p>
        </div>
      </section>

      <section className="relative pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {channels.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="moksha-card-standard group flex h-full flex-col p-7"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#FF6B00]/20 bg-gradient-to-br from-[#FF3D00]/15 to-[#FFB300]/10">
                  <c.icon className="h-5 w-5 text-[#FF6B00]" />
                </div>
                <h3 className="font-display text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {c.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-white/60">{c.text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#FF6B00] transition-transform group-hover:translate-x-1">
                  {c.cta}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FAQ />

      <Footer />
    </main>
  )
}
