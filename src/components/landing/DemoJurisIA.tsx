'use client'

import { motion } from 'framer-motion'
import { Bot, Scale, BookOpen, ShieldCheck } from 'lucide-react'

const features = [
  { icon: Scale, label: "Spécialiste du droit des sociétés français" },
  { icon: BookOpen, label: "Citations Legifrance, INPI, service-public.fr" },
  { icon: ShieldCheck, label: "Indice de confiance sur chaque réponse" },
  { icon: Bot, label: "Disponible 24/7 dans ton dashboard" },
]

export default function DemoJurisIA() {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80">
            <Bot className="h-4 w-4 text-[#FF6B35]" /> JurisIA
          </div>
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Ton <span className="moksha-gradient-text">avocat IA</span> de confiance, 24/7.
          </h2>
          <p className="mt-4 text-white/60">
            Pose tes questions en français simple. JurisIA cite les textes officiels, évalue sa confiance et te
            redirige vers un professionnel pour les cas complexes.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FF6B35]/30 bg-[#FF6B35]/10">
                  <f.icon className="h-4 w-4 text-[#FF6B35]" />
                </div>
                <span className="text-sm text-white/80">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass p-6 shadow-[0_0_50px_-15px_rgba(255,107,53,0.4)]"
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#5DCAA5]" />
              <span className="text-xs text-white/60">JurisIA — En ligne</span>
            </div>
            <span className="text-xs text-white/40">Confiance : Élevé</span>
          </div>
          <div className="space-y-4">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#0F6E56]/30 px-4 py-3 text-sm">
              Je veux créer une SASU pour mon activité de conseil. Quel capital minimum ?
            </div>
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <p>
                Tu peux créer ta <strong className="text-[#FFD700]">SASU avec 1 € de capital minimum</strong>. Il n&apos;y a
                pas de capital légal imposé pour les SASU (art. L227-1 du Code de commerce).
              </p>
              <p className="mt-2 text-white/70">
                👉 En pratique, je te recommande plutôt <strong>1000 à 5000 €</strong> pour rassurer tes partenaires
                (banque, clients, fournisseurs).
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-2.5 py-0.5 text-[11px] text-[#FF6B35]">
                  📖 Legifrance L227-1
                </span>
                <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2.5 py-0.5 text-[11px] text-[#FFD700]">
                  📖 service-public.fr
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 pl-2">
              <motion.span className="h-2 w-2 rounded-full bg-white/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <motion.span className="h-2 w-2 rounded-full bg-white/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
              <motion.span className="h-2 w-2 rounded-full bg-white/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
