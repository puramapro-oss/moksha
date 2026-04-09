import { redirect } from 'next/navigation'

export default async function ShareRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  // Redirect to home with referral code
  redirect(`/?ref=${encodeURIComponent(code)}`)
}
