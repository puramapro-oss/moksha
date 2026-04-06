'use client'

import { Star } from 'lucide-react'

const featured = {
  name: 'Maëlle R.',
  role: 'Fondatrice SASU freelance design',
  text: "J'ai créé ma SASU un samedi soir depuis mon canapé. Lundi matin, JurisIA m'a guidée sur ma première facture. Franchement, jamais je ne serais passée par un notaire. MOKSHA m'a fait gagner 800€ et 2 semaines.",
}

const others = [
  { name: 'Kevin L.', role: 'SCI familiale', text: "Le simulateur m'a sauvé : j'ai comparé SCI IR vs IS en 5 min. Le comparatif m'a convaincu de basculer à l'IS.", stars: 5 },
  { name: 'Ahmed B.', role: 'Micro-entrepreneur', text: "Créé en 8 min chrono. Le ScannerPerfect a détecté que ma pièce d'identité était floue avant envoi. Zéro refus.", stars: 5 },
  { name: 'Claire M.', role: 'Association culturelle', text: "On a lancé notre asso loi 1901 en une soirée. Les statuts sont clairs, la déclaration préfecture partie seule.", stars: 5 },
  { name: 'Thomas D.', role: 'SAS startup', text: "Le coffre ProofVault est un game changer. J'ai partagé mon Kbis et mes statuts à ma banque en 1 clic.", stars: 5 },
  { name: 'Sofia P.', role: 'EURL consultante', text: "JurisIA m'a expliqué le régime TNS vs assimilé salarié en mots simples. J'ai enfin compris.", stars: 5 },
]

export default function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Ils se sont <span className="moksha-gradient-text">libérés</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            (Noms fictifs, cas d&apos;usage représentatifs.)
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass lg:col-span-1 lg:row-span-2 flex flex-col justify-between p-8">
            <div>
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                ))}
              </div>
              <p className="text-lg leading-relaxed text-white/85">&ldquo;{featured.text}&rdquo;</p>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFD700] text-sm font-bold text-[#070B18]">
                {featured.name.split(' ').map((p) => p[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-semibold">{featured.name}</p>
                <p className="text-xs text-white/50">{featured.role}</p>
              </div>
            </div>
          </div>
          {others.map((o) => (
            <div key={o.name} className="glass p-6">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: o.stars }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#FFD700] text-[#FFD700]" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/75">&ldquo;{o.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  {o.name.split(' ').map((p) => p[0]).join('')}
                </div>
                <div>
                  <p className="text-xs font-semibold">{o.name}</p>
                  <p className="text-[11px] text-white/50">{o.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
