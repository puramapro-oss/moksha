'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Logo from '@/components/shared/Logo'
import { Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const ENT_KEY = 'moksha_wizard_entreprise'
const ASSOC_KEY = 'moksha_wizard_assoc'

type Phase = 'idle' | 'auth-pending' | 'submitting' | 'error'

export default function Formalites() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // Auto-finalisation : si l'user est authentifié + wizard data en sessionStorage,
  // on appelle /api/demarches/create + /deposer puis on route vers le dossier.
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setPhase('auth-pending')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const entRaw = sessionStorage.getItem(ENT_KEY)
        const assocRaw = sessionStorage.getItem(ASSOC_KEY)
        if (!entRaw && !assocRaw) {
          // Rien à finaliser → dashboard
          router.replace('/dashboard')
          return
        }
        setPhase('submitting')
        const type = entRaw ? 'entreprise' : 'association'
        const raw = entRaw ?? assocRaw!
        const parsed = JSON.parse(raw) as Record<string, unknown> & { __step?: number }
        delete parsed.__step
        const res = await fetch('/api/demarches/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, wizard_data: parsed }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Création impossible' }))
          throw new Error(err.error ?? 'Création impossible')
        }
        const { id } = (await res.json()) as { id: string }
        // Cleanup storage
        try { sessionStorage.removeItem(ENT_KEY); sessionStorage.removeItem(ASSOC_KEY) } catch {}
        // Lance dépôt en arrière-plan
        fetch(`/api/demarches/${id}/deposer`, { method: 'POST' }).catch(() => {})
        if (!cancelled) {
          toast.success('Dossier créé — génération en cours')
          router.replace(`/dashboard/demarches/${id}`)
        }
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Erreur — réessaie'
        setErrMsg(msg)
        setPhase('error')
      }
    }
    run()
    return () => { cancelled = true }
  }, [user, authLoading, router])

  return (
    <main className="relative z-10 min-h-screen">
      <div className="moksha-mesh-bg" aria-hidden="true" />
      <header className="relative border-b border-white/5 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Logo />
          <Link
            href="/demarrer"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ← Accueil
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-2xl px-6 pt-20 text-center">
        {phase === 'submitting' ? (
          <>
            <Loader2 className="mx-auto mb-6 h-14 w-14 animate-spin text-[#FF6B00]" />
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              Finalisation <span className="moksha-gradient-text">en cours…</span>
            </h1>
            <p className="mt-4 text-white/60">
              Création du dossier, génération des documents, dépôt automatique.
              On t&apos;envoie au tableau de bord dans un instant.
            </p>
          </>
        ) : phase === 'error' ? (
          <>
            <Sparkles className="mx-auto mb-6 h-14 w-14 text-[#FFB300]" />
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              Une <span className="moksha-gradient-text">étape rate</span>
            </h1>
            <p className="mt-4 text-white/60">{errMsg ?? 'Erreur inconnue'}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/creer/entreprise" className="moksha-btn-primary">
                Reprendre le wizard →
              </Link>
              <Link href="/dashboard" className="moksha-btn-secondary">
                Aller au dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <Sparkles className="mx-auto mb-6 h-14 w-14 text-[#FFB300]" />
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              Ton dossier est <span className="moksha-gradient-text">presque prêt</span>
            </h1>
            <p className="mt-4 text-white/60">
              Connecte-toi ou crée ton compte pour poursuivre : génération des documents, signature électronique, dépôt automatique.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth?next=/creer/formalites" className="moksha-btn-primary">
                Créer mon compte →
              </Link>
              <Link href="/auth?next=/creer/formalites" className="moksha-btn-secondary">
                Se connecter
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
