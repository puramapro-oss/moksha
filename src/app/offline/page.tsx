import { WifiOff } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B18] p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <WifiOff className="h-16 w-16 text-white/30" />
        <h1 className="text-2xl font-extrabold">Hors connexion</h1>
        <p className="text-sm text-white/50">
          MOKSHA a besoin d&apos;internet pour fonctionner. Vérifie ta connexion et réessaie.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18]"
        >
          Réessayer
        </Link>
      </div>
    </div>
  )
}
