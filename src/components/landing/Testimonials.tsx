'use client'

import { motion } from 'framer-motion'
import { HeartHandshake, Eye, Lock, Sparkles } from 'lucide-react'

const principles = [
  {
    icon: HeartHandshake,
    title: 'Honnêteté radicale',
    text: "Pas de témoignages inventés, pas de chiffres gonflés. Tu vois exactement ce que tu paies, ce que tu obtiens, et ce qui est en cours de construction.",
    color: '#FF6B35',
  },
  {
    icon: Eye,
    title: 'Transparence totale',
    text: "Frais de greffe, annonce légale, délais réels du greffe : tout est annoncé avant paiement. Aucune surprise, aucune option masquée.",
    color: '#FFD700',
  },
  {
    icon: Lock,
    title: "Tes données t'appartiennent",
    text: "Hébergement Europe, chiffrement AES-256, conformité RGPD. Tu peux exporter ou supprimer ton dossier à tout moment, en un clic.",
    color: '#5DCAA5',
  },
  {
    icon: Sparkles,
    title: 'JurisIA, pas un avocat',
    text: "JurisIA cite les sources officielles et indique son indice de confiance. Sur les cas complexes, il te redirige vers un professionnel — c'est la règle.",
    color: '#FF6B35',
  },
]

export default function Testimonials() {
  return (
    <section className="moksha-section">
      <div className="moksha-container">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="moksha-eyebrow mb-3">Nos engagements</p>
          <h2 className="moksha-h2">
            Construit sur des <span className="moksha-gradient-text">principes clairs</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
            MOKSHA est en lancement. Plutôt que d'inventer des avis, on te dit comment on travaille.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass glass-hover relative overflow-hidden p-6 sm:p-8"
            >
              <div
                className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${p.color}26, ${p.color}0d)`,
                  border: `1px solid ${p.color}33`,
                }}
              >
                <p.icon className="h-5 w-5" style={{ color: p.color }} />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                {p.title}
              </h3>
              <p className="text-pretty text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
                {p.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
