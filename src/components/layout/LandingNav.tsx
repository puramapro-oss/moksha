'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Logo from '@/components/shared/Logo'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-2xl border-b border-white/5 bg-[#070B18]/80' : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-white/70 transition hover:text-white">Fonctionnalités</a>
          <a href="#comment" className="text-sm text-white/70 transition hover:text-white">Comment ça marche</a>
          <a href="#pricing" className="text-sm text-white/70 transition hover:text-white">Tarifs</a>
          <a href="#faq" className="text-sm text-white/70 transition hover:text-white">FAQ</a>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth" className="text-sm text-white/80 transition hover:text-white">Se connecter</Link>
          <Link
            href="/demarrer"
            className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-semibold text-[#070B18] transition hover:opacity-95"
          >
            Démarrer →
          </Link>
        </div>
        <button
          aria-label="Menu"
          className="md:hidden"
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
      {open && (
        <div className="border-t border-white/5 bg-[#070B18] md:hidden">
          <div className="flex flex-col gap-4 p-6">
            <a href="#features" onClick={() => setOpen(false)} className="text-white/80">Fonctionnalités</a>
            <a href="#comment" onClick={() => setOpen(false)} className="text-white/80">Comment ça marche</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-white/80">Tarifs</a>
            <a href="#faq" onClick={() => setOpen(false)} className="text-white/80">FAQ</a>
            <Link href="/auth" onClick={() => setOpen(false)} className="text-white/80">Se connecter</Link>
            <Link
              href="/demarrer"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-3 text-center font-semibold text-[#070B18]"
            >
              Démarrer →
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
