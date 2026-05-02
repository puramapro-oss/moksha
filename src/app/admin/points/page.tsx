'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp } from 'lucide-react'

type BalanceRow = {
  user_id: string
  balance: number
  lifetime_earned: number
  moksha_profiles: { email: string; full_name: string | null }
}

export default function AdminPoints() {
  const [balances, setBalances] = useState<BalanceRow[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/points')
      .then((r) => r.json())
      .then((d) => {
        setBalances(d.balances ?? [])
        setTotalPoints(d.totalPoints ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        <Star className="h-6 w-6 text-[#FFB300]" /> Points Purama
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold text-[#FFB300]">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-white/50">Points en circulation</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold">{(totalPoints * 0.01).toFixed(2)} €</p>
          <p className="text-xs text-white/50">Valeur totale (1pt = 0.01€)</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold">{balances.length}</p>
          <p className="text-xs text-white/50">Utilisateurs avec points</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : (
        <div className="glass overflow-hidden">
          <div className="grid grid-cols-4 gap-4 border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-wider text-white/40">
            <span>Utilisateur</span><span>Balance</span><span>Total gagné</span><span>Valeur €</span>
          </div>
          {balances.map((b) => (
            <div key={b.user_id} className="grid grid-cols-4 gap-4 border-b border-white/5 px-4 py-3 text-sm">
              <span className="truncate">{b.moksha_profiles?.full_name || b.moksha_profiles?.email}</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#FFB300]" />{b.balance}</span>
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-[#5DCAA5]" />{b.lifetime_earned}</span>
              <span>{(b.balance * 0.01).toFixed(2)} €</span>
            </div>
          ))}
          {balances.length === 0 && (
            <p className="py-8 text-center text-sm text-white/40">Aucun utilisateur avec des points.</p>
          )}
        </div>
      )}
    </div>
  )
}
