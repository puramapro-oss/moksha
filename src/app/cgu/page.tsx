import LandingNav from '@/components/layout/LandingNav'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'CGU — MOKSHA', description: 'Conditions Générales d\'Utilisation de MOKSHA.' }

export default function CGU() {
  return (
    <main className="relative z-10 min-h-screen">
      <LandingNav />
      <article className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-white/80">
        <h1 className="font-display text-4xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>Conditions Générales d&apos;Utilisation</h1>
        <p className="mt-4 text-sm text-white/50">Dernière mise à jour : 6 avril 2026</p>
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 1 — Acceptation</h2>
            <p>En créant un compte sur MOKSHA, tu acceptes les présentes CGU sans réserve.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 2 — Usage du service</h2>
            <p>Tu t&apos;engages à utiliser MOKSHA conformément à sa destination : création et gestion d&apos;entreprise ou d&apos;association. Toute utilisation frauduleuse, illégale ou contraire aux bonnes mœurs est strictement interdite.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 3 — Exactitude des données</h2>
            <p>Tu es seul responsable de l&apos;exactitude des informations que tu renseignes. Toute déclaration fausse peut entraîner des sanctions légales et le refus ou l&apos;annulation de tes démarches.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 4 — JurisIA</h2>
            <p>JurisIA est un assistant juridique basé sur l&apos;IA. Ses réponses ont valeur informative et ne constituent pas un avis juridique personnalisé. Pour toute situation complexe, consulte un avocat.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Art. 5 — Suspension / résiliation</h2>
            <p>MOKSHA se réserve le droit de suspendre ou résilier ton compte en cas de manquement aux présentes CGU ou d&apos;usage frauduleux.</p>
          </section>
        </div>
      </article>
      <Footer />
    </main>
  )
}
