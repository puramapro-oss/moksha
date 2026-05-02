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
    <section className="moksha-section">
      <div className="moksha-container grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="moksha-eyebrow mb-3 flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-[#FF3D00]" /> JurisIA
          </p>
          <h2 className="moksha-h2">
            Ton agent juridique <span className="moksha-gradient-text">IA</span>, 24/7.
          </h2>
          <p className="mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-white/60">
            Pose tes questions en français simple. JurisIA cite les textes officiels, évalue sa confiance et te
            redirige vers un professionnel pour les cas complexes.
          </p>
          <ul className="mt-7 space-y-3.5">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FF3D00]/30 bg-[#FF3D00]/10">
                  <f.icon className="h-4 w-4 text-[#FF3D00]" />
                </div>
                <span className="text-[14px] text-white/80 sm:text-sm">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass p-6 shadow-[0_0_50px_-15px_rgba(255, 61, 0,0.4)]"
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
                Tu peux créer ta <strong className="text-[#FFB300]">SASU avec 1 € de capital minimum</strong>. Il n&apos;y a
                pas de capital légal imposé pour les SASU (art. L227-1 du Code de commerce).
              </p>
              <p className="mt-2 text-white/70">
                👉 En pratique, je te recommande plutôt <strong>1000 à 5000 €</strong> pour rassurer tes partenaires
                (banque, clients, fournisseurs).
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#FF3D00]/30 bg-[#FF3D00]/10 px-2.5 py-0.5 text-[11px] text-[#FF3D00]">
                  📖 Legifrance L227-1
                </span>
                <span className="rounded-full border border-[#FFB300]/30 bg-[#FFB300]/10 px-2.5 py-0.5 text-[11px] text-[#FFB300]">
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
