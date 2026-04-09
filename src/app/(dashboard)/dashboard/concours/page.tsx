'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, Medal, Ticket, Calendar, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type LeaderboardEntry = { user_id: string; full_name: string; score: number; rank: number }
type DrawResult = { period: string; winners: { name: string; amount: number; rank: number }[] }

export default function ConcoursPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<'classement' | 'tirage'>('classement')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [tickets, setTickets] = useState(0)
  const [pastDraws, setPastDraws] = useState<DrawResult[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    if (!profile?.id) return
    try {
      const [lb, tk, draws] = await Promise.all([
        supabase.from('moksha_contest_leaderboard').select('*').order('score', { ascending: false }).limit(10),
        supabase.from('moksha_lottery_tickets').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).is('draw_id', null),
        supabase.from('moksha_lottery_draws').select('*').eq('status', 'completed').order('draw_date', { ascending: false }).limit(5),
      ])
      setLeaderboard((lb.data as LeaderboardEntry[]) ?? [])
      setTickets(tk.count ?? 0)
      setPastDraws((draws.data as DrawResult[]) ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [profile?.id, supabase])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="skeleton h-96 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <Trophy className="h-6 w-6 text-[#FFD700]" /> Concours
        </h1>
        <p className="mt-1 text-sm text-white/60">Classement hebdo + tirage mensuel. 10 gagnants chaque fois.</p>
      </div>

      {/* Tickets count */}
      <div className="glass flex items-center gap-4 p-5">
        <Ticket className="h-8 w-8 text-[#FF6B35]" />
        <div>
          <p className="text-2xl font-extrabold text-[#FFD700]">{tickets}</p>
          <p className="text-xs text-white/50">Tickets pour le prochain tirage mensuel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('classement')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'classement' ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30' : 'text-white/50 hover:bg-white/5'}`}
        >
          <Medal className="h-4 w-4" /> Classement hebdo
        </button>
        <button
          onClick={() => setTab('tirage')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'tirage' ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30' : 'text-white/50 hover:bg-white/5'}`}
        >
          <Calendar className="h-4 w-4" /> Tirage mensuel
        </button>
      </div>

      {tab === 'classement' ? (
        <div className="space-y-2">
          <div className="glass p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-white/50">
              <Users className="h-4 w-4" />
              <span>Top 10 de la semaine — Score = parrainages x10 + abos x50 + jours actifs x5</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/40">Le classement sera disponible dimanche prochain.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between rounded-xl p-3 ${
                      entry.user_id === profile?.id ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/20' : 'bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        i === 0 ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                        i === 1 ? 'bg-white/10 text-white/70' :
                        i === 2 ? 'bg-[#CD7F32]/20 text-[#CD7F32]' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{entry.full_name || 'Anonyme'}</span>
                    </div>
                    <span className="font-semibold text-[#FFD700]">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-center text-[10px] text-white/30">
            6% du CA redistribué chaque semaine aux 10 premiers. Résultats dimanche 23h59.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass p-5">
            <h3 className="mb-3 font-semibold">Comment gagner des tickets ?</h3>
            <div className="grid gap-2 text-xs text-white/60">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <span>Inscription</span><span className="text-[#5DCAA5]">+1 ticket</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <span>Parrainage réussi</span><span className="text-[#5DCAA5]">+2 tickets</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <span>Partage social</span><span className="text-[#5DCAA5]">+1 ticket</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <span>Streak 7 jours</span><span className="text-[#5DCAA5]">+1 ticket</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <span>Abonnement actif</span><span className="text-[#5DCAA5]">+5 tickets/mois</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <span>500 points Purama</span><span className="text-[#5DCAA5]">= 1 ticket</span>
              </div>
            </div>
          </div>

          {pastDraws.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold">Derniers tirages</h3>
              {pastDraws.map((draw, i) => (
                <div key={i} className="glass mb-2 p-4">
                  <p className="mb-2 text-sm font-medium">{draw.period}</p>
                  {draw.winners?.map((w, j) => (
                    <div key={j} className="flex items-center justify-between py-1 text-xs">
                      <span>{w.rank}. {w.name}</span>
                      <span className="text-[#5DCAA5]">{w.amount.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-[10px] text-white/30">
            4% du CA redistribué chaque mois. 10 gagnants tirés au sort parmi les utilisateurs actifs. Dernier jour du mois.
          </p>
        </div>
      )}
    </div>
  )
}
