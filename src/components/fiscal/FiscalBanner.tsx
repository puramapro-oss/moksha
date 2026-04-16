'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

/**
 * FiscalBanner V7 §17 — banner in-app doré si user a >3000€ gains cumulés/an.
 * Fenêtre d'affichage : du 1er avril au 15 juin (plus permissif pour l'année de seuil atteint).
 * Disparaît au clic → moksha_fiscal_notifications.acknowledged = true (palier 3).
 */
export default function FiscalBanner() {
  const { profile } = useAuth()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [earnings, setEarnings] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false)
      return
    }
    const load = async () => {
      // Fenêtre d'affichage : seuil 3000€ atteint OU toujours visible jusqu'au 15 juin
      const now = new Date()
      const month = now.getMonth() + 1
      const day = now.getDate()
      const outsideWindow = (month > 6) || (month === 6 && day > 15)

      // Total gains année en cours
      const start = new Date(now.getFullYear(), 0, 1).toISOString()
      const { data: txs } = await supabase
        .from('moksha_wallet_transactions')
        .select('amount, type, statut, created_at')
        .eq('user_id', profile.id)
        .gte('created_at', start)
      const total = (txs || []).reduce((s, t: { amount: number | string; type: string; statut: string }) => {
        const a = Number(t.amount)
        if (t.type === 'retrait') return s
        return t.statut === 'completed' ? s + a : s
      }, 0)
      setEarnings(total)

      if (total < 3000 || outsideWindow) {
        setLoading(false)
        return
      }

      // Check acknowledged palier 3
      const { data: ack } = await supabase
        .from('moksha_fiscal_notifications')
        .select('acknowledged')
        .eq('user_id', profile.id)
        .eq('palier', 3)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setShow(!ack?.acknowledged)
      setLoading(false)
    }
    load()
  }, [profile?.id, supabase])

  const dismiss = async () => {
    if (!profile?.id) return
    setShow(false)
    // Upsert acknowledged=true sur le palier 3 le plus récent (ou crée la ligne)
    const { data: existing } = await supabase
      .from('moksha_fiscal_notifications')
      .select('id')
      .eq('user_id', profile.id)
      .eq('palier', 3)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) {
      await supabase.from('moksha_fiscal_notifications').update({ acknowledged: true }).eq('id', existing.id)
    } else {
      await supabase.from('moksha_fiscal_notifications').insert({
        user_id: profile.id,
        palier: 3,
        email_sent: false,
        push_sent: false,
        acknowledged: true,
      })
    }
  }

  if (loading || !show) return null

  return (
    <div className="sticky top-0 z-40 w-full border-b border-[#FFD700]/20 bg-gradient-to-r from-[#FFD700]/10 via-[#FF6B35]/10 to-[#FFD700]/10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#FFD700]/20 text-[#FFD700]">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Tu as gagné plus de {earnings.toFixed(0)}€ cette année
            </p>
            <p className="mt-0.5 text-[11px] text-white/70">
              Seuil 3 000€ franchi → pense à déclarer. Abattement auto 34%.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/fiscal"
            className="whitespace-nowrap rounded-lg bg-[#FFD700] px-3 py-1.5 text-xs font-bold text-[#070B18] hover:opacity-90"
          >
            En savoir plus
          </Link>
          <button
            onClick={dismiss}
            className="rounded-lg border border-white/10 p-1.5 text-white/70 hover:bg-white/5"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
