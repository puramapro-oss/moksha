import Link from 'next/link'
import { Crown, Users, Euro, Link2, Gift } from 'lucide-react'

export const metadata = {
  title: 'Programme Ambassadeur MOKSHA — 50% à vie + paliers Bronze → Éternel',
  description:
    'Rejoins le programme Ambassadeur Purama. 50% de commission à vie sur abonnement filleul + paliers Bronze 200€ → Éternel 200 000€.',
}

const PALIERS = [
  { tier: 'Bronze', filleuls: 10, prime: '200€', bonus: 'Starter à vie' },
  { tier: 'Argent', filleuls: 25, prime: '500€', bonus: 'Pro + early access 7j' },
  { tier: 'Or', filleuls: 50, prime: '1 000€', bonus: 'Unlimited + page perso' },
  { tier: 'Platine', filleuls: 100, prime: '2 500€', bonus: 'Enterprise + priorité' },
  { tier: 'Diamant', filleuls: 250, prime: '6 000€', bonus: 'VIP' },
  { tier: 'Légende', filleuls: 500, prime: '12 000€', bonus: 'Transmission héréditaire' },
  { tier: 'Titan', filleuls: 1000, prime: '25 000€', bonus: 'Ligne de produits' },
  { tier: 'Dieu', filleuls: 5000, prime: '100 000€', bonus: 'Commissions héréditaires' },
  { tier: 'Éternel', filleuls: 10000, prime: '200 000€', bonus: '1% de parts + héritage' },
]

export default function AmbassadeurPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-16">
      <div className="text-center">
        <Crown className="mx-auto mb-4 h-10 w-10 text-[#FFB300]" />
        <h1
          className="font-[family-name:var(--font-display)] text-4xl font-extrabold md:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Programme Ambassadeur MOKSHA
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
          Recommande MOKSHA à ton audience.{' '}
          <strong className="text-[#FFB300]">50% de commission à vie</strong> sur les abonnements de
          tes filleuls + paliers de récompenses jusqu&apos;à <strong className="text-[#FFB300]">200 000€</strong>.
          0 investissement, 100% éthique.
        </p>

        <Link
          href="/auth?next=/dashboard/ambassadeur"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-8 py-4 text-base font-bold text-[#070B18] transition active:scale-[0.98]"
        >
          Postuler comme Ambassadeur <Link2 className="h-4 w-4" />
        </Link>
      </div>

      {/* Comment ça marche */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <Users className="mb-3 h-6 w-6 text-[#FF3D00]" />
          <h3 className="font-semibold">1. Crée ton profil</h3>
          <p className="mt-2 text-sm text-white/60">
            Connecte-toi, choisis ton pseudo et reçois ton lien personnalisé moksha.purama.dev/go/[toi].
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <Link2 className="mb-3 h-6 w-6 text-[#FFB300]" />
          <h3 className="font-semibold">2. Partage ton lien</h3>
          <p className="mt-2 text-sm text-white/60">
            Stories, vidéos, posts, bio. Chaque clic est tracké pendant 30 jours via cookie.
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <Euro className="mb-3 h-6 w-6 text-[#5DCAA5]" />
          <h3 className="font-semibold">3. Encaisse</h3>
          <p className="mt-2 text-sm text-white/60">
            Retrait IBAN dès 5€. Commissions créditées automatiquement à chaque paiement filleul.
          </p>
        </div>
      </div>

      {/* Paliers */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
          <Gift className="h-5 w-5 text-[#FFB300]" />
          Paliers de récompenses
        </h2>
        <div className="space-y-2">
          {PALIERS.map((p) => (
            <div
              key={p.tier}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-20 text-sm font-bold">{p.tier}</span>
                <span className="text-xs text-white/50">{p.filleuls.toLocaleString('fr-FR')} filleuls</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden text-xs text-white/60 md:inline">{p.bonus}</span>
                <span className="text-sm font-bold text-[#5DCAA5]">{p.prime}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/40">
          Commission conditionnée à 30 jours d&apos;activité réelle du filleul. Versements sur wallet, retrait IBAN dès 5€.
        </p>
      </div>

      <div className="rounded-2xl border border-[#5DCAA5]/20 bg-[#5DCAA5]/5 p-6 text-center">
        <p className="text-sm text-white/70">
          Déjà inscrit ? Rends-toi dans ton espace Ambassadeur pour récupérer ton lien.
        </p>
        <Link
          href="/dashboard/ambassadeur"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#5DCAA5]/30 bg-[#5DCAA5]/10 px-5 py-2 text-sm font-semibold text-[#5DCAA5] hover:bg-[#5DCAA5]/15"
        >
          Espace Ambassadeur
        </Link>
      </div>
    </div>
  )
}
