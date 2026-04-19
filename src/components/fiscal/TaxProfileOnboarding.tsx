'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { TAX_PROFILES, type TaxProfileType } from '@/lib/tax'

interface Props {
  onComplete?: (profile: TaxProfileType) => void
  forceOpen?: boolean
}

type Step = 'choose' | 'details' | 'confirm'

export default function TaxProfileOnboarding({ onComplete, forceOpen }: Props) {
  const [open, setOpen] = useState(forceOpen ?? false)
  const [step, setStep] = useState<Step>('choose')
  const [chosen, setChosen] = useState<TaxProfileType | null>(null)
  const [siret, setSiret] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [activity, setActivity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  const checkProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/tax/profile', { cache: 'no-store' })
      if (!res.ok) throw new Error('network')
      const data = (await res.json()) as { profile?: { profile_type?: string } | null }
      setHasProfile(Boolean(data.profile?.profile_type))
      if (!data.profile?.profile_type && !forceOpen) setOpen(true)
    } catch {
      setHasProfile(false)
    }
  }, [forceOpen])

  useEffect(() => {
    void checkProfile()
  }, [checkProfile])

  const submit = async () => {
    if (!chosen) return
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { profile_type: chosen }
      if (chosen === 'autoentrepreneur' || chosen === 'entreprise') {
        if (!siret.trim()) {
          toast.error('SIRET requis')
          setSubmitting(false)
          return
        }
        payload.siret = siret.replace(/\s+/g, '')
        if (chosen === 'entreprise') {
          payload.company_name = companyName
          payload.legal_form = legalForm
          payload.activity_type = activity
        }
      }
      const res = await fetch('/api/tax/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Erreur enregistrement')
      }
      toast.success('Profil fiscal enregistré')
      setOpen(false)
      onComplete?.(chosen)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  if (hasProfile === null) return null
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-4 backdrop-blur sm:items-center">
      <div className="glass w-full max-w-xl p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Ton profil fiscal</h2>
          <span className="text-xs text-white/40">
            {step === 'choose' ? '1/2' : step === 'details' ? '2/2' : 'Confirmation'}
          </span>
        </div>

        {step === 'choose' && (
          <>
            <p className="mb-5 text-sm text-white/60">
              Purama déclare automatiquement selon ton profil. Aucune paperasse, 100% légal.
            </p>
            <div className="space-y-2.5">
              {(Object.values(TAX_PROFILES)).map((p) => (
                <button
                  key={p.type}
                  onClick={() => setChosen(p.type)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                    chosen === p.type
                      ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">{p.label}</span>
                    <span className="mt-0.5 block text-[12px] text-white/55">{p.description}</span>
                    <span className="mt-1 block text-[11px] italic text-white/40">{p.whenToChoose}</span>
                  </span>
                  {chosen === p.type && <Check className="h-5 w-5 text-[#FF6B35]" />}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
              >
                Plus tard
              </button>
              <button
                onClick={() => {
                  if (!chosen) {
                    toast.error('Choisis un profil')
                    return
                  }
                  if (chosen === 'autoentrepreneur' || chosen === 'entreprise') setStep('details')
                  else void submit()
                }}
                disabled={!chosen || submitting}
                className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuer'}
              </button>
            </div>
          </>
        )}

        {step === 'details' && (chosen === 'autoentrepreneur' || chosen === 'entreprise') && (
          <>
            <p className="mb-5 text-sm text-white/60">
              {chosen === 'autoentrepreneur'
                ? 'Renseigne ton SIRET pour que Purama signe le mandat URSSAF Tierce Déclaration.'
                : 'Renseigne les infos de ton entreprise pour activer Factur-X et Pennylane.'}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/70">SIRET (14 chiffres)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 00012"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FF6B35] focus:outline-none"
                />
              </div>
              {chosen === 'entreprise' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-white/70">Raison sociale</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="SASU Example"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FF6B35] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70">Forme juridique</label>
                    <select
                      value={legalForm}
                      onChange={(e) => setLegalForm(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-[#FF6B35] focus:outline-none"
                    >
                      <option value="">Choisir...</option>
                      <option value="SASU">SASU</option>
                      <option value="SAS">SAS</option>
                      <option value="SARL">SARL</option>
                      <option value="EURL">EURL</option>
                      <option value="SCI">SCI</option>
                      <option value="Association">Association loi 1901</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70">Activité principale</label>
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                      placeholder="Conseil, édition logicielle, ..."
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FF6B35] focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={() => setStep('choose')}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
              >
                Retour
              </button>
              <button
                onClick={submit}
                disabled={!siret.trim() || submitting}
                className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
