'use client'

import { Zap, Clock } from 'lucide-react'
import { FORMES_JURIDIQUES } from '@/lib/constants'
import type { WizardData } from './WizardEntreprise'

export default function StepStructure({
  data,
  update,
}: {
  data: WizardData
  update: (p: Partial<WizardData>) => void
}) {
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Quelle forme juridique ?
      </h2>
      <p className="mb-8 text-sm text-white/60">Pas sûr ? JurisIA peut t&apos;aider à choisir.</p>

      <div className="grid gap-3 md:grid-cols-2">
        {FORMES_JURIDIQUES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => update({ forme: f.id })}
            className={`group flex items-start gap-3 rounded-2xl border p-5 text-left transition-all ${
              data.forme === f.id
                ? 'border-[#FF6B35]/60 bg-[#FF6B35]/10 shadow-[0_0_30px_-10px_rgba(255,107,53,0.4)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-3xl">{f.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold">{f.label}</h3>
              <p className="mt-1 text-xs text-white/55">{f.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-white/80">Mode de traitement</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => update({ mode: 'standard' })}
            className={`flex items-start gap-3 rounded-2xl border p-5 text-left transition ${
              data.mode === 'standard' ? 'border-[#FF6B35]/60 bg-[#FF6B35]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <Clock className="h-5 w-5 text-[#FFD700]" />
            <div>
              <h4 className="font-semibold">Standard — 72h</h4>
              <p className="mt-1 text-xs text-white/55">Traitement classique, inclus dans le tarif.</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => update({ mode: 'express' })}
            className={`flex items-start gap-3 rounded-2xl border p-5 text-left transition ${
              data.mode === 'express' ? 'border-[#FF6B35]/60 bg-[#FF6B35]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <Zap className="h-5 w-5 text-[#FFD700]" />
            <div>
              <h4 className="font-semibold">Express — 24h (+50€)</h4>
              <p className="mt-1 text-xs text-white/55">Priorité absolue, dépôt dans la journée.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
