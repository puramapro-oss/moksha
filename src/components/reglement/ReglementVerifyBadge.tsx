'use client'

import { useState } from 'react'
import { ShieldCheck, Loader2, Clock, ExternalLink, AlertCircle } from 'lucide-react'

type StampStatus = 'confirmed' | 'pending_anchor' | 'legacy_tezos' | 'unstamped'

type Props = {
  reglementId: string
  stampStatus: StampStatus
  bitcoinBlockHeight: number | null
  bitcoinBlockTimestamp: string | null
  legacyProofUrl: string | null
}

export default function ReglementVerifyBadge({
  reglementId,
  stampStatus,
  bitcoinBlockHeight,
  bitcoinBlockTimestamp,
  legacyProofUrl,
}: Props) {
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<
    | null
    | { ok: true; verified: boolean; bitcoinBlockHeight?: number; bitcoinBlockTimestamp?: string; pending: boolean; upgradedNow: boolean }
    | { ok: false; error: string }
  >(null)

  const handleVerify = async () => {
    setVerifying(true)
    setResult(null)
    try {
      const res = await fetch(`/api/reglement/verify/${encodeURIComponent(reglementId)}`)
      const json = (await res.json()) as Record<string, unknown>
      if (!res.ok || json.ok === false) {
        setResult({ ok: false, error: typeof json.error === 'string' ? json.error : 'Vérification impossible' })
      } else {
        setResult({
          ok: true,
          verified: json.verified === true,
          bitcoinBlockHeight: typeof json.bitcoin_block_height === 'number' ? json.bitcoin_block_height : undefined,
          bitcoinBlockTimestamp: typeof json.bitcoin_block_timestamp === 'string' ? json.bitcoin_block_timestamp : undefined,
          pending: json.pending_upgrade === true || json.stamp_status === 'pending_anchor',
          upgradedNow: json.upgraded_now === true,
        })
      }
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'Connexion impossible' })
    } finally {
      setVerifying(false)
    }
  }

  if (stampStatus === 'unstamped') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/50">
        <AlertCircle className="h-3 w-3" /> Non horodaté
      </span>
    )
  }

  if (stampStatus === 'legacy_tezos' && legacyProofUrl) {
    return (
      <a
        href={legacyProofUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/10"
        title="Preuve historique Tezos (avant migration V7.1)"
      >
        <ShieldCheck className="h-3 w-3" /> Preuve historique <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleVerify}
        disabled={verifying}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
          stampStatus === 'confirmed'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
        }`}
      >
        {verifying ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : stampStatus === 'confirmed' ? (
          <ShieldCheck className="h-3 w-3" />
        ) : (
          <Clock className="h-3 w-3" />
        )}
        {stampStatus === 'confirmed' ? 'Preuve blockchain Purama' : 'Ancrage en cours'}
      </button>

      {!result && stampStatus === 'confirmed' && bitcoinBlockHeight && (
        <span className="text-[10px] text-white/40">
          bloc #{bitcoinBlockHeight.toLocaleString('fr-FR')}
          {bitcoinBlockTimestamp &&
            ` · ${new Date(bitcoinBlockTimestamp).toLocaleDateString('fr-FR')}`}
        </span>
      )}
      {!result && stampStatus === 'pending_anchor' && (
        <span className="text-[10px] text-amber-200/70">
          Finalisation ~1-2h après publication
        </span>
      )}

      {result && result.ok && result.verified && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-200">
          ✓ Preuve vérifiée
          {result.bitcoinBlockHeight &&
            ` — bloc #${result.bitcoinBlockHeight.toLocaleString('fr-FR')}`}
          {result.bitcoinBlockTimestamp &&
            ` · ${new Date(result.bitcoinBlockTimestamp).toLocaleString('fr-FR')}`}
          {result.upgradedNow && <span className="ml-1 text-[10px] opacity-70">(ancrage finalisé à l&apos;instant)</span>}
        </div>
      )}
      {result && result.ok && !result.verified && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200">
          {result.pending
            ? 'Preuve enregistrée, ancrage blockchain en cours (~1-2h).'
            : 'Vérification incomplète — réessaie plus tard.'}
        </div>
      )}
      {result && !result.ok && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[11px] text-red-200">
          {result.error}
        </div>
      )}
    </div>
  )
}
