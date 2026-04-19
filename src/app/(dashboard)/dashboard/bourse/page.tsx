import Link from 'next/link'
import { Info, CheckCircle2 } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { PROFIL_LABELS, MISSIONS_CITOYENNES, type ProfilSocial } from '@/lib/bourses'
import BourseClient from '@/components/bourse/BourseClient'

export const metadata = { title: 'Bourse d\'inclusion — MOKSHA' }
export const dynamic = 'force-dynamic'

export default async function BoursePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-white/60">Connecte-toi pour accéder à la bourse d&apos;inclusion.</p>
      </main>
    )
  }

  const svc = createServiceClient()
  const { data: bourse } = await svc
    .from('moksha_bourses_inclusion')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const profilsSafe = (Array.isArray(bourse?.profil_social) ? bourse?.profil_social : []) as ProfilSocial[]
  const proofsSafe = (Array.isArray(bourse?.proof_documents) ? bourse?.proof_documents : []) as Array<{
    slug?: string
    status?: string
  }>

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold">
          Bourse d&apos;<span className="moksha-gradient-text">inclusion</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Programme Association Purama — financé par subventions (Afnic, FDJ, Fondation de France, Orange…).
          <br />50€ à 200€ selon profil, après 5 missions citoyennes vérifiées.
        </p>
      </div>

      <div className="glass mb-6 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-[#5DCAA5]" />
          <div className="text-[13px] leading-relaxed text-white/70">
            <p className="font-semibold text-white">Dual circuit strict</p>
            <p className="mt-1">
              La bourse d&apos;inclusion est financée par des subventions reçues par l&apos;Association Purama
              (loi 1901, RNA déclaré). Elle est <strong>distincte</strong> de la prime de bienvenue (100€) financée par la SASU.
              Tu peux cumuler les deux si tu es éligible.
            </p>
          </div>
        </div>
      </div>

      {bourse ? (
        <>
          <div className="glass mb-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/45">Montant de ta bourse</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-[#5DCAA5]">
                  {Number(bourse.montant_eur).toFixed(0)}€
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profilsSafe.map((p) => (
                    <span key={p} className="rounded-full bg-white/[0.05] px-3 py-1 text-[11px]">
                      {PROFIL_LABELS[p]?.icon} {PROFIL_LABELS[p]?.label}
                    </span>
                  ))}
                </div>
              </div>
              {bourse.versee ? (
                <span className="rounded-full bg-[#5DCAA5]/20 px-3 py-1.5 text-[12px] text-[#5DCAA5]">
                  <CheckCircle2 className="mr-1 inline h-4 w-4" /> Versée
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-[12px] text-amber-300">
                  En cours
                </span>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-[12px] text-white/60">
                <span>Missions validées</span>
                <span>{bourse.missions_completees ?? 0} / {bourse.missions_requises ?? 5}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] transition-all"
                  style={{ width: `${Math.min(100, ((bourse.missions_completees ?? 0) / (bourse.missions_requises ?? 5)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <BourseClient missions={MISSIONS_CITOYENNES} submittedSlugs={proofsSafe.map((p) => p.slug).filter((s): s is string => typeof s === 'string')} />
        </>
      ) : (
        <div className="glass p-6">
          <h3 className="font-display text-lg font-bold">Es-tu éligible ?</h3>
          <p className="mt-2 text-[13px] text-white/60">
            Coche les profils qui te correspondent pour activer ta bourse (auto-déclaration sous responsabilité).
          </p>
          <Link
            href="/dashboard/bourse/eligibilite"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18]"
          >
            Vérifier mon éligibilité
          </Link>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-[12px] leading-relaxed text-white/55">
        <p className="font-semibold text-white/70">Pourquoi ce programme ?</p>
        <p className="mt-1">
          Purama est engagée pour l&apos;inclusion numérique (projets soutenus par l&apos;ANCT France Numérique Ensemble).
          Chaque mission citoyenne complétée renforce notre capacité à obtenir de nouvelles subventions.
        </p>
      </div>
    </main>
  )
}
