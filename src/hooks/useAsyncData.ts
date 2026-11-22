'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Loader<T> = () => Promise<T>
type Result<T> = { loader: Loader<T>; data: T | null; error: unknown }

/** Receive external data; only the latest active request may publish its result. */
export function useAsyncData<T>(loader: Loader<T>) {
  const [result, setResult] = useState<Result<T> | null>(null)
  const active = useRef(false)
  const generation = useRef<symbol | null>(null)

  const refresh = useCallback(() => {
    if (!active.current) return Promise.resolve()
    const request = Symbol()
    generation.current = request
    return loader().then(
      (data) => {
        if (active.current && generation.current === request) setResult({ loader, data, error: null })
      },
      (error: unknown) => {
        if (!active.current || generation.current !== request) return
        setResult((previous) => ({ loader, data: previous?.loader === loader ? previous.data : null, error }))
      },
    )
  }, [loader])

  useEffect(() => {
    active.current = true
    void refresh()
    return () => {
      active.current = false
      generation.current = null
    }
  }, [refresh])

  // A changed loader (for example a different account) cannot display old data,
  // even in the render before the previous effect has been cleaned up.
  const current = result?.loader === loader ? result : null
  return { data: current?.data ?? null, error: current?.error ?? null, loading: current === null, refresh }
}
