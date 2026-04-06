'use client'

import { useState, useMemo } from 'react'
import { BarChart3 } from 'lucide-react'

type Regime = 'sasu' | 'eurl' | 'micro'

export default function Simulateur() {
  const [ca, setCa] = useState(60000)
  const [charges, setCharges] = useState(12000)
  const [regime, setRegime] = useState<Regime>('sasu')

  const results = useMemo(() => {
    const benefice = Math.max(0, ca - charges)
    // Simplifié — vulgarisation pour affichage indicatif
    const sasu = {
      cotisations: benefice * 0.25, // dividendes 30% + assimilé salarié ~25%
      is: Math.min(benefice, 42500) * 0.15 + Math.max(0, benefice - 42500) * 0.25,
      net: benefice - benefice * 0.25 - (Math.min(benefice, 42500) * 0.15 + Math.max(0, benefice - 42500) * 0.25) * 0.5,
    }
    const eurl = {
      cotisations: benefice * 0.45, // TNS
      is: 0,
      net: benefice * 0.55,
    }
    const micro = {
      cotisations: ca * 0.22, // micro BNC
      is: 0,
      net: ca * 0.78 - charges,
    }
    return { benefice, sasu, eurl, micro }
  }, [ca, charges])

  const current = results[regime]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <BarChart3 className="h-7 w-7 text-[#FFD700]" /> Simulateur fiscal
        </h1>
        <p className="mt-1 text-sm text-white/60">Compare SASU, EURL et Micro-entreprise — estimation indicative.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass p-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Chiffre d&apos;affaires annuel (€)</label>
            <input
              type="number"
              min={0}
              value={ca}
              onChange={(e) => setCa(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Charges annuelles (€)</label>
            <input
              type="number"
              min={0}
              value={charges}
              onChange={(e) => setCharges(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Forme juridique</label>
            <div className="grid grid-cols-3 gap-2">
              {(['sasu', 'eurl', 'micro'] as Regime[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className={`rounded-xl border py-2 text-sm uppercase ${
                    regime === r ? 'border-[#FF6B35]/60 bg-[#FF6B35]/10 text-white' : 'border-white/10 bg-white/5 text-white/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="mb-4 font-semibold">Résultats estimés</h2>
          <div className="space-y-3 text-sm">
            <Row label="Bénéfice avant impôts" value={results.benefice} />
            <Row label="Cotisations sociales" value={current.cotisations} negative />
            <Row label="Impôt sur les sociétés" value={current.is} negative />
            <div className="border-t border-white/10 pt-3">
              <Row label="Revenu net estimé" value={current.net} highlight />
            </div>
          </div>
          <p className="mt-6 text-[10px] text-white/40">
            ⚠ Simulation simplifiée à titre indicatif. Pour une projection précise, consulte un expert-comptable.
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-[#FFD700] text-lg' : negative ? 'text-red-300' : 'text-white'}`}>
        {negative ? '-' : ''}{Math.round(value).toLocaleString('fr-FR')} €
      </span>
    </div>
  )
}
