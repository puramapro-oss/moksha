'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heart, Send, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type Entry = { id: string; content: string; created_at: string }

export default function GratitudePage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  const fetchEntries = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('moksha_gratitude_entries')
      .select('id, content, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setEntries(data || [])
    setLoading(false)
  }, [profile?.id, supabase])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const todayCount = entries.filter(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString()
  ).length

  const streak = (() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toDateString()
      if (entries.some((e) => new Date(e.created_at).toDateString() === dateStr)) {
        count++
      } else if (i > 0) break
    }
    return count
  })()

  async function submit() {
    if (!text.trim() || !profile?.id || todayCount >= 3) return
    setSending(true)
    const { error } = await supabase.from('moksha_gratitude_entries').insert({
      user_id: profile.id,
      content: text.trim(),
    })
    if (error) {
      toast.error('Impossible de sauvegarder. Réessaie.')
    } else {
      toast.success('Gratitude enregistrée +100 pts')
      setText('')
      await fetchEntries()
    }
    setSending(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-[#FF6B35]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Journal de gratitude
        </h1>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        3 gratitudes par jour transforment ta perception. Chaque entrée = +100 points.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#FF6B35]">{todayCount}/3</p>
          <p className="text-xs text-[var(--text-muted)]">Aujourd&apos;hui</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className="h-5 w-5 text-[#FFD700]" />
            <p className="text-2xl font-bold text-[#FFD700]">{streak}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Jours de suite</p>
        </div>
      </div>

      {/* Input */}
      {todayCount < 3 ? (
        <div className="glass rounded-xl p-5">
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Pour quoi es-tu reconnaissant aujourd&apos;hui ?
          </label>
          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60"
              maxLength={280}
            />
            <button
              onClick={submit}
              disabled={!text.trim() || sending}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-sm text-[#5DCAA5]">
            3 gratitudes enregistrées aujourd&apos;hui. Reviens demain pour continuer ton streak.
          </p>
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Historique</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Heart className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-[var(--text-muted)]">
              L&apos;espace de toutes les possibilités. Écris ta première gratitude.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="glass rounded-xl p-4">
              <p className="text-sm text-[var(--text-primary)]">{entry.content}</p>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
