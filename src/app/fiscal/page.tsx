import Link from 'next/link'
import { FileText, Download, AlertCircle } from 'lucide-react'
import LandingNav from '@/components/layout/LandingNav'

export const metadata = {
  title: 'Fiscalité & déclaration — MOKSHA',
  description: 'Seuils de déclaration, abattement, récapitulatif annuel.',
}

export default function FiscalPage() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <section className="mx-auto max-w-3xl px-6 pt-32 pb-20 space-y-8">
        <header>
          <FileText className="h-8 w-8 text-[#FFB300]" />
          <h1 className="mt-3 font-display text-4xl font-extrabold">Fiscalité & déclaration</h1>
          <p className="mt-2 text-white/60">
            Tout ce qu&apos;il faut savoir sur les gains perçus via MOKSHA.
          </p>
        </header>

        <div className="glass space-y-4 p-6">
          <h2 className="text-xl font-bold">Seuil de déclaration</h2>
          <p className="text-sm text-white/80">
            En France, un seuil de déclaration s&apos;applique à partir de{' '}
            <strong>3 000€ de revenus annuels</strong> via des plateformes numériques. En dessous,{' '}
            <strong>aucune obligation de déclaration</strong> — tu peux utiliser MOKSHA sans aucune démarche.
          </p>
          <p className="text-sm text-white/60">
            MOKSHA t&apos;envoie automatiquement une notification quand tu approches du seuil (1500€ → 2500€ → 3000€).
          </p>
        </div>

        <div className="glass space-y-4 p-6">
          <h2 className="text-xl font-bold">Si tu dépasses 3 000€ — 3 étapes</h2>
          <ol className="space-y-3 text-sm text-white/80">
            <li>
              <strong>1.</strong> Connecte-toi à{' '}
              <a href="https://www.impots.gouv.fr" className="underline" target="_blank" rel="noreferrer">
                impots.gouv.fr
              </a>
            </li>
            <li>
              <strong>2.</strong> Reporte le montant total dans la <strong>case 5NG</strong> (Bénéfices non commerciaux, régime micro)
            </li>
            <li>
              <strong>3.</strong> L&apos;abattement automatique de <strong>34%</strong> s&apos;applique.
              Exemple : 5 000€ déclarés → imposés sur 3 300€ seulement.
            </li>
          </ol>
        </div>

        <div className="glass space-y-3 p-6">
          <h2 className="text-xl font-bold">Récapitulatif annuel</h2>
          <p className="text-sm text-white/80">
            Chaque 1er janvier, MOKSHA génère automatiquement ton récapitulatif PDF avec : primes, parrainage, Nature Rewards, marketplace, missions. Envoyé par email + disponible dans ton dashboard.
          </p>
          <Link
            href="/dashboard/parametres"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            <Download className="h-4 w-4" /> Télécharger mon récapitulatif
          </Link>
        </div>

        <div className="glass space-y-2 p-6 text-xs text-white/60">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#FF3D00] mt-0.5" />
            <p>
              Les gains perçus via MOKSHA peuvent être soumis à l&apos;impôt sur le revenu selon ta situation fiscale et le montant perçu. MOKSHA ne saurait être tenu responsable des obligations fiscales individuelles. Pour une situation complexe, consulte un conseiller fiscal.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
