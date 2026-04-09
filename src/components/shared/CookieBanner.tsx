'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('moksha_cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('moksha_cookie_consent', 'accepted')
    setVisible(false)
  }

  function refuse() {
    localStorage.setItem('moksha_cookie_consent', 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[999] p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-[#0D1225]/95 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">Ce site utilise des cookies</p>
          <p className="mt-1 text-xs text-white/50">
            Nous utilisons des cookies essentiels et analytiques pour améliorer ton expérience.{' '}
            <Link href="/politique-cookies" className="text-[#FF6B35] underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={refuse}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/5"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-4 py-2 text-xs font-bold text-[#070B18]"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
