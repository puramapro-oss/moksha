'use client'

import { useEffect, useState, useCallback } from 'react'
import { Share2, Building2, FileSignature, X, Copy, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { MokshaDocument } from '@/types'

type Share = {
  token: string
  expire: string
  audience: 'banque' | 'auditeur' | 'partenaire'
  docs: Array<{ id: string; nom: string }>
}

export default function PartagePage() {
  const { profile, plan } = useAuth()
  const supabase = createClient()
  const [docs, setDocs] = useState<MokshaDocument[]>([])
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState<null | 'banque' | 'auditeur' | 'partenaire'>(null)

  const load = useCallback(async () => {
    if (!profile?.id) return
    const [docsRes, sharesRes] = await Promise.all([
      supabase.from('moksha_documents').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      fetch('/api/partage').then((r) => (r.ok ? r.json() : { shares: [] })),
    ])
    setDocs((docsRes.data as MokshaDocument[]) || [])
    setShares(sharesRes.shares || [])
    setLoading(false)
  }, [profile?.id, supabase])

  useEffect(() => {
    load()
  }, [load])

  if (plan !== 'pro') {
    return (
      <div className="space-y-6">
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <Share2 className="h-6 w-6 text-[#FFD700]" /> Partage
        </h1>
        <div className="glass space-y-3 p-8 text-center">
          <p className="text-sm text-white/70">
            La fonctionnalité <strong>Partage banque & auditeur</strong> est réservée au plan <strong>Pro</strong>.
          </p>
          <a
            href="/paiement?plan=pro_mensuel"
            className="inline-block rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18]"
          >
            Passer au plan Pro
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <Share2 className="h-6 w-6 text-[#FFD700]" /> Partage sécurisé
        </h1>
        <p className="mt-1 text-sm text-white/60">Génère des liens temporaires pour ta banque, ton auditeur ou tes partenaires.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => setOpenModal('banque')}
          className="glass glass-hover p-6 text-left"
        >
          <Building2 className="mb-3 h-7 w-7 text-[#5DCAA5]" />
          <h3 className="font-semibold">Dossier banque</h3>
          <p className="mt-1 text-xs text-white/50">Statuts + Kbis + bénéficiaires en 1 clic.</p>
        </button>
        <button
          onClick={() => setOpenModal('auditeur')}
          className="glass glass-hover p-6 text-left"
        >
          <FileSignature className="mb-3 h-7 w-7 text-[#FFD700]" />
          <h3 className="font-semibold">Lien auditeur</h3>
          <p className="mt-1 text-xs text-white/50">Comptable, expert, contrôle fiscal.</p>
        </button>
        <button
          onClick={() => setOpenModal('partenaire')}
          className="glass glass-hover p-6 text-left"
        >
          <Share2 className="mb-3 h-7 w-7 text-[#FF6B35]" />
          <h3 className="font-semibold">Partenaire</h3>
          <p className="mt-1 text-xs text-white/50">Investisseur, fournisseur, client.</p>
        </button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Liens actifs</h2>
        {loading ? (
          <div className="skeleton h-32 rounded-2xl" />
        ) : shares.length === 0 ? (
          <div className="glass p-6 text-center text-xs text-white/50">Aucun lien actif.</div>
        ) : (
          <div className="space-y-2">
            {shares.map((s) => (
              <ShareRow key={s.token} share={s} onRevoked={load} />
            ))}
          </div>
        )}
      </div>

      {openModal && (
        <CreateShareModal
          audience={openModal}
          docs={docs}
          onClose={() => setOpenModal(null)}
          onCreated={() => {
            setOpenModal(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function ShareRow({ share, onRevoked }: { share: Share; onRevoked: () => void }) {
  const [copied, setCopied] = useState(false)
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/partage/${share.token}`

  async function revoke() {
    if (!confirm('Révoquer ce lien ?')) return
    const r = await fetch(`/api/partage?token=${share.token}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Lien révoqué')
      onRevoked()
    }
  }

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Lien copié')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="glass p-4 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-[#FF6B35]/15 px-2 py-0.5 text-[10px] uppercase text-[#FF6B35]">{share.audience}</span>
        <span className="text-[10px] text-white/40">expire le {new Date(share.expire).toLocaleDateString('fr-FR')}</span>
      </div>
      <p className="text-[11px] text-white/60">
        {share.docs.length} document{share.docs.length > 1 ? 's' : ''} • {share.docs.map((d) => d.nom).join(', ')}
      </p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px]"
        />
        <button
          onClick={copy}
          className="rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-3 text-[#070B18]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <button onClick={revoke} className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function CreateShareModal({
  audience,
  docs,
  onClose,
  onCreated,
}: {
  audience: 'banque' | 'auditeur' | 'partenaire'
  docs: MokshaDocument[]
  onClose: () => void
  onCreated: () => void
}) {
  const [selected, setSelected] = useState<string[]>(() => {
    if (audience === 'banque') return docs.filter((d) => ['statuts', 'kbis', 'identite'].includes(d.type)).map((d) => d.id)
    return []
  })
  const [days, setDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function submit() {
    if (selected.length === 0) {
      toast.error('Sélectionne au moins un document')
      return
    }
    setSubmitting(true)
    const r = await fetch('/api/partage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: selected, audience, days }),
    })
    setSubmitting(false)
    if (r.ok) {
      toast.success('Lien généré')
      onCreated()
    } else {
      const d = await r.json().catch(() => ({}))
      toast.error(d.error || 'Échec')
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-lg space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold capitalize" style={{ fontFamily: 'var(--font-display)' }}>
            Nouveau lien — {audience}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs text-white/60">Documents à partager</p>
          {docs.length === 0 ? (
            <p className="text-xs text-white/40">Aucun document. Ajoute-en dans ton ProofVault d&apos;abord.</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {docs.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs hover:bg-white/[0.05]">
                  <input
                    type="checkbox"
                    checked={selected.includes(d.id)}
                    onChange={() => toggle(d.id)}
                    className="accent-[#FF6B35]"
                  />
                  <span className="flex-1 truncate">{d.nom}</span>
                  <span className="text-[10px] text-white/40">{d.type}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <label className="block text-xs">
          <span className="mb-1 block text-white/60">Durée du lien (jours, max 30)</span>
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
        </label>

        <button
          onClick={submit}
          disabled={submitting || selected.length === 0}
          className="w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
        >
          {submitting ? 'Génération...' : 'Générer le lien sécurisé'}
        </button>
      </div>
    </div>
  )
}
