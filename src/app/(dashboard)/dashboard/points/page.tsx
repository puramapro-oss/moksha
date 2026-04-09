'use client'

import { useEffect, useState, useCallback } from 'react'
import { Star, Gift, Trophy, TrendingUp, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { POINTS_SHOP, POINTS_VALUE } from '@/lib/constants'
import type { PointTransaction } from '@/types'

type PointsData = {
  balance: number
  lifetime_earned: number
  rank: number | null
  transactions: PointTransaction[]
}

export default function PointsPage() {
  const [data, setData] = useState<PointsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftResult, setGiftResult] = useState<{ gift: { type: string; value: string }; streak: number } | null>(null)
  const [tab, setTab] = useState<'historique' | 'boutique'>('historique')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/points')
      if (r.ok) setData(await r.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function openGift() {
    setGiftLoading(true)
    try {
      const r = await fetch('/api/points/daily-gift', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) {
        toast.error(d.error || 'Erreur')
        return
      }
      setGiftResult(d)
      toast.success(`Tu as gagné : ${d.gift.value}`)
      load()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setGiftLoading(false)
    }
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <Star className="h-6 w-6 text-[#FFD700]" /> Points Purama
        </h1>
        <p className="mt-1 text-sm text-white/60">Cumule des points, échange-les contre des réductions ou du cash.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass p-5 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-[#FFD700]" />
          <p className="text-3xl font-extrabold text-[#FFD700]">{data?.balance ?? 0}</p>
          <p className="text-[10px] text-white/50">Points disponibles</p>
        </div>
        <div className="glass p-5 text-center">
          <TrendingUp className="mx-auto mb-2 h-6 w-6 text-[#5DCAA5]" />
          <p className="text-3xl font-extrabold">{data?.lifetime_earned ?? 0}</p>
          <p className="text-[10px] text-white/50">Points gagnés au total</p>
        </div>
        <div className="glass p-5 text-center">
          <Trophy className="mx-auto mb-2 h-6 w-6 text-[#FF6B35]" />
          <p className="text-3xl font-extrabold">#{data?.rank ?? '—'}</p>
          <p className="text-[10px] text-white/50">Classement</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-lg font-bold text-white/80">{((data?.balance ?? 0) * POINTS_VALUE).toFixed(2)} €</p>
          <p className="text-[10px] text-white/50">Valeur estimée</p>
        </div>
      </div>

      {/* Daily Gift */}
      <div className="glass overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-[#FFD700]" />
            <div>
              <h2 className="font-semibold">Coffre quotidien</h2>
              <p className="text-xs text-white/50">Ouvre ton coffre chaque jour pour gagner des récompenses</p>
            </div>
          </div>
          {giftResult ? (
            <div className="rounded-xl bg-gradient-to-r from-[#FF6B35]/20 to-[#FFD700]/20 border border-[#FFD700]/30 px-4 py-2 text-center">
              <p className="text-sm font-bold text-[#FFD700]">{giftResult.gift.value}</p>
              <p className="text-[10px] text-white/50">Streak : {giftResult.streak} jours</p>
            </div>
          ) : (
            <button
              onClick={openGift}
              disabled={giftLoading}
              className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
            >
              {giftLoading ? 'Ouverture...' : 'Ouvrir le coffre'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('historique')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'historique' ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30' : 'text-white/50 hover:bg-white/5'}`}
        >
          Historique
        </button>
        <button
          onClick={() => setTab('boutique')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'boutique' ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30' : 'text-white/50 hover:bg-white/5'}`}
        >
          <ShoppingBag className="h-4 w-4" /> Boutique
        </button>
      </div>

      {tab === 'historique' ? (
        <div className="space-y-2">
          {(!data?.transactions || data.transactions.length === 0) ? (
            <div className="glass flex flex-col items-center gap-3 py-10 text-center">
              <Star className="h-8 w-8 text-white/30" />
              <p className="text-sm text-white/60">Aucune transaction — commence à utiliser MOKSHA pour gagner des points.</p>
            </div>
          ) : (
            data.transactions.map((t) => (
              <div key={t.id} className="glass flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium capitalize">{t.type.replace('_', ' ')}</p>
                  <p className="text-[10px] text-white/40">
                    {t.description ? `${t.description} — ` : ''}
                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <p className={`font-semibold ${t.amount > 0 ? 'text-[#5DCAA5]' : 'text-red-300'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount} pts
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {POINTS_SHOP.map((item) => (
            <div key={item.id} className="glass flex items-center justify-between p-5">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-white/50">{item.cost.toLocaleString()} points</p>
              </div>
              <button
                disabled={(data?.balance ?? 0) < item.cost}
                className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-4 py-2 text-xs font-bold text-[#070B18] disabled:opacity-30"
              >
                Échanger
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
