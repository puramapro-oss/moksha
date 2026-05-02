'use client'

import { useEffect, useState } from 'react'
import { Wallet as WalletIcon, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type Props = {
  showPoints?: boolean
}

export default function WalletPhase1({ showPoints = true }: Props) {
  const { profile } = useAuth()
  const [points, setPoints] = useState(0)
  const [euros, setEuros] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      // Points balance
      const { data: pt } = await supabase
        .from('moksha_point_balances')
        .select('balance')
        .eq('user_id', profile.id)
        .maybeSingle()
      setPoints(pt?.balance ?? 0)

      // Euros via wallet_transactions
      const { data: txs } = await supabase
        .from('moksha_wallet_transactions')
        .select('amount, type, statut')
        .eq('user_id', profile.id)
      const solde = (txs || []).reduce((sum, t: { amount: number | string; type: string; statut: string }) => {
        const a = Number(t.amount)
        if (t.type === 'retrait') return sum - Math.abs(a)
        if (t.statut === 'completed') return sum + a
        return sum
      }, 0)
      setEuros(solde)
      setLoading(false)
    }
    load()
  }, [profile?.id, supabase])

  const pointsEurValue = points * 0.01

  if (loading) {
    return <div className="skeleton h-48 rounded-2xl" />
  }

  return (
    <div className="glass overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/50">Ton wallet Purama</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-[#FFB300]" style={{ fontFamily: 'var(--font-display)' }}>
              {euros.toFixed(2)}
            </span>
            <span className="text-xl text-white/70">€</span>
          </div>
        </div>
        <WalletIcon className="h-6 w-6 text-[#FFB300]" />
      </div>

      {showPoints && (
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
          <div>
            <p className="text-xs text-white/50">Points Purama</p>
            <p className="text-sm font-semibold">
              {points.toLocaleString('fr-FR')}{' '}
              <span className="text-white/50">= {pointsEurValue.toFixed(2)}€</span>
            </p>
          </div>
          <Lock className="h-3.5 w-3.5 text-white/30" aria-hidden />
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-white/40">
        Retrait IBAN disponible dès activation de ta Purama Card. 1pt = 0,01€. Retrait bloqué 30 jours après souscription (art. L221-28).
      </p>
    </div>
  )
}
