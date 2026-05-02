'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { WalletTransaction } from '@/types'
import { WALLET_MIN_WITHDRAWAL } from '@/lib/constants'

export default function Wallet() {
  const { profile } = useAuth()
  const [txs, setTxs] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const supabase = createClient()

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('moksha_wallet_transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setTxs((data as WalletTransaction[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  // Solde = sum complétés (commission/bonus/concours) − sum retraits (pending+completed)
  const solde = txs.reduce((sum, t) => {
    const a = Number(t.amount)
    if (t.type === 'retrait') return sum - Math.abs(a)
    if (t.statut === 'completed') return sum + a
    return sum
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <WalletIcon className="h-6 w-6 text-[#FFB300]" /> Wallet
        </h1>
        <p className="mt-1 text-sm text-white/60">Gains de parrainage, bonus concours et retraits.</p>
      </div>

      <div className="glass p-8 text-center">
        <p className="text-xs uppercase tracking-wider text-white/50">Solde disponible</p>
        <p className="mt-3 text-6xl font-extrabold text-[#FFB300]">{solde.toFixed(2)} €</p>
        <button
          onClick={() => {
            if (solde < WALLET_MIN_WITHDRAWAL) {
              toast.error(`Minimum ${WALLET_MIN_WITHDRAWAL}€ pour un retrait`)
              return
            }
            setOpenModal(true)
          }}
          className="mt-6 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-6 py-3 text-sm font-bold text-[#070B18]"
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
                    <p className="text-sm font-medium capitalize">
                      {t.type}
                      {t.statut !== 'completed' && (
                        <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] uppercase text-amber-300">
                          {t.statut}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {t.description ? `${t.description} • ` : ''}
                      {new Date(t.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold ${t.type === 'retrait' ? 'text-red-300' : 'text-[#5DCAA5]'}`}>
                  {t.type === 'retrait' ? '' : '+'}{Number(t.amount).toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {openModal && (
        <WithdrawModal
          maxAmount={solde}
          onClose={() => setOpenModal(false)}
          onSuccess={() => {
            setOpenModal(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function WithdrawModal({
  maxAmount,
  onClose,
  onSuccess,
}: {
  maxAmount: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [titulaire, setTitulaire] = useState('')
  const [amount, setAmount] = useState(maxAmount)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iban, bic, titulaire, amount }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Échec du retrait')
        return
      }
      toast.success(data.message || 'Demande enregistrée')
      onSuccess()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="glass w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Demande de retrait
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block text-xs">
          <span className="mb-1 block text-white/60">Titulaire du compte</span>
          <input
            type="text"
            required
            value={titulaire}
            onChange={(e) => setTitulaire(e.target.value)}
            placeholder="Prénom NOM"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF3D00]/60"
          />
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-white/60">IBAN (FR…)</span>
          <input
            type="text"
            required
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="FR76 ..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs outline-none focus:border-[#FF3D00]/60"
          />
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-white/60">BIC</span>
          <input
            type="text"
            required
            value={bic}
            onChange={(e) => setBic(e.target.value.toUpperCase())}
            placeholder="BNPAFRPP"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs outline-none focus:border-[#FF3D00]/60"
          />
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-white/60">Montant (€) — max {maxAmount.toFixed(2)}€</span>
          <input
            type="number"
            required
            min={WALLET_MIN_WITHDRAWAL}
            max={maxAmount}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF3D00]/60"
          />
        </label>

        <p className="text-[10px] text-white/40">
          Versement sous 3 jours ouvrés. Les retraits sont traités manuellement le temps que la SASU PURAMA active SEPA Stripe Treasury.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
        >
          {submitting ? 'Envoi...' : 'Confirmer la demande'}
        </button>
      </form>
    </div>
  )
}
