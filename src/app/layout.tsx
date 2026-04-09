import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import CinematicIntro from '@/components/shared/CinematicIntro'
import CookieBanner from '@/components/shared/CookieBanner'
import CursorGlow from '@/components/shared/CursorGlow'
import { localeMeta, type Locale } from '@/i18n/config'
import { APP_DESCRIPTION, APP_NAME, APP_URL } from '@/lib/constants'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${APP_NAME} — Libère-toi. Crée ton empire en 10 minutes.`,
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  keywords: [
    'création entreprise',
    'SASU',
    'SAS',
    'SARL',
    'EURL',
    'SCI',
    'micro-entreprise',
    'association loi 1901',
    'LegalPlace',
    'INPI',
    'dépôt INPI',
    'statuts',
    'kbis',
    'juridique',
    'agent IA juridique',
    'MOKSHA',
  ],
  authors: [{ name: 'SASU PURAMA' }],
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: `${APP_NAME} — Libère-toi. Crée ton empire.`,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Crée ton entreprise en 10 min`,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: APP_URL },
}

export const viewport: Viewport = {
  themeColor: '#FF6B35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale
  const messages = await getMessages()
  const dir = localeMeta[locale]?.dir ?? 'ltr'

  return (
    <html lang={locale} dir={dir} className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}` }} />
      </head>
      <body className="min-h-screen bg-[var(--bg-void)] font-[family-name:var(--font-body)] text-[var(--text-primary)] antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="aurora" />
          <div className="grid-bg" />
          <div className="noise" />
          <div className="fire-orb fixed left-[8%] top-[12%] h-[420px] w-[420px] bg-[#FF6B35]" />
          <div className="fire-orb fixed right-[10%] top-[55%] h-[360px] w-[360px] bg-[#FFD700]" style={{ animationDelay: '-7s' }} />
          <div className="fire-orb fixed left-[55%] top-[8%] h-[300px] w-[300px] bg-[#5DCAA5]" style={{ animationDelay: '-14s' }} />
          <ErrorBoundary>{children}</ErrorBoundary>
          <CinematicIntro />
          <CursorGlow />
          <CookieBanner />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(13, 18, 37, 0.9)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                color: '#F8FAFC',
              },
            }}
          />
          <Analytics />
          <SpeedInsights />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
