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
    q: "Y a-t-il un risque de refus du greffe ?",
    r: "ScannerPerfect™ contrôle la qualité de tes pièces (lisibilité, format, complétude) avant envoi, et JurisIA vérifie la cohérence juridique du dossier. Si malgré tout le greffe demande une régularisation, la Garantie Zéro Refus s'active : on corrige et on redépose gratuitement, autant de fois qu'il faut.",
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
    <section id="faq" className="moksha-section">
      <div className="moksha-container max-w-3xl">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="moksha-eyebrow mb-3">FAQ</p>
          <h2 className="moksha-h2">
            Questions <span className="moksha-gradient-text">fréquentes</span>
          </h2>
        </div>
        <div className="space-y-2.5">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={i} className={`glass overflow-hidden transition-colors ${isOpen ? 'border-white/15' : ''}`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.025] sm:px-6 sm:py-5"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14.5px] font-semibold text-white/90 sm:text-base">{f.q}</span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0 text-[#FF3D00]" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-white/45" />
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-white/5 px-5 py-5 text-[13.5px] leading-relaxed text-pretty text-white/65 sm:px-6 sm:text-[14.5px]">
                    {f.r}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
