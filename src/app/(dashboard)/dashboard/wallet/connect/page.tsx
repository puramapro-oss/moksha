import { Suspense } from 'react'
import ConnectOnboarding from '@/components/wallet/ConnectOnboarding'

export const metadata = { title: 'Activer mes gains — MOKSHA' }
export const dynamic = 'force-dynamic'

export default function ConnectPage() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="glass p-8">
          <h1 className="font-display text-3xl font-extrabold">Activation indisponible</h1>
          <p className="mt-3 text-sm text-white/60">
            La configuration Stripe Connect n&apos;est pas encore déployée sur cet environnement.
            Reviens plus tard ou contacte le support.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold">
          Active tes <span className="moksha-gradient-text">gains</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Reçois tes primes (100€) et tes récompenses KARMA en euros réels sur ton compte bancaire.
        </p>
      </div>

      <Suspense fallback={<div className="glass p-10 text-center text-white/50">Chargement...</div>}>
        <ConnectOnboarding publishableKey={publishableKey} />
      </Suspense>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-[13px] leading-relaxed text-white/70">
        <p className="font-semibold text-white/90">💡 Comment ça fonctionne ?</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4">
          <li>Tu vérifies ton identité (CNI/passeport) via Stripe — 2 minutes.</li>
          <li>Chaque prime (J1 25€ · J30 25€ · J60 50€) est transférée automatiquement.</li>
          <li>Tu retires vers ton IBAN dès 20€ (frais ~2,30€) — arrivée SEPA instant.</li>
          <li>Purama déclare tes revenus selon ton profil fiscal (auto).</li>
        </ol>
      </div>
    </main>
  )
}
