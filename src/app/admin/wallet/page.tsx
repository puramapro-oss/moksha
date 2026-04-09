'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Check, X } from 'lucide-react'
import { toast } from 'sonner'

type Tx = {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: 'commission' | 'bonus' | 'retrait' | 'concours'
  amount: number
  description: string | null
  statut: 'pending' | 'completed' | 'failed'
  stripe_payout_id: string | null
  created_at: string
}

type Balance = { user_id: string; email: string; full_name: string; balance: number }

type Data = {
  totals: { in: number; out: number; pending: number; net: number }
  transactions: Tx[]
  balances: Balance[]
}

export default function AdminWallet() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/wallet')
    if (r.ok) setData((await r.json()) as Data)
    else toast.error('Chargement impossible')
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function updateTx(id: string, statut: 'completed' | 'failed') {
    const r = await fetch('/api/admin/wallet', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut }),
    })
    if (r.ok) {
      toast.success(statut === 'completed' ? 'Retrait marqué versé' : 'Retrait refusé')
      load()
    } else toast.error('Échec')
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        Wallet — vue globale
      </h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card label="Encaissé (commissions)" value={data ? `${data.totals.in.toFixed(2)} €` : '...'} icon={<ArrowDownLeft className="h-5 w-5" />} />
        <Card label="Versé (retraits)" value={data ? `${data.totals.out.toFixed(2)} €` : '...'} icon={<ArrowUpRight className="h-5 w-5" />} />
        <Card label="En attente" value={data ? `${data.totals.pending.toFixed(2)} €` : '...'} icon={<WalletIcon className="h-5 w-5" />} />
        <Card label="Solde réseau" value={data ? `${data.totals.net.toFixed(2)} €` : '...'} icon={<WalletIcon className="h-5 w-5" />} accent />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Retraits en attente</h2>
        {loading ? (
          <div className="skeleton h-32 rounded-2xl" />
        ) : (
          <div className="space-y-2">
            {(data?.transactions || []).filter((t) => t.type === 'retrait' && t.statut === 'pending').length === 0 ? (
              <div className="glass p-6 text-center text-xs text-white/50">Aucun retrait en attente.</div>
            ) : (
              (data?.transactions || [])
                .filter((t) => t.type === 'retrait' && t.statut === 'pending')
                .map((t) => (
                  <div key={t.id} className="glass flex items-center justify-between p-4 text-sm">
                    <div>
                      <p className="font-medium">{t.user_email}</p>
                      <p className="text-[11px] text-white/50">{t.description || '—'}</p>
                      <p className="text-[10px] text-white/40">{new Date(t.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#FFD700]">{Math.abs(Number(t.amount)).toFixed(2)} €</span>
                      <button
                        onClick={() => updateTx(t.id, 'completed')}
                        className="rounded-lg bg-[#5DCAA5]/20 p-2 text-[#5DCAA5] hover:bg-[#5DCAA5]/30"
                        title="Marquer versé"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateTx(t.id, 'failed')}
                        className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                        title="Refuser"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Top soldes utilisateurs</h2>
        {loading ? (
          <div className="skeleton h-32 rounded-2xl" />
        ) : (data?.balances || []).length === 0 ? (
          <div className="glass p-6 text-center text-xs text-white/50">Aucun solde positif.</div>
        ) : (
          <div className="glass overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5 text-left text-xs uppercase text-white/50">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3 text-right">Solde</th>
                </tr>
              </thead>
              <tbody>
                {data!.balances.map((b, i) => (
                  <tr key={b.user_id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white/40">{i + 1}</td>
                    <td className="px-4 py-3 text-white/80">{b.email}</td>
                    <td className="px-4 py-3 text-white/60">{b.full_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#FFD700]">{b.balance.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="glass p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-gradient-to-br from-[#FF6B35] to-[#FFD700] text-[#070B18]' : 'bg-white/5 text-white/60'}`}>
        {icon}
      </div>
      <div className="text-xl font-extrabold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  )
}
