'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Flame } from 'lucide-react'

const STORAGE_KEY = 'moksha_intro_seen'
const DURATION_MS = 3600

export default function CinematicIntro() {
  const t = useTranslations('intro')
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY)
      if (!seen) {
        setVisible(true)
        document.body.style.overflow = 'hidden'
        const t = window.setTimeout(() => close(), DURATION_MS)
        return () => window.clearTimeout(t)
      }
    } catch {
      // SSR / private mode → skip
    }
  }, [])

  function close() {
    setVisible(false)
    document.body.style.overflow = ''
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="moksha-intro"
          data-testid="cinematic-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#070B18]"
        >
          {/* aurora bg */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.45 }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0"
            aria-hidden
          >
            <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,#FF3D00_0%,transparent_60%)] blur-3xl" />
            <div className="absolute left-[40%] top-[40%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,#FFB300_0%,transparent_55%)] opacity-70 blur-3xl" />
            <div className="absolute right-[20%] top-[55%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,#5DCAA5_0%,transparent_55%)] opacity-50 blur-3xl" />
          </motion.div>

          {/* particles ring */}
          <motion.div
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 360, opacity: 1 }}
            transition={{ rotate: { duration: 14, ease: 'linear', repeat: Infinity }, opacity: { duration: 0.8 } }}
            className="absolute h-[480px] w-[480px] rounded-full border border-white/[0.06]"
            aria-hidden
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF3D00] to-[#FFB300] shadow-[0_0_20px_#FF3D00]"
                style={{ transform: `rotate(${i * 30}deg) translateY(-240px)` }}
              />
            ))}
          </motion.div>

          {/* content */}
          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
              className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF3D00] to-[#FFB300] shadow-[0_0_80px_-10px_rgba(255, 61, 0,0.8)]"
            >
              <Flame className="h-12 w-12 text-[#070B18]" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              MOKSHA
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.0 }}
              className="bg-gradient-to-r from-[#FF3D00] via-[#FFB300] to-[#5DCAA5] bg-clip-text text-xl font-bold text-transparent sm:text-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('tagline')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.4 }}
              className="mt-2 max-w-md text-base text-white/70 sm:text-lg"
            >
              {t('subtagline')}
            </motion.p>

            <motion.button
              type="button"
              onClick={close}
              data-testid="intro-skip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 2.0 }}
              className="mt-12 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm text-white/80 backdrop-blur-lg transition hover:bg-white/10"
            >
              {t('skip')} →
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
