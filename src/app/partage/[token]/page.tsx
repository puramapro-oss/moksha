import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { FileText, Lock, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PartagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token || token.length < 20) notFound()

  const svc = createServiceClient()
  const { data: docs } = await svc
    .from('moksha_documents')
    .select('id, nom, file_url, file_size, mime_type, partage_expire, created_at, type, metadata')
    .eq('partage_token', token)

  if (!docs || docs.length === 0) notFound()

  const expire = docs[0].partage_expire
  if (!expire || new Date(expire) < new Date()) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-white/30" />
        <h1 className="font-display text-2xl font-bold">Lien expiré</h1>
        <p className="mt-2 text-sm text-white/60">Ce lien de partage n&apos;est plus valide. Demande un nouveau lien à son émetteur.</p>
      </div>
    )
  }

  const audience = ((docs[0].metadata as { audience?: string })?.audience) || 'partenaire'

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF3D00] to-[#FFB300]">
          <Lock className="h-6 w-6 text-[#070B18]" />
        </div>
        <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          Documents partagés
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Espace sécurisé MOKSHA • partage {audience} • expire le {new Date(expire).toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="space-y-3">
        {docs.map((d) => (
          <a
            key={d.id}
            href={d.file_url}
            target="_blank"
            rel="noopener"
            className="glass glass-hover flex items-center gap-4 p-4 transition"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <FileText className="h-6 w-6 text-[#FFB300]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{d.nom}</p>
              <p className="text-[11px] text-white/50">
                {d.type || 'document'} •{' '}
                {d.file_size ? `${Math.round((d.file_size as number) / 1024)} Ko` : ''} •{' '}
                {new Date(d.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <Download className="h-5 w-5 text-white/40" />
          </a>
        ))}
      </div>

      <p className="text-center text-[10px] text-white/40">
        🔐 Lien chiffré, accessible uniquement via cette URL. Ne le partage qu&apos;avec les destinataires prévus.
      </p>
    </div>
  )
}
