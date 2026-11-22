'use client'

import { useCallback, useSyncExternalStore } from 'react'

const serverSnapshot = () => undefined

/** The server has no sessionStorage; the form mounts after its draft is known. */
export function useStoredDraft(key: string) {
  const read = useCallback(() => {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  }, [key])
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) notify()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])
  return useSyncExternalStore(subscribe, read, serverSnapshot)
}
