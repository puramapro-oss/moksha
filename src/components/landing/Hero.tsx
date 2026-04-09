'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Flame, Zap, Shield, Sparkles } from 'lucide-react'

export default function Hero() {
  const t = useTranslations('hero')
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-lg"
        >
          <Flame className="h-4 w-4 text-[#FF6B35]" />
          <span>{t('badge')}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="h1-hero mx-auto max-w-4xl"
        >
          {t('title_1')}{' '}
          <span className="moksha-gradient-text">{t('title_highlight')}</span>{' '}
          {t('title_2')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/70 md:text-xl"
        >
          {t('subtitle')} <span className="text-white">{t('subtitle_emphasis')}</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/demarrer"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-8 py-4 text-base font-bold text-[#070B18] shadow-[0_0_40px_-5px_rgba(255,107,53,0.6)] transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <Flame className="h-5 w-5" />
            {t('cta_primary')}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="#comment"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-xl transition hover:bg-white/10"
          >
            {t('cta_secondary')} ▶
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#5DCAA5]" />
            <span>{t('trust_1')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#FFD700]" />
            <span>{t('trust_2')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF6B35]" />
            <span>{t('trust_3')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
