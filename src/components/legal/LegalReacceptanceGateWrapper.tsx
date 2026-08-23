'use client'

import LegalReacceptanceGate from '@/lib/legal/components/LegalReacceptanceGate'
import type { LegalDocType } from '@/lib/legal/types'

export interface LegalReacceptanceGateWrapperProps {
  appName: string
  docsEnAttente: LegalDocType[]
}

/**
 * Pont serveur→client pour `LegalReacceptanceGate` (Gap 7 CONFORMITE.md 2026-08-23) :
 * `docsEnAttente` est calculé côté serveur (layout `(dashboard)`, comparaison
 * `legal_acceptances` vs `CURRENT_LEGAL_VERSIONS`), mais `onAccept` doit rester une fonction
 * côté client (un Server Component ne peut pas passer de fonction en prop à un Client
 * Component) — ce wrapper la fournit ici. Pattern identique à `arogya` (source de vérité
 * @purama/legal, `packages/legal/README.md`).
 */
export default function LegalReacceptanceGateWrapper({
  appName,
  docsEnAttente,
}: LegalReacceptanceGateWrapperProps) {
  async function onAccept(docType: LegalDocType) {
    const res = await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docType }),
    })
    if (!res.ok) throw new Error("Enregistrement de l'acceptation impossible.")
  }

  return (
    <LegalReacceptanceGate appName={appName} docsEnAttente={docsEnAttente} onAccept={onAccept} />
  )
}
