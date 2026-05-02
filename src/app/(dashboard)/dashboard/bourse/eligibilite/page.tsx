'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { PROFIL_LABELS, type ProfilSocial } from '@/lib/bourses'

export default function EligibilitePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<ProfilSocial>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const toggle = (p: ProfilSocial) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const submit = async () => {
    if (selected.size === 0) {
      toast.error('Coche au moins 1 profil')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/bourses/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profil_social: Array.from(selected) }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Erreur')
      }
      const data = (await res.json()) as { montant_eur: number; missions_requises: number }
      toast.success(`Bourse de ${data.montant_eur}€ activée ! Valide ${data.missions_requises} missions pour toucher.`)
      router.push('/dashboard/bourse')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl font-extrabold">
        Vérifie ton <span className="moksha-gradient-text">éligibilité</span>
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Coche les profils qui te correspondent. Auto-déclaration sous ta responsabilité.
        Purama peut demander un justificatif (attestation CAF, carte étudiante, avis de situation...).
      </p>

      <div className="glass mt-6 p-5">
        <div className="space-y-2">
          {(Object.entries(PROFIL_LABELS) as Array<[ProfilSocial, { label: string; montant: number; icon: string }]>).map(([key, def]) => {
            const active = selected.has(key)
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-[#FF3D00] bg-[#FF3D00]/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <span className="text-2xl">{def.icon}</span>
                <div className="flex-1">
                  <span className="block text-sm font-semibold text-white">{def.label}</span>
                  <span className="mt-0.5 block text-[12px] text-white/55">jusqu&apos;à {def.montant}€</span>
                </div>
                {active && <Check className="h-5 w-5 text-[#FF3D00]" />}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] py-4 text-base font-bold text-[#070B18] disabled:opacity-50"
      >
        {submitting ? 'Activation...' : 'Activer ma bourse'}
      </button>

      <p className="mt-4 text-[11px] text-white/40">
        ⚠️ L&apos;auto-déclaration doit être exacte. Les montants sont versés <strong>après 5 missions citoyennes vérifiées</strong>
        et <strong>après confirmation de financement</strong> (subvention reçue).
        Les déclarations mensongères sont passibles de remboursement.
      </p>
    </main>
  )
}
