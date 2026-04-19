'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, Clock } from 'lucide-react'
import LandingNav from '@/components/layout/LandingNav'

export default function RemboursementPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [iban, setIban] = useState('')
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !iban || !amount || !details) {
      toast.error('Tous les champs sont requis')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: 'Demande de remboursement frais — Jeux-concours',
          message: `IBAN: ${iban}\nMontant: ${amount}€\n\nDétails:\n${details}`,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Erreur envoi')
      }
      setSent(true)
      toast.success('Demande envoyée — réponse sous 7 jours')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <LandingNav />
      <main className="relative z-10 mx-auto max-w-xl px-6 pt-28 pb-20">
        <h1 className="font-display text-3xl font-extrabold">
          Remboursement des <span className="moksha-gradient-text">frais</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Conformément à l&apos;article 5 du règlement des jeux-concours, tout participant peut demander
          le remboursement des frais engagés (timbres, connexion internet, enveloppes).
        </p>

        {sent ? (
          <div className="glass mt-6 p-6 text-center">
            <Mail className="mx-auto mb-3 h-10 w-10 text-[#5DCAA5]" />
            <h3 className="font-display text-xl font-bold">Demande bien reçue</h3>
            <p className="mt-2 text-sm text-white/60">
              Tu recevras une réponse sous 7 jours ouvrés à {email}.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="glass mt-6 space-y-3 p-6">
            <div>
              <label className="block text-xs font-semibold text-white/70">Nom / Prénom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-[#FF6B35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-[#FF6B35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70">IBAN (pour remboursement)</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="FR76 ..."
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-xs text-white focus:border-[#FF6B35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70">Montant demandé (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-[#FF6B35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70">Détails (frais détaillés)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                required
                placeholder="Ex: 2 timbres à 1,29€ pour envoi courrier participation concours du 15/04/2026..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FF6B35] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
            >
              {submitting ? <Clock className="mx-auto h-4 w-4 animate-spin" /> : 'Envoyer ma demande'}
            </button>
            <p className="text-[11px] text-white/40">
              Traitement sous 7 jours ouvrés. Réponse par email. Remboursement par virement SEPA.
            </p>
          </form>
        )}
      </main>
    </>
  )
}
