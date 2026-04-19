import DashboardShell from '@/components/dashboard/DashboardShell'
import TutorialOverlay from '@/components/shared/TutorialOverlay'
import WelcomeBonus from '@/components/shared/WelcomeBonus'
import ConversionPopup from '@/components/shared/ConversionPopup'
import FiscalBanner from '@/components/fiscal/FiscalBanner'
import TaxProfileOnboarding from '@/components/fiscal/TaxProfileOnboarding'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <FiscalBanner />
      {children}
      <WelcomeBonus />
      <TutorialOverlay />
      <ConversionPopup />
      <TaxProfileOnboarding />
    </DashboardShell>
  )
}
