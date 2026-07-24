'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAwakeningLevel } from '@/lib/awakening'

export function useAwakening() {
  const [xp, setXp] = useState(() => {
    const stored = localStorage.getItem('moksha-awakening-xp')
    return stored ? parseInt(stored, 10) : 0
  })
  const [showAffirmation, setShowAffirmation] = useState(() => {
    const seen = sessionStorage.getItem('moksha-affirmation-seen')
    return !seen
  })

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
