import DashboardShell from '@/components/dashboard/DashboardShell'
import TutorialOverlay from '@/components/shared/TutorialOverlay'
import WelcomeBonus from '@/components/shared/WelcomeBonus'
import ConversionPopup from '@/components/shared/ConversionPopup'
import FiscalBanner from '@/components/fiscal/FiscalBanner'
import TaxProfileOnboarding from '@/components/fiscal/TaxProfileOnboarding'
import LegalReacceptanceGateWrapper from '@/components/legal/LegalReacceptanceGateWrapper'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { computeDocsEnAttente, type LegalDocType } from '@/lib/legal'

interface AcceptanceRow {
  doc_type: LegalDocType
  version: string
}

/**
 * Monte `LegalReacceptanceGate` (NIYAMA-BRIEF.md §1, Gap 7 CONFORMITE.md 2026-08-23) : bloque
 * l'accès dashboard tant qu'une nouvelle version de CGU/CGV/confidentialité publiée après la
 * dernière acceptation de l'utilisateur n'a pas été ré-acceptée. `middleware.ts` garantit déjà
 * que ces routes sont auth-only — défensif si `user` est absent (edge case SSR) : on ne bloque
 * jamais l'app pour un utilisateur non identifiable ici.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let docsEnAttente: LegalDocType[] = []

  if (user) {
    const { data: rows } = await supabase
      .from('legal_acceptances')
      .select('doc_type, version')
      .eq('user_id', user.id)
      .order('accepted_at', { ascending: false })

    const latestByType = new Map<LegalDocType, string>()
    ;((rows ?? []) as AcceptanceRow[]).forEach((row) => {
      if (!latestByType.has(row.doc_type)) {
        latestByType.set(row.doc_type, row.version)
      }
    })

    const dernieresAcceptations = Object.fromEntries(latestByType) as Partial<
      Record<LegalDocType, string>
    >

    // "mentions" est informatif, jamais soumis à acceptation explicite (AuthForm.tsx n'envoie
    // que cgu/cgv/confidentialite à /api/legal/accept) — l'inclure ferait apparaître un gate
    // qu'aucun utilisateur ne peut jamais lever.
    docsEnAttente = computeDocsEnAttente(dernieresAcceptations).filter((doc) => doc !== 'mentions')
  }

  return (
    <DashboardShell>
      {docsEnAttente.length > 0 && (
        <LegalReacceptanceGateWrapper appName="MOKSHA" docsEnAttente={docsEnAttente} />
      )}
      <FiscalBanner />
      {children}
      <WelcomeBonus />
      <TutorialOverlay />
      <ConversionPopup />
      <TaxProfileOnboarding />
    </DashboardShell>
  )
}
