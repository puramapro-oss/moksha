'use client'

import { useState, type FormEvent } from 'react'
import { MessageSquare, Star, Send } from 'lucide-react'
import { toast } from 'sonner'
import { POINTS_REWARDS } from '@/lib/constants'

const CATEGORIES = [
  { id: 'general', label: 'Général' },
  { id: 'jurisia', label: 'JurisIA' },
  { id: 'demarches', label: 'Démarches' },
  { id: 'proofvault', label: 'ProofVault' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'autre', label: 'Autre' },
] as const

export default function FeedbackPage() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [category, setCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Choisis une note avant d\'envoyer')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment, category }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erreur')
        return
      }
      toast.success(data.message)
      setSubmitted(true)
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF3D00] to-[#FFB300]">
          <MessageSquare className="h-8 w-8 text-[#070B18]" />
        </div>
        <h2 className="text-2xl font-extrabold">Merci pour ton retour !</h2>
        <p className="text-sm text-white/60">+{POINTS_REWARDS.feedback} points ajoutés à ton compte.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <MessageSquare className="h-6 w-6 text-[#FF3D00]" /> Feedback
        </h1>
        <p className="mt-1 text-sm text-white/60">Aide-nous à améliorer MOKSHA. +{POINTS_REWARDS.feedback} points par feedback.</p>
      </div>

      <form onSubmit={submit} className="glass space-y-6 p-6">
        {/* Rating */}
        <div>
          <label className="mb-2 block text-sm font-medium">Quelle note donnerais-tu à MOKSHA ?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    n <= (hoverRating || rating) ? 'fill-[#FFB300] text-[#FFB300]' : 'text-white/20'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                  category === c.id
                    ? 'bg-[#FF3D00]/20 text-[#FF3D00] border border-[#FF3D00]/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="mb-2 block text-sm font-medium">Ton message (optionnel)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Ce qui fonctionne bien, ce qu'on pourrait améliorer..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF3D00]/60"
            maxLength={2000}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Envoi...' : 'Envoyer mon feedback'}
        </button>
      </form>
    </div>
  )
}
