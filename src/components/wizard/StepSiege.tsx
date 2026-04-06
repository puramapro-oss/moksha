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
  const [results, setResults] = useState<AdresseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (query.length < 3) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/adresse?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const json = await res.json()
          setResults(json.results || [])
        }
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(t)
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
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-10 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />}
          </div>
          {focused && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0D1225] shadow-2xl">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(r.label)
                    update({ adresse: r.label })
                    setResults([])
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
                    ? 'border-[#FF6B35]/60 bg-[#FF6B35]/10'
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
