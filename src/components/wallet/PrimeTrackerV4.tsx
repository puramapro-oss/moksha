import { createServiceClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CheckCircle2, Clock, AlertTriangle, Euro } from 'lucide-react'

interface PrimeRow {
  palier_actuel: number
  montant_verse_eur: number
  montant_total_eur: number
  prime_mode: string
  subscription_payment_check_1: boolean
  subscription_payment_check_2: boolean
  subscription_payment_check_3: boolean
  palier_suspended: boolean
  palier_1_date: string | null
  palier_2_date: string | null
  palier_3_date: string | null
  recuperee: boolean
}

interface ConnectRow {
  payouts_enabled: boolean | null
}

const PALIER_CONFIG = [
  { num: 1 as const, amount: 25, delay: 'J1', condition: '1er paiement abo', day: 'Dès paiement' },
  { num: 2 as const, amount: 25, delay: 'J30', condition: '2ème paiement abo', day: 'À J+30' },
  { num: 3 as const, amount: 50, delay: 'J60', condition: '3ème paiement abo', day: 'À J+60' },
]

export default async function PrimeTrackerV4() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const svc = createServiceClient()
  const { data: prime } = await svc
    .from('moksha_primes_v4')
    .select('*')
    .eq('user_id', user.id)
    .eq('app_id', 'moksha')
    .maybeSingle<PrimeRow>()

  const { data: connect } = await svc
    .from('moksha_connect_accounts')
    .select('payouts_enabled')
    .eq('user_id', user.id)
    .maybeSingle<ConnectRow>()

  if (!prime) return null

  const checks = [
    prime.subscription_payment_check_1,
    prime.subscription_payment_check_2,
    prime.subscription_payment_check_3,
  ]
  const dates = [prime.palier_1_date, prime.palier_2_date, prime.palier_3_date]

  const connectReady = connect?.payouts_enabled === true

  return (
    <div className="glass p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Prime de bienvenue</h3>
          <p className="mt-0.5 text-[13px] text-white/55">
            {prime.montant_verse_eur.toFixed(0)}€ versés / {prime.montant_total_eur.toFixed(0)}€ au total · {prime.prime_mode}
          </p>
        </div>
        {prime.recuperee && (
          <span className="rounded-full bg-red-500/20 px-3 py-1 text-[11px] text-red-300">Récupérée (rétractation)</span>
        )}
        {prime.palier_suspended && !prime.recuperee && (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] text-amber-300">
            <AlertTriangle className="mr-1 inline h-3 w-3" /> Paiement à régulariser
          </span>
        )}
      </div>

      <div className="space-y-3">
        {PALIER_CONFIG.map((p, i) => {
          const versé = prime.palier_actuel >= p.num
          const éligible = checks[i] && !prime.palier_suspended && !versé && !prime.recuperee
          const dateVersement = dates[i]
          return (
            <div
              key={p.num}
              className={`flex items-center gap-3 rounded-xl border p-4 ${
                versé
                  ? 'border-[#5DCAA5]/30 bg-[#5DCAA5]/5'
                  : éligible
                  ? 'border-[#FFD700]/30 bg-[#FFD700]/5'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  versé ? 'bg-[#5DCAA5]/20' : éligible ? 'bg-[#FFD700]/20' : 'bg-white/5'
                }`}
              >
                {versé ? (
                  <CheckCircle2 className="h-5 w-5 text-[#5DCAA5]" />
                ) : éligible ? (
                  <Euro className="h-5 w-5 text-[#FFD700]" />
                ) : (
                  <Clock className="h-5 w-5 text-white/40" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Palier {p.num} — {p.amount}€
                  </span>
                  <span className="text-[11px] text-white/50">{p.delay}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-white/55">
                  {versé && dateVersement
                    ? `Versé le ${new Date(dateVersement).toLocaleDateString('fr-FR')}`
                    : éligible
                    ? connectReady
                      ? 'Éligible — versement au prochain CRON (6h30)'
                      : 'Éligible — active Stripe Connect pour recevoir'
                    : `En attente : ${p.condition}`}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {!connectReady && !prime.recuperee && (
        <a
          href="/dashboard/wallet/connect"
          className="mt-5 block rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-3 text-center text-sm font-bold text-[#070B18]"
        >
          Activer Stripe Connect pour recevoir mes euros
        </a>
      )}

      <p className="mt-4 text-[11px] text-white/40">
        Primes versées en euros réels via Stripe Connect (STEL EMI passportée FR).
        Retrait SEPA instant dès 20€ (≈2,30€ de frais, recommandé à partir de 50€).
      </p>
    </div>
  )
}
