import type { NextRequest } from 'next/server'

/**
 * Vérifie que la requête vient bien d'un CRON Vercel.
 * Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>` si CRON_SECRET est défini,
 * sinon on accepte uniquement quand la requête provient du réseau Vercel.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (secret) {
    return auth === `Bearer ${secret}`
  }
  // Vercel CRON fait toujours passer un header x-vercel-cron
  return req.headers.get('x-vercel-cron') !== null || req.headers.get('x-vercel-signature') !== null
}
