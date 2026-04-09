'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import Stepper from './Stepper'
import { TYPES_ASSOCIATIONS } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'

type AssocData = {
  type: string
  nom: string
  objet: string
  adresse: string
  bureau: {
    president: { prenom: string; nom: string; email: string }
    secretaire: { prenom: string; nom: string; email: string }
    tresorier: { prenom: string; nom: string; email: string }
  }
  accept_cgv: boolean
}

const STEPS = [
  { id: 'type', label: 'Type' },
  { id: 'nom', label: 'Nom & objet' },
  { id: 'siege', label: 'Siège' },
  { id: 'bureau', label: 'Bureau' },
  { id: 'recap', label: 'Récap' },
]

export default function WizardAssociation() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState<AssocData>({
    type: 'culturelle',
    nom: '',
    objet: '',
    adresse: '',
    bureau: {
      president: { prenom: '', nom: '', email: '' },
      secretaire: { prenom: '', nom: '', email: '' },
      tresorier: { prenom: '', nom: '', email: '' },
    },
    accept_cgv: false,
  })

  const update = (patch: Partial<AssocData>) => setData((d) => ({ ...d, ...patch }))
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  async function submit() {
    if (!data.accept_cgv) {
      toast.error('Tu dois accepter les CGV')
      return
    }
    if (!isAuthenticated) {
      try { sessionStorage.setItem('moksha_wizard_assoc', JSON.stringify(data)) } catch {}
      router.push('/auth?next=/creer/formalites')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/demarches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'association', wizard_data: data }),
      })
      if (!res.ok) throw new Error('Création impossible')
      const { id } = await res.json()
      toast.success('Dossier créé — génération en cours')
      fetch(`/api/demarches/${id}/deposer`, { method: 'POST' }).catch(() => {})
      router.push(`/dashboard/demarches/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const setMember = (role: 'president' | 'secretaire' | 'tresorier', patch: Partial<AssocData['bureau']['president']>) => {
    update({ bureau: { ...data.bureau, [role]: { ...data.bureau[role], ...patch } } })
  }

  return (
    <div>
      <Stepper steps={STEPS} current={step} />
      <div className="glass p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Quel type d&apos;association ?
                </h2>
                <p className="mb-8 text-sm text-white/60">Loi 1901 — chaque type a ses spécificités juridiques.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {TYPES_ASSOCIATIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => update({ type: t.id })}
                      className={`flex items-start gap-3 rounded-2xl border p-5 text-left transition ${
                        data.type === t.id
                          ? 'border-[#FF6B35]/60 bg-[#FF6B35]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl">{t.icon}</div>
                      <div>
                        <h3 className="font-semibold">{t.label}</h3>
                        <p className="mt-1 text-xs text-white/55">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Nom & objet
                </h2>
                <p className="mb-8 text-sm text-white/60">Le nom et l&apos;objet figureront dans les statuts et au Journal Officiel.</p>
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Nom de l&apos;association *</label>
                    <input
                      value={data.nom}
                      onChange={(e) => update({ nom: e.target.value })}
                      placeholder="Ex: Les Amis du Patrimoine"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Objet social (mission) *</label>
                    <textarea
                      value={data.objet}
                      onChange={(e) => update({ objet: e.target.value })}
                      rows={4}
                      placeholder="L'association a pour objet…"
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Où sera le siège ?
                </h2>
                <p className="mb-8 text-sm text-white/60">Adresse du siège social de l&apos;association.</p>
                <input
                  value={data.adresse}
                  onChange={(e) => update({ adresse: e.target.value })}
                  placeholder="Numéro, rue, code postal, ville"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
                />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Bureau directeur
                </h2>
                <p className="mb-8 text-sm text-white/60">Président, secrétaire et trésorier — minimum légal pour une association.</p>
                <div className="space-y-5">
                  {(['president', 'secretaire', 'tresorier'] as const).map((role) => (
                    <div key={role} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <h3 className="mb-3 text-sm font-semibold capitalize text-white/80">{role}</h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          placeholder="Prénom"
                          value={data.bureau[role].prenom}
                          onChange={(e) => setMember(role, { prenom: e.target.value })}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]/60"
                        />
                        <input
                          placeholder="Nom"
                          value={data.bureau[role].nom}
                          onChange={(e) => setMember(role, { nom: e.target.value })}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]/60"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={data.bureau[role].email}
                          onChange={(e) => setMember(role, { email: e.target.value })}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]/60"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Récapitulatif
                </h2>
                <p className="mb-8 text-sm text-white/60">Vérifie tout avant le dépôt préfecture.</p>
                <div className="space-y-4">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm">
                    <div className="text-white/50">Type</div>
                    <div className="font-semibold">{TYPES_ASSOCIATIONS.find((t) => t.id === data.type)?.label}</div>
                    <div className="mt-3 text-white/50">Nom</div>
                    <div className="font-semibold">{data.nom || '—'}</div>
                    <div className="mt-3 text-white/50">Objet</div>
                    <div className="text-sm">{data.objet || '—'}</div>
                    <div className="mt-3 text-white/50">Siège</div>
                    <div className="text-sm">{data.adresse || '—'}</div>
                  </section>
                  <section className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-5">
                    <h3 className="mb-2 text-sm font-semibold text-white">💰 Tarification</h3>
                    <div className="flex justify-between text-sm">
                      <span>Création association</span>
                      <strong className="text-[#FFD700]">29 €</strong>
                    </div>
                    <p className="mt-2 text-xs text-white/50">
                      Gratuit pour une simple déclaration, MOKSHA génère statuts, PV AG, Cerfa préfecture et suit le dossier.
                    </p>
                  </section>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={data.accept_cgv}
                      onChange={(e) => update({ accept_cgv: e.target.checked })}
                      className="mt-0.5 h-4 w-4 accent-[#FF6B35]"
                    />
                    <span className="text-white/80">
                      J&apos;accepte les{' '}
                      <Link href="/cgv" target="_blank" className="text-[#FFD700] underline">CGV</Link>.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0 || submitting}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          >
            ← Précédent
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18]"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : '🏛️ Déposer mon dossier'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
