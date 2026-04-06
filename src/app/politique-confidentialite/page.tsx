import LandingNav from '@/components/layout/LandingNav'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Politique de confidentialité — MOKSHA',
  description: 'Politique de confidentialité et protection des données RGPD de MOKSHA.',
}

export default function Politique() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <article className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-white/80">
        <h1 className="font-display text-4xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>Politique de confidentialité</h1>
        <p className="mt-4 text-sm text-white/50">Dernière mise à jour : 6 avril 2026</p>
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Responsable du traitement</h2>
            <p>SASU PURAMA, 8 Rue de la Chapelle, 25560 Frasne — contact : matiss.frasne@gmail.com</p>
            <p>DPO : matiss.frasne@gmail.com</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Données collectées</h2>
            <ul className="list-disc pl-6">
              <li>Identifiants de compte (email, nom, avatar)</li>
              <li>Données de création d&apos;entreprise / association (dénomination, siège, dirigeant, activité)</li>
              <li>Documents uploadés dans ProofVault (chiffrés AES-256)</li>
              <li>Données de paiement (via Stripe, jamais stockées en clair)</li>
              <li>Historique JurisIA (conversations avec l&apos;agent juridique)</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Finalités</h2>
            <ul className="list-disc pl-6">
              <li>Exécution du contrat (création, dépôt INPI, suivi)</li>
              <li>Respect des obligations légales (facturation, comptabilité)</li>
              <li>Amélioration du service (statistiques agrégées anonymisées)</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Durée de conservation</h2>
            <p>Les données sont conservées pendant toute la durée de ton compte, puis 5 ans après sa fermeture pour respecter les obligations légales (art. L123-22 C. com.).</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Tes droits</h2>
            <p>Conformément au RGPD (art. 15 à 22), tu disposes d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de portabilité, de limitation et d&apos;opposition. Exerce ces droits par email à <a className="text-[#FFD700]" href="mailto:matiss.frasne@gmail.com">matiss.frasne@gmail.com</a>.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Sécurité</h2>
            <p>Documents chiffrés AES-256 au repos, TLS 1.3 en transit. Authentification forte par Supabase Auth. Accès aux serveurs restreint au principe du moindre privilège.</p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  )
}
