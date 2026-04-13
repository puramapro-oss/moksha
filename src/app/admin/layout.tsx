'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ShieldAlert, Users, FileText, DollarSign, Trophy, LayoutDashboard, MessageSquare, Star, Mail } from 'lucide-react'
import Logo from '@/components/shared/Logo'
import { useAuth } from '@/hooks/useAuth'

const links = [
  { href: '/admin', label: 'Vue globale', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/demarches', label: 'Démarches', icon: FileText },
  { href: '/admin/parrainages', label: 'Parrainages', icon: Users },
  { href: '/admin/wallet', label: 'Wallet', icon: DollarSign },
  { href: '/admin/concours', label: 'Concours', icon: Trophy },
  { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/admin/points', label: 'Points', icon: Star },
  { href: '/admin/contact', label: 'Messages', icon: Mail },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isSuperAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isSuperAdmin) router.replace('/dashboard')
  }, [loading, isSuperAdmin, router])

  if (loading) return <div className="p-10 text-white/50">Ton espace se prépare...</div>
  if (!isSuperAdmin) return null

  return (
    <div className="relative z-10 flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-[#0A0F1E]/60 p-5 backdrop-blur-xl md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-2">
          <Logo size="sm" />
          <span className="rounded-full bg-[#FF6B35]/20 px-2 py-0.5 text-[10px] font-bold text-[#FF6B35]">ADMIN</span>
        </div>
        <nav className="space-y-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/admin' && pathname?.startsWith(l.href))
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active ? 'border border-[#FF6B35]/30 bg-[#FF6B35]/10 text-white' : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            )
          })}
        </nav>
        <Link
          href="/dashboard"
          className="mt-auto flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10"
        >
          ← Retour dashboard
        </Link>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          <ShieldAlert className="h-4 w-4" /> Tu es en zone admin — agis avec précaution.
        </div>
        {children}
      </main>
    </div>
  )
}
