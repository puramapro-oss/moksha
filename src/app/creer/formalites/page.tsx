'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Logo from '@/components/shared/Logo'
import { Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { claimDraft } from '@/lib/wizard-draft'

const ENT_KEY = 'moksha_wizard_entreprise'
const ASSOC_KEY = 'moksha_wizard_assoc'

type CreatedDraft = { id: string; storageKey: string; raw: string }
type Creation = { promise: Promise<CreatedDraft | null>; handled: boolean }

async function createStoredDraft(userId: string): Promise<CreatedDraft | null> {
  const entreprise = sessionStorage.getItem(ENT_KEY)
  const association = sessionStorage.getItem(ASSOC_KEY)
  if (!entreprise && !association) return null
  const storageKey = entreprise ? ENT_KEY : ASSOC_KEY
  const draft = claimDraft(storageKey, entreprise ?? association!, userId)
  const response = await fetch('/api/demarches/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: entreprise ? 'entreprise' : 'association', wizard_data: draft.data }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Création impossible' }))
    throw new Error(error.error ?? 'Création impossible')
  }
  const { id } = (await response.json()) as { id: string }
  return { id, storageKey, raw: draft.raw }
}

export default function Formalites() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id
  const [failure, setFailure] = useState<{ userId: string; message: string } | null>(null)
  const creations = useRef(new Map<string, Creation>())
  const errMsg = failure?.userId === userId ? failure?.message : null
  const phase = errMsg ? 'error' : userId ? 'submitting' : 'idle'

  // Keep one creation per account during this visit, including Strict Mode and
  // token refreshes. Only the currently subscribed account handles its result.
  useEffect(() => {
    if (authLoading || !userId) return
    let current = true
    let creation = creations.current.get(userId)
    if (!creation) {
      creation = { promise: createStoredDraft(userId), handled: false }
      creations.current.set(userId, creation)
    }
    const request = creation
    void request.promise.then((draft) => {
      if (!current || request.handled) return
      request.handled = true
      if (!draft) {
        router.replace('/dashboard')
        return
      }
      try {
        // A later edit must not be erased by an older submission's response.
        if (sessionStorage.getItem(draft.storageKey) === draft.raw) sessionStorage.removeItem(draft.storageKey)
      } catch (error) {
        console.error('[sessionStorage] Erreur cleanup:', error)
      }
      fetch(`/api/demarches/${draft.id}/deposer`, { method: 'POST' }).catch(() => {})
      toast.success('Dossier créé — génération en cours')
      router.replace(`/dashboard/demarches/${draft.id}`)
    }, (error: unknown) => {
      if (current) setFailure({ userId, message: error instanceof Error ? error.message : 'Erreur — réessaie' })
    })
    return () => { current = false }
  }, [userId, authLoading, router])

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
