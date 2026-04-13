'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light' | 'oled'

type ThemeCtx = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('moksha-theme') as Theme | null
    if (stored && ['dark', 'light', 'oled'].includes(stored)) {
      setThemeState(stored)
      document.documentElement.setAttribute('data-theme', stored)
    }
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('moksha-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
