import Link from 'next/link'
import Logo from '@/components/shared/Logo'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-white/50">
              Libère-toi. Crée ton empire en 10 minutes. Agent IA juridique, coffre-fort sécurisé, dépôt INPI automatique.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              Produit
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/creer/entreprise" className="text-white/60 transition hover:text-white">Créer entreprise</Link></li>
              <li><Link href="/creer/association" className="text-white/60 transition hover:text-white">Créer association</Link></li>
              <li><Link href="/#pricing" className="text-white/60 transition hover:text-white">Tarifs</Link></li>
              <li><Link href="/#faq" className="text-white/60 transition hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              Ressources
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/aide" className="text-white/60 transition hover:text-white">Centre d&apos;aide</Link></li>
              <li><Link href="/dashboard/jurisia" className="text-white/60 transition hover:text-white">JurisIA</Link></li>
              <li><a href="https://www.service-public.fr" target="_blank" rel="noopener" className="text-white/60 transition hover:text-white">service-public.fr</a></li>
              <li><a href="https://www.legifrance.gouv.fr" target="_blank" rel="noopener" className="text-white/60 transition hover:text-white">Legifrance</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              Légal
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="text-white/60 transition hover:text-white">Mentions légales</Link></li>
              <li><Link href="/politique-confidentialite" className="text-white/60 transition hover:text-white">Confidentialité</Link></li>
              <li><Link href="/cgv" className="text-white/60 transition hover:text-white">CGV</Link></li>
              <li><Link href="/cgu" className="text-white/60 transition hover:text-white">CGU</Link></li>
              <li><Link href="/politique-cookies" className="text-white/60 transition hover:text-white">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-white/40">
            © 2026 SASU PURAMA — 8 Rue de la Chapelle, 25560 Frasne — TVA non applicable (art. 293B CGI)
          </p>
          <p className="text-xs text-white/40">
            Fait avec 🔥 en France — 10 % du CA reversé à l&apos;asso Purama
          </p>
        </div>
      </div>
    </footer>
  )
}
