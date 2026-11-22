'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import type { WizardData } from './WizardEntreprise'

type AdresseResult = { label: string; street: string; city: string; postcode: string }

export default function StepSiege({
  data,
  update,
}: {
  data: WizardData
  update: (p: Partial<WizardData>) => void
}) {
  const [query, setQuery] = useState(data.adresse)
  const [response, setResponse] = useState<{ query: string; results: AdresseResult[]; error: boolean } | null>(null)
  const [pendingQuery, setPendingQuery] = useState<string | null>(null)
  const current = query.length >= 3 && response?.query === query ? response : null
  const results = current?.results ?? []
  const loading = query.length >= 3 && pendingQuery === query
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (query.length < 3) return
    let active = true
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setPendingQuery(query)
      try {
        const res = await fetch(`/api/adresse?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (!res.ok) throw new Error('Recherche indisponible')
        const json = (await res.json()) as { results?: AdresseResult[] }
        if (active) setResponse({ query, results: json.results ?? [], error: false })
      } catch {
        if (active) setResponse({ query, results: [], error: true })
      } finally {
        if (active) setPendingQuery(null)
      }
    }, 350)
    return () => {
      active = false
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  return (
    <div>
      <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Où sera le siège social ?
      </h2>
      <p className="mb-8 text-sm text-white/60">L&apos;adresse officielle de ton entreprise. Tu peux la domicilier chez toi.</p>

      <div className="space-y-5">
        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-white/80">Adresse du siège *</label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                update({ adresse: e.target.value })
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder="8 rue de la Chapelle, Frasne"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-10 text-sm outline-none focus:border-[#FF3D00]/60 focus:ring-1 focus:ring-[#FF3D00]/30"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />}
          </div>
          {current?.error && <p role="alert" className="mt-2 text-xs text-amber-300">Recherche indisponible. Tu peux saisir ton adresse complète.</p>}
          {focused && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0D1225] shadow-2xl">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(r.label)
                    update({ adresse: r.label })
                    setResponse(null)
                    setFocused(false)
                  }}
                  className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/5 last:border-0"
                >
                  <div className="font-medium">{r.street || r.label}</div>
                  <div className="text-xs text-white/50">{r.postcode} {r.city}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Type de local *</label>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { id: 'domicile', label: 'Domicile du dirigeant', icon: '🏠' },
              { id: 'commercial', label: 'Local commercial', icon: '🏢' },
              { id: 'coworking', label: 'Coworking / Domiciliation', icon: '💼' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ type_local: t.id })}
                className={`rounded-xl border p-4 text-center text-sm transition ${
                  data.type_local === t.id
                    ? 'border-[#FF3D00]/60 bg-[#FF3D00]/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="mb-1 text-2xl">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
