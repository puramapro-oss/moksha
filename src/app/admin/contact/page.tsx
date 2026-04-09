'use client'

import { useEffect, useState } from 'react'
import { Mail, Check, Clock } from 'lucide-react'

type ContactMsg = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  sent_at: string
  responded: boolean
}

export default function AdminContact() {
  const [messages, setMessages] = useState<ContactMsg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/contact')
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .finally(() => setLoading(false))
  }, [])

  const unread = messages.filter((m) => !m.responded).length

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        <Mail className="h-6 w-6 text-[#FF6B35]" /> Messages de contact
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold">{messages.length}</p>
          <p className="text-xs text-white/50">Messages reçus</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-extrabold text-amber-400">{unread}</p>
          <p className="text-xs text-white/50">Non répondus</p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : messages.length === 0 ? (
        <div className="glass py-10 text-center text-sm text-white/40">Aucun message reçu.</div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="glass p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{m.subject}</p>
                  <p className="text-[10px] text-white/40">{m.name} — {m.email} — {new Date(m.sent_at).toLocaleDateString('fr-FR')}</p>
                </div>
                {m.responded ? (
                  <span className="flex items-center gap-1 rounded-full bg-[#5DCAA5]/10 px-2 py-0.5 text-[10px] text-[#5DCAA5]">
                    <Check className="h-3 w-3" /> Répondu
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                    <Clock className="h-3 w-3" /> En attente
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/70">{m.message}</p>
              {!m.responded && (
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                  className="mt-3 inline-block rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                >
                  Répondre par email
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
