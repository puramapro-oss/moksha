import Link from 'next/link'
import { Zap, Trophy, Target, Flame, Globe } from 'lucide-react'
import LandingNav from '@/components/layout/LandingNav'
import { createServiceClient } from '@/lib/supabase'
import { getCurrentDrawPeriod } from '@/lib/karma-tickets'

export const metadata = { title: 'KARMA — Jeux-concours gratuits MOKSHA' }
export const dynamic = 'force-dynamic'

async function getPoolStats() {
  const svc = createServiceClient()
  const week = getCurrentDrawPeriod('week')
  const month = getCurrentDrawPeriod('month')

  const [weekTickets, monthTickets, weekDraw, monthDraw] = await Promise.all([
    svc.from('moksha_karma_tickets').select('id', { count: 'exact', head: true }).eq('draw_type', 'week').eq('draw_period', week).eq('used', false),
    svc.from('moksha_karma_tickets').select('id', { count: 'exact', head: true }).eq('draw_type', 'month').eq('draw_period', month).eq('used', false),
    svc.from('moksha_karma_draws').select('pool_eur, draw_date').eq('type', 'week').eq('period', week).maybeSingle<{ pool_eur: number; draw_date: string }>(),
    svc.from('moksha_karma_draws').select('pool_eur, draw_date').eq('type', 'month').eq('period', month).maybeSingle<{ pool_eur: number; draw_date: string }>(),
  ])

  return {
    weekTickets: weekTickets.count ?? 0,
    monthTickets: monthTickets.count ?? 0,
    weekPool: weekDraw.data?.pool_eur ?? 10,
    monthPool: monthDraw.data?.pool_eur ?? 50,
    weekPeriod: week,
    monthPeriod: month,
  }
}

export default async function KarmaPage() {
  const stats = await getPoolStats()

  return (
    <>
      <LandingNav />
      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-20">
        <div className="text-center">
          <span className="inline-block rounded-full bg-[#FFB300]/10 px-4 py-1.5 text-xs font-bold text-[#FFB300]">
            🎰 JEUX-CONCOURS GRATUITS
          </span>
          <h1 className="mt-4 font-display text-5xl font-extrabold">
            <span className="moksha-gradient-text">KARMA</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            6 jeux gratuits. Participation sans obligation d&apos;achat.
            4 jeux de skill + 2 tirages au sort certifiés random.org.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="glass p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#FF3D00]/20 p-2.5">
                <Zap className="h-6 w-6 text-[#FF3D00]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/45">Tirage hebdomadaire</p>
                <p className="font-display text-2xl font-extrabold">{stats.weekPool.toFixed(0)}€</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-white/55">
              {stats.weekTickets.toLocaleString()} tickets en jeu cette semaine ({stats.weekPeriod}).
              Prochain tirage dimanche 23h59.
            </p>
          </div>

          <div className="glass p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#FFB300]/20 p-2.5">
                <Trophy className="h-6 w-6 text-[#FFB300]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/45">Tirage mensuel</p>
                <p className="font-display text-2xl font-extrabold">{stats.monthPool.toFixed(0)}€</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-white/55">
              {stats.monthTickets.toLocaleString()} tickets en jeu ({stats.monthPeriod}).
              3 gagnants — 60% / 25% / 15%. Tirage le 1er du mois suivant.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Target, title: 'Leaderboard Impact', desc: 'Score skill 7 piliers — classement public' },
            { icon: Flame, title: 'Défis collectifs', desc: 'Hebdomadaire, objectifs business' },
            { icon: Trophy, title: 'Classement Karma', desc: 'Mensuel — top entrepreneurs actifs' },
            { icon: Target, title: 'Quête Rare 21j', desc: 'Crée ta SASU en 21 jours parfaits' },
            { icon: Zap, title: 'Roue du Dharma', desc: 'Tirage quotidien gratuit' },
            { icon: Globe, title: 'Jackpot Terre', desc: 'Mensuel — 20% ONG (reçu fiscal 66%)' },
          ].map((g) => (
            <div key={g.title} className="glass p-5">
              <g.icon className="h-6 w-6 text-[#FFB300]" />
              <h3 className="mt-3 font-display text-lg font-bold">{g.title}</h3>
              <p className="mt-1 text-[13px] text-white/55">{g.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="font-display text-lg font-bold">Comment obtenir des tickets — 18 façons gratuites</h3>
          <div className="mt-4 grid gap-x-6 gap-y-2 text-[13px] text-white/65 sm:grid-cols-2">
            <span>✓ Inscription : +1 semaine + 1 mois</span>
            <span>✓ Parrainage : +2 (parrain + filleul)</span>
            <span>✓ Mission complétée : +1</span>
            <span>✓ Avis App Store / Play Store : +3 chacun</span>
            <span>✓ Follow Insta / TikTok / YouTube : +1 chacun</span>
            <span>✓ Story Insta / TikTok : +1 chacun</span>
            <span>✓ Vidéo TikTok / Reels : +2</span>
            <span>✓ Partage évolution/parrainage : +1 (max 3/j)</span>
            <span>✓ Challenge gagné : +2</span>
            <span>✓ Streak 7j : +1 · Streak 30j : +5</span>
            <span>✓ Feedback in-app : +1</span>
            <span>✓ Abonné payant : ×5 multiplicateur</span>
          </div>
          <p className="mt-4 text-[11px] text-white/40">
            L&apos;abonnement est <strong>facultatif</strong>. Il donne un multiplicateur mais n&apos;est jamais nécessaire pour participer.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/50">
          <Link href="/reglement" className="text-[#FF3D00] underline">Règlement complet + hash blockchain</Link>
          <Link href="/remboursement" className="text-[#FF3D00] underline">Remboursement des frais</Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/35">
          🌱 Participation gratuite et sans obligation d&apos;achat.
          Règlement horodaté sur Tezos via OriginStamp. Conformité ANJ, RGPD, Code de la consommation.
        </p>
      </main>
    </>
  )
}
