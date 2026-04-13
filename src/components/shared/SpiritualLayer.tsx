'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { getAffirmation } from '@/lib/awakening'
import { useAwakening } from '@/hooks/useAwakening'

export default function SpiritualLayer() {
  const { showAffirmation, dismissAffirmation, addXp } = useAwakening()
  const [affirmation, setAffirmation] = useState<{ text: string; category: string } | null>(null)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (showAffirmation) {
      setAffirmation(getAffirmation())
      requestAnimationFrame(() => setAnimate(true))
    }
  }, [showAffirmation])

  if (!showAffirmation || !affirmation) return null

  function handleAccept() {
    addXp(10)
    setAnimate(false)
    setTimeout(dismissAffirmation, 300)
  }

  function handleDismiss() {
    setAnimate(false)
    setTimeout(dismissAffirmation, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        animate ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`relative mx-4 max-w-md rounded-3xl border border-white/10 bg-[var(--bg-nebula)]/95 p-8 text-center backdrop-blur-2xl shadow-[0_0_80px_rgba(255,107,53,0.15)] transition-all duration-500 ${
          animate ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-1 text-white/30 transition hover:text-white/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FFD700]/20">
            <Sparkles className="h-8 w-8 text-[#FFD700]" />
          </div>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#FFD700]/60">
          Ton affirmation du jour
        </p>

        <p className="mb-8 font-[family-name:var(--font-display)] text-xl font-bold leading-relaxed text-white/90">
          &laquo; {affirmation.text} &raquo;
        </p>

        <button
          onClick={handleAccept}
          className="magnetic-btn w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-3.5 text-sm font-bold text-[#070B18] transition-all"
        >
          J&apos;int&egrave;gre ✨
        </button>
      </div>
    </div>
  )
}
