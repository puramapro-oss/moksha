import { permanentRedirect } from 'next/navigation'

export const metadata = { title: 'Tarifs — MOKSHA' }

export default function PricingRedirect() {
  permanentRedirect('/paiement')
}
