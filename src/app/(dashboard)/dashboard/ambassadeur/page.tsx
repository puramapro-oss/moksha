'use client'

import { useEffect, useState } from 'react'
import { Crown, Link2, Copy, Users, MousePointerClick, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

type Profile = {
  id: string
  slug: string
  bio: string | null
  tier: string
  approved: boolean
  social_links: Record<string, string>
}

type Stats = { clicks: number; conversions: number }

export default function AmbassadeurDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ clicks: 0, conversions: 0 })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    fetch('/api/influencer')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile)
          setStats(d.stats ?? { clicks: 0, conversions: 0 })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function createProfile() {
    if (!slug.trim() || slug.trim().length < 3) {
      toast.error('Pseudo trop court (3 caractères min)')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/influencer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim(), bio: bio.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.profile) {
        setProfile(data.profile)
        toast.success('Profil créé — ton lien est prêt')
      } else {
        toast.error(data.error ?? 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setCreating(false)
    }
  }

  function copyLink() {
    if (!profile) return
    const url = `${window.location.origin}/go/${profile.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Lien copié')
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />

  const conversionRate =
    stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl font-extrabold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Crown className="h-6 w-6 text-[#FFB300]" />
          Espace Ambassadeur
        </h1>
        <p className="mt-1 text-sm text-white/60">
          50% de commission à vie sur les abonnements de tes filleuls. Ton lien, tes stats, tes gains.
        </p>
      </div>

      {!profile ? (
        <div className="glass space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Crée ton profil Ambassadeur</h2>
          <p className="text-sm text-white/60">
            Choisis un pseudo, ajoute une mini-bio et reçois ton lien personnalisé en 1 clic.
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">
                Pseudo (3-40 caractères, lettres/chiffres)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="text-white/40">moksha.purama.dev/go/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ton-pseudo"
                  className="flex-1 bg-transparent outline-none"
                  maxLength={40}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Mini-bio (optionnel)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tu peux présenter ton contenu, ton audience, ton positionnement..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-[#FFB300]/40"
                maxLength={500}
              />
            </div>
            <button
              onClick={createProfile}
              disabled={creating}
              className="w-full rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-3 text-sm font-bold text-[#070B18] disabled:opacity-50"
            >
              {creating ? 'Création...' : 'Créer mon profil Ambassadeur'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Lien */}
          <div className="glass rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#FFB300]" />
              <span className="text-xs uppercase tracking-wider text-white/50">Ton lien</span>
              <span className="ml-auto rounded-full bg-[#FFB300]/10 px-2 py-0.5 text-[10px] font-bold text-[#FFB300] uppercase">
                {profile.tier}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <code className="flex-1 truncate text-sm text-white/80">
                {typeof window !== 'undefined' ? window.location.origin : ''}/go/{profile.slug}
              </code>
              <button
                onClick={copyLink}
                className="rounded-lg border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
                aria-label="Copier le lien"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass rounded-2xl p-5 text-center">
              <MousePointerClick className="mx-auto mb-2 h-5 w-5 text-[#FF3D00]" />
              <p className="text-3xl font-extrabold">{stats.clicks}</p>
              <p className="text-xs text-white/50">Clics</p>
            </div>
            <div className="glass rounded-2xl p-5 text-center">
              <Users className="mx-auto mb-2 h-5 w-5 text-[#5DCAA5]" />
              <p className="text-3xl font-extrabold text-[#5DCAA5]">{stats.conversions}</p>
              <p className="text-xs text-white/50">Conversions</p>
            </div>
            <div className="glass rounded-2xl p-5 text-center">
              <TrendingUp className="mx-auto mb-2 h-5 w-5 text-[#FFB300]" />
              <p className="text-3xl font-extrabold text-[#FFB300]">{conversionRate}%</p>
              <p className="text-xs text-white/50">Taux conversion</p>
            </div>
          </div>

          {profile.bio && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-white/50">Ta bio</p>
              <p className="mt-2 text-sm text-white/80">{profile.bio}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
