'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Bot,
  Lock,
  BarChart3,
  Bell,
  Building2,
  Share2,
  Users,
  Wallet,
  HelpCircle,
  Settings,
  LogOut,
  ShieldAlert,
  Star,
  Trophy,
  MessageSquare,
  Wind,
  Heart,
  Banknote,
} from 'lucide-react'
import Logo from '@/components/shared/Logo'
import WisdomFooter from '@/components/shared/WisdomFooter'
import SpiritualLayer from '@/components/shared/SpiritualLayer'
import { useAuth } from '@/hooks/useAuth'
import NotificationBell from './NotificationBell'

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }

const main: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/demarches', label: 'Mes démarches', icon: FileText },
  { href: '/dashboard/jurisia', label: 'JurisIA', icon: Bot },
  { href: '/dashboard/proofvault', label: 'ProofVault', icon: Lock },
  { href: '/dashboard/simulateur', label: 'Simulateur', icon: BarChart3 },
  { href: '/dashboard/rappels', label: 'Rappels', icon: Bell },
  { href: '/dashboard/structures', label: 'Mes structures', icon: Building2 },
  { href: '/dashboard/partage', label: 'Partage Pro', icon: Share2 },
]

const grow: NavItem[] = [
  { href: '/dashboard/parrainage', label: 'Parrainage', icon: Users },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/points', label: 'Points', icon: Star },
  { href: '/dashboard/concours', label: 'Concours', icon: Trophy },
  { href: '/dashboard/financer', label: 'Financer', icon: Banknote },
]

const wellbeing: NavItem[] = [
  { href: '/dashboard/breathe', label: 'Respiration', icon: Wind },
  { href: '/dashboard/gratitude', label: 'Gratitude', icon: Heart },
]

const support: NavItem[] = [
  { href: '/dashboard/aide', label: 'Aide & FAQ', icon: HelpCircle },
  { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? 'bg-gradient-to-r from-[#FF6B35]/15 to-[#FFD700]/5 text-white border border-[#FF6B35]/30'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/dashboard'
  const { profile, isSuperAdmin, signOut, plan } = useAuth()

  return (
    <div className="relative z-10 flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-[var(--bg-nebula)]/60 p-5 backdrop-blur-xl md:flex md:flex-col">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <NotificationBell />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {main.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}
          <div className="my-4 border-t border-white/5" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Croissance</p>
          {grow.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}
          <div className="my-4 border-t border-white/5" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Bien-être</p>
          {wellbeing.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}
          <div className="my-4 border-t border-white/5" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Support</p>
          {support.map((i) => <NavLink key={i.href} item={i} pathname={pathname} />)}
          {isSuperAdmin && (
            <>
              <div className="my-4 border-t border-white/5" />
              <NavLink item={{ href: '/admin', label: 'Admin', icon: ShieldAlert }} pathname={pathname} />
            </>
          )}
        </nav>
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFD700] text-[10px] font-bold text-[#070B18]">
              {(profile?.full_name || profile?.email || '?').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{profile?.full_name || 'Utilisateur'}</p>
              <p className="truncate text-[10px] text-white/40">Plan : {plan}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-xs text-white/60 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 pb-20 md:pb-8">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[var(--bg-void)]/80 px-5 py-4 backdrop-blur-xl md:hidden">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={signOut} className="rounded-lg border border-white/10 p-2">
              <LogOut className="h-4 w-4 text-white/60" />
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-6xl p-6 md:p-10">
          {children}
          <WisdomFooter />
        </div>
      </main>
      <SpiritualLayer />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-[var(--bg-void)]/95 py-2 backdrop-blur-2xl md:hidden">
        {main.slice(0, 5).map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] ${
                active ? 'text-[#FF6B35]' : 'text-white/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
