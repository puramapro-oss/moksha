import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import LandingNav from '@/components/layout/LandingNav'
import {
  Building2,
  Users,
  Bot,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  Sparkles,
  Check,
  Scale,
  Lock,
  Flame,
} from 'lucide-react'

export const metadata = {
  title: 'Démarrer — MOKSHA',
  description: 'Choisis la voie qui te convient : entreprise, association ou conseil JurisIA.',
}

const featuredBenefits = [
  'Statuts générés et signés en ligne',
  'Annonce légale + dépôt INPI auto',
  'Kbis envoyé sous 5–10 jours',
  'Garantie zéro refus (corrections illimitées)',
]

const standardEntries = [
  {
    icon: Users,
    eyebrow: 'Association',
    title: 'Loi 1901',
    description:
      "Statuts, PV constitutif, déclaration préfecture, parution JOAFE. 6 types : culturelle, sportive, humanitaire, éducation, environnement, autre.",
    href: '/creer/association',
    duration: '8 min',
    price: 'Dès 29€',
    accent: '#5DCAA5',
  },
  {
    icon: Bot,
    eyebrow: 'Conseil',
    title: 'JurisIA me guide',
    description:
      "JurisIA analyse ton projet et recommande la forme juridique la plus adaptée. Citations Legifrance, score de confiance.",
    href: '/auth?next=/dashboard/jurisia',
    duration: '5 min',
    price: 'Gratuit',
    accent: '#FFB300',
  },
]

const pillars = [
  {
    icon: Flame,
    title: 'Liberté',
    text: "Pas un seul rendez-vous. Tu signes depuis ton canapé. MOKSHA dépose à ta place via Pappers + INPI.",
  },
  {
    icon: Zap,
    title: 'Vitesse',
    text: 'Wizard 6 étapes en 10 minutes. Express 24h disponible. Documents juridiques générés par IA, relus par JurisIA.',
  },
  {
    icon: Lock,
    title: 'Sécurité',
    text: 'ProofVault chiffré AES-256. Score conformité temps réel. Garantie zéro refus avec corrections illimitées.',
  },
]

export default function Demarrer() {
  return (
    <main className="relative z-10 min-h-screen">
      <div className="moksha-mesh-bg" aria-hidden="true" />
      <LandingNav />

      <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="moksha-eyebrow-chip mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[#FFB300]" />
              <span>Une question, trois réponses</span>
            </div>
            <h1
              className="moksha-h1 text-balance"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.25rem, 5vw + 0.4rem, 4rem)',
              }}
            >
              Par où <span className="moksha-gradient-text">commences-tu</span> ?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/65 sm:text-base">
              Choisis la voie. MOKSHA s&apos;occupe du reste — statuts, dépôts, conformité.
            </p>

            <div className="mx-auto mt-8 inline-flex">
              <div className="moksha-trust-strip">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#5DCAA5]" />
                  Kbis 5–10 jours
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#FFB300]" />
                  Garantie zéro refus
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5 text-[#FF6B00]" />
                  100 % en ligne
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grille asymétrique : Entreprise featured 2 col + Asso/Conseil 1 col */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3 md:gap-7">
            {/* Card Entreprise — featured 2 col */}
            <Link
              href="/creer/entreprise"
              className="moksha-card-featured group relative flex h-full flex-col p-7 sm:p-9 md:col-span-2 md:p-11"
              aria-label="Créer mon entreprise — le plus choisi"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="moksha-badge-featured">
                  <Flame className="h-3 w-3" />
                  Le plus choisi
                </span>
                <span className="text-xs font-medium tracking-wider text-white/45">
                  ⏱ 10 min · Dès 49€
                </span>
              </div>

              <div className="mt-6 flex flex-1 flex-col md:mt-8 md:flex-row md:gap-10">
                <div className="flex-1">
                  <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF3D00] via-[#FF6B00] to-[#FFB300] shadow-[0_8px_30px_-8px_rgba(255,61,0,0.6)] transition-transform group-hover:scale-105 group-hover:rotate-[-2deg]">
                    <Building2 className="h-8 w-8 text-[#1a0500]" strokeWidth={2.2} />
                  </div>
                  <span className="moksha-eyebrow block">Entreprise</span>
                  <h3
                    className="mt-2 font-display text-3xl font-extrabold leading-tight md:text-4xl"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Crée ta société
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
                    SASU · SAS · SARL · EURL · SCI · Micro-entreprise.
                    Wizard 6 étapes, signature électronique, dépôt INPI automatique via Pappers.
                  </p>
                </div>

                <ul className="mt-7 flex flex-col gap-3 md:mt-2 md:max-w-[280px]">
                  {featuredBenefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-white/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5DCAA5]" strokeWidth={3} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
                <span className="text-xs text-white/40">
                  Frais officiels (~187€ greffe + annonce légale) en sus
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF6B00] transition-transform group-hover:translate-x-1">
                  Démarrer
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Cards Asso + Conseil — 1 col chacune */}
            {standardEntries.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="moksha-card-standard group relative flex h-full flex-col p-7 sm:p-8"
                aria-label={c.title}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition-transform group-hover:scale-110"
                    style={{
                      boxShadow: `0 0 24px -8px ${c.accent}55`,
                    }}
                  >
                    <c.icon className="h-6 w-6" style={{ color: c.accent }} strokeWidth={2.1} />
                  </div>
                  <span className="text-[11px] font-medium tracking-wider text-white/40">
                    ⏱ {c.duration}
                  </span>
                </div>

                <span className="moksha-eyebrow mt-6 block">{c.eyebrow}</span>
                <h3
                  className="mt-1.5 font-display text-2xl font-bold leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {c.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">{c.description}</p>

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs">
                  <span className="font-medium" style={{ color: c.accent }}>
                    {c.price}
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/45 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi MOKSHA — 3 piliers */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <span className="moksha-eyebrow">Pourquoi MOKSHA</span>
            <h2
              className="moksha-h2 mt-3 text-balance"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Trois <span className="moksha-gradient-text">libérations</span> d&apos;un coup
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="moksha-card-standard p-7">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3D00]/15 to-[#FFB300]/10 border border-[#FF6B00]/15">
                  <p.icon className="h-5 w-5 text-[#FF6B00]" />
                </div>
                <h3
                  className="font-display text-xl font-bold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {p.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/60">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:text-white"
            >
              <Scale className="h-4 w-4" />
              Voir les tarifs et comparer
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
