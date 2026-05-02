'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { HelpCircle, Plus, Minus, Mail, Bot, Sparkles, Send, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

const faqs = [
  { q: "Comment créer ma première entreprise avec MOKSHA ?", r: "Clique sur « Démarrer » en haut à droite, choisis « Créer mon entreprise », renseigne les informations demandées puis valide le récapitulatif. MOKSHA génère, signe, dépose et te livre ton Kbis." },
  { q: "Quelle forme juridique choisir ?", r: "Utilise JurisIA (onglet dédié). Il analyse ton projet et te recommande la forme la plus adaptée : SASU, EURL, SAS, SARL, SCI ou micro-entreprise." },
  { q: "Combien de temps pour recevoir mon Kbis ?", r: "5 à 10 jours ouvrés en mode Standard, 24 à 72h en mode Express (option +50€)." },
  { q: "Quels sont les frais officiels obligatoires ?", r: "Frais de greffe INPI ≈ 37€ et annonce légale ≈ 150-200€. Ils s'ajoutent au tarif MOKSHA et ne sont pas encaissés par nous." },
  { q: "Mon dossier a été refusé, que se passe-t-il ?", r: "La Garantie Zéro Refus s'active : correction automatique et redépôt gratuit illimité jusqu'à l'acceptation." },
  { q: "Puis-je domicilier mon entreprise chez moi ?", r: "Oui, sauf restriction du règlement de copropriété ou du bail d'habitation. MOKSHA génère automatiquement la lettre de domiciliation." },
  { q: "Comment fonctionne ProofVault ?", r: "Upload drag & drop, chiffrement AES-256 automatique, partage en 1 clic avec ta banque ou ton auditeur via lien temporaire sécurisé." },
  { q: "JurisIA peut-il remplacer un avocat ?", r: "Non. JurisIA est un assistant juridique IA qui cite les textes officiels. Pour une situation complexe, consulte un avocat ou un expert-comptable." },
  { q: "Comment sont calculées les commissions de parrainage ?", r: "50% du premier paiement de ton filleul + 10% de ses paiements récurrents à vie. Paliers bonus à chaque seuil (5, 10, 25, 50, 100, 500, 1000 filleuls)." },
  { q: "Comment retirer mon solde wallet ?", r: "Depuis la page Wallet, à partir de 20€ minimum, par virement IBAN. Le traitement prend 3 à 5 jours ouvrés." },
  { q: "Que se passe-t-il si j'annule mon abonnement ?", r: "Tu gardes l'accès jusqu'à la fin de la période en cours. Tes données et ProofVault restent accessibles. Aucune pénalité." },
  { q: "Peut-on créer une association ?", r: "Oui, 5 étapes : type, nom/objet, siège, bureau, récap. Statuts, PV AG et Cerfa préfecture générés et déposés automatiquement." },
  { q: "MOKSHA est-il conforme RGPD ?", r: "100%. Données hébergées en UE (Francfort), chiffrement AES-256, droits d'accès/rectification/effacement garantis. DPO : matiss.frasne@gmail.com." },
  { q: "Quels modes de paiement acceptez-vous ?", r: "Carte bancaire (Visa, MasterCard, Amex), Apple Pay, Google Pay, Link et Paypal via Stripe." },
  { q: "Puis-je gérer plusieurs structures ?", r: "Oui. Plan Gratuit : 1 structure. Autopilote : 3 structures. Pro : illimité." },
]

export default function Aide() {
  const [open, setOpen] = useState<number | null>(0)
  const [search, setSearch] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const { profile, refetch } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const filtered = search.trim()
    ? faqs.filter((f) =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.r.toLowerCase().includes(search.toLowerCase())
      )
    : faqs

  async function relaunchTutorial() {
    if (profile?.id) {
      await supabase.from('moksha_profiles').update({ tutorial_completed: false }).eq('id', profile.id)
      await refetch()
    }
    if (typeof window !== 'undefined') localStorage.setItem('moksha-relaunch-tutorial', '1')
    toast.success('Tuto relancé')
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <HelpCircle className="h-6 w-6 text-[#FFB300]" /> Aide & FAQ
        </h1>
        <p className="mt-1 text-sm text-white/60">Réponses aux questions les plus fréquentes.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans la FAQ..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#FF3D00]/60"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-white/40" />
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/jurisia" className="glass glass-hover flex items-center gap-4 p-5">
          <Bot className="h-7 w-7 text-[#FF3D00]" />
          <div>
            <h3 className="font-semibold">Demander à JurisIA</h3>
            <p className="text-xs text-white/50">Question juridique précise</p>
          </div>
        </Link>
        <a href="mailto:matiss.frasne@gmail.com" className="glass glass-hover flex items-center gap-4 p-5">
          <Mail className="h-7 w-7 text-[#FFB300]" />
          <div>
            <h3 className="font-semibold">Contacter le support</h3>
            <p className="text-xs text-white/50">matiss.frasne@gmail.com</p>
          </div>
        </a>
        <button onClick={relaunchTutorial} className="glass glass-hover flex items-center gap-4 p-5 text-left">
          <Sparkles className="h-7 w-7 text-[#5DCAA5]" />
          <div>
            <h3 className="font-semibold">Relancer le tuto</h3>
            <p className="text-xs text-white/50">6 étapes guidées</p>
          </div>
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-white/50">Aucun résultat pour &quot;{search}&quot;</p>
            <button
              onClick={() => setChatOpen(true)}
              className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-4 py-2 text-xs font-bold text-[#070B18]"
            >
              Poser ma question au chatbot
            </button>
          </div>
        ) : (
          filtered.map((f, i) => (
            <div key={i} className="glass overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="text-sm font-semibold">{f.q}</span>
                {open === i ? <Minus className="h-4 w-4 text-[#FF3D00]" /> : <Plus className="h-4 w-4 text-white/50" />}
              </button>
              {open === i && <div className="border-t border-white/5 px-6 py-4 text-sm text-white/70">{f.r}</div>}
            </div>
          ))
        )}
      </div>

      {/* Chatbot FAB */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3D00] to-[#FFB300] shadow-lg shadow-[#FF3D00]/20 md:bottom-8"
        >
          <Bot className="h-6 w-6 text-[#070B18]" />
        </button>
      )}

      {chatOpen && <AideChatbot onClose={() => setChatOpen(false)} />}
    </div>
  )
}

function AideChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setSending(true)
    try {
      const r = await fetch('/api/aide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const d = await r.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: d.reply || d.error || 'Erreur' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur réseau. Réessaie.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1225]/95 shadow-2xl backdrop-blur-xl md:bottom-8">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[#FF3D00]" />
          <span className="text-sm font-semibold">Assistant MOKSHA</span>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10">
          <X className="h-4 w-4 text-white/50" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-xs text-white/40">Pose-moi une question sur MOKSHA.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-gradient-to-r from-[#FF3D00] to-[#FFB300] text-[#070B18]'
                : 'bg-white/10 text-white/80'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/40">
              Réflexion...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ta question..."
            maxLength={1000}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#FF3D00]/60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] p-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-[#070B18]" />
          </button>
        </div>
      </form>
    </div>
  )
}
