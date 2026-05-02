'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Sparkles, ShieldCheck, Zap, Globe2 } from 'lucide-react'
import Logo from '@/components/shared/Logo'

// Particles léger, lazy + ssr:false (pas de WebGL côté serveur)
const FireParticles = dynamic(() => import('./FireParticles'), { ssr: false })

export default function AppEntrance() {
  const t = useTranslations('hero')

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-24 sm:py-32">
      {/* Background layers — CSS pur + tsParticles léger */}
      <div className="moksha-mesh-bg" aria-hidden="true" />
      <FireParticles />

      {/* Halo conique derrière le hero */}
      <div className="moksha-halo" aria-hidden="true" />

      {/* Logo centered top */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-10 sm:mb-14"
      >
        <Logo size="lg" />
      </motion.div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="moksha-eyebrow-chip mb-7"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FFB300]" />
          <span>{t('badge')}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="moksha-h1 max-w-[18ch] text-balance"
          style={{ fontSize: 'clamp(2.4rem, 5.8vw + 0.4rem, 4.5rem)' }}
        >
          {t('title_1')}{' '}
          <span className="moksha-gradient-text">{t('title_highlight')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-6 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-white/65 sm:text-base md:text-lg"
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:mt-11 sm:flex-row sm:gap-4"
        >
          <Link
            href="/demarrer"
            className="moksha-btn-primary w-full max-w-xs sm:w-auto"
            aria-label={t('cta_primary')}
          >
            <span>{t('cta_primary')}</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/auth"
            className="moksha-btn-secondary w-full max-w-xs sm:w-auto"
            aria-label={t('cta_secondary')}
          >
            {t('cta_secondary')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="moksha-trust-strip mt-10 sm:mt-12"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#5DCAA5]" />
            {t('trust_1')}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#FFB300]" />
            {t('trust_2')}
          </span>
          <span className="flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-[#FF6B00]" />
            {t('trust_3')}
          </span>
        </motion.div>
      </div>
    </section>
  )
}
