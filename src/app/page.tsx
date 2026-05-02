import Link from 'next/link'
import AppEntrance from '@/components/landing/AppEntrance'

// Écran d'accueil app pur — style ChatGPT/Linear : logo + H1 + 2 CTA + 3 trust
// Sections marketing supprimées (cf. CLAUDE.md "JAMAIS landing 13 sections").
// Composants Choices/Features/HowItWorks/DemoJurisIA/Comparatif/Testimonials/Pricing/FAQ/CTAFinal
// conservés en lib pour réutilisation /aide ou /comparatif si besoin futur.

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen">
      <AppEntrance />

      {/* Footer minimal — légalement requis (SASU, art. 293B, RGPD) */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 text-center text-[12.5px] text-white/45 sm:flex-row sm:text-left">
          <p>
            © 2026 SASU PURAMA — 8 Rue de la Chapelle, 25560 Frasne — TVA non applicable (art. 293B CGI)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link href="/mentions-legales" className="transition hover:text-white/80">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="transition hover:text-white/80">Confidentialité</Link>
            <Link href="/cgv" className="transition hover:text-white/80">CGV</Link>
            <Link href="/aide" className="transition hover:text-white/80">Aide</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
