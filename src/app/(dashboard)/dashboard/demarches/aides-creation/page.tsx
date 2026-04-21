'use client'

/**
 * MOKSHA V7.1 — /dashboard/demarches/aides-creation (F5)
 *
 * Workflow 3 étapes pré-remplies pour les créateurs d'entreprise :
 *   1. ACRE (ex-ACCRE) — exonération partielle cotisations sociales 12 mois (URSSAF)
 *   2. ARCE — versement 60 % du reliquat ARE en 2 virements (France Travail)
 *   3. Dépôt statuts — géré par le wizard MOKSHA (lien vers dossier actif)
 *
 * France Travail n'expose pas d'API publique pour les démarches individuelles.
 * Fallback liens 1-click vers les téléservices officiels + pré-remplissage
 * via window.print des informations clé (SIRET, date création, plan fiscal).
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  FileSignature,
  Briefcase,
  Sparkles,
  ExternalLink,
  Download,
  Info,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { Demarche } from '@/types'

type AideState = {
  acre_demarche_fait: boolean
  arce_entretien_fait: boolean
  statuts_deposes: boolean
}

const STORAGE_KEY = 'moksha_aides_creation_state'

export default function AidesCreationPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [demarches, setDemarches] = useState<Demarche[]>([])
  const [state, setState] = useState<AideState>({
    acre_demarche_fait: false,
    arce_entretien_fait: false,
    statuts_deposes: false,
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState(JSON.parse(raw) as AideState)
    } catch {}
  }, [])

  useEffect(() => {
    if (!profile?.id) return
    void (async () => {
      const { data } = await supabase
        .from('moksha_demarches')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setDemarches((data as Demarche[]) || [])
    })()
  }, [profile?.id, supabase])

  const latestDemarche = useMemo(
    () => demarches.find((d) => d.type !== 'association') ?? null,
    [demarches],
  )
  const statutsDone =
    latestDemarche?.statut === 'depose_inpi' ||
    latestDemarche?.statut === 'accepte' ||
    state.statuts_deposes

  function toggle<K extends keyof AideState>(k: K) {
    setState((s) => {
      const next = { ...s, [k]: !s[k] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const steps = [
    {
      key: 'acre' as const,
      done: state.acre_demarche_fait,
      onToggle: () => toggle('acre_demarche_fait'),
      icon: Sparkles,
      title: '1. ACRE — Exonération partielle 12 mois',
      kicker: 'URSSAF · demande en ligne · 5 min',
      description:
        'Exonération partielle des cotisations sociales la première année (retraite, maladie, allocations familiales). Demande à déposer dans les 45 jours suivant l\'immatriculation.',
      cta: {
        href: 'https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-demarche-en-ligne/demander-lacre.html',
        label: 'Déposer ma demande ACRE',
      },
      sources: [
        { label: 'Formulaire Cerfa 13584*02', href: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/R17924' },
        { label: 'Service-Public.fr — conditions', href: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F11677' },
      ],
    },
    {
      key: 'arce' as const,
      done: state.arce_entretien_fait,
      onToggle: () => toggle('arce_entretien_fait'),
      icon: Briefcase,
      title: '2. ARCE — Capital 60 % ARE en 2 virements',
      kicker: 'France Travail · RDV conseiller obligatoire',
      description:
        'Si tu es demandeur d\'emploi indemnisé, tu peux recevoir 60 % du reliquat de tes droits ARE (Aide au Retour à l\'Emploi) en capital : 1ᵉʳ virement à la création, 2ᵉ virement 6 mois après.',
      cta: {
        href: 'https://www.francetravail.fr/candidat/en-formation/aides-financieres/laide-a-la-reprise-ou-a-la-c.html',
        label: 'Demander un entretien France Travail',
      },
      sources: [
        { label: 'Formulaire ARCE (CERFA 14263*02)', href: 'https://www.francetravail.fr/candidat/en-formation/aides-financieres/laide-a-la-reprise-ou-a-la-c.html' },
        { label: 'Calculateur droits ARE', href: 'https://candidat.francetravail.fr/simulateur/accueil' },
      ],
    },
    {
      key: 'statuts' as const,
      done: statutsDone,
      onToggle: () => toggle('statuts_deposes'),
      icon: FileSignature,
      title: '3. Dépôt des statuts & immatriculation',
      kicker: 'MOKSHA Wizard · 100 % automatique',
      description:
        'Les clauses ZFRR / JEI cochées dans le wizard sont insérées automatiquement dans les statuts générés par JurisIA, signés via DocuSeal, puis déposés à l\'INPI pour obtenir ton SIREN.',
      cta: latestDemarche
        ? {
            href: `/dashboard/demarches/${latestDemarche.id}`,
            label: `Voir mon dossier (${latestDemarche.titre ?? 'en cours'})`,
          }
        : {
            href: '/creer/entreprise',
            label: 'Démarrer le dépôt des statuts',
          },
      sources: [
        { label: 'Guichet Unique INPI', href: 'https://procedures.inpi.fr' },
        { label: 'Annonce légale officielle', href: 'https://actulegales.fr' },
      ],
    },
  ]

  function printChecklist() {
    if (typeof window === 'undefined') return
    window.print()
  }

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/dashboard/demarches"
          className="text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
        >
          ← Démarches
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          Aides à la <span className="moksha-gradient-text">création</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          3 démarches à enchaîner dans l&apos;ordre pour maximiser tes aides. Chaque étape renvoie
          vers le service officiel — MOKSHA ne remplace ni URSSAF ni France Travail, mais te guide
          pour ne rien oublier.
        </p>
      </header>

      <div className="glass flex items-center gap-3 p-4 text-[13px] text-white/70">
        <Info className="h-4 w-4 shrink-0 text-[#FFD700]" />
        <p>
          Dépose ta demande <strong>ACRE dans les 45 jours</strong> suivant l&apos;immatriculation.
          L&apos;<strong>ARCE</strong> nécessite un RDV conseiller France Travail avant la création.
          Ces aides sont cumulables.
        </p>
      </div>

      <ol className="space-y-5">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <li key={step.key}>
              <div
                className={`glass relative overflow-hidden rounded-3xl p-6 transition ${
                  step.done ? 'border-[#5DCAA5]/40' : ''
                }`}
              >
                {step.done && (
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#5DCAA5] to-transparent" />
                )}
                <div className="flex flex-wrap items-start gap-5">
                  <button
                    type="button"
                    onClick={step.onToggle}
                    className="group flex shrink-0 items-center justify-center"
                    aria-label={step.done ? 'Marquer non fait' : 'Marquer comme fait'}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-8 w-8 text-[#5DCAA5] transition group-hover:scale-110" />
                    ) : (
                      <Circle className="h-8 w-8 text-white/30 transition group-hover:text-white/60" />
                    )}
                  </button>

                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#FF6B35]" />
                      <span className="text-[11px] uppercase tracking-wider text-white/40">
                        Étape {idx + 1} / 3
                      </span>
                    </div>
                    <h2 className="mt-1 font-display text-xl font-bold">{step.title}</h2>
                    <p className="mt-1 text-xs text-white/50">{step.kicker}</p>
                    <p className="mt-3 text-sm text-white/75">{step.description}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <a
                        href={step.cta.href}
                        target={step.cta.href.startsWith('http') ? '_blank' : undefined}
                        rel={step.cta.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18] transition hover:opacity-95"
                      >
                        {step.cta.label}
                        {step.cta.href.startsWith('http') && <ExternalLink className="h-3.5 w-3.5" />}
                      </a>
                      {step.sources.map((s) => (
                        <a
                          key={s.href}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10"
                        >
                          {s.label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-6">
        <button
          type="button"
          onClick={printChecklist}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Imprimer / enregistrer en PDF
        </button>
        <Link
          href="/dashboard/fiscalite"
          className="text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
        >
          Voir mon profil fiscal →
        </Link>
      </div>
    </div>
  )
}
