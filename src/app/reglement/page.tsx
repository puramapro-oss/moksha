import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import LandingNav from '@/components/layout/LandingNav'
import ReglementVerifyBadge from '@/components/reglement/ReglementVerifyBadge'
import { REGLEMENT_CONTENT } from './content'

export const metadata = { title: 'Règlement des jeux-concours — MOKSHA' }
export const dynamic = 'force-dynamic'

export default async function ReglementPage() {
  const svc = createServiceClient()
  const { data: reglement } = await svc
    .from('moksha_reglements')
    .select('id, version, content_hash, opentimestamps_proof, originstamp_hash, originstamp_proof_url, blockchain, bitcoin_block_height, bitcoin_block_timestamp, published_at')
    .eq('active', true)
    .maybeSingle()

  const stampStatus: 'confirmed' | 'pending_anchor' | 'legacy_tezos' | 'unstamped' = reglement
    ? reglement.bitcoin_block_height
      ? 'confirmed'
      : reglement.opentimestamps_proof
      ? 'pending_anchor'
      : reglement.originstamp_hash
      ? 'legacy_tezos'
      : 'unstamped'
    : 'unstamped'

  return (
    <>
      <LandingNav />
      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-20">
        <h1 className="font-display text-4xl font-extrabold">
          Règlement des <span className="moksha-gradient-text">jeux-concours</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Publié par SASU PURAMA (8 Rue de la Chapelle, 25560 Frasne — RCS Besançon 938 765 432).
        </p>

        {reglement && (
          <div className="glass mt-6 p-5 text-[13px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#5DCAA5]/20 px-3 py-1 text-[11px] font-semibold text-[#5DCAA5]">
                  Version {reglement.version}
                </span>
                <span className="text-[11px] text-white/50">
                  Publié le{' '}
                  {new Date(reglement.published_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <ReglementVerifyBadge
                reglementId={reglement.id}
                stampStatus={stampStatus}
                bitcoinBlockHeight={reglement.bitcoin_block_height}
                bitcoinBlockTimestamp={reglement.bitcoin_block_timestamp}
                legacyProofUrl={reglement.originstamp_proof_url}
              />
            </div>
            <div className="mt-4 space-y-1.5 rounded-lg bg-black/20 p-3 font-mono text-[10.5px] leading-relaxed">
              <div>
                <span className="text-white/40">SHA-256 du règlement :</span>{' '}
                <span className="break-all text-white/80">{reglement.content_hash}</span>
              </div>
              {stampStatus === 'confirmed' && reglement.bitcoin_block_height && (
                <div>
                  <span className="text-white/40">Ancrage blockchain :</span>{' '}
                  <span className="text-white/80">
                    bloc #{reglement.bitcoin_block_height.toLocaleString('fr-FR')}
                    {reglement.bitcoin_block_timestamp &&
                      ` — ${new Date(reglement.bitcoin_block_timestamp).toLocaleString('fr-FR')}`}
                  </span>
                </div>
              )}
              {stampStatus === 'pending_anchor' && (
                <div className="text-amber-300/80">
                  <span className="text-white/40">Ancrage blockchain :</span> en cours (finalisation ~1-2h après publication)
                </div>
              )}
              {stampStatus === 'legacy_tezos' && reglement.originstamp_hash && (
                <div>
                  <span className="text-white/40">Preuve historique Tezos :</span>{' '}
                  <span className="break-all text-white/80">{reglement.originstamp_hash}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <article className="prose prose-invert mt-8 max-w-none text-[14px] leading-relaxed text-white/80">
          {REGLEMENT_CONTENT.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h2 key={i} className="font-display text-2xl font-bold text-white mt-8">{line.slice(2)}</h2>
            if (line.startsWith('## ')) return <h3 key={i} className="font-display text-lg font-bold text-white mt-6">{line.slice(3)}</h3>
            if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-white/90 mt-4">{line.slice(4)}</h4>
            if (line.trim() === '') return <br key={i} />
            return <p key={i} className="mt-2">{line}</p>
          })}
        </article>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-[12px] text-white/55">
          🌱 Participation gratuite et sans obligation d&apos;achat. Remboursement des frais sur demande :{' '}
          <Link href="/remboursement" className="text-[#FF3D00] underline">/remboursement</Link>.
          Les tirages sont certifiés random.org signed. Conformité ANJ, RGPD, Code de la consommation.
        </div>
      </main>
    </>
  )
}
