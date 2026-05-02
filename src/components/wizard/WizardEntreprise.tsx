'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Stepper from './Stepper'
import StepStructure from './StepStructure'
import StepDenomination from './StepDenomination'
import StepSiege from './StepSiege'
import StepCapital from './StepCapital'
import StepDirigeant from './StepDirigeant'
import StepRecap from './StepRecap'
import { useAuth } from '@/hooks/useAuth'

export type WizardData = {
  forme: string
  mode: 'standard' | 'express'
  denomination: string
  nom_commercial: string
  activite: string
  code_ape: string
  adresse: string
  type_local: string
  capital: number
  apport_type: 'numeraire' | 'nature' | 'mixte'
  dirigeant: {
    prenom: string
    nom: string
    date_naissance: string
    nationalite: string
    adresse: string
  }
  /** Zone Franche Rurale Revitalisation — exo IS 5 ans si siège en ZFRR. */
  optim_zfrr: boolean
  /** Jeune Entreprise Innovante — exo charges sociales dirigeants si R&D ≥15%. */
  optim_jei: boolean
  accept_cgv: boolean
}

const STEPS = [
  { id: 'structure', label: 'Structure' },
  { id: 'denomination', label: 'Dénomination' },
  { id: 'siege', label: 'Siège' },
  { id: 'capital', label: 'Capital' },
  { id: 'dirigeant', label: 'Dirigeant' },
  { id: 'recap', label: 'Récap' },
]

const STORAGE_KEY = 'moksha_wizard_entreprise'

const DEFAULT_DATA: WizardData = {
  forme: 'sasu',
  mode: 'standard',
  denomination: '',
  nom_commercial: '',
  activite: '',
  code_ape: '',
  adresse: '',
  type_local: 'domicile',
  capital: 1000,
  apport_type: 'numeraire',
  dirigeant: {
    prenom: '',
    nom: '',
    date_naissance: '',
    nationalite: 'Française',
    adresse: '',
  },
  optim_zfrr: false,
  optim_jei: false,
  accept_cgv: false,
}

// Validation par étape — bouton "Suivant" actif uniquement si l'étape courante
// est cohérente. Évite les sauts d'étape avec champs vides + persistance fragile.
function isStepValid(step: number, d: WizardData): boolean {
  switch (step) {
    case 0:
      return ['sasu', 'sas', 'sarl', 'eurl', 'sci', 'micro'].includes(d.forme)
    case 1:
      return (
        d.denomination.trim().length >= 3 &&
        d.activite.trim().length >= 8 &&
        d.code_ape.trim().length >= 4
      )
    case 2:
      return d.adresse.trim().length >= 8
    case 3:
      // Micro-entreprise : pas de capital social
      if (d.forme === 'micro') return true
      return d.capital >= 1
    case 4: {
      const dr = d.dirigeant
      return (
        dr.prenom.trim().length >= 2 &&
        dr.nom.trim().length >= 2 &&
        dr.date_naissance.length === 10 &&
        dr.adresse.trim().length >= 8
      )
    }
    case 5:
      return d.accept_cgv === true
    default:
      return false
  }
}

export default function WizardEntreprise() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [data, setData] = useState<WizardData>(DEFAULT_DATA)

  // Restore depuis sessionStorage au mount (1×) — évite SSR mismatch
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WizardData> & { __step?: number }
        const { __step, ...rest } = parsed
        setData((d) => ({ ...d, ...rest, dirigeant: { ...d.dirigeant, ...(rest.dirigeant ?? {}) } }))
        if (typeof __step === 'number' && __step >= 0 && __step < STEPS.length) setStep(__step)
      }
    } catch {
      // sessionStorage inaccessible (Safari privé) → on ignore et continue
    } finally {
      setHydrated(true)
    }
  }, [])

  // Persiste data + step à chaque changement (après hydratation)
  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, __step: step }))
    } catch {}
  }, [data, step, hydrated])

  const update = useCallback((patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch })), [])

  const next = () => {
    if (!isStepValid(step, data)) {
      toast.error('Champs requis manquants ou invalides à cette étape')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  async function submit() {
    if (!data.accept_cgv) {
      toast.error('Tu dois accepter les CGV pour continuer')
      return
    }
    if (!isAuthenticated) {
      toast.info('Connecte-toi pour finaliser ton dossier')
      router.push('/auth?next=/creer/formalites')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/demarches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'entreprise', wizard_data: data }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Création impossible' }))
        throw new Error(errBody.error ?? 'Création impossible')
      }
      const { id } = await res.json()
      toast.success('Dossier créé — génération des documents en cours')
      // Vide le storage : dossier soumis avec succès
      try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
      // Lance la génération + signature en arrière-plan
      fetch(`/api/demarches/${id}/deposer`, { method: 'POST' }).catch(() => {})
      router.push(`/dashboard/demarches/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur — réessaie dans un instant')
    } finally {
      setSubmitting(false)
    }
  }

  const currentStepValid = isStepValid(step, data)

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
            {step === 0 && <StepStructure data={data} update={update} />}
            {step === 1 && <StepDenomination data={data} update={update} />}
            {step === 2 && <StepSiege data={data} update={update} />}
            {step === 3 && <StepCapital data={data} update={update} />}
            {step === 4 && <StepDirigeant data={data} update={update} />}
            {step === 5 && <StepRecap data={data} update={update} />}
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
              disabled={!currentStepValid}
              className="moksha-btn-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:transform-none"
              aria-disabled={!currentStepValid}
            >
              <span>Suivant</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !currentStepValid}
              className="moksha-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{submitting ? 'Envoi…' : 'Déposer mon dossier'}</span>
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
