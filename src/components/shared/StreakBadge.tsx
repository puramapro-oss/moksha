'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

export default function StreakBadge() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [streak, setStreak] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    ;(async () => {
      const { data } = await supabase
        .from('moksha_daily_gifts')
        .select('streak_count, opened_at')
        .eq('user_id', profile.id)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data) return

      const lastDate = new Date(data.opened_at)
      const today = new Date()
      const diffDays = Math.floor(
        (today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
      )

      // Streak still valid if opened today or yesterday
      if (diffDays <= 1) {
        setStreak(data.streak_count ?? 0)
        setActive(diffDays === 0)
      } else {
        setStreak(0)
      }
    })()
  }, [profile?.id, supabase])

  if (streak === 0) return null

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-[#FF6B35]/20 to-[#FFD700]/20 text-[#FFD700] shadow-[0_0_16px_rgba(255,215,0,0.2)]'
          : 'border border-white/10 bg-white/5 text-white/50'
      }`}
      title={active ? 'Streak actif — ouvre ton coffre demain pour continuer' : 'Streak en pause — ouvre ton coffre pour la relancer'}
    >
      <Flame className={`h-3.5 w-3.5 ${active ? 'text-[#FF6B35]' : 'text-white/40'}`} />
      <span>{streak}</span>
      <span className="text-[10px] opacity-70">j</span>
    </div>
  )
}
