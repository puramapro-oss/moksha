import LandingNav from '@/components/layout/LandingNav'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Politique cookies — MOKSHA', description: 'Utilisation des cookies sur MOKSHA.' }

export default function Cookies() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <article className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-white/80">
        <h1 className="font-display text-4xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>Politique Cookies</h1>
        <p className="mt-4 text-sm text-white/50">Dernière mise à jour : 6 avril 2026</p>
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Cookies essentiels</h2>
            <p>MOKSHA utilise uniquement des cookies strictement nécessaires au fonctionnement du service : session d&apos;authentification, préférences UI, sécurité CSRF. Aucun cookie publicitaire n&apos;est déposé.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Analytique</h2>
            <p>Nous utilisons Vercel Analytics en mode anonyme (respect du « Do Not Track »). Aucune donnée personnelle identifiable n&apos;est partagée avec des tiers.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Gestion</h2>
            <p>Tu peux configurer ton navigateur pour refuser les cookies. Cela peut toutefois dégrader ton expérience (par exemple, impossibilité de rester connecté).</p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  )
}
