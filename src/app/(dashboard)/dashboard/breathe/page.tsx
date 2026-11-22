'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Wind, Play, Pause, RotateCcw, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type SaveState = 'idle' | 'saving' | 'saved' | 'rejected' | 'unconfirmed'
type Phase = 'inhale' | 'hold' | 'exhale'
type Clock = { phaseIndex: number; countdown: number; cycles: number; totalTime: number }
const INITIAL_CLOCK: Clock = { phaseIndex: 0, countdown: 4, cycles: 0, totalTime: 0 }

const PHASES: { phase: Phase; duration: number; label: string }[] = [
  { phase: 'inhale', duration: 4, label: 'Inspire' },
  { phase: 'hold', duration: 7, label: 'Retiens' },
  { phase: 'exhale', duration: 8, label: 'Expire' },
]

const MIN_SECONDS_FOR_POINTS = 180 // 3 min
const POINTS_PER_SESSION = 50

type PastSession = { id: string; cycles: number; duration_seconds: number; created_at: string }

export default function BreathePage() {
  const { user } = useAuth()
  return <BreathingSession key={user?.id} userId={user?.id} />
}

function BreathingSession({ userId }: { userId?: string }) {
  const supabase = createClient()

  const [running, setRunning] = useState(false)
  const [clock, setClock] = useState(INITIAL_CLOCK)
  const clockRef = useRef(INITIAL_CLOCK)
  const { phaseIndex, countdown, cycles, totalTime } = clock
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const saveStateRef = useRef<SaveState>('idle')
  const publishSaveState = useCallback((next: SaveState) => {
    saveStateRef.current = next
    setSaveState(next)
  }, [])
  const activeSave = useRef<symbol | null>(null)
  const saved = saveState === 'saved'
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = PHASES[phaseIndex]

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  // Fetch past sessions
  useEffect(() => {
    if (!userId) return
    let currentRequest = true
    supabase
      .from('moksha_breath_sessions')
      .select('id, cycles, duration_seconds, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (currentRequest) setPastSessions(data ?? [])
      })
    return () => { currentRequest = false }
  }, [userId, supabase, saved])

  useEffect(() => () => { activeSave.current = null }, [])

  const saveSession = useCallback(async (elapsed = clockRef.current) => {
    const status = saveStateRef.current
    if (!userId || activeSave.current || (status !== 'idle' && status !== 'rejected')) return

    const attempt = Symbol()
    activeSave.current = attempt
    publishSaveState('saving')
    try {
      const { error, status } = await supabase.from('moksha_breath_sessions').insert({
        user_id: userId,
        cycles: elapsed.cycles,
        duration_seconds: elapsed.totalTime,
        points_earned: POINTS_PER_SESSION,
      })
      if (activeSave.current !== attempt) return
      if (error) {
        // A lost acknowledgement may follow a successful insert.
        const definitivelyRejected = [400, 401, 403, 404, 406, 415, 422].includes(status)
        publishSaveState(definitivelyRejected ? 'rejected' : 'unconfirmed')
        return
      }
      publishSaveState('saved')
      toast.success('Séance enregistrée.')
    } catch {
      if (activeSave.current === attempt) publishSaveState('unconfirmed')
    } finally {
      if (activeSave.current === attempt) activeSave.current = null
    }
  }, [userId, supabase, publishSaveState])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      const previous = clockRef.current
      const phaseEnded = previous.countdown <= 1
      const nextPhase = phaseEnded ? (previous.phaseIndex + 1) % PHASES.length : previous.phaseIndex
      const next: Clock = {
        phaseIndex: nextPhase,
        countdown: phaseEnded ? PHASES[nextPhase].duration : previous.countdown - 1,
        cycles: previous.cycles + (phaseEnded && nextPhase === 0 ? 1 : 0),
        totalTime: previous.totalTime + 1,
      }
      clockRef.current = next
      setClock(next)
      if (next.totalTime >= MIN_SECONDS_FOR_POINTS && saveStateRef.current === 'idle') void saveSession(next)
    }, 1000)
    return clearTimer
  }, [running, clearTimer, saveSession])

  function reset() {
    setRunning(false)
    clockRef.current = INITIAL_CLOCK
    setClock(INITIAL_CLOCK)
    activeSave.current = null
    publishSaveState('idle')
    clearTimer()
  }

  const circleScale =
    current.phase === 'inhale'
      ? 1 + ((PHASES[0].duration - countdown) / PHASES[0].duration) * 0.4
      : current.phase === 'exhale'
        ? 1.4 - ((PHASES[2].duration - countdown) / PHASES[2].duration) * 0.4
        : 1.4

  const circleColor =
    current.phase === 'inhale'
      ? 'rgba(93, 202, 165, 0.3)'
      : current.phase === 'hold'
        ? 'rgba(255, 179, 0, 0.3)'
        : 'rgba(255, 61, 0, 0.3)'

  const totalSessions = pastSessions.length
  const totalMinutes = pastSessions.reduce((s, p) => s + p.duration_seconds, 0) / 60

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-4 flex items-center gap-2">
        <Wind className="h-5 w-5 text-[#5DCAA5]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Respiration 4-7-8
        </h1>
      </div>
      <p className="mb-10 max-w-md text-center text-sm text-[var(--text-secondary)]">
        Une pratique guidée de respiration 4-7-8. Arrête si elle provoque un inconfort et reprends une respiration naturelle.
      </p>

      {/* Breath circle */}
      <div className="relative mb-10 flex h-64 w-64 items-center justify-center">
        <div
          className="absolute rounded-full transition-all duration-1000 ease-in-out"
          style={{
            width: `${circleScale * 180}px`,
            height: `${circleScale * 180}px`,
            background: `radial-gradient(circle, ${circleColor}, transparent 70%)`,
            boxShadow: `0 0 60px ${circleColor}`,
          }}
        />
        <div className="relative z-10 text-center">
          <p className="text-5xl font-bold tabular-nums text-white">{countdown}</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-secondary)]">
            {running ? current.label : 'Prêt ?'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setRunning(!running)}
          aria-label={running ? 'Mettre la respiration en pause' : 'Démarrer la respiration'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3D00] to-[#FFB300] text-[#070B18] shadow-lg transition-all active:scale-95"
        >
          {running ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
        </button>
        <button
          onClick={reset}
          aria-label="Réinitialiser la séance"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Session stats */}
      <div className="mt-10 grid grid-cols-2 gap-6 text-center">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-[#5DCAA5]">{cycles}</p>
          <p className="text-xs text-[var(--text-muted)]">Cycles</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-[#FFB300]">
            {Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, '0')}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Durée</p>
        </div>
      </div>

      {saved ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#5DCAA5]/10 px-4 py-2">
          <Trophy className="h-4 w-4 text-[#5DCAA5]" />
          <span className="text-sm font-medium text-[#5DCAA5]">
            Séance enregistrée
          </span>
        </div>
      ) : saveState === 'rejected' ? (
        <div role="status" className="mt-8 text-center text-sm">
          <p>La séance n’a pas pu être enregistrée.</p>
          <button type="button" className="mt-2 underline" onClick={() => void saveSession()}>
            Réessayer l’enregistrement
          </button>
        </div>
      ) : (
        <p role="status" className="mt-8 text-center text-xs text-[var(--text-muted)]">
          {saveState === 'unconfirmed'
            ? 'Enregistrement non confirmé. Actualise la page pour vérifier ton historique.'
            : saveState === 'saving'
              ? 'Enregistrement en cours…'
              : 'La séance sera enregistrée après 3 minutes de pratique'}
        </p>
      )}

      {/* Past sessions */}
      {totalSessions > 0 && (
        <div className="mt-10 w-full max-w-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Tes sessions</h2>
            <span className="text-xs text-[var(--text-muted)]">
              {totalSessions} session{totalSessions > 1 ? 's' : ''} · {Math.round(totalMinutes)}{' '}
              min au total
            </span>
          </div>
          {pastSessions.slice(0, 5).map((s) => (
            <div key={s.id} className="glass flex items-center justify-between rounded-xl p-3">
              <div>
                <p className="text-sm font-medium">
                  {s.cycles} cycle{s.cycles > 1 ? 's' : ''} ·{' '}
                  {Math.floor(s.duration_seconds / 60)}min
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {new Date(s.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className="text-xs font-medium text-[#5DCAA5]">Enregistrée</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
