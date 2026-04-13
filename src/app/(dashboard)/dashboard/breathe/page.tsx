'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Wind, Play, Pause, RotateCcw } from 'lucide-react'

type Phase = 'inhale' | 'hold' | 'exhale'

const PHASES: { phase: Phase; duration: number; label: string }[] = [
  { phase: 'inhale', duration: 4, label: 'Inspire' },
  { phase: 'hold', duration: 7, label: 'Retiens' },
  { phase: 'exhale', duration: 8, label: 'Expire' },
]

export default function BreathePage() {
  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [countdown, setCountdown] = useState(4)
  const [cycles, setCycles] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = PHASES[phaseIndex]

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (!running) { clearTimer(); return }

    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPhaseIndex((pi) => {
            const next = (pi + 1) % 3
            if (next === 0) setCycles((cy) => cy + 1)
            return next
          })
          // Return next phase duration
          const nextPhase = PHASES[(phaseIndex + 1) % 3]
          return nextPhase.duration
        }
        return c - 1
      })
      setTotalTime((t) => t + 1)
    }, 1000)

    return clearTimer
  }, [running, phaseIndex, clearTimer])

  function reset() {
    setRunning(false)
    setPhaseIndex(0)
    setCountdown(4)
    setCycles(0)
    setTotalTime(0)
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
        ? 'rgba(255, 215, 0, 0.3)'
        : 'rgba(255, 107, 53, 0.3)'

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-4 flex items-center gap-2">
        <Wind className="h-5 w-5 text-[#5DCAA5]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Respiration 4-7-8
        </h1>
      </div>
      <p className="mb-10 max-w-md text-center text-sm text-[var(--text-secondary)]">
        Cette technique de respiration calme le mental et recentre l&apos;énergie.
        Idéal avant une décision importante.
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
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18] shadow-lg transition-all active:scale-95"
        >
          {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </button>
        <button
          onClick={reset}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-6 text-center">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-[#5DCAA5]">{cycles}</p>
          <p className="text-xs text-[var(--text-muted)]">Cycles</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-[#FFD700]">{Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, '0')}</p>
          <p className="text-xs text-[var(--text-muted)]">Durée</p>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        +50 points après 3 minutes de pratique
      </p>
    </div>
  )
}
