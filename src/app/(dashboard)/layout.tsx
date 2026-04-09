import DashboardShell from '@/components/dashboard/DashboardShell'
import TutorialOverlay from '@/components/shared/TutorialOverlay'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      {children}
      <TutorialOverlay />
    </DashboardShell>
  )
}
