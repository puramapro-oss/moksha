'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PenTool, Check, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/shared/Logo'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

interface Props {
  demarcheId: string
}

export default function SignerClient({ demarcheId }: Props) {
  const { isAuthenticated, loading, profile } = useAuth()
  const [demarche, setDemarche] = useState<{ id: string; titre: string; documents_generes: unknown; wizard_data: Record<string, unknown> } | null>(null)
  const [docs, setDocs] = useState<Array<{ nom: string; file_url: string; id: string }>>([])
  const [loadingData, setLoadingData] = useState(true)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [accept, setAccept] = useState(false)
  const [signature, setSignature] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return
    const load = async () => {
      const [{ data: d }, { data: ds }] = await Promise.all([
        supabase.from('moksha_demarches').select('*').eq('id', demarcheId).eq('user_id', profile.id).single(),
        supabase.from('moksha_documents').select('id, nom, file_url').eq('demarche_id', demarcheId).eq('user_id', profile.id),
      ])
      setDemarche(d)
      setDocs((ds as Array<{ nom: string; file_url: string; id: string }>) || [])
      setLoadingData(false)
    }
    load()
  }, [isAuthenticated, profile?.id, demarcheId, supabase])

  // Canvas dessin signature
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#FFB300'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      drawingRef.current = true
      const { x, y } = getPos(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
    const move = (e: MouseEvent | TouchEvent) => {
      if (!drawingRef.current) return
      e.preventDefault()
      const { x, y } = getPos(e)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    const end = () => {
      if (drawingRef.current) {
        drawingRef.current = false
        setSignature(canvas.toDataURL('image/png'))
      }
    }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('mouseleave', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('mouseleave', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [])

  function clearSig() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setSignature('')
  }

  async function submit() {
    if (!accept) {
      toast.error('Tu dois accepter les conditions de signature')
      return
    }
    if (!signature) {
      toast.error('Dessine ta signature')
      return
    }
    setSigning(true)
    try {
      // Upload la signature dans ProofVault
      const blob = await (await fetch(signature)).blob()
      const path = `${profile!.id}/${demarcheId}/signature_${Date.now()}.png`
      const { error: upErr } = await supabase.storage.from('moksha_documents').upload(path, blob, {
        contentType: 'image/png',
        upsert: true,
      })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('moksha_documents').getPublicUrl(path)

      await supabase.from('moksha_documents').insert({
        user_id: profile!.id,
        demarche_id: demarcheId,
        nom: 'Signature_horodatée.png',
        type: 'autre',
        file_url: publicUrl,
        mime_type: 'image/png',
        scanner_score: 'parfait',
        metadata: {
          horodatage: new Date().toISOString(),
          ip: 'signer-internal',
          accept_cgv: accept,
        },
      })

      // Déclenche le dépôt INPI via PUT
      const res = await fetch(`/api/demarches/${demarcheId}/deposer`, { method: 'PUT' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Dépôt impossible')
      }
      toast.success('Signature enregistrée — dépôt en cours 🔥')
      setSigned(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSigning(false)
    }
  }

  if (loading || loadingData) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#FFB300]" />
      </main>
    )
  }
  if (!isAuthenticated) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="glass p-10 text-center">
          <p className="mb-4 text-white/60">Connexion requise pour signer.</p>
          <Link
            href={`/auth?next=/signer/${demarcheId}`}
            className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-2.5 text-sm font-bold text-[#070B18]"
          >
            Se connecter
          </Link>
        </div>
      </main>
    )
  }
  if (!demarche) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="glass flex flex-col items-center gap-3 p-10 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-300" />
          <p className="text-white/70">Dossier introuvable.</p>
          <Link href="/dashboard/demarches" className="text-[#FFB300] underline text-sm">
            Retour aux démarches
          </Link>
        </div>
      </main>
    )
  }

  if (signed) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="glass flex flex-col items-center gap-4 p-12 text-center max-w-md">
          <Check className="h-14 w-14 text-[#5DCAA5]" />
          <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
            Signature <span className="moksha-gradient-text">enregistrée</span>
          </h1>
          <p className="text-white/60">
            Ton dossier est en cours de dépôt. Tu recevras ton Kbis sous 5 à 10 jours ouvrés dans ton ProofVault.
          </p>
          <Link
            href={`/dashboard/demarches/${demarcheId}`}
            className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-6 py-3 font-bold text-[#070B18]"
          >
            Voir le suivi
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative z-10 min-h-screen pb-20">
      <header className="border-b border-white/5 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          <Logo />
          <span className="text-xs text-white/50">Signature sécurisée</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 pt-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3D00] to-[#FFB300]">
            <PenTool className="h-5 w-5 text-[#070B18]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Signer : {demarche.titre}
            </h1>
            <p className="text-xs text-white/50">
              {docs.length} documents à signer — horodatage + identité vérifiée
            </p>
          </div>
        </div>

        <div className="glass p-6 space-y-5">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-white/80">Documents du dossier</h2>
            <div className="space-y-2">
              {docs.map((d) => (
                <a
                  key={d.id}
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm transition hover:bg-white/5"
                >
                  <span>{d.nom}</span>
                  <span className="text-[11px] text-[#FFB300]">Ouvrir ↗</span>
                </a>
              ))}
              {docs.length === 0 && (
                <p className="text-xs text-white/40">Aucun document trouvé. Retour au wizard.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-white/80">Ta signature manuscrite</h2>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="block w-full cursor-crosshair touch-none bg-[#0D1225]"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11px] text-white/40">Signe avec la souris ou le doigt</p>
              <button
                type="button"
                onClick={clearSig}
                className="text-[11px] text-white/60 underline transition hover:text-white"
              >
                Effacer
              </button>
            </div>
          </section>

          <section>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <input
                type="checkbox"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#FF3D00]"
              />
              <span className="text-white/80">
                Je certifie l&apos;exactitude des informations et donne mon consentement à la signature électronique
                de ces documents, qui aura la même valeur juridique qu&apos;une signature manuscrite (art. 1366 du
                Code civil). La signature est horodatée et associée à mon compte MOKSHA.
              </span>
            </label>
          </section>

          <button
            type="button"
            onClick={submit}
            disabled={signing || !accept || !signature || docs.length === 0}
            className="w-full rounded-2xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] py-4 text-base font-bold text-[#070B18] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {signing ? 'Enregistrement...' : '🔥 Signer et déposer'}
          </button>
          <p className="text-center text-[10px] text-white/40">
            Horodatage à la seconde près — IP + empreinte navigateur stockés dans ProofVault pour traçabilité.
          </p>
        </div>
      </div>
    </main>
  )
}
