'use client'

import { useState, type FormEvent } from 'react'
import { Mail, Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data.error || 'Erreur')
        return
      }
      toast.success(data.message)
      setSent(true)
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B18] p-4">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        {sent ? (
          <div className="glass flex flex-col items-center gap-4 p-10 text-center">
            <Mail className="h-12 w-12 text-[#5DCAA5]" />
            <h1 className="text-2xl font-extrabold">Message envoyé</h1>
            <p className="text-sm text-white/60">On te répond sous 24h. En attendant, consulte notre aide.</p>
            <Link href="/dashboard/aide" className="mt-2 rounded-xl bg-white/10 px-6 py-2 text-sm">
              Aide & FAQ
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="glass space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-[#FF6B35]" />
              <h1 className="text-2xl font-extrabold">Nous contacter</h1>
            </div>
            <p className="text-sm text-white/60">Une question ? Un problème ? Écris-nous.</p>

            <label className="block text-xs">
              <span className="mb-1 block text-white/60">Nom</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]/60"
              />
            </label>

            <label className="block text-xs">
              <span className="mb-1 block text-white/60">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]/60"
              />
            </label>

            <label className="block text-xs">
              <span className="mb-1 block text-white/60">Objet</span>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]/60"
              />
            </label>

            <label className="block text-xs">
              <span className="mb-1 block text-white/60">Message</span>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-[#FF6B35]/60"
                maxLength={5000}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
