'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Send, Check, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type Intention = { id: string; content: string; completed: boolean; created_at: string }

export default function IntentionsPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [intentions, setIntentions] = useState<Intention[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchIntentions = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('moksha_intentions')
      .select('id, content, completed, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setIntentions(data ?? [])
    setLoading(false)
  }, [profile?.id, supabase])

  useEffect(() => {
    fetchIntentions()
  }, [fetchIntentions])

  const todayIntention = intentions.find(
    (i) => new Date(i.created_at).toDateString() === new Date().toDateString(),
  )

  async function submit() {
    if (!text.trim() || !profile?.id || todayIntention) return
    setSending(true)
    const { error } = await supabase.from('moksha_intentions').insert({
      user_id: profile.id,
      content: text.trim(),
    })
    if (error) {
      toast.error('Impossible de sauvegarder. Réessaie.')
    } else {
      toast.success('Intention posée — ta journée a maintenant une direction.')
      setText('')
      await fetchIntentions()
    }
    setSending(false)
  }

  async function toggleComplete(id: string, current: boolean) {
    const { error } = await supabase
      .from('moksha_intentions')
      .update({ completed: !current })
      .eq('id', id)
      .eq('user_id', profile?.id ?? '')
    if (!error) {
      setIntentions((prev) => prev.map((i) => (i.id === id ? { ...i, completed: !current } : i)))
      if (!current) toast.success('Intention accomplie — tu avances.')
    }
  }

  const streak = (() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toDateString()
      if (intentions.some((e) => new Date(e.created_at).toDateString() === dateStr)) {
        count++
      } else if (i > 0) break
    }
    return count
  })()

  const completedCount = intentions.filter((i) => i.completed).length

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-[#FFB300]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Intention du jour
        </h1>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        Pose une intention chaque matin. Le soir, reviens marquer si elle est accomplie. La clarté
        précède l&apos;action.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#FFB300]">{streak}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Jours de suite</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#5DCAA5]">{completedCount}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Accomplies</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#FF3D00]">{intentions.length}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Total</p>
        </div>
      </div>

      {/* Today's intention */}
      {todayIntention ? (
        <div
          className={`glass rounded-xl p-6 ${todayIntention.completed ? 'border-[#5DCAA5]/30 bg-[#5DCAA5]/5' : ''}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FFB300]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">
              Intention d&apos;aujourd&apos;hui
            </span>
          </div>
          <p className="text-lg font-medium">{todayIntention.content}</p>
          <button
            onClick={() => toggleComplete(todayIntention.id, todayIntention.completed)}
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              todayIntention.completed
                ? 'bg-[#5DCAA5]/20 text-[#5DCAA5]'
                : 'border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
            }`}
          >
            {todayIntention.completed ? (
              <>
                <Check className="h-4 w-4" /> Accomplie
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" /> Marquer comme accomplie
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="glass rounded-xl p-5">
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Quelle est ton intention pour aujourd&apos;hui ?
          </label>
          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FFB300]/60"
              maxLength={200}
            />
            <button
              onClick={submit}
              disabled={!text.trim() || sending}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] text-[#070B18] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {intentions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Historique</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : (
            intentions
              .filter((i) => i.id !== todayIntention?.id)
              .slice(0, 10)
              .map((intention) => (
                <div
                  key={intention.id}
                  className="glass flex items-center justify-between rounded-xl p-4"
                >
                  <div className="flex-1">
                    <p
                      className={`text-sm ${intention.completed ? 'text-[var(--text-muted)] line-through' : ''}`}
                    >
                      {intention.content}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {new Date(intention.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  {intention.completed ? (
                    <Check className="h-4 w-4 shrink-0 text-[#5DCAA5]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-white/20" />
                  )}
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}
