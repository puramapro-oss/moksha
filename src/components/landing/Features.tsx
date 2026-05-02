'use client'

import { motion } from 'framer-motion'
import { Bot, Rocket, Lock, Radio, Camera, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'JurisIA',
    description: "Ton agent juridique IA. Citations Legifrance officielles, indice de confiance, réponses en français simple.",
    color: '#FF3D00',
  },
  {
    icon: Rocket,
    title: 'Autopilote',
    description: 'PV AG annuelle, déclarations TVA, rappels URSSAF. Tout se gère automatiquement.',
    color: '#FFB300',
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
    color: '#FF3D00',
  },
  {
    icon: Camera,
    title: 'ScannerPerfect™',
    description: 'Contrôle qualité automatique : flou, reflet, lisibilité. Zéro refus à la source.',
    color: '#FFB300',
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
    <section id="features" className="moksha-section">
      <div className="moksha-container">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="moksha-eyebrow mb-3">Fonctionnalités</p>
          <h2 className="moksha-h2">
            Tout pour aller <span className="moksha-gradient-text">vite et loin</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
            Six outils pensés pour t&apos;émanciper de la friction administrative.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass glass-hover group p-6 sm:p-7"
            >
              <div
                className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${f.color}26, ${f.color}0d)`,
                  border: `1px solid ${f.color}33`,
                }}
              >
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                {f.title}
              </h3>
              <p className="text-pretty text-[13.5px] leading-relaxed text-white/60 sm:text-[14.5px]">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
