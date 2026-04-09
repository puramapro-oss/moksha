'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import Logo from '@/components/shared/Logo'

export default function AuthForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          toast.error(error.message || 'Connexion impossible')
          return
        }
        // Lier parrainage si cookie ?ref= présent
        await fetch('/api/referral/apply', { method: 'POST' }).catch(() => null)
        toast.success('Connexion réussie')
        router.push(next)
      } else {
        if (!fullName.trim()) {
          toast.error('Indique ton nom')
          return
        }
        const { error } = await signUp(email, password, fullName)
        if (error) {
          toast.error(error.message || 'Inscription impossible')
          return
        }
        // Lier parrainage si cookie ?ref= présent (le trigger SQL a déjà créé le profil)
        await fetch('/api/referral/apply', { method: 'POST' }).catch(() => null)
        toast.success('Compte créé — bienvenue sur MOKSHA 🔥')
        router.push(next)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error('Connexion Google impossible')
      setLoading(false)
    }
  }

  return (
    <div className="glass w-full max-w-md p-8 md:p-10">
      <div className="mb-8 flex justify-center">
        <Logo size="lg" withText={false} />
      </div>
      <h1
        className="text-center font-display text-3xl font-extrabold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {mode === 'login' ? 'Bon retour' : 'Bienvenue'}
      </h1>
      <p className="mt-2 text-center text-sm text-white/60">
        {mode === 'login' ? "Connecte-toi pour accéder à ton empire" : 'Crée ton compte pour démarrer'}
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continuer avec Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-white/40">
        <div className="h-px flex-1 bg-white/10" />
        ou
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Prénom et nom"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
          />
        )}
        <input
          type="email"
          placeholder="Ton email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-[#FF6B35]/60 focus:ring-1 focus:ring-[#FF6B35]/30"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-3 text-sm font-bold text-[#070B18] transition hover:opacity-95 disabled:opacity-50"
        >
          {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="font-semibold text-[#FFD700] transition hover:text-[#FF6B35]"
        >
          {mode === 'login' ? "S'inscrire" : 'Se connecter'}
        </button>
      </p>

      <p className="mt-6 text-center text-xs text-white/40">
        En continuant, tu acceptes nos{' '}
        <Link href="/cgu" className="underline transition hover:text-white/60">
          CGU
        </Link>{' '}
        et notre{' '}
        <Link href="/politique-confidentialite" className="underline transition hover:text-white/60">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  )
}
