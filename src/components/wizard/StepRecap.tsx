'use client'

import Link from 'next/link'
import { FORMES_JURIDIQUES } from '@/lib/constants'
import type { WizardData } from './WizardEntreprise'

export default function StepRecap({
  data,
  update,
}: {
  data: WizardData
  update: (p: Partial<WizardData>) => void
}) {
  const forme = FORMES_JURIDIQUES.find((f) => f.id === data.forme)
  const tarifBase = data.forme === 'micro' ? 29 : 49
  const tarifExpress = data.mode === 'express' ? 50 : 0
  const total = tarifBase + tarifExpress

  return (
    <div>
      <h2 className="mb-2 font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Récapitulatif
      </h2>
      <p className="mb-8 text-sm text-white/60">Vérifie que tout est correct avant le dépôt.</p>

      <div className="space-y-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-3 text-sm font-semibold text-white/80">Structure</h3>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div><span className="text-white/50">Forme :</span> {forme?.label}</div>
            <div><span className="text-white/50">Mode :</span> {data.mode === 'express' ? 'Express 24h' : 'Standard 72h'}</div>
            <div className="md:col-span-2"><span className="text-white/50">Dénomination :</span> <strong>{data.denomination || '—'}</strong></div>
            {data.nom_commercial && <div className="md:col-span-2"><span className="text-white/50">Nom commercial :</span> {data.nom_commercial}</div>}
            <div className="md:col-span-2"><span className="text-white/50">Activité :</span> {data.activite || '—'}</div>
            <div><span className="text-white/50">Code APE :</span> {data.code_ape || '—'}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-3 text-sm font-semibold text-white/80">Siège social</h3>
          <div className="text-sm">{data.adresse || '—'}</div>
          <div className="mt-1 text-xs text-white/50">Type de local : {data.type_local}</div>
        </section>

        {data.forme !== 'micro' && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="mb-3 text-sm font-semibold text-white/80">Capital</h3>
            <div className="text-sm">
              <strong>{data.capital.toLocaleString('fr-FR')} €</strong> — apport {data.apport_type}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-3 text-sm font-semibold text-white/80">Dirigeant</h3>
          <div className="grid gap-1 text-sm">
            <div>{data.dirigeant.prenom} {data.dirigeant.nom} — {data.dirigeant.nationalite}</div>
            <div className="text-xs text-white/50">Né(e) le {data.dirigeant.date_naissance || '—'}</div>
            <div className="text-xs text-white/50">{data.dirigeant.adresse || '—'}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">💰 Tarification</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Création {forme?.label}</span><strong>{tarifBase} €</strong></div>
            {tarifExpress > 0 && <div className="flex justify-between"><span>Option Express 24h</span><strong>+{tarifExpress} €</strong></div>}
            <div className="flex justify-between border-t border-white/10 pt-2 text-base"><span>Total MOKSHA</span><strong className="text-[#FFD700]">{total} €</strong></div>
            <div className="mt-3 rounded-lg bg-white/5 p-3 text-xs text-white/60">
              ⚠️ Frais officiels obligatoires en plus (non encaissés par MOKSHA) :
              <ul className="ml-4 mt-1 list-disc">
                <li>Frais de greffe INPI : ≈ 37 €</li>
                <li>Annonce légale obligatoire : ≈ 150-200 €</li>
              </ul>
            </div>
          </div>
        </section>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <input
            type="checkbox"
            checked={data.accept_cgv}
            onChange={(e) => update({ accept_cgv: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#FF6B35]"
          />
          <span className="text-white/80">
            J&apos;accepte les{' '}
            <Link href="/cgv" target="_blank" className="text-[#FFD700] underline">CGV</Link> et reconnais avoir pris connaissance des{' '}
            <Link href="/politique-confidentialite" target="_blank" className="text-[#FFD700] underline">règles de confidentialité</Link>. Je certifie l&apos;exactitude des informations fournies.
          </span>
        </label>
      </div>
    </div>
  )
}
