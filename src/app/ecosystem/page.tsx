'use client'

import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

const APPS = [
  { slug: 'jurispurama', name: 'JurisPurama', desc: 'Assistant juridique IA expert', color: '#6D28D9', related: true },
  { slug: 'midas', name: 'MIDAS', desc: 'Trading et investissement intelligent', color: '#F59E0B', related: false },
  { slug: 'kaia', name: 'KAÏA', desc: 'Méditation et bien-être mental', color: '#06B6D4', related: false },
  { slug: 'vida', name: 'VIDA', desc: 'Suivi santé et nutrition', color: '#10B981', related: false },
  { slug: 'lingora', name: 'Lingora', desc: 'Apprends 16 langues avec l\'IA', color: '#3B82F6', related: false },
  { slug: 'kash', name: 'KASH', desc: 'Gestion budget et épargne', color: '#F59E0B', related: true },
  { slug: 'entreprise-pilot', name: 'EntreprisePilot', desc: 'Pilotage d\'entreprise', color: '#6366F1', related: true },
  { slug: 'purama-compta', name: 'Compta', desc: 'Comptabilité simplifiée', color: '#0EA5E9', related: true },
  { slug: 'akasha', name: 'AKASHA', desc: 'Assistant IA multi-expert', color: '#00d4ff', related: false },
  { slug: 'lumios', name: 'LUMIOS', desc: 'Conseil et consulting IA', color: '#14B8A6', related: true },
  { slug: 'sutra', name: 'SUTRA', desc: 'Création vidéo IA', color: '#8B5CF6', related: false },
  { slug: 'prana', name: 'PRANA', desc: 'Coaching sportif personnalisé', color: '#F472B6', related: false },
  { slug: 'exodus', name: 'EXODUS', desc: 'Développement personnel', color: '#22C55E', related: false },
  { slug: 'mana', name: 'MANA', desc: 'Productivité et gestion du temps', color: '#A855F7', related: false },
  { slug: 'aether', name: 'AETHER', desc: 'Art et créativité IA', color: '#E879F9', related: false },
  { slug: 'origin', name: 'Origin', desc: 'Découvre tes origines', color: '#D946EF', related: false },
]

export default function EcosystemPage() {
  const related = APPS.filter((a) => a.related)
  const others = APPS.filter((a) => !a.related)

  return (
    <div className="min-h-screen bg-[#070B18] p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
          Écosystème <span className="gradient-text">Purama</span>
        </h1>
        <p className="mt-3 text-white/60">19 apps interconnectées. Un compte. Des points partagés.</p>
        <p className="mt-1 text-xs text-[#FF6B35]">-50% avec le code CROSS50 sur toute l&apos;offre Purama</p>

        <h2 className="mb-4 mt-10 text-xl font-bold">Recommandé pour toi</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {related.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>

        <h2 className="mb-4 mt-10 text-xl font-bold">Tout l&apos;écosystème</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {others.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AppCard({ app }: { app: typeof APPS[number] }) {
  return (
    <div className="glass glass-hover group relative overflow-hidden p-5">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: app.color }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold" style={{ background: `${app.color}20`, color: app.color }}>
            {app.name[0]}
          </div>
          <h3 className="font-semibold">{app.name}</h3>
          <p className="mt-1 text-xs text-white/50">{app.desc}</p>
        </div>
        <ExternalLink className="h-4 w-4 text-white/30 transition group-hover:text-white/60" />
      </div>
    </div>
  )
}
