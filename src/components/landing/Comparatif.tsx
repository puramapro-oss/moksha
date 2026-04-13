'use client'

import { motion } from 'framer-motion'
import { Bot, ShieldCheck, Lock, Gauge, Receipt, Headphones } from 'lucide-react'

const reasons = [
  {
    icon: Bot,
    title: 'JurisIA intégré',
    text: "Un agent juridique IA disponible 24/7 dans ton tableau de bord. Citations Legifrance, INPI et service-public.fr, indice de confiance sur chaque réponse.",
  },
  {
    icon: ShieldCheck,
    title: 'Garantie Zéro Refus',
    text: "ScannerPerfect™ valide tes pièces avant l'envoi. En cas de refus du greffe, on corrige et on redépose gratuitement, autant de fois qu'il faut.",
  },
  {
    icon: Lock,
    title: 'ProofVault sécurisé',
    text: "Tous tes documents chiffrés AES-256, hébergés en Europe. Partage instantané à ta banque ou ton expert-comptable via lien temporaire signé.",
  },
  {
    icon: Gauge,
    title: 'Score conformité live',
    text: "Dix critères évalués en temps réel. Tu sais ce qui manque, ce qui est à risque, et comment corriger — sans attendre un courrier du greffe.",
  },
  {
    icon: Receipt,
    title: 'Frais transparents',
    text: "Le tarif MOKSHA, plus les frais officiels (greffe ~37€, annonce légale ~150-200€) affichés avant paiement. Aucun supplément caché.",
  },
  {
    icon: Headphones,
    title: 'Support humain réel',
    text: "Si JurisIA atteint ses limites, tu écris à matiss.frasne@gmail.com et tu obtiens une réponse personnelle. Pas de chatbot en boucle.",
  },
]

export default function Comparatif() {
  return (
    <section className="moksha-section">
      <div className="moksha-container max-w-5xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="moksha-eyebrow mb-3">Pourquoi MOKSHA</p>
          <h2 className="moksha-h2">
            Six raisons de <span className="moksha-gradient-text">nous choisir</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
            Conçu pour ceux qui veulent avancer vite sans sacrifier la rigueur juridique.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="glass glass-hover p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <r.icon className="h-[18px] w-[18px] text-[#FFD700]" />
              </div>
              <h3 className="mb-2 font-display text-base font-bold tracking-tight text-white sm:text-lg">
                {r.title}
              </h3>
              <p className="text-pretty text-[13.5px] leading-relaxed text-white/60">
                {r.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
