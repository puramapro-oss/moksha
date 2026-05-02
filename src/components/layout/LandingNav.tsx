'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Logo from '@/components/shared/Logo'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'

export default function LandingNav() {
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/5 bg-[#070B18]/85 backdrop-blur-2xl'
          : 'border-transparent bg-[#070B18]/55 backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-white/70 transition hover:text-white">{t('features')}</a>
          <a href="#comment" className="text-sm text-white/70 transition hover:text-white">{t('how')}</a>
          <a href="#pricing" className="text-sm text-white/70 transition hover:text-white">{t('pricing')}</a>
          <a href="#faq" className="text-sm text-white/70 transition hover:text-white">{t('faq')}</a>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link href="/auth" className="text-sm text-white/80 transition hover:text-white">{t('login')}</Link>
          <Link
            href="/demarrer"
            className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-2.5 text-sm font-semibold text-[#070B18] transition hover:opacity-95"
          >
            {t('start')} →
          </Link>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/5 bg-[#070B18] md:hidden">
          <div className="flex flex-col gap-4 p-6">
            <a href="#features" onClick={() => setOpen(false)} className="text-white/80">{t('features')}</a>
            <a href="#comment" onClick={() => setOpen(false)} className="text-white/80">{t('how')}</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-white/80">{t('pricing')}</a>
            <a href="#faq" onClick={() => setOpen(false)} className="text-white/80">{t('faq')}</a>
            <Link href="/auth" onClick={() => setOpen(false)} className="text-white/80">{t('login')}</Link>
            <Link
              href="/demarrer"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-3 text-center font-semibold text-[#070B18]"
            >
              {t('start')} →
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
