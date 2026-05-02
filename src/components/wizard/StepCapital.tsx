'use client'

import type { WizardData } from './WizardEntreprise'

export default function StepCapital({
  data,
  update,
}: {
  data: WizardData
  update: (p: Partial<WizardData>) => void
}) {
  const isMicro = data.forme === 'micro'
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        {isMicro ? 'Micro-entreprise' : 'Capital social'}
      </h2>
      <p className="mb-8 text-sm text-white/60">
        {isMicro
          ? "Pas de capital à déclarer pour une micro-entreprise. Tu peux passer à l'étape suivante."
          : "Le capital minimum légal est de 1 €. Les banques préfèrent souvent voir 1000 € et plus."}
      </p>

      {!isMicro && (
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Montant du capital (€) *</label>
            <input
              type="number"
              min={1}
              step={100}
              value={data.capital}
              onChange={(e) => update({ capital: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF3D00]/60 focus:ring-1 focus:ring-[#FF3D00]/30"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[1000, 5000, 10000, 50000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ capital: v })}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
                >
                  {v.toLocaleString('fr-FR')} €
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Type d&apos;apport *</label>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { id: 'numeraire', label: 'Numéraire', desc: 'Apport en argent' },
                { id: 'nature', label: 'Nature', desc: 'Matériel, biens' },
                { id: 'mixte', label: 'Mixte', desc: 'Les deux combinés' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update({ apport_type: t.id as WizardData['apport_type'] })}
                  className={`rounded-xl border p-4 text-center text-sm transition ${
                    data.apport_type === t.id
                      ? 'border-[#FF3D00]/60 bg-[#FF3D00]/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold">{t.label}</div>
                  <div className="mt-1 text-xs text-white/50">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
