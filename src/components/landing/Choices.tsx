'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, Users, Bot } from 'lucide-react'

const choices = [
  {
    icon: Building2,
    title: 'Créer mon entreprise',
    description: 'SASU, SAS, SARL, EURL, SCI, Micro — 10 minutes chrono, dépôt INPI automatique.',
    cta: 'Démarrer',
    href: '/creer/entreprise',
    color: '#FF6B35',
  },
  {
    icon: Users,
    title: 'Créer mon association',
    description: 'Association loi 1901, statuts types, déclaration préfecture, JOAFE auto.',
    cta: 'Démarrer',
    href: '/creer/association',
    color: '#FFD700',
  },
  {
    icon: Bot,
    title: "Je ne sais pas encore",
    description: "JurisIA t'aide à choisir la meilleure forme juridique selon ton projet.",
    cta: 'Discuter avec JurisIA',
    href: '/auth?next=/dashboard/jurisia',
    color: '#5DCAA5',
  },
] as const

export default function Choices() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Par où veux-tu <span className="moksha-gradient-text">commencer ?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Trois voies vers la libération. Choisis celle qui correspond à ton projet.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {choices.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={c.href}
                className="glass glass-hover group block h-full p-8 transition-all"
                style={{ '--accent': c.color } as React.CSSProperties}
              >
                <div
                  className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${c.color}20, ${c.color}10)`,
                    border: `1px solid ${c.color}35`,
                  }}
                >
                  <c.icon className="h-7 w-7" style={{ color: c.color }} />
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {c.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-white/60">{c.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: c.color }}>
                  {c.cta}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
