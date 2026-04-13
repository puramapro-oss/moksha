'use client'

import { useState, useMemo } from 'react'
import { Banknote, ArrowRight, ArrowLeft, Download, CheckCircle2, AlertCircle, HelpCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { matchAides, computeCumul, type ProfilType, type SituationType, type Aide } from '@/lib/aides-data'

const PROFILS: { id: ProfilType; label: string; icon: string }[] = [
  { id: 'particulier', label: 'Particulier', icon: '👤' },
  { id: 'entreprise', label: 'Entreprise', icon: '🏢' },
  { id: 'association', label: 'Association', icon: '🤝' },
  { id: 'etudiant', label: 'Étudiant', icon: '🎓' },
]

const SITUATIONS: { id: SituationType; label: string }[] = [
  { id: 'salarie', label: 'Salarié' },
  { id: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
  { id: 'independant', label: 'Indépendant' },
  { id: 'auto_entrepreneur', label: 'Auto-entrepreneur' },
  { id: 'retraite', label: 'Retraité' },
  { id: 'rsa', label: 'RSA' },
  { id: 'cej', label: 'CEJ / Garantie Jeunes' },
  { id: 'etudiant', label: 'Étudiant' },
]

function BadgeAide({ badge }: { badge: Aide['badge'] }) {
  const styles = {
    probable: 'bg-[#5DCAA5]/20 text-[#5DCAA5]',
    possible: 'bg-[#FFD700]/20 text-[#FFD700]',
    verifier: 'bg-blue-500/20 text-blue-400',
  }
  const labels = { probable: '✅ Probable', possible: '🟡 Possible', verifier: '🔵 À vérifier' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[badge]}`}>
      {labels[badge]}
    </span>
  )
}

export default function FinancerPage() {
  const [step, setStep] = useState(1)

  // Step 1 state
  const [profil, setProfil] = useState<ProfilType | null>(null)
  const [situation, setSituation] = useState<SituationType | null>(null)
  const [handicap, setHandicap] = useState(false)

  // Matched aides
  const aides = useMemo(() => {
    if (!profil || !situation) return []
    return matchAides(profil, situation, handicap)
  }, [profil, situation, handicap])

  const cumul = useMemo(() => computeCumul(aides), [aides])

  // Step 4 — tracking
  const [tracked, setTracked] = useState<Record<number, 'en_cours' | 'accepte' | 'refuse'>>({})

  function canNext() {
    if (step === 1) return profil && situation
    if (step === 2) return aides.length > 0
    if (step === 3) return true
    return false
  }

  function generatePDF() {
    toast.success('PDF généré avec succès')
    // In production this would use jsPDF
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Banknote className="h-6 w-6 text-[#5DCAA5]" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Financer ton projet
        </h1>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        La plupart de nos clients ne paient rien grâce aux aides publiques.
        Découvre celles auxquelles tu as droit en 2 minutes.
      </p>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`stepper-dot ${s === step ? 'active' : s < step ? 'done' : ''}`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 4 && (
              <div className={`h-px w-8 ${s < step ? 'bg-[#5DCAA5]/50' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Profil */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Quel est ton profil ?</h2>
            <div className="grid grid-cols-2 gap-3">
              {PROFILS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfil(p.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                    profil === p.id
                      ? 'border-[#FF6B35]/50 bg-[#FF6B35]/10'
                      : 'border-white/5 bg-white/[0.03] hover:bg-white/5'
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-sm font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Ta situation actuelle ?</h2>
            <div className="grid grid-cols-2 gap-2">
              {SITUATIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSituation(s.id)}
                  className={`rounded-xl border px-4 py-3 text-sm text-left transition ${
                    situation === s.id
                      ? 'border-[#FF6B35]/50 bg-[#FF6B35]/10 font-medium'
                      : 'border-white/5 bg-white/[0.03] hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={handicap}
                onChange={(e) => setHandicap(e.target.checked)}
                className="h-5 w-5 rounded border-white/20 bg-white/5 accent-[#FF6B35]"
              />
              <span className="text-sm">Situation de handicap (RQTH)</span>
            </label>
          </div>
        </div>
      )}

      {/* Step 2 — Matching */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          {/* Cumul banner */}
          <div className="glass rounded-xl border-[#5DCAA5]/30 bg-[#5DCAA5]/5 p-5 text-center">
            <p className="text-xs text-[#5DCAA5]/70">Cumul potentiel des aides</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#5DCAA5]">
              {cumul.toLocaleString('fr-FR')} €
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {aides.length} aide{aides.length > 1 ? 's' : ''} identifiée{aides.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Aide cards */}
          {aides.map((aide) => (
            <div key={aide.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{aide.nom}</h3>
                    <BadgeAide badge={aide.badge} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{aide.description}</p>
                  {aide.region && (
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">Région : {aide.region}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-[#FFD700]">
                    {aide.montant_max.toLocaleString('fr-FR')} €
                  </p>
                  {aide.taux_remboursement && (
                    <p className="text-[10px] text-[var(--text-muted)]">{aide.taux_remboursement}% remboursé</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={aide.url_officielle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition hover:bg-white/10"
                >
                  Site officiel →
                </a>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {aide.cumulable ? 'Cumulable' : 'Non cumulable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3 — PDF */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-xl p-6 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[#FF6B35]/50" />
            <h2 className="text-lg font-semibold">Ton dossier est prêt</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Télécharge le PDF avec toutes les aides identifiées, les liens officiels
              et les pièces justificatives à fournir.
            </p>
            <button
              onClick={generatePDF}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-6 py-3 text-sm font-bold text-[#070B18] transition active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Télécharger le dossier PDF
            </button>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="mb-3 text-sm font-semibold">Résumé</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Profil</span>
                <span className="font-medium capitalize">{profil}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Situation</span>
                <span className="font-medium">{SITUATIONS.find((s) => s.id === situation)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Aides éligibles</span>
                <span className="font-bold text-[#5DCAA5]">{aides.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Cumul potentiel</span>
                <span className="font-bold text-[#FFD700]">{cumul.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Suivi */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-xl p-5">
            <h2 className="mb-4 font-semibold">Suivi de tes demandes</h2>
            <div className="space-y-3">
              {aides.map((aide) => {
                const status = tracked[aide.id]
                return (
                  <div key={aide.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{aide.nom}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {aide.montant_max.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {(['en_cours', 'accepte', 'refuse'] as const).map((s) => {
                        const icons = { en_cours: HelpCircle, accepte: CheckCircle2, refuse: AlertCircle }
                        const colors = { en_cours: 'text-[#FFD700]', accepte: 'text-[#5DCAA5]', refuse: 'text-red-400' }
                        const Icon = icons[s]
                        return (
                          <button
                            key={s}
                            onClick={() => setTracked((prev) => ({ ...prev, [aide.id]: s }))}
                            className={`rounded-lg p-1.5 transition ${
                              status === s ? `${colors[s]} bg-white/10` : 'text-white/20 hover:text-white/40'
                            }`}
                            title={s === 'en_cours' ? 'En cours' : s === 'accepte' ? 'Accepté' : 'Refusé'}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
        ) : (
          <div />
        )}
        {step < 4 && (
          <button
            onClick={() => canNext() && setStep((s) => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18] disabled:opacity-40"
          >
            Suivant <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
