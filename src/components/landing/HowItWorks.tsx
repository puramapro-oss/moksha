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
    <section id="comment" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Comment ça <span className="moksha-gradient-text">marche</span> ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Quatre étapes. Zéro bureaucratie. Ton entreprise est créée et opérationnelle.
          </p>
        </div>
        <div className="relative grid gap-8 md:grid-cols-4">
          <div className="absolute left-6 right-6 top-[52px] hidden h-[2px] bg-gradient-to-r from-[#FF6B35] via-[#FFD700] to-[#5DCAA5] opacity-40 md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-5 inline-flex h-[104px] w-[104px] items-center justify-center rounded-3xl border border-white/10 bg-[#0D1225] shadow-[0_0_40px_-10px_rgba(255,107,53,0.35)]">
                <s.icon className="h-9 w-9 text-[#FFD700]" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {s.title}
              </h3>
              <p className="mx-auto max-w-[240px] text-sm text-white/60">{s.description}</p>
              <span className="mt-3 inline-block rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-3 py-1 text-xs font-semibold text-[#FF6B35]">
                {s.duration}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
