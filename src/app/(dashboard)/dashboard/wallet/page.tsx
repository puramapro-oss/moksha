'use client'

import { useEffect, useState } from 'react'
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { WalletTransaction } from '@/types'
import { WALLET_MIN_WITHDRAWAL } from '@/lib/constants'

export default function Wallet() {
  const { profile } = useAuth()
  const [txs, setTxs] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data } = await supabase
        .from('moksha_wallet_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setTxs((data as WalletTransaction[]) || [])
      setLoading(false)
    }
    load()
  }, [profile?.id, supabase])

  const solde = txs.reduce((sum, t) => {
    if (t.statut !== 'completed') return sum
    if (t.type === 'retrait') return sum - Number(t.amount)
    return sum + Number(t.amount)
  }, 0)

  async function requestWithdrawal() {
    if (solde < WALLET_MIN_WITHDRAWAL) {
      toast.error(`Minimum ${WALLET_MIN_WITHDRAWAL}€ pour un retrait`)
      return
    }
    toast.info('Fonctionnalité de retrait en cours de finalisation — nous te contactons par email.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <WalletIcon className="h-6 w-6 text-[#FFD700]" /> Wallet
        </h1>
        <p className="mt-1 text-sm text-white/60">Gains de parrainage, bonus concours et retraits.</p>
      </div>

      <div className="glass p-8 text-center">
        <p className="text-xs uppercase tracking-wider text-white/50">Solde disponible</p>
        <p className="mt-3 text-6xl font-extrabold text-[#FFD700]">{solde.toFixed(2)} €</p>
        <button
          onClick={requestWithdrawal}
          className="mt-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18]"
        >
          Demander un retrait (IBAN)
        </button>
        <p className="mt-2 text-[10px] text-white/40">Retrait minimum : {WALLET_MIN_WITHDRAWAL} €</p>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Historique</h2>
        {loading ? (
          <div className="skeleton h-32 rounded-2xl" />
        ) : txs.length === 0 ? (
          <div className="glass flex flex-col items-center gap-3 py-10 text-center">
            <WalletIcon className="h-8 w-8 text-white/30" />
            <p className="text-sm text-white/60">Aucune transaction — parraine tes premiers amis pour commencer à gagner.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((t) => (
              <div key={t.id} className="glass flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {t.type === 'retrait' ? (
                    <ArrowUpRight className="h-5 w-5 text-red-400" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-[#5DCAA5]" />
                  )}
                  <div>
                    <p className="text-sm font-medium capitalize">{t.type}</p>
                    <p className="text-[10px] text-white/40">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <p className={`font-semibold ${t.type === 'retrait' ? 'text-red-300' : 'text-[#5DCAA5]'}`}>
                  {t.type === 'retrait' ? '-' : '+'}{Number(t.amount).toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
