import DashboardShell from '@/components/dashboard/DashboardShell'
import TutorialOverlay from '@/components/shared/TutorialOverlay'
import WelcomeBonus from '@/components/shared/WelcomeBonus'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      {children}
      <WelcomeBonus />
      <TutorialOverlay />
    </DashboardShell>
  )
}
