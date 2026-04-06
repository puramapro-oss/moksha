'use client'

import type { WizardData } from './WizardEntreprise'

export default function StepDirigeant({
  data,
  update,
}: {
  data: WizardData
  update: (p: Partial<WizardData>) => void
}) {
  const setDirigeant = (patch: Partial<WizardData['dirigeant']>) =>
    update({ dirigeant: { ...data.dirigeant, ...patch } })

  return (
    <div>
      <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Qui dirige l&apos;entreprise ?
      </h2>
      <p className="mb-8 text-sm text-white/60">Président, gérant ou associé unique — tes informations personnelles sont protégées.</p>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Prénom *</label>
          <input
            type="text"
            value={data.dirigeant.prenom}
            onChange={(e) => setDirigeant({ prenom: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Nom *</label>
          <input
            type="text"
            value={data.dirigeant.nom}
            onChange={(e) => setDirigeant({ nom: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Date de naissance *</label>
          <input
            type="date"
            value={data.dirigeant.date_naissance}
            onChange={(e) => setDirigeant({ date_naissance: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Nationalité *</label>
          <input
            type="text"
            value={data.dirigeant.nationalite}
            onChange={(e) => setDirigeant({ nationalite: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-white/80">Adresse personnelle *</label>
          <input
            type="text"
            value={data.dirigeant.adresse}
            onChange={(e) => setDirigeant({ adresse: e.target.value })}
            placeholder="Numéro, rue, code postal, ville"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-4 text-xs text-white/70">
        📎 Tu pourras uploader ta pièce d&apos;identité et un justificatif de domicile dans l&apos;écran suivant, après création du dossier.
      </div>
    </div>
  )
}
