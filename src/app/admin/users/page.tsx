'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type User = { id: string; email: string; full_name: string | null; plan: string; created_at: string }

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('moksha_profiles')
        .select('id, email, full_name, plan, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
      setUsers((data as User[]) || [])
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Utilisateurs</h1>
      {loading ? (
        <div className="skeleton h-32 rounded-2xl" />
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 text-left text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Créé</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white/80">{u.email}</td>
                  <td className="px-4 py-3 text-white/70">{u.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-2 py-0.5 text-[10px] capitalize text-[#FFD700]">
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
