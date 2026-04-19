import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import LandingNav from '@/components/layout/LandingNav'

export const metadata = { title: 'Règlement des jeux-concours — MOKSHA' }
export const dynamic = 'force-dynamic'

const REGLEMENT_CONTENT = `
# Règlement des jeux-concours MOKSHA

## Article 1 — Organisateur

SASU PURAMA, société par actions simplifiée unipersonnelle au capital de 1 000 €,
immatriculée au RCS de Besançon sous le n° 938 765 432, dont le siège social
est situé 8 Rue de la Chapelle, 25560 Frasne, France.

Contact : matiss.frasne@gmail.com

## Article 2 — Durée & participation gratuite

Les jeux-concours (Leaderboard Impact, Défis collectifs, Classement Karma, Quêtes épiques,
Roue du Dharma, Jackpot Terre) organisés par MOKSHA se déroulent en continu.
La participation est **gratuite et sans obligation d'achat**.

Les tickets de participation s'obtiennent via l'une des 18 actions suivantes :
inscription (+1 semaine +1 mois), parrainage (+2 parrain et filleul), mission complétée (+1),
avis App Store/Play Store (+3), follow réseaux sociaux (+1), stories (+1), vidéos (+2),
partages (+1 max 3/j), challenges (+2), streak 7j (+1) / 30j (+5), feedback (+1).
L'abonnement payant donne droit à un multiplicateur × 5 mais n'est jamais obligatoire.

## Article 3 — Dotations

### Tirage hebdomadaire
Cagnotte = 2 % du chiffre d'affaires hebdomadaire, min 10 €.
1 gagnant par tirage.

### Tirage mensuel
Cagnotte = 3 % du chiffre d'affaires mensuel, min 50 €.
3 gagnants par tirage : 60 % / 25 % / 15 %.

### Jackpot Terre (mensuel exceptionnel)
Cagnotte = 20 % du pool mensuel, plafonné à 25 000 €/mois.
50 % au gagnant + 50 % ONG partenaire (reçu fiscal 66 %).
Plafond de 25 000 € respecté pour conformité ANJ.

## Article 4 — Désignation des gagnants

Tirage au sort certifié **random.org signed** (preuve cryptographique publique).
Alternative skill-based (Leaderboard Impact, Classement Karma) : score public basé sur les 7 piliers
(mental, corporel, financier, alimentaire, énergétique, relationnel, informationnel).

## Article 5 — Remboursement des frais

Conformément à la législation, tout participant peut demander le remboursement des frais
engagés pour participer (timbres, connexion internet). Demande à adresser à :
https://moksha.purama.dev/remboursement

## Article 6 — Données personnelles (RGPD)

Les données collectées sont traitées conformément au RGPD. Responsable de traitement :
SASU PURAMA (voir art. 1). DPO : matiss.frasne@gmail.com.
Les gagnants peuvent être contactés par email pour la remise des prix.
Durée de conservation : 5 ans pour les gagnants, 3 ans pour les participants.

## Article 7 — Litiges

Tout litige relatif à l'interprétation ou l'application du présent règlement sera soumis
au **Tribunal de commerce de Besançon** (France).

## Article 8 — Horodatage blockchain

Ce règlement est horodaté sur la blockchain **Tezos** via OriginStamp, garantissant
l'authenticité et l'antériorité du texte. Le hash SHA-256 et la preuve sont affichés ci-dessous.

## Article 9 — Modifications

MOKSHA se réserve le droit de modifier le présent règlement avec un préavis de 30 jours,
par publication d'une nouvelle version sur https://moksha.purama.dev/reglement.
Les versions antérieures restent accessibles et horodatées.
`.trim()

export default async function ReglementPage() {
  const svc = createServiceClient()
  const { data: reglement } = await svc
    .from('moksha_reglements')
    .select('version, content_hash, originstamp_hash, originstamp_proof_url, blockchain, published_at')
    .eq('active', true)
    .maybeSingle()

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
              <div>
                <span className="rounded-full bg-[#5DCAA5]/20 px-3 py-1 text-[11px] font-semibold text-[#5DCAA5]">
                  Version {reglement.version}
                </span>
                <span className="ml-2 text-[11px] text-white/50">
                  Publié le {new Date(reglement.published_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <span className="text-[11px] text-white/45">Blockchain : {reglement.blockchain}</span>
            </div>
            <div className="mt-4 space-y-1.5 rounded-lg bg-black/20 p-3 font-mono text-[10.5px] leading-relaxed">
              <div><span className="text-white/40">SHA-256 :</span> <span className="break-all text-white/80">{reglement.content_hash}</span></div>
              {reglement.originstamp_hash && (
                <div><span className="text-white/40">OriginStamp :</span> <span className="break-all text-white/80">{reglement.originstamp_hash}</span></div>
              )}
              {reglement.originstamp_proof_url && (
                <div>
                  <span className="text-white/40">Preuve :</span>{' '}
                  <a href={reglement.originstamp_proof_url} target="_blank" rel="noopener noreferrer" className="break-all text-[#FF6B35] underline">
                    {reglement.originstamp_proof_url}
                  </a>
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
          <Link href="/remboursement" className="text-[#FF6B35] underline">/remboursement</Link>.
          Les tirages sont certifiés random.org signed. Conformité ANJ, RGPD, Code de la consommation.
        </div>
      </main>
    </>
  )
}

// Export du contenu pour usage en seed (POST /api/reglement/publish)
export { REGLEMENT_CONTENT }
