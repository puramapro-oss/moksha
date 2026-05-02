'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { X, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type Step = {
  titre: string
  message: string
  cta?: string
  goTo?: string
}

const STEPS: Step[] = [
  {
    titre: 'Bienvenue sur MOKSHA 🔥',
    message:
      "Tu viens de faire le premier pas vers ta libération entrepreneuriale. En 6 étapes rapides, je te montre tout ce que MOKSHA peut faire pour toi.",
  },
  {
    titre: 'Crée ton entreprise en 10 minutes',
    message:
      "Choisis ta forme juridique (SASU, SARL, etc.), remplis 6 étapes guidées, et MOKSHA dépose ton dossier à l'INPI automatiquement.",
    cta: 'Voir le wizard',
    goTo: '/creer/entreprise',
  },
  {
    titre: 'JurisIA — ton avocat IA',
    message:
      'Pose toutes tes questions juridiques en français simple. JurisIA te répond avec sources officielles et indice de confiance.',
    cta: 'Essayer JurisIA',
    goTo: '/dashboard/jurisia',
  },
  {
    titre: 'ProofVault — ton coffre-fort',
    message:
      "Tous tes documents sont chiffrés AES-256, horodatés, et partageables d'un clic à ta banque ou à ton auditeur.",
    cta: 'Ouvrir le coffre',
    goTo: '/dashboard/proofvault',
  },
  {
    titre: 'Parrainage — gagne à chaque ami',
    message:
      "Partage ton code MOKSHA-XXXX. Tu touches 50% du 1er paiement de chaque filleul + 10% à vie. Wallet IBAN dès 20€.",
    cta: 'Voir mon code',
    goTo: '/dashboard/parrainage',
  },
  {
    titre: "C'est parti, libère-toi 🚀",
    message:
      "Tu connais l'essentiel. Si tu te perds, l'aide et le tuto sont toujours dispo dans /aide. Bonne libération !",
  },
]

export default function TutorialOverlay() {
  const { profile, refetch } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const supabase = createClient()

  // N'affiche que sur le dashboard, à la 1re visite
  useEffect(() => {
    if (!profile) return
    if (!pathname?.startsWith('/dashboard')) return
    if (profile.tutorial_completed === true) return
    // Force overlay reset si bouton "relancer" déclenche localStorage flag
    const force = typeof window !== 'undefined' && localStorage.getItem('moksha-relaunch-tutorial') === '1'
    if (force) {
      localStorage.removeItem('moksha-relaunch-tutorial')
      setOpen(true)
      return
    }
    const t = setTimeout(() => setOpen(true), 1500)
    return () => clearTimeout(t)
  }, [profile, pathname])

  async function complete() {
    if (profile?.id) {
      await supabase.from('moksha_profiles').update({ tutorial_completed: true }).eq('id', profile.id)
      refetch()
    }
    setOpen(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else complete()
  }

  function goCta() {
    const s = STEPS[step]
    if (s.goTo) router.push(s.goTo)
    next()
  }

  if (!open) return null

  const s = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="glass relative w-full max-w-md space-y-4 p-6 md:p-8">
        <button
          onClick={complete}
          aria-label="Passer le tuto"
          className="absolute right-4 top-4 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#FFB300]" />
          <span className="text-[10px] uppercase tracking-wider text-white/50">
            Étape {step + 1} / {STEPS.length}
          </span>
        </div>

        <h2 className="font-display text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          {s.titre}
        </h2>
        <p className="text-sm text-white/70">{s.message}</p>

        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#FF3D00] to-[#FFB300] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={complete}
            className="text-xs text-white/40 hover:text-white/70"
          >
            Passer
          </button>
          <div className="flex gap-2">
            {s.cta && s.goTo && (
              <button
                onClick={goCta}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                {s.cta}
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-2 text-xs font-bold text-[#070B18]"
            >
              {step === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
