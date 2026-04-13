'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Banknote,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

type ProfilType = 'particulier' | 'entreprise' | 'association' | 'etudiant'
type SituationType =
  | 'salarie'
  | 'demandeur_emploi'
  | 'independant'
  | 'auto_entrepreneur'
  | 'retraite'
  | 'rsa'
  | 'cej'
  | 'etudiant'

type Aide = {
  id: number
  nom: string
  type_aide: string
  profil_eligible: string[]
  situation_eligible: string[]
  montant_max: number
  taux_remboursement: number | null
  url_officielle: string
  description: string
  region: string | null
  handicap_only: boolean
  cumulable: boolean
  badge: 'probable' | 'possible' | 'verifier'
}

type Dossier = {
  id: string
  aide_id: number
  statut: 'en_cours' | 'accepte' | 'refuse' | 'renouveler'
  moksha_aides?: { nom: string; montant_max: number; badge: string; url_officielle: string }
}

const PROFILS: { id: ProfilType; label: string; icon: string }[] = [
  { id: 'particulier', label: 'Particulier', icon: '👤' },
  { id: 'entreprise', label: 'Entreprise', icon: '🏢' },
  { id: 'association', label: 'Association', icon: '🤝' },
  { id: 'etudiant', label: 'Étudiant', icon: '🎓' },
]

const SITUATIONS: { id: SituationType; label: string }[] = [
  { id: 'salarie', label: 'Salarié' },
  { id: 'demandeur_emploi', label: "Demandeur d'emploi" },
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
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[badge]}`}
    >
      {labels[badge]}
    </span>
  )
}

export default function FinancerPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [savingDossiers, setSavingDossiers] = useState(false)

  // Step 1 state
  const [profil, setProfil] = useState<ProfilType | null>(null)
  const [situation, setSituation] = useState<SituationType | null>(null)
  const [handicap, setHandicap] = useState(false)

  // Step 2 — aides from DB
  const [aides, setAides] = useState<Aide[]>([])
  const [cumul, setCumul] = useState(0)

  // Step 4 — dossiers from DB
  const [dossiers, setDossiers] = useState<Dossier[]>([])

  const fetchAides = useCallback(async () => {
    if (!profil || !situation) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        profil,
        situation,
        handicap: String(handicap),
      })
      const res = await fetch(`/api/financer?${params}`)
      const data = await res.json()
      if (res.ok) {
        setAides(data.aides ?? [])
        setCumul(data.cumul ?? 0)
      } else {
        toast.error(data.error ?? 'Erreur chargement des aides')
      }
    } catch {
      toast.error('Impossible de charger les aides')
    } finally {
      setLoading(false)
    }
  }, [profil, situation, handicap])

  // Fetch aides when moving to step 2
  useEffect(() => {
    if (step === 2) fetchAides()
  }, [step, fetchAides])

  // Fetch dossiers when moving to step 4
  useEffect(() => {
    if (step === 4) {
      fetch('/api/financer/dossiers')
        .then((r) => r.json())
        .then((data) => setDossiers(data.dossiers ?? []))
        .catch(() => {})
    }
  }, [step])

  async function saveDossiers() {
    if (!profil || !situation) return
    setSavingDossiers(true)
    try {
      let saved = 0
      for (const aide of aides) {
        const existing = dossiers.find((d) => d.aide_id === aide.id)
        if (existing) continue
        const res = await fetch('/api/financer/dossiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aide_id: aide.id, profil, situation, handicap }),
        })
        if (res.ok) saved++
      }
      if (saved > 0) toast.success(`${saved} dossier${saved > 1 ? 's' : ''} enregistré${saved > 1 ? 's' : ''}`)
      // Refresh
      const res = await fetch('/api/financer/dossiers')
      const data = await res.json()
      setDossiers(data.dossiers ?? [])
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingDossiers(false)
    }
  }

  async function updateDossierStatus(dossierId: string, statut: string) {
    try {
      const res = await fetch('/api/financer/dossiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dossierId, statut }),
      })
      if (res.ok) {
        setDossiers((prev) =>
          prev.map((d) => (d.id === dossierId ? { ...d, statut: statut as Dossier['statut'] } : d)),
        )
      } else {
        toast.error('Erreur mise à jour')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  async function generatePDF() {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // En-tête
      doc.setFontSize(22)
      doc.setTextColor(255, 107, 53)
      doc.text('MOKSHA — Dossier Financement', 20, 25)

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 33)

      // Identité
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Profil du demandeur', 20, 48)
      doc.setFontSize(10)
      doc.text(`Type : ${profil}`, 25, 56)
      doc.text(`Situation : ${SITUATIONS.find((s) => s.id === situation)?.label ?? situation}`, 25, 62)
      doc.text(`Handicap (RQTH) : ${handicap ? 'Oui' : 'Non'}`, 25, 68)

      // Résumé
      doc.setFontSize(12)
      doc.setTextColor(93, 202, 165)
      doc.text(`${aides.length} aides identifiées — Cumul potentiel : ${cumul.toLocaleString('fr-FR')} €`, 20, 82)

      // Liste des aides
      let y = 95
      doc.setTextColor(0, 0, 0)
      for (const aide of aides) {
        if (y > 270) {
          doc.addPage()
          y = 25
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${aide.nom}`, 20, y)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`Montant max : ${aide.montant_max.toLocaleString('fr-FR')} €`, 25, y + 6)
        doc.text(aide.description, 25, y + 12, { maxWidth: 160 })
        doc.text(`Lien : ${aide.url_officielle}`, 25, y + 22)
        doc.setTextColor(0, 0, 0)

        y += 30
      }

      // Mentions légales
      if (y > 250) {
        doc.addPage()
        y = 25
      }
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        'SASU PURAMA — 8 Rue de la Chapelle, 25560 Frasne — Art. 293B du CGI',
        20,
        y + 10,
      )
      doc.text(
        'Ce document est fourni à titre indicatif. Vérifiez votre éligibilité auprès des organismes officiels.',
        20,
        y + 16,
      )

      doc.save(`moksha-financement-${profil}-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('PDF téléchargé avec succès')
    } catch {
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  function canNext() {
    if (step === 1) return profil && situation
    if (step === 2) return aides.length > 0
    if (step === 3) return true
    return false
  }

  function handleNext() {
    if (!canNext()) return
    if (step === 3) {
      saveDossiers()
    }
    setStep((s) => s + 1)
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
        La plupart de nos clients ne paient rien grâce aux aides publiques. Découvre celles
        auxquelles tu as droit en 2 minutes.
      </p>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                s === step
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18]'
                  : s < step
                    ? 'bg-[#5DCAA5]/20 text-[#5DCAA5]'
                    : 'bg-white/5 text-[var(--text-muted)]'
              }`}
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
        <div className="animate-fade-in space-y-5">
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
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
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
            <label className="flex cursor-pointer items-center gap-3">
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
        <div className="animate-fade-in space-y-4">
          {loading ? (
            <div className="glass flex items-center justify-center rounded-xl p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]/50" />
              <span className="ml-3 text-sm text-[var(--text-secondary)]">
                Analyse de tes droits en cours...
              </span>
            </div>
          ) : (
            <>
              {/* Cumul banner */}
              <div className="glass rounded-xl border-[#5DCAA5]/30 bg-[#5DCAA5]/5 p-5 text-center">
                <p className="text-xs text-[#5DCAA5]/70">Cumul potentiel des aides</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#5DCAA5]">
                  {cumul.toLocaleString('fr-FR')} €
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {aides.length} aide{aides.length > 1 ? 's' : ''} identifiée
                  {aides.length > 1 ? 's' : ''}
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
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {aide.description}
                      </p>
                      {aide.region && (
                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                          Région : {aide.region}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-[#FFD700]">
                        {aide.montant_max.toLocaleString('fr-FR')} €
                      </p>
                      {aide.taux_remboursement && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {aide.taux_remboursement}% remboursé
                        </p>
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
            </>
          )}
        </div>
      )}

      {/* Step 3 — PDF */}
      {step === 3 && (
        <div className="animate-fade-in space-y-4">
          <div className="glass rounded-xl p-6 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[#FF6B35]/50" />
            <h2 className="text-lg font-semibold">Ton dossier est prêt</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Télécharge le PDF avec toutes les aides identifiées, les liens officiels et les
              pièces justificatives à fournir.
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
                <span className="font-medium">
                  {SITUATIONS.find((s) => s.id === situation)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Aides éligibles</span>
                <span className="font-bold text-[#5DCAA5]">{aides.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Cumul potentiel</span>
                <span className="font-bold text-[#FFD700]">
                  {cumul.toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Suivi */}
      {step === 4 && (
        <div className="animate-fade-in space-y-4">
          <div className="glass rounded-xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Suivi de tes demandes</h2>
              {savingDossiers && (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
              )}
            </div>

            {dossiers.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                Tes dossiers sont en cours de création...
              </p>
            ) : (
              <div className="space-y-3">
                {dossiers.map((dossier) => (
                  <div
                    key={dossier.id}
                    className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {dossier.moksha_aides?.nom ?? `Aide #${dossier.aide_id}`}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {dossier.moksha_aides?.montant_max?.toLocaleString('fr-FR') ?? '—'} €
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {(['en_cours', 'accepte', 'refuse'] as const).map((s) => {
                        const icons = {
                          en_cours: HelpCircle,
                          accepte: CheckCircle2,
                          refuse: AlertCircle,
                        }
                        const colors = {
                          en_cours: 'text-[#FFD700]',
                          accepte: 'text-[#5DCAA5]',
                          refuse: 'text-red-400',
                        }
                        const Icon = icons[s]
                        return (
                          <button
                            key={s}
                            onClick={() => updateDossierStatus(dossier.id, s)}
                            className={`rounded-lg p-1.5 transition ${
                              dossier.statut === s
                                ? `${colors[s]} bg-white/10`
                                : 'text-white/20 hover:text-white/40'
                            }`}
                            title={
                              s === 'en_cours'
                                ? 'En cours'
                                : s === 'accepte'
                                  ? 'Accepté'
                                  : 'Refusé'
                            }
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              fetch('/api/financer/dossiers')
                .then((r) => r.json())
                .then((data) => setDossiers(data.dossiers ?? []))
            }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-white/10"
          >
            <RefreshCw className="h-3 w-3" /> Actualiser
          </button>
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
            onClick={handleNext}
            disabled={!canNext() || loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18] disabled:opacity-40"
          >
            Suivant <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
