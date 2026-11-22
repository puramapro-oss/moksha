'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Heart, Send, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type Entry = { id: string; content: string; created_at: string }

function countToday(entries: Entry[]) {
  const today = new Date().toDateString()
  return entries.filter((entry) => new Date(entry.created_at).toDateString() === today).length
}

export default function GratitudePage() {
  const { user, loading } = useAuth()
  return <GratitudeJournal key={user?.id} userId={user?.id} authLoading={loading} />
}

function GratitudeJournal({ userId, authLoading }: { userId?: string; authLoading: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(Boolean(userId))
  const [loadError, setLoadError] = useState(false)
  const [sending, setSending] = useState(false)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const activeRead = useRef<symbol | null>(null)
  const activeSave = useRef<symbol | null>(null)
  const confirmedEntries = useRef<Entry[] | null>(null)
  const unconfirmedWrite = useRef(false)
  const draftRevision = useRef(0)

  const supabase = createClient()

  const fetchEntries = useCallback(async () => {
    const request = Symbol()
    activeRead.current = request
    confirmedEntries.current = null
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(false)
    try {
      const { data, error } = await supabase
        .from('moksha_gratitude_entries')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (activeRead.current !== request) return
      if (error) setLoadError(true)
      else {
        confirmedEntries.current = data || []
        setEntries(confirmedEntries.current)
      }
    } catch {
      if (activeRead.current === request) setLoadError(true)
    } finally {
      if (activeRead.current === request) {
        activeRead.current = null
        setLoading(false)
      }
    }
  }, [userId, supabase])

  useEffect(() => {
    let mounted = true
    queueMicrotask(() => { if (mounted) void fetchEntries() })
    return () => {
      mounted = false
      activeRead.current = null
      activeSave.current = null
      confirmedEntries.current = null
    }
  }, [fetchEntries])

  const todayCount = countToday(entries)
  const historyReady = Boolean(userId) && !authLoading && !loading && !loadError

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
    const knownEntries = confirmedEntries.current
    if (!text.trim() || !userId || !historyReady ||
        activeSave.current || unconfirmedWrite.current || !knownEntries || countToday(knownEntries) >= 3) return

    const attempt = Symbol()
    const revision = draftRevision.current
    activeSave.current = attempt
    setSending(true)
    try {
      const { error, status } = await supabase.from('moksha_gratitude_entries').insert({
        user_id: userId,
        content: text.trim(),
      })
      if (activeSave.current !== attempt) return
      if (error) {
        // An interrupted acknowledgement can follow a successful insertion.
        if ([400, 401, 403, 404, 406, 415, 422].includes(status)) {
          toast.error('Impossible de sauvegarder. Réessaie.')
        } else {
          unconfirmedWrite.current = true
          setUnconfirmed(true)
        }
        return
      }
      toast.success('Gratitude enregistrée')
      if (draftRevision.current === revision) setText('')
      await fetchEntries()
    } catch {
      if (activeSave.current === attempt) {
        unconfirmedWrite.current = true
        setUnconfirmed(true)
      }
    } finally {
      if (activeSave.current === attempt) {
        activeSave.current = null
        setSending(false)
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-[#FF3D00]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Journal de gratitude
        </h1>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        Note jusqu’à 3 gratitudes par jour si cette pratique te convient. Tu peux arrêter à tout moment.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#FF3D00]">{historyReady ? todayCount : '—'}/3</p>
          <p className="text-xs text-[var(--text-muted)]">Aujourd&apos;hui</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className="h-5 w-5 text-[#FFB300]" />
            <p className="text-2xl font-bold text-[#FFB300]">{historyReady ? streak : '—'}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Jours de suite</p>
        </div>
      </div>

      {/* Input */}
      {!historyReady || todayCount < 3 ? (
        <div className="glass rounded-xl p-5">
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Pour quoi es-tu reconnaissant aujourd&apos;hui ?
          </label>
          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => { draftRevision.current++; setText(e.target.value) }}
              onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
              disabled={!userId || authLoading}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF3D00]/60"
              maxLength={280}
              aria-label="Gratitude du jour"
            />
            <button
              onClick={() => void submit()}
              disabled={!text.trim() || !historyReady || sending || unconfirmed}
              aria-label="Enregistrer la gratitude"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] text-[#070B18] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {unconfirmed && (
            <p role="status" className="mt-3 text-sm text-[var(--text-muted)]">
              Enregistrement non confirmé. Conserve ton brouillon et actualise la page pour vérifier l&apos;historique avant de réessayer.
            </p>
          )}
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
        ) : loadError ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Impossible de charger l&apos;historique pour le moment. Les entrées ne sont pas présentées comme absentes.
            </p>
            <button type="button" className="mt-3 text-sm underline" onClick={() => void fetchEntries()}>
              Recharger l&apos;historique
            </button>
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
