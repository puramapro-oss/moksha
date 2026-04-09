'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'

type FeedbackItem = {
  id: string
  rating: number
  comment: string | null
  category: string
  points_given: number
  created_at: string
  moksha_profiles: { email: string; full_name: string | null }
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [avg, setAvg] = useState('0')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/feedback')
      .then((r) => r.json())
      .then((d) => {
        setFeedbacks(d.feedbacks ?? [])
        setAvg(d.avg ?? '0')
        setTotal(d.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        <MessageSquare className="h-6 w-6 text-[#FF6B35]" /> Feedback utilisateurs
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold text-[#FFD700]">{avg}/5</p>
          <p className="text-xs text-white/50">Note moyenne</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold">{total}</p>
          <p className="text-xs text-white/50">Feedbacks reçus</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold text-[#5DCAA5]">{total * 200}</p>
          <p className="text-xs text-white/50">Points distribués</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : feedbacks.length === 0 ? (
        <div className="glass py-10 text-center text-sm text-white/40">Aucun feedback reçu.</div>
      ) : (
        <div className="space-y-2">
          {feedbacks.map((f) => (
            <div key={f.id} className="glass flex items-start gap-4 p-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= f.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-white/20'}`} />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm">{f.comment || <span className="text-white/30">Pas de commentaire</span>}</p>
                <p className="mt-1 text-[10px] text-white/40">
                  {f.moksha_profiles?.full_name || f.moksha_profiles?.email} — {f.category} — {new Date(f.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
