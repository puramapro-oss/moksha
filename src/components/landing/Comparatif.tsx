'use client'

import { Check, X } from 'lucide-react'

const rows = [
  { feature: 'Création SASU', moksha: '49€', legalplace: '99€', notaire: '800€+' },
  { feature: 'Express 24h', moksha: '99€', legalplace: '199€', notaire: 'N/A' },
  { feature: 'Agent IA juridique (JurisIA)', moksha: true, legalplace: false, notaire: false },
  { feature: 'Coffre-fort sécurisé (ProofVault)', moksha: true, legalplace: false, notaire: 'Papier' },
  { feature: 'Score conformité temps réel', moksha: true, legalplace: false, notaire: false },
  { feature: 'PV AG automatiques', moksha: '19€/mois', legalplace: '99€/an', notaire: 'Sur devis' },
  { feature: 'Garantie Zéro Refus', moksha: true, legalplace: 'Partielle', notaire: true },
  { feature: 'Simulateur fiscal', moksha: true, legalplace: false, notaire: 'Sur devis' },
]

function Cell({ value, winner }: { value: boolean | string; winner?: boolean }) {
  if (value === true)
    return (
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${winner ? 'bg-[#5DCAA5]/20' : 'bg-white/5'}`}>
        <Check className={`h-4 w-4 ${winner ? 'text-[#5DCAA5]' : 'text-white/40'}`} />
      </div>
    )
  if (value === false)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
        <X className="h-4 w-4 text-red-400" />
      </div>
    )
  return <span className={`text-sm font-semibold ${winner ? 'text-[#FFD700]' : 'text-white/70'}`}>{value}</span>
}

export default function Comparatif() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Pourquoi choisir <span className="moksha-gradient-text">MOKSHA</span> ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Comparaison objective avec la concurrence.
          </p>
        </div>
        <div className="glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-6 py-5 text-sm font-semibold text-white/60">Fonctionnalité</th>
                <th className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-[#FF6B35] to-[#FFD700] bg-clip-text text-lg font-bold text-transparent">
                      MOKSHA
                    </span>
                    <span className="rounded-full bg-[#FF6B35]/20 px-2 py-0.5 text-[10px] font-bold text-[#FF6B35]">
                      RECOMMANDÉ
                    </span>
                  </div>
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-white/50">LegalPlace</th>
                <th className="px-6 py-5 text-sm font-semibold text-white/50">Notaire</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-white/80">{r.feature}</td>
                  <td className="px-6 py-4"><Cell value={r.moksha} winner /></td>
                  <td className="px-6 py-4"><Cell value={r.legalplace} /></td>
                  <td className="px-6 py-4"><Cell value={r.notaire} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
