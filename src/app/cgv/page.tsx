import LandingNav from '@/components/layout/LandingNav'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'CGV — MOKSHA', description: 'Conditions Générales de Vente de MOKSHA.' }

export default function CGV() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <article className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-white/80">
        <h1 className="font-display text-4xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>Conditions Générales de Vente</h1>
        <p className="mt-4 text-sm text-white/50">Dernière mise à jour : 6 avril 2026</p>
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 1 — Objet</h2>
            <p>Les présentes CGV encadrent la vente des services MOKSHA édités par SASU PURAMA : création d&apos;entreprise, création d&apos;association, dépôt INPI, agent juridique IA JurisIA, coffre-fort ProofVault.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 2 — Prix</h2>
            <p>Les prix sont indiqués en euros TTC. TVA non applicable (art. 293B CGI). Les frais officiels obligatoires (greffe ≈ 37€, annonce légale ≈ 150-200€) ne sont pas inclus dans le tarif MOKSHA.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 3 — Paiement</h2>
            <p>Le paiement s&apos;effectue par carte bancaire via Stripe. Abonnements mensuels ou annuels, prélevés automatiquement à échéance.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 4 — Droit de rétractation</h2>
            <p>Pour les abonnements, tu disposes de 14 jours de rétractation à compter de la souscription (art. L221-18 Code de la consommation). Pour les prestations de création (dossier en cours), la rétractation n&apos;est pas possible une fois le dépôt effectif engagé.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 5 — Garantie Zéro Refus</h2>
            <p>Si ton dossier est refusé par l&apos;INPI pour un motif imputable à MOKSHA, nous corrigeons et redéposons gratuitement sans limite jusqu&apos;à obtention de l&apos;acceptation.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 6 — Responsabilité</h2>
            <p>MOKSHA est un outil d&apos;assistance. L&apos;éditeur ne peut être tenu responsable des erreurs provenant des informations renseignées par l&apos;utilisateur. JurisIA ne remplace pas un avocat.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 7 — Litiges</h2>
            <p>Les présentes CGV sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents de Besançon, France.</p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  )
}
