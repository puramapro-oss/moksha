'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check, AlertCircle, ShieldCheck, Building2, MapPin, Hash } from 'lucide-react'
import { isValidSiret, formatSiret, type EtablissementInfo } from '@/lib/insee'

type LookupState =
  | { kind: 'idle' }
  | { kind: 'invalid' }
  | { kind: 'loading' }
  | { kind: 'success'; info: EtablissementInfo }
  | { kind: 'error'; message: string; httpStatus?: number }

type Props = {
  /** Valeur SIRET initiale (prefill, ex: reprise wizard). */
  defaultValue?: string
  /** Appelé quand un établissement est trouvé. */
  onResolved?: (info: EtablissementInfo) => void
  /** Appelé quand l'utilisateur efface le champ. */
  onClear?: () => void
  /** Label du champ (default "SIRET de ton entreprise"). */
  label?: string
  /** Texte d'aide sous le champ. */
  helper?: string
  /** Désactive l'auto-format visuel (groupe par 3-3-3-5). */
  disableFormatting?: boolean
}

function formatVisual(s: string): string {
  // 14 chiffres → "XXX XXX XXX XXXXX"
  const d = formatSiret(s)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`
}

export default function SiretLookup({
  defaultValue = '',
  onResolved,
  onClear,
  label = 'SIRET de ton entreprise',
  helper = '14 chiffres — vérification automatique au répertoire INSEE Sirene',
  disableFormatting = false,
}: Props) {
  const [raw, setRaw] = useState(defaultValue)
  const [state, setState] = useState<LookupState>({ kind: 'idle' })

  const lookup = useCallback(async (siret: string) => {
    setState({ kind: 'loading' })
    try {
      const res = await fetch(`/api/siret/${encodeURIComponent(siret)}`)
      const json = (await res.json()) as
        | { ok: true; etablissement: EtablissementInfo }
        | { ok: false; error: string; message: string }
      if (res.ok && 'etablissement' in json) {
        setState({ kind: 'success', info: json.etablissement })
        onResolved?.(json.etablissement)
      } else if ('message' in json) {
        setState({ kind: 'error', message: json.message, httpStatus: res.status })
      } else {
        setState({ kind: 'error', message: 'Erreur inconnue', httpStatus: res.status })
      }
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Connexion impossible',
      })
    }
  }, [onResolved])

  useEffect(() => {
    const digits = formatSiret(raw)
    if (!digits) {
      setState({ kind: 'idle' })
      return
    }
    if (digits.length < 14) {
      setState({ kind: 'idle' })
      return
    }
    if (!isValidSiret(digits)) {
      setState({ kind: 'invalid' })
      return
    }
    const timeout = setTimeout(() => {
      void lookup(digits)
    }, 500)
    return () => clearTimeout(timeout)
  }, [raw, lookup])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRaw(value)
    if (formatSiret(value).length === 0) onClear?.()
  }

  const display = disableFormatting ? raw : formatVisual(raw)
  const digits = formatSiret(raw)
  const stateForBorder = (() => {
    if (state.kind === 'success') return 'border-emerald-500/60 ring-1 ring-emerald-500/30'
    if (state.kind === 'invalid' || state.kind === 'error') return 'border-amber-500/60 ring-1 ring-amber-500/20'
    return 'border-white/10 focus-within:border-[#FF6B35]/60 focus-within:ring-1 focus-within:ring-[#FF6B35]/30'
  })()

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/80">{label}</label>

      <div className={`relative flex items-center rounded-xl border bg-white/5 transition ${stateForBorder}`}>
        <Hash className="pointer-events-none absolute left-4 h-4 w-4 text-white/40" />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          placeholder="123 456 789 00012"
          maxLength={disableFormatting ? 14 : 17}
          className="w-full rounded-xl bg-transparent py-3 pl-11 pr-12 font-mono text-sm tracking-wider tabular-nums outline-none placeholder:text-white/30"
          aria-invalid={state.kind === 'invalid' || state.kind === 'error'}
          aria-describedby="siret-helper"
        />
        <div className="absolute right-4">
          {state.kind === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
          {state.kind === 'success' && <Check className="h-4 w-4 text-emerald-400" />}
          {(state.kind === 'invalid' || state.kind === 'error') && (
            <AlertCircle className="h-4 w-4 text-amber-400" />
          )}
        </div>
      </div>

      <p id="siret-helper" className="text-xs text-white/50">
        {helper} · <span className="font-mono">{digits.length}/14</span>
      </p>

      {state.kind === 'invalid' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <span className="font-semibold">SIRET invalide.</span> Vérifie les 14 chiffres — la clé Luhn (dernier chiffre) ne correspond pas. Astuce : recopie depuis ton K-bis pour éviter les erreurs.
        </div>
      )}

      {state.kind === 'error' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <span className="font-semibold">
            {state.httpStatus === 404 && 'Aucun établissement trouvé. '}
            {state.httpStatus === 429 && 'Trop de requêtes vers INSEE. '}
            {state.httpStatus === 502 && 'Service INSEE indisponible. '}
            {!state.httpStatus && 'Connexion impossible. '}
          </span>
          {state.message}
        </div>
      )}

      {state.kind === 'success' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span className="font-display text-sm font-semibold text-white">
                {state.info.denomination}
              </span>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300"
              title={state.info.source === 'insee' ? 'Source officielle INSEE Sirene' : 'Source recherche-entreprises.api.gouv.fr'}
            >
              <ShieldCheck className="h-3 w-3" />
              {state.info.source === 'insee' ? 'Vérifié INSEE' : 'Vérifié gouv'}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <dt className="text-white/50">SIREN</dt>
            <dd className="font-mono text-white/80">{state.info.siren}</dd>
            <dt className="text-white/50">Forme juridique</dt>
            <dd className="text-white/80">{state.info.forme_juridique}</dd>
            <dt className="text-white/50">Code NAF</dt>
            <dd className="font-mono text-white/80">{state.info.code_naf || '—'}</dd>
            <dt className="text-white/50">État</dt>
            <dd>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  state.info.etat === 'A'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {state.info.etat === 'A' ? 'Actif' : 'Fermé'}
              </span>
            </dd>
            {state.info.date_creation && (
              <>
                <dt className="text-white/50">Créée le</dt>
                <dd className="text-white/80">
                  {new Date(state.info.date_creation).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </dd>
              </>
            )}
          </dl>
          {state.info.adresse.line && (
            <div className="mt-3 flex items-start gap-2 border-t border-emerald-500/20 pt-3 text-xs text-white/70">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
              <span>{state.info.adresse.line}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
