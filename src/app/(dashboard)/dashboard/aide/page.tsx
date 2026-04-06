'use client'

import { useState } from 'react'
import { HelpCircle, Plus, Minus, Mail, Bot } from 'lucide-react'
import Link from 'next/link'

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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <HelpCircle className="h-6 w-6 text-[#FFD700]" /> Aide & FAQ
        </h1>
        <p className="mt-1 text-sm text-white/60">Réponses aux questions les plus fréquentes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/jurisia" className="glass glass-hover flex items-center gap-4 p-5">
          <Bot className="h-7 w-7 text-[#FF6B35]" />
          <div>
            <h3 className="font-semibold">Demander à JurisIA</h3>
            <p className="text-xs text-white/50">Question juridique précise</p>
          </div>
        </Link>
        <a href="mailto:matiss.frasne@gmail.com" className="glass glass-hover flex items-center gap-4 p-5">
          <Mail className="h-7 w-7 text-[#FFD700]" />
          <div>
            <h3 className="font-semibold">Contacter le support</h3>
            <p className="text-xs text-white/50">matiss.frasne@gmail.com</p>
          </div>
        </a>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="glass overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="text-sm font-semibold">{f.q}</span>
              {open === i ? <Minus className="h-4 w-4 text-[#FF6B35]" /> : <Plus className="h-4 w-4 text-white/50" />}
            </button>
            {open === i && <div className="border-t border-white/5 px-6 py-4 text-sm text-white/70">{f.r}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
