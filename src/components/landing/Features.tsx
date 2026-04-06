'use client'

import { motion } from 'framer-motion'
import { Bot, Rocket, Lock, Radio, Camera, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'JurisIA',
    description: "Ton agent juridique IA. Citations Legifrance officielles, indice de confiance, réponses en français simple.",
    color: '#FF6B35',
  },
  {
    icon: Rocket,
    title: 'Autopilote',
    description: 'PV AG annuelle, déclarations TVA, rappels URSSAF. Tout se gère automatiquement.',
    color: '#FFD700',
  },
  {
    icon: Lock,
    title: 'ProofVault',
    description: 'Coffre-fort AES-256. Timeline horodatée, partage banque/auditeur en 1 clic.',
    color: '#5DCAA5',
  },
  {
    icon: Radio,
    title: 'Suivi temps réel',
    description: 'Statut INPI live. Notifications à chaque étape. Kbis reçu directement dans ton vault.',
    color: '#FF6B35',
  },
  {
    icon: Camera,
    title: 'ScannerPerfect™',
    description: 'Contrôle qualité automatique : flou, reflet, lisibilité. Zéro refus à la source.',
    color: '#FFD700',
  },
  {
    icon: BarChart3,
    title: 'Simulateur',
    description: 'Compare statuts, salaires, TVA, embauche. Projections fiscales en temps réel.',
    color: '#5DCAA5',
  },
] as const

export default function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Tout ce qu&apos;il te faut pour{' '}
            <span className="moksha-gradient-text">aller vite et loin</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Six outils d&apos;exception conçus pour te libérer de l&apos;administratif.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass glass-hover group p-7"
            >
              <div
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${f.color}25, ${f.color}10)`,
                  border: `1px solid ${f.color}40`,
                }}
              >
                <f.icon className="h-6 w-6" style={{ color: f.color }} />
              </div>
              <h3 className="mb-2 font-display text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/60">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
