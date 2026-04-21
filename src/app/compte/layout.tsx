/**
 * MOKSHA V7.1 — Layout /compte/* (Stripe Connect Embedded)
 * Source: CLAUDE.md V7.1 §36.5
 *
 * 7 sections mappées sur les Site Links Stripe Dashboard
 * (dashboard.stripe.com/settings/connect/emails) :
 *   - Bannière notification → /compte/notifications
 *   - Gestion comptes      → /compte/gestion
 *   - Virements            → /compte/virements
 *   - Paiements            → /compte/paiements
 *   - Soldes               → /compte/soldes
 *   - Documents            → /compte/documents
 *   - Configuration        → /compte/configuration
 *
 * Universal links iOS/Android : ces URLs fonctionnent web + natif via
 * .well-known/apple-app-site-association + assetlinks.json.
 */

import Link from 'next/link'
import LandingNav from '@/components/layout/LandingNav'
import {
  Bell,
  Settings,
  ArrowDownToLine,
  CreditCard,
  Wallet,
  FileText,
  Cog,
} from 'lucide-react'

const SECTIONS = [
  { href: '/compte/notifications', label: 'Notifications', icon: Bell },
  { href: '/compte/gestion', label: 'Gestion du compte', icon: Settings },
  { href: '/compte/virements', label: 'Virements', icon: ArrowDownToLine },
  { href: '/compte/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/compte/soldes', label: 'Soldes', icon: Wallet },
  { href: '/compte/documents', label: 'Documents', icon: FileText },
  { href: '/compte/configuration', label: 'Configuration', icon: Cog },
]

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNav />
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold">
            Mon <span className="moksha-gradient-text">compte Purama</span>
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Géré via Stripe Connect (licence EMI passportée FR). Purama ne possède jamais tes fonds.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav className="glass h-fit p-3">
            <ul className="space-y-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon
                return (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      {s.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <section>{children}</section>
        </div>
      </main>
    </>
  )
}
