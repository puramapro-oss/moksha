'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Upload } from 'lucide-react'
import type { MissionCitoyenne } from '@/lib/bourses'

interface Props {
  missions: MissionCitoyenne[]
  submittedSlugs: string[]
}

export default function BourseClient({ missions, submittedSlugs }: Props) {
  const [submittingSlug, setSubmittingSlug] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [proofText, setProofText] = useState('')
  const [openMission, setOpenMission] = useState<string | null>(null)
  const [localSubmitted, setLocalSubmitted] = useState<Set<string>>(new Set(submittedSlugs))

  const submit = async (slug: string) => {
    setSubmittingSlug(slug)
    try {
      const res = await fetch('/api/bourses/verify-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_slug: slug,
          proof_url: proofUrl || undefined,
          proof_text: proofText || undefined,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Erreur validation')
      }
      const data = (await res.json()) as { auto_validated: boolean; status: string }
      toast.success(
        data.auto_validated
          ? 'Mission validée ✓ — compteur +1'
          : 'Mission soumise pour revue manuelle (24-48h)',
      )
      setLocalSubmitted((prev) => new Set(prev).add(slug))
      setOpenMission(null)
      setProofUrl('')
      setProofText('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmittingSlug(null)
    }
  }

  return (
    <div>
      <h3 className="mb-3 font-display text-lg font-bold text-white">Missions citoyennes disponibles</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {missions.map((m) => {
          const done = localSubmitted.has(m.slug)
          const open = openMission === m.slug
          return (
            <div
              key={m.slug}
              className={`glass p-5 transition ${done ? 'opacity-60' : 'hover:border-white/20'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                    {done && <CheckCircle2 className="h-4 w-4 text-[#5DCAA5]" />}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-white/55">{m.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase text-white/50">
                      {m.category}
                    </span>
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/50">
                      {m.verification === 'url_proof'
                        ? '🔗 URL auto'
                        : m.verification === 'geo_photo'
                        ? '📸 Photo + GPS'
                        : m.verification === 'peer_validation'
                        ? '👥 Attestation'
                        : '📝 Revue manuelle'}
                    </span>
                  </div>
                </div>
              </div>
              {!done && (
                <>
                  {!open && (
                    <button
                      onClick={() => setOpenMission(m.slug)}
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.06]"
                    >
                      Soumettre preuve
                    </button>
                  )}
                  {open && (
                    <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                      {(m.verification === 'url_proof' || m.verification === 'geo_photo') && (
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-white/50">
                            URL preuve
                          </label>
                          <input
                            type="url"
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            placeholder="https://..."
                            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#FF3D00] focus:outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-white/50">
                          Note / contexte
                        </label>
                        <textarea
                          value={proofText}
                          onChange={(e) => setProofText(e.target.value)}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#FF3D00] focus:outline-none"
                          placeholder="Décris brièvement ton action..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOpenMission(null)}
                          className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/60 hover:bg-white/5"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => submit(m.slug)}
                          disabled={submittingSlug === m.slug}
                          className="flex-1 rounded-lg bg-gradient-to-r from-[#FF3D00] to-[#FFB300] py-2 text-xs font-bold text-[#070B18] disabled:opacity-50"
                        >
                          {submittingSlug === m.slug ? <Clock className="mx-auto h-4 w-4 animate-spin" /> : <><Upload className="mx-auto h-3.5 w-3.5" /></>}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
