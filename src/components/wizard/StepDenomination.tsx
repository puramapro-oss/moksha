'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { CODES_APE } from '@/lib/constants'
import type { WizardData } from './WizardEntreprise'

export default function StepDenomination({
  data,
  update,
}: {
  data: WizardData
  update: (p: Partial<WizardData>) => void
}) {
  const [checking, setChecking] = useState(false)
  const [check, setCheck] = useState<{ available: boolean; similar: { denomination: string; siren: string }[] } | null>(null)

  useEffect(() => {
    if (!data.denomination || data.denomination.length < 3) {
      setCheck(null)
      return
    }
    const t = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(`/api/check-denomination?q=${encodeURIComponent(data.denomination)}`)
        if (res.ok) setCheck(await res.json())
      } catch {} finally {
        setChecking(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [data.denomination])

  return (
    <div>
      <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Comment s&apos;appelle ton entreprise ?
      </h2>
      <p className="mb-8 text-sm text-white/60">On vérifie automatiquement la disponibilité au répertoire INSEE.</p>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Dénomination sociale *</label>
          <div className="relative">
            <input
              type="text"
              value={data.denomination}
              onChange={(e) => update({ denomination: e.target.value })}
              placeholder="Ex: Luminos Conseil"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
            />
            {checking && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />
            )}
          </div>
          {check && !checking && data.denomination.length >= 3 && (
            <div
              className={`mt-2 flex items-start gap-2 rounded-lg border p-3 text-xs ${
                check.available
                  ? 'border-[#5DCAA5]/30 bg-[#5DCAA5]/10 text-[#5DCAA5]'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              {check.available ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <div>
                {check.available
                  ? 'Aucune entreprise active ne porte ce nom — tu peux y aller.'
                  : "Des entreprises proches existent déjà. Vérifie à ne pas créer de confusion."}
                {!check.available && check.similar && check.similar.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-[11px]">
                    {check.similar.slice(0, 3).map((s) => (
                      <li key={s.siren}>{s.denomination}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Nom commercial (optionnel)</label>
          <input
            type="text"
            value={data.nom_commercial}
            onChange={(e) => update({ nom_commercial: e.target.value })}
            placeholder="Ex: Luminos"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Activité principale *</label>
          <textarea
            value={data.activite}
            onChange={(e) => update({ activite: e.target.value })}
            rows={3}
            placeholder="Décris en quelques phrases ce que fera ton entreprise"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
          <p className="mt-1 text-xs text-white/40">JurisIA générera automatiquement l&apos;objet social détaillé à partir de cette description.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Code APE *</label>
          <select
            value={data.code_ape}
            onChange={(e) => update({ code_ape: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          >
            <option value="">Sélectionne un code APE</option>
            {CODES_APE.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
