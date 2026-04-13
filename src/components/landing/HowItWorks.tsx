'use client'

import { motion } from 'framer-motion'
import { ClipboardList, PenTool, Rocket, FileCheck } from 'lucide-react'

const steps = [
  {
    icon: ClipboardList,
    title: '1. Questionnaire',
    description: "Réponds à 6 questions simples. JurisIA te guide et pré-remplit ton dossier automatiquement.",
    duration: '3 min',
  },
  {
    icon: PenTool,
    title: '2. Signature',
    description: "Visualise tes documents générés. Signe électroniquement via FranceConnect+ ou eIDAS.",
    duration: '2 min',
  },
  {
    icon: Rocket,
    title: '3. Dépôt automatique',
    description: "MOKSHA dépose ton dossier à l'INPI, publie l'annonce légale, gère le paiement des frais de greffe.",
    duration: 'Instantané',
  },
  {
    icon: FileCheck,
    title: '4. Kbis dans ton vault',
    description: "Ton Kbis arrive directement dans ProofVault sous 5 à 10 jours ouvrés. Tu es officiellement libre.",
    duration: '5-10j',
  },
]

export default function HowItWorks() {
  return (
    <section id="comment" className="moksha-section">
      <div className="moksha-container">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="moksha-eyebrow mb-3">Le parcours</p>
          <h2 className="moksha-h2">
            Quatre étapes, <span className="moksha-gradient-text">zéro friction</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
            Du questionnaire au Kbis dans ton coffre. On gère le reste.
          </p>
        </div>
        <div className="relative grid gap-10 sm:gap-8 md:grid-cols-4">
          <div className="pointer-events-none absolute left-12 right-12 top-[44px] hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative mb-5">
                <div className="flex h-[88px] w-[88px] items-center justify-center rounded-3xl border border-white/10 bg-[#0D1225] shadow-[0_8px_30px_-12px_rgba(255,107,53,0.35)] sm:h-[96px] sm:w-[96px]">
                  <s.icon className="h-8 w-8 text-[#FFD700]" />
                </div>
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFD700] text-[11px] font-bold text-[#070B18]">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 font-display text-base font-bold tracking-tight text-white sm:text-lg">
                {s.title.replace(/^\d+\.\s*/, '')}
              </h3>
              <p className="mx-auto max-w-[240px] text-pretty text-[13.5px] leading-relaxed text-white/55">
                {s.description}
              </p>
              <span className="mt-3 inline-block rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#FF6B35]">
                {s.duration}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
