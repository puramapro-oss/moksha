'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAwakeningLevel } from '@/lib/awakening'

export function useAwakening() {
  const [xp, setXp] = useState(0)
  const [showAffirmation, setShowAffirmation] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('moksha-awakening-xp')
    if (stored) setXp(parseInt(stored, 10))

    // Show affirmation once per session
    const seen = sessionStorage.getItem('moksha-affirmation-seen')
    if (!seen) setShowAffirmation(true)
  }, [])

  const addXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount
      localStorage.setItem('moksha-awakening-xp', String(next))
      return next
    })
  }, [])

  const dismissAffirmation = useCallback(() => {
    setShowAffirmation(false)
    sessionStorage.setItem('moksha-affirmation-seen', '1')
  }, [])

  const level = getAwakeningLevel(xp)

  return { xp, level, addXp, showAffirmation, dismissAffirmation }
}
