'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getAffirmation } from '@/lib/awakening'

const STORAGE_KEY = 'moksha-welcome-claimed'

export default function WelcomeBonus() {
  const { user, profile } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [awarded, setAwarded] = useState<number | null>(null)
  const [affirmation, setAffirmation] = useState<{ text: string; category: string } | null>(null)

  useEffect(() => {
    if (!user || !profile) return
    if (!pathname?.startsWith('/dashboard')) return

    // Client-side guard to avoid repeated API calls per session
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1') return

    // Check server state
    fetch('/api/points/welcome-bonus')
      .then((r) => r.json())
      .then((data) => {
        if (data.received) {
          localStorage.setItem(STORAGE_KEY, '1')
          return
        }
        setAffirmation(getAffirmation())
        setTimeout(() => setOpen(true), 800)
      })
      .catch(() => {})
  }, [user, profile, pathname])

  async function claim() {
    setLoading(true)
    try {
      const res = await fetch('/api/points/welcome-bonus', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.awarded) {
        setAwarded(data.awarded)
        setClaimed(true)
        localStorage.setItem(STORAGE_KEY, '1')
      } else if (data.already) {
        localStorage.setItem(STORAGE_KEY, '1')
        setOpen(false)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function close() {
    setOpen(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  if (!open || !affirmation) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="glass relative w-full max-w-md space-y-5 p-7 text-center">
        {/* Icon glow */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.4)]">
          <Sparkles className="h-8 w-8 text-[#070B18]" />
        </div>

        {!claimed ? (
          <>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#FFD700]">Bienvenue chez toi</p>
              <h2
                className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {profile?.full_name?.split(' ')[0] || 'Entrepreneur'}
              </h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm italic text-white/80">&laquo; {affirmation.text} &raquo;</p>
            </div>

            <button
              onClick={claim}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-3 text-sm font-bold text-[#070B18] transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Un instant...' : 'Recevoir mes 100 points de départ'}
            </button>

            <button
              onClick={close}
              className="text-[10px] text-white/30 hover:text-white/60"
            >
              Passer
            </button>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#5DCAA5]">Accueilli</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#FFD700]">
                +{awarded} points
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Tu vois ? Tu es capable de tout. C&apos;est parti.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#5DCAA5]/10 py-2">
              <Star className="h-4 w-4 text-[#FFD700]" />
              <span className="text-xs text-[#5DCAA5]">Crédités sur ton compte</span>
            </div>

            <button
              onClick={close}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Explorer MOKSHA
            </button>
          </>
        )}
      </div>
    </div>
  )
}
