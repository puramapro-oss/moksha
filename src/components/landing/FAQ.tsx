'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: "Comment MOKSHA dépose mon dossier à l'INPI ?",
    r: "Nous passons par notre partenaire accrédité Pappers Services, qui a un accès direct au guichet unique de l'INPI. Tu ne quittes jamais MOKSHA. En cas d'indisponibilité, nous te pré-remplissons le dossier et te redirigeons vers procedures.inpi.fr.",
  },
  {
    q: "Combien de temps pour recevoir mon Kbis ?",
    r: "5 à 10 jours ouvrés en mode Standard. En mode Express (+50€), ton dossier est traité sous 24 à 72h par les équipes du greffe. Ton Kbis arrive directement dans ton ProofVault et par email.",
  },
  {
    q: "Quels sont les frais cachés ?",
    r: "Aucun. Notre tarif MOKSHA ne couvre pas les frais officiels obligatoires que tu paies dans tous les cas : greffe ≈ 37€ et annonce légale ≈ 150-200€ (parution obligatoire au Journal d'Annonces Légales). Nous te les affichons avant paiement.",
  },
  {
    q: "Quel taux de réussite ? Y a-t-il un risque de refus ?",
    r: "Notre taux de conformité est supérieur à 98% grâce à ScannerPerfect et au contrôle JurisIA. En cas de refus, la Garantie Zéro Refus s'active : correction et redépôt gratuits illimités.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    r: "Tes documents sont chiffrés AES-256 et transmis via TLS 1.3. ProofVault est hébergé chez Supabase en Europe (Francfort). Nous sommes conformes RGPD et appliquons le principe du moindre privilège.",
  },
  {
    q: "JurisIA remplace-t-il un avocat ?",
    r: "Non. JurisIA est un assistant juridique IA qui cite les textes officiels. Pour toute situation complexe (litige, fiscalité avancée, montage complexe), nous recommandons explicitement de consulter un avocat ou un expert-comptable.",
  },
  {
    q: "La signature électronique est-elle légale ?",
    r: "Oui. Nous utilisons DocuSeal avec intégration FranceConnect+ (signature qualifiée eIDAS). Elle a la même valeur juridique qu'une signature manuscrite (art. 1366 du Code civil).",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    r: "Oui. Tous les abonnements sont sans engagement, annulables en 1 clic depuis ton dashboard. En cas d'insatisfaction sur un abonnement annuel, tu bénéficies d'une garantie 14 jours satisfait ou remboursé.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Questions <span className="moksha-gradient-text">fréquentes</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="glass overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.02]"
              >
                <span className="font-semibold">{f.q}</span>
                {open === i ? <Minus className="h-5 w-5 shrink-0 text-[#FF6B35]" /> : <Plus className="h-5 w-5 shrink-0 text-white/50" />}
              </button>
              {open === i && (
                <div className="border-t border-white/5 px-6 py-5 text-sm leading-relaxed text-white/70">
                  {f.r}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
