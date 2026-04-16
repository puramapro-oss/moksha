import { permanentRedirect } from 'next/navigation'

export const metadata = { title: 'Connexion — MOKSHA' }

export default function LoginRedirect() {
  permanentRedirect('/auth')
}
