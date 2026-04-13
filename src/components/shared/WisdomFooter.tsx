'use client'

import { useState, useEffect } from 'react'
import { getWisdomQuote } from '@/lib/awakening'

export default function WisdomFooter() {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null)

  useEffect(() => {
    setQuote(getWisdomQuote())
    const interval = setInterval(() => setQuote(getWisdomQuote()), 30 * 60 * 1000) // 30min
    return () => clearInterval(interval)
  }, [])

  if (!quote) return null

  return (
    <div className="mt-8 border-t border-white/5 py-6 text-center">
      <p className="text-xs italic text-[var(--text-muted)]">
        &laquo; {quote.text} &raquo;
      </p>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">— {quote.author}</p>
    </div>
  )
}
