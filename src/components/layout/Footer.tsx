import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Logo from '@/components/shared/Logo'

export default function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="relative z-10 border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-white/50">{t('description')}</p>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              {t('product')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/creer/entreprise" className="text-white/60 transition hover:text-white">{t('create_company')}</Link></li>
              <li><Link href="/creer/association" className="text-white/60 transition hover:text-white">{t('create_association')}</Link></li>
              <li><Link href="/#pricing" className="text-white/60 transition hover:text-white">{t('pricing')}</Link></li>
              <li><Link href="/#faq" className="text-white/60 transition hover:text-white">{t('faq')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              {t('resources')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/aide" className="text-white/60 transition hover:text-white">{t('help_center')}</Link></li>
              <li><Link href="/dashboard/jurisia" className="text-white/60 transition hover:text-white">{t('jurisia')}</Link></li>
              <li><a href="https://www.service-public.fr" target="_blank" rel="noopener" className="text-white/60 transition hover:text-white">service-public.fr</a></li>
              <li><a href="https://www.legifrance.gouv.fr" target="_blank" rel="noopener" className="text-white/60 transition hover:text-white">Legifrance</a></li>
              <li><Link href="/contact" className="text-white/60 transition hover:text-white">Contact</Link></li>
              <li><Link href="/ecosystem" className="text-white/60 transition hover:text-white">Écosystème Purama</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              {t('legal')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="text-white/60 transition hover:text-white">{t('legal_notice')}</Link></li>
              <li><Link href="/politique-confidentialite" className="text-white/60 transition hover:text-white">{t('privacy')}</Link></li>
              <li><Link href="/cgv" className="text-white/60 transition hover:text-white">{t('terms_sale')}</Link></li>
              <li><Link href="/cgu" className="text-white/60 transition hover:text-white">{t('terms_use')}</Link></li>
              <li><Link href="/politique-cookies" className="text-white/60 transition hover:text-white">{t('cookies')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-white/40">{t('copyright')}</p>
          <p className="text-xs text-white/40">{t('made_in')}</p>
        </div>
      </div>
    </footer>
  )
}
