'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Shield } from 'lucide-react'
import { toast } from 'sonner'

type User = {
  id: string
  email: string
  full_name: string | null
  plan: 'gratuit' | 'autopilote' | 'pro'
  referral_code: string
  is_admin: boolean
  is_super_admin: boolean
  created_at: string
  jurisia_questions_today: number
  stripe_customer_id: string | null
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    if (r.ok) {
      const d = (await r.json()) as { users: User[] }
      setUsers(d.users)
    } else {
      toast.error('Chargement impossible')
    }
    setLoading(false)
  }, [q])

  useEffect(() => {
    load()
  }, [load])

  async function updatePlan(id: string, plan: User['plan']) {
    const r = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, plan }),
    })
    if (r.ok) {
      toast.success('Plan mis à jour')
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan } : u)))
    } else toast.error('Échec mise à jour')
  }

  async function toggleAdmin(u: User) {
    const r = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, is_admin: !u.is_admin }),
    })
    if (r.ok) {
      toast.success(u.is_admin ? 'Admin retiré' : 'Promu admin')
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, is_admin: !p.is_admin } : p)))
    } else toast.error('Échec')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          Utilisateurs
        </h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email, nom, code parrain…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#FF3D00]/60"
          />
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : users.length === 0 ? (
        <div className="glass p-10 text-center text-sm text-white/60">Aucun utilisateur.</div>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 text-left text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Quota IA</th>
                <th className="px-4 py-3">Créé</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white/80">
                    {u.email}
                    {u.is_super_admin && <span className="ml-2 rounded-full bg-[#FF3D00]/20 px-2 py-0.5 text-[9px] text-[#FF3D00]">SUPER</span>}
                    {u.is_admin && !u.is_super_admin && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] text-amber-300">ADMIN</span>}
                  </td>
                  <td className="px-4 py-3 text-white/70">{u.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.plan}
                      onChange={(e) => updatePlan(u.id, e.target.value as User['plan'])}
                      disabled={u.is_super_admin}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs"
                    >
                      <option value="gratuit">Gratuit</option>
                      <option value="autopilote">Autopilote</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#FFB300]">{u.referral_code}</td>
                  <td className="px-4 py-3 text-white/60">{u.jurisia_questions_today}</td>
                  <td className="px-4 py-3 text-white/50">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    {!u.is_super_admin && (
                      <button
                        onClick={() => toggleAdmin(u)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10"
                      >
                        <Shield className="h-3 w-3" />
                        {u.is_admin ? 'Retirer admin' : 'Rendre admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
