'use client'

import { useEffect, useState } from 'react'
import { Users, Trophy, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

type TopParrain = {
  id: string
  email: string
  full_name: string | null
  referral_code: string
  filleuls: number
  actifs: number
  gains: number
}

type Data = {
  summary: { total: number; actifs: number; gains: number }
  top: TopParrain[]
}

export default function AdminParrainages() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/parrainages')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d as Data))
      .catch(() => toast.error('Chargement impossible'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        Parrainages
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Filleuls totaux" value={data?.summary.total ?? '...'} icon={<Users className="h-5 w-5" />} />
        <Card label="Filleuls actifs/payants" value={data?.summary.actifs ?? '...'} icon={<TrendingUp className="h-5 w-5" />} />
        <Card label="Commissions versées" value={data ? `${data.summary.gains.toLocaleString('fr-FR')} €` : '...'} icon={<Trophy className="h-5 w-5" />} accent />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Top 100 parrains</h2>
        {loading ? (
          <div className="skeleton h-40 rounded-2xl" />
        ) : !data || data.top.length === 0 ? (
          <div className="glass p-10 text-center text-sm text-white/60">Aucun parrain pour l&apos;instant.</div>
        ) : (
          <div className="glass overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5 text-left text-xs uppercase text-white/50">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Parrain</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Filleuls</th>
                  <th className="px-4 py-3">Actifs</th>
                  <th className="px-4 py-3 text-right">Gains</th>
                </tr>
              </thead>
              <tbody>
                {data.top.map((p, i) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white/40">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-white/90">{p.full_name || '—'}</p>
                      <p className="text-[11px] text-white/50">{p.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#FFD700]">{p.referral_code}</td>
                    <td className="px-4 py-3 font-semibold">{p.filleuls}</td>
                    <td className="px-4 py-3 text-[#5DCAA5]">{p.actifs}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#FFD700]">{p.gains.toFixed(2)} €</td>
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
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  )
}
