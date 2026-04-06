import { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'

export const metadata = {
  title: 'Se connecter à MOKSHA',
  description: 'Accède à ton dashboard MOKSHA : création entreprise, JurisIA, ProofVault.',
}

export default function AuthPage() {
  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
      <Suspense fallback={<div className="text-white/50">Chargement...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  )
}
