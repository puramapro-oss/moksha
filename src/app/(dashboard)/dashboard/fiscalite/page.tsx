import Link from 'next/link'
import { Download, FileText, Info, AlertTriangle } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { TAX_PROFILES, type TaxProfileType, computeThresholdAlert } from '@/lib/tax'

export const metadata = { title: 'Fiscalité — MOKSHA' }
export const dynamic = 'force-dynamic'

export default async function FiscalitePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-white/60">Connecte-toi pour voir ta fiscalité.</p>
      </main>
    )
  }

  const svc = createServiceClient()
  const [taxProfileRes, walletRes] = await Promise.all([
    svc.from('moksha_user_tax_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    svc.from('moksha_user_wallets').select('yearly_earned_eur, lifetime_earned_eur').eq('user_id', user.id).maybeSingle(),
  ])

  const taxProfile = taxProfileRes.data as {
    profile_type?: TaxProfileType
    siret?: string | null
    threshold_305_alerted?: boolean
    threshold_bnc_alerted?: boolean
    threshold_tva_alerted?: boolean
  } | null
  const wallet = walletRes.data as { yearly_earned_eur?: number; lifetime_earned_eur?: number } | null

  const profileType = taxProfile?.profile_type ?? null
  const yearlyEur = Number(wallet?.yearly_earned_eur ?? 0)
  const lifetimeEur = Number(wallet?.lifetime_earned_eur ?? 0)

  const profileDef = profileType ? TAX_PROFILES[profileType] : null

  const alert = computeThresholdAlert({
    yearlyEur,
    currentProfile: profileType,
    alerted: {
      threshold_305: taxProfile?.threshold_305_alerted ?? false,
      threshold_bnc: taxProfile?.threshold_bnc_alerted ?? false,
      threshold_tva: taxProfile?.threshold_tva_alerted ?? false,
    },
  })

  const currentYear = new Date().getFullYear()

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold">
          Ma <span className="moksha-gradient-text">fiscalité</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Purama déclare automatiquement selon ton profil. Tu peux télécharger les documents à tout moment.
        </p>
      </div>

      {!profileDef && (
        <div className="glass mb-6 p-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-[#FFB300]" />
            <div className="flex-1">
              <h3 className="font-semibold">Complète ton profil fiscal</h3>
              <p className="mt-1 text-[13px] text-white/60">
                Choisis ton profil (occasionnel / BNC / AE / entreprise) pour que Purama déclare à ta place.
              </p>
              <Link
                href="/dashboard/parametres"
                className="mt-3 inline-block rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-4 py-2 text-xs font-bold text-[#070B18]"
              >
                Définir mon profil
              </Link>
            </div>
          </div>
        </div>
      )}

      {alert && (
        <div
          className={`glass mb-6 p-5 ${
            alert.level === 'critical'
              ? 'border-red-500/40 bg-red-500/5'
              : alert.level === 'warning'
              ? 'border-amber-500/40 bg-amber-500/5'
              : 'border-blue-500/40 bg-blue-500/5'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`mt-0.5 h-5 w-5 ${
                alert.level === 'critical' ? 'text-red-400' : alert.level === 'warning' ? 'text-amber-400' : 'text-blue-400'
              }`}
            />
            <div>
              <p className="font-semibold text-white">{alert.message}</p>
              <p className="mt-1 text-[13px] text-white/60">{alert.action}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="glass p-5">
          <p className="text-[11px] uppercase tracking-wide text-white/45">Année en cours</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{yearlyEur.toFixed(2)}€</p>
          <p className="mt-1 text-[12px] text-white/50">cumul {currentYear}</p>
        </div>
        <div className="glass p-5">
          <p className="text-[11px] uppercase tracking-wide text-white/45">Depuis toujours</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{lifetimeEur.toFixed(2)}€</p>
          <p className="mt-1 text-[12px] text-white/50">toutes sources</p>
        </div>
        <div className="glass p-5">
          <p className="text-[11px] uppercase tracking-wide text-white/45">Profil fiscal</p>
          <p className="mt-1 font-display text-xl font-bold capitalize">{profileDef?.shortLabel ?? '—'}</p>
          <p className="mt-1 text-[12px] text-white/50">{profileDef?.icon} {profileDef?.label?.split('(')[0]}</p>
        </div>
      </div>

      {profileDef && (
        <div className="glass mt-6 p-6">
          <h3 className="font-display text-lg font-bold">Ce que Purama fait pour toi</h3>
          <p className="mt-2 text-[13px] text-white/60">{profileDef.declaration}</p>
          <p className="mt-3 text-[13px] text-white/80">{profileDef.retraitMessage}</p>

          {(profileType === 'particulier_occasionnel' || profileType === 'particulier_bnc') && (
            <div className="mt-5 space-y-3">
              <h4 className="font-semibold text-white">Télécharger mes documents</h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/tax/prefill-2042?year=${currentYear - 1}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[13px] hover:bg-white/[0.06]"
                >
                  <Download className="h-4 w-4" /> 2042-C-PRO {currentYear - 1}
                </a>
                <a
                  href={`/api/fiscal/summary?year=${currentYear - 1}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[13px] hover:bg-white/[0.06]"
                >
                  <FileText className="h-4 w-4" /> Récap {currentYear - 1}
                </a>
              </div>
              <p className="text-[11px] text-white/40">
                Le PDF 2042-C-PRO pré-rempli te fait gagner 10 secondes sur impots.gouv.fr (case 5NG).
              </p>
            </div>
          )}

          {profileType === 'autoentrepreneur' && (
            <div className="mt-5">
              <p className="text-[13px] text-white/60">
                Mandat URSSAF Tierce Déclaration à signer (2 min) pour que Purama déclare automatiquement.
              </p>
              <Link
                href="/dashboard/fiscalite/urssaf"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-4 py-2.5 text-[13px] font-bold text-[#070B18]"
              >
                Signer le mandat URSSAF
              </Link>
            </div>
          )}

          {profileType === 'entreprise' && (
            <div className="mt-5">
              <p className="text-[13px] text-white/60">
                Connecte ton Pennylane pour l&apos;envoi automatique des Factur-X.
              </p>
              <Link
                href="/dashboard/fiscalite/pennylane"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-4 py-2.5 text-[13px] font-bold text-[#070B18]"
              >
                Connecter Pennylane
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-[12px] leading-relaxed text-white/55">
        <p>
          📚 En savoir plus : <Link href="/fiscal" className="underline">Guide fiscal Purama</Link> — seuils, abattements, cas pratiques.
        </p>
        <p className="mt-2">
          ⚖️ Ce document est informatif. Purama n&apos;est pas expert-comptable ; elle agit uniquement comme tiers déclarant URSSAF (mandat)
          et pré-remplisseur 2042/Factur-X. Consulte un professionnel pour ta situation personnelle.
        </p>
      </div>
    </main>
  )
}
