import SignerClient from '@/components/shared/SignerClient'

export const metadata = { title: 'Signer mon dossier — MOKSHA' }

export default async function SignerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SignerClient demarcheId={id} />
}
