import Link from 'next/link'
import { Sparkles, Users, Euro, Link2, Gift } from 'lucide-react'

export const metadata = {
  title: 'Devenir influenceur MOKSHA — 50% au 1er paiement + 10% à vie',
  description:
    'Rejoins le programme influenceur MOKSHA. 50% de commission sur le premier paiement de tes filleuls + 10% récurrent à vie. 8 paliers Bronze → Éternel.',
}

const PALIERS = [
  { tier: 'Bronze', filleuls: 10, gain: '50€', bonus: 'Plan Starter GRATUIT' },
  { tier: 'Argent', filleuls: 25, gain: '150€', bonus: 'Plan Pro + early access 7j' },
  { tier: 'Or', filleuls: 50, gain: '400€', bonus: 'Unlimited + page perso' },
  { tier: 'Platine', filleuls: 100, gain: '1 000€', bonus: 'Enterprise + priorité feature' },
  { tier: 'Diamant', filleuls: 250, gain: '3 000€', bonus: 'VIP + commissions héréditaires' },
  { tier: 'Légende', filleuls: 500, gain: '6 500€', bonus: 'Commissions héréditaires' },
  { tier: 'Titan', filleuls: 5000, gain: '50 000€', bonus: 'Ligne de produits' },
  { tier: 'Éternel', filleuls: 10000, gain: '100 000€', bonus: '1% de parts + héritage' },
]

export default function DevenirInfluenceurPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-16">
      <div className="text-center">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#FFD700]" />
        <h1
          className="font-[family-name:var(--font-display)] text-4xl font-extrabold md:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Deviens influenceur MOKSHA
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
          Recommande MOKSHA à ton audience et touche <strong className="text-[#FFD700]">50%</strong>{' '}
          du premier paiement de chaque filleul +{' '}
          <strong className="text-[#FFD700]">10% récurrent à vie</strong>. 0 investissement, 100%
          éthique.
        </p>

        <Link
          href="/auth?next=/dashboard/influencer"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-8 py-4 text-base font-bold text-[#070B18] transition active:scale-[0.98]"
        >
          Je me lance <Link2 className="h-4 w-4" />
        </Link>
      </div>

      {/* Comment ça marche */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <Users className="mb-3 h-6 w-6 text-[#FF6B35]" />
          <h3 className="font-semibold">1. Crée ton profil</h3>
          <p className="mt-2 text-sm text-white/60">
            Connecte-toi, choisis ton pseudo et reçois ton lien personnalisé MOKSHA.purama.dev/go/[toi].
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <Link2 className="mb-3 h-6 w-6 text-[#FFD700]" />
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
          <Gift className="h-5 w-5 text-[#FFD700]" />
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
                <span className="text-xs text-white/50">{p.filleuls} filleuls</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/60">{p.bonus}</span>
                <span className="text-sm font-bold text-[#5DCAA5]">{p.gain}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#5DCAA5]/20 bg-[#5DCAA5]/5 p-6 text-center">
        <p className="text-sm text-white/70">
          Déjà inscrit ? Rends-toi dans ton dashboard influenceur pour récupérer ton lien.
        </p>
        <Link
          href="/dashboard/influencer"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#5DCAA5]/30 bg-[#5DCAA5]/10 px-5 py-2 text-sm font-semibold text-[#5DCAA5] hover:bg-[#5DCAA5]/15"
        >
          Dashboard influenceur
        </Link>
      </div>
    </div>
  )
}
