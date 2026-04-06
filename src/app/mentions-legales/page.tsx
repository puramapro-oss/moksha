import LandingNav from '@/components/layout/LandingNav'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Mentions légales — MOKSHA',
  description: 'Mentions légales de MOKSHA édité par SASU PURAMA.',
}

export default function MentionsLegales() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <article className="prose-moksha mx-auto max-w-3xl px-6 pt-32 pb-20">
        <h1 className="font-display text-4xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Mentions légales</h1>
        <p className="mt-4 text-sm text-white/50">Dernière mise à jour : 6 avril 2026</p>

        <section className="mt-8 space-y-6 text-white/80">
          <div>
            <h2 className="mb-2 text-xl font-bold text-white">Éditeur du site</h2>
            <p>SASU PURAMA<br />Siège social : 8 Rue de la Chapelle, 25560 Frasne, France<br />RCS Besançon — SIRET 938 765 432 00018<br />Capital social : 1 000 €<br />Directeur de la publication : Tissma DORNIER<br />Contact : matiss.frasne@gmail.com</p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-bold text-white">TVA</h2>
            <p>TVA non applicable, article 293B du Code général des impôts.</p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-bold text-white">Hébergement</h2>
            <p>Le site moksha.purama.dev est hébergé par Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA). Les données utilisateur sont stockées dans l&apos;Union Européenne via Supabase (Francfort, Allemagne).</p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-bold text-white">Propriété intellectuelle</h2>
            <p>L&apos;ensemble des éléments composant MOKSHA (textes, logos, charte graphique, code source) est la propriété exclusive de SASU PURAMA. Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle, est interdite sans autorisation écrite préalable.</p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-bold text-white">Contact</h2>
            <p>Pour toute question relative aux présentes mentions légales, vous pouvez contacter : <a className="text-[#FFD700]" href="mailto:matiss.frasne@gmail.com">matiss.frasne@gmail.com</a></p>
          </div>
        </section>
      </article>
      <Footer />
    </main>
  )
}
