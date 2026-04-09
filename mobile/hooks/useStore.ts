import { create } from 'zustand'

type AppState = {
  introSeen: boolean
  setIntroSeen: (v: boolean) => void
  tutorialCompleted: boolean
  setTutorialCompleted: (v: boolean) => void
  theme: 'dark' | 'light'
  setTheme: (v: 'dark' | 'light') => void
}

export const useStore = create<AppState>((set) => ({
  introSeen: false,
  setIntroSeen: (v) => set({ introSeen: v }),
  tutorialCompleted: false,
  setTutorialCompleted: (v) => set({ tutorialCompleted: v }),
  theme: 'dark',
  setTheme: (v) => set({ theme: v }),
}))
