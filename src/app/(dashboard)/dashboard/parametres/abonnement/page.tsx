'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Pause, X, ArrowRight, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type Sub = {
  id: string
  plan: string
  status: string
  started_at: string
  ends_at: string | null
  cancelled_at: string | null
  stripe_subscription_id: string | null
}

export default function AbonnementPage() {
  const { profile, isAuthenticated } = useAuth()
  const [sub, setSub] = useState<Sub | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2 | 3>(0)
  const [cancelReason, setCancelReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    const sb = createClient()
    sb.from('moksha_subscriptions')
      .select('id, plan, status, started_at, ends_at, cancelled_at, stripe_subscription_id')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setSub(data as Sub | null)
        setLoading(false)
      })
  }, [isAuthenticated])

  async function confirmCancel() {
    if (!sub?.stripe_subscription_id) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Résiliation enregistrée. Accès actif jusqu\'à la fin de la période.')
      setCancelStep(0)
    } catch {
      toast.error('Erreur — contacte le support.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-white/60">Chargement...</div>

  const isPremium = profile?.plan && profile.plan !== 'gratuit'
  const startedAt = sub?.started_at ? new Date(sub.started_at) : null
  const daysActive = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / (24 * 3600 * 1000)) : 0
  const canWithdraw = daysActive >= 30

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Mon abonnement</h1>
        <p className="text-sm text-white/60">Gère ton plan, pause ou résilie.</p>
      </header>

      <div className="glass space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">Plan actuel</div>
            <div className="mt-1 text-xl font-bold capitalize">{profile?.plan || 'gratuit'}</div>
            {sub && (
              <div className="mt-1 text-xs text-white/50">
                Statut : <span className="capitalize">{sub.status}</span>
                {sub.cancelled_at && ' — résiliation programmée'}
              </div>
            )}
          </div>
          <CreditCard className="h-6 w-6 text-[#FFB300]" />
        </div>

        {isPremium && (
          <div className="rounded-xl bg-white/5 p-3 text-xs text-white/60 space-y-1">
            <div>Accès immédiat activé (art. L221-28 Code conso)</div>
            <div>
              Prime wallet disponible au retrait : {canWithdraw ? '✅ maintenant' : `dans ${30 - daysActive} jours`}
            </div>
            <div>Résiliation effective en fin de période — données conservées 3 ans (RGPD)</div>
          </div>
        )}

        {!isPremium && (
          <Link
            href="/pricing"
            className="block rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] py-3 text-center font-bold text-[#070B18]"
          >
            Passer Premium — 100€ prime bienvenue
          </Link>
        )}

        {isPremium && !sub?.cancelled_at && (
          <div className="flex gap-3">
            <button
              onClick={() => toast.info('Contacte le support pour une pause — disponible bientôt en self-service.')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm hover:bg-white/5"
            >
              <Pause className="h-4 w-4" /> Pause 1 mois
            </button>
            <button
              onClick={() => setCancelStep(1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 py-3 text-sm text-red-300 hover:bg-red-500/10"
            >
              <X className="h-4 w-4" /> Résilier
            </button>
          </div>
        )}
      </div>

      {/* Résiliation 3 étapes */}
      {cancelStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass max-w-md w-full space-y-4 p-6">
            {cancelStep === 1 && (
              <>
                <AlertTriangle className="h-8 w-8 text-[#FF3D00]" />
                <h2 className="text-xl font-bold">En résiliant, tu vas perdre :</h2>
                <ul className="space-y-2 text-sm text-white/80">
                  <li>• Ta prime wallet non encore retirée</li>
                  <li>• Ton streak et ton multiplicateur</li>
                  <li>• Les commissions récurrentes de tes filleuls</li>
                  <li>• L&apos;accès à JurisIA illimité</li>
                </ul>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setCancelStep(0)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm">
                    Annuler
                  </button>
                  <button
                    onClick={() => setCancelStep(2)}
                    className="flex-1 rounded-xl bg-white/10 py-3 text-sm hover:bg-white/15"
                  >
                    Continuer
                  </button>
                </div>
              </>
            )}
            {cancelStep === 2 && (
              <>
                <h2 className="text-xl font-bold">Et si tu mettais en pause 1 mois ?</h2>
                <p className="text-sm text-white/70">Tu gardes ta prime, ton streak, tes filleuls. Reprise automatique.</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      toast.info('Pause — contacte le support.')
                      setCancelStep(0)
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] py-3 text-sm font-bold text-[#070B18]"
                  >
                    Mettre en pause
                  </button>
                  <button
                    onClick={() => setCancelStep(3)}
                    className="flex-1 rounded-xl border border-red-500/30 py-3 text-sm text-red-300"
                  >
                    Résilier quand même
                  </button>
                </div>
              </>
            )}
            {cancelStep === 3 && (
              <>
                <h2 className="text-xl font-bold">Dernière étape</h2>
                <p className="text-sm text-white/70">Dis-nous pourquoi (facultatif) :</p>
                <div className="space-y-2">
                  {['Trop cher', 'Pas assez de gains', 'Je pars sur une autre app', 'Autre'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setCancelReason(r)}
                      className={`w-full rounded-xl border py-2 text-sm ${
                        cancelReason === r ? 'border-[#FFB300] bg-[#FFB300]/10' : 'border-white/10'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setCancelStep(0)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm">
                    Revenir
                  </button>
                  <button
                    onClick={confirmCancel}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-red-500/90 py-3 text-sm font-bold disabled:opacity-50"
                  >
                    {submitting ? '...' : 'Confirmer la résiliation'}
                    <ArrowRight className="ml-1 inline h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
