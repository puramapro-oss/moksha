'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Sparkles, ShieldCheck, Zap } from 'lucide-react'

export default function Hero() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-36 sm:pb-24 md:pt-40 md:pb-28 lg:pt-48 lg:pb-32">
      <div className="relative mx-auto w-full max-w-5xl px-6 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] text-white/75 backdrop-blur-xl sm:text-[13px]"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FFB300]" />
          <span className="truncate">{t('badge')}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="moksha-h1 mx-auto max-w-[22ch] text-balance text-white"
        >
          {t('title_1')}{' '}
          <span className="moksha-gradient-text">{t('title_highlight')}</span>{' '}
          {t('title_2')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
          className="mx-auto mt-5 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-white/65 sm:mt-6 sm:text-base md:text-lg"
        >
          {t('subtitle')} <span className="text-white/90">{t('subtitle_emphasis')}</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
        >
          <Link
            href="/demarrer"
            className="group relative inline-flex w-full max-w-xs items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-7 py-3.5 text-[15px] font-semibold text-[#070B18] shadow-[0_8px_40px_-10px_rgba(255, 61, 0,0.7)] transition hover:shadow-[0_12px_50px_-8px_rgba(255, 179, 0,0.6)] sm:w-auto"
          >
            {t('cta_primary')}
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="#comment"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-[15px] font-medium text-white/85 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] sm:w-auto"
          >
            {t('cta_secondary')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] text-white/45 sm:text-[13px]"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#5DCAA5]" />
            <span>{t('trust_1')}</span>
          </div>
          <span className="hidden h-1 w-1 rounded-full bg-white/15 sm:block" />
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#FFB300]" />
            <span>{t('trust_2')}</span>
          </div>
          <span className="hidden h-1 w-1 rounded-full bg-white/15 sm:block" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#FF3D00]" />
            <span>{t('trust_3')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
