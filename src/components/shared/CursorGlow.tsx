'use client'

import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Only on desktop with hover support
    if (!window.matchMedia('(hover: hover)').matches) {
      el.style.display = 'none'
      return
    }

    function move(e: MouseEvent) {
      if (el) {
        el.style.left = `${e.clientX}px`
        el.style.top = `${e.clientY}px`
      }
    }

    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return <div ref={ref} className="cursor-glow" />
}
