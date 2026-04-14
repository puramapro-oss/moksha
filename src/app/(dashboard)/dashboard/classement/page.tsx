'use client'

import { useEffect, useState, useCallback } from 'react'
import { Medal, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { getLigue, nextLigue, LIGUES } from '@/lib/ligues'

type Entry = { user_id: string; full_name: string; score: number; rank: number }

export default function ClassementPage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [myScore, setMyScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('moksha_contest_leaderboard')
      .select('user_id, full_name, score, rank')
      .order('score', { ascending: false })
      .limit(100)

    const list = (data as Entry[]) ?? []
    setEntries(list)

    if (profile?.id) {
      const mine = list.find((e) => e.user_id === profile.id)
      setMyScore(mine?.score ?? 0)
    }
    setLoading(false)
  }, [profile?.id, supabase])

  useEffect(() => { load() }, [load])

  const myLigue = getLigue(myScore)
  const next = nextLigue(myScore)
  const progress = next
    ? Math.min(100, Math.round(((myScore - myLigue.minScore) / (next.minScore - myLigue.minScore)) * 100))
    : 100

  if (loading) return <div className="skeleton h-96 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl font-extrabold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Medal className="h-6 w-6 text-[#FFD700]" />
          Classement
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Top 100 de la semaine. Score = parrainages×10 + abos×50 + jours actifs×5 + gratitudes×3.
        </p>
      </div>

      {/* Ma ligue */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">Ta ligue</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl">{myLigue.emoji}</span>
              <span
                className="font-[family-name:var(--font-display)] text-2xl font-bold"
                style={{ color: myLigue.color }}
              >
                {myLigue.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">Ton score</p>
            <p className="text-3xl font-extrabold text-[#FFD700]">{myScore}</p>
          </div>
        </div>

        {next ? (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Prochaine ligue : {next.emoji} {next.name}</span>
              <span>{Math.max(0, next.minScore - myScore)} pts à faire</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-5 text-center text-xs font-semibold text-[#FF6B35]">
            Tu es au sommet — Purama. Respect. 🔥
          </p>
        )}
      </div>

      {/* Toutes les ligues */}
      <div className="glass rounded-2xl p-5">
        <h2 className="mb-3 text-sm font-semibold text-white/70">Les 10 ligues</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {LIGUES.map((l) => (
            <div
              key={l.key}
              className={`flex flex-col items-center gap-1 rounded-xl p-3 text-center ${
                l.key === myLigue.key
                  ? 'bg-white/[0.06] ring-1 ring-[#FFD700]/40'
                  : 'bg-white/[0.02]'
              }`}
            >
              <span className="text-xl">{l.emoji}</span>
              <span className="text-[11px] font-semibold" style={{ color: l.color }}>
                {l.name}
              </span>
              <span className="text-[10px] text-white/40">{l.minScore}+</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 100 */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-white/50">
          <Users className="h-4 w-4" />
          Top 100 cette semaine
        </div>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            Le classement sera disponible dimanche prochain.
          </p>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry, i) => {
              const ligue = getLigue(entry.score)
              const mine = entry.user_id === profile?.id
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between gap-3 rounded-xl p-3 ${
                    mine ? 'bg-[#FF6B35]/10 ring-1 ring-[#FF6B35]/30' : 'bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? 'bg-[#FFD700]/20 text-[#FFD700]'
                          : i === 1
                            ? 'bg-white/10 text-white/70'
                            : i === 2
                              ? 'bg-[#CD7F32]/20 text-[#CD7F32]'
                              : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{entry.full_name || 'Anonyme'}</span>
                    <span className="text-xs" title={ligue.name}>
                      {ligue.emoji}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#FFD700]">{entry.score} pts</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
