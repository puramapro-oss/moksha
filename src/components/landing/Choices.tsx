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
    <section className="moksha-section">
      <div className="moksha-container">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
          <p className="moksha-eyebrow mb-3">Par où commencer</p>
          <h2 className="moksha-h2">
            Choisis ta <span className="moksha-gradient-text">voie</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
            Trois portes d&apos;entrée. Une seule libération.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
          {choices.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                href={c.href}
                className="glass glass-hover group flex h-full flex-col p-6 transition-all sm:p-7"
              >
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${c.color}26, ${c.color}0d)`,
                    border: `1px solid ${c.color}33`,
                  }}
                >
                  <c.icon className="h-6 w-6" style={{ color: c.color }} />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                  {c.title}
                </h3>
                <p className="mb-6 text-pretty text-[13.5px] leading-relaxed text-white/60 sm:text-[14.5px]">
                  {c.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: c.color }}>
                  {c.cta}
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
