'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Globe, Check } from 'lucide-react'
import { locales, localeMeta, type Locale } from '@/i18n/config'
import { setLocale } from '@/i18n/actions'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const current = useLocale() as Locale
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const change = (loc: Locale) => {
    startTransition(async () => {
      await setLocale(loc)
      setOpen(false)
    })
  }

  const meta = localeMeta[current]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('language')}
        aria-expanded={open}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 backdrop-blur-lg transition hover:bg-white/10 disabled:opacity-50"
      >
        <Globe className="h-4 w-4" />
        <span aria-hidden>{meta.flag}</span>
        {!compact && <span className="hidden sm:inline">{meta.native}</span>}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-[1100] mt-2 max-h-[60vh] w-56 overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1225]/95 p-1 shadow-2xl backdrop-blur-2xl"
        >
          {locales.map((loc) => {
            const m = localeMeta[loc]
            const active = loc === current
            return (
              <button
                key={loc}
                role="option"
                aria-selected={active}
                onClick={() => change(loc)}
                disabled={pending}
                data-testid={`lang-${loc}`}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active ? 'bg-gradient-to-r from-[#FF3D00]/20 to-[#FFB300]/10 text-white' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span aria-hidden className="text-base">{m.flag}</span>
                  <span>{m.native}</span>
                </span>
                {active && <Check className="h-4 w-4 text-[#5DCAA5]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
