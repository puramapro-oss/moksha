import { REGLEMENT_CONTENT } from '@/app/reglement/content'
import { APP_URL } from '@/lib/constants'

const MAX_CONTENT_BYTES = 2 * 1024 * 1024

/** Canonical sources are deployment configuration, never the request origin. */
export async function readReglementContent(source: unknown): Promise<string | null> {
  if (typeof source !== 'string' || !source || source.startsWith('//')
    || source.includes('\\') || Array.from(source).some(character => {
      const code = character.charCodeAt(0)
      return code <= 32 || code === 127
    })) return null

  try {
    const application = new URL(APP_URL)
    const url = new URL(source, `${application.origin}/`)
    if (url.username || url.password || url.hash) return null

    // The public page renders this exact text inside HTML. Hash the published
    // text itself, without fetching our own dynamic page or trusting Host.
    if (url.origin === application.origin && url.pathname === '/reglement') {
      return REGLEMENT_CONTENT
    }

    const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    if (storage.username || storage.password || url.protocol !== 'https:'
      || url.origin !== storage.origin
      || !url.pathname.startsWith('/storage/v1/object/public/')
      || /%(?:25|2f|5c)/i.test(url.pathname)) return null
    const objectSegments = url.pathname.slice('/storage/v1/object/public/'.length).split('/')
    if (objectSegments.length < 2 || objectSegments.some(segment => {
      const decoded = decodeURIComponent(segment)
      return !decoded || decoded === '.' || decoded === '..'
        || Array.from(decoded).some(character => character.charCodeAt(0) < 32)
    })) return null

    const response = await fetch(url, {
      redirect: 'error', credentials: 'omit', cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: 'text/plain, application/json' },
    })
    if (!response.ok || Number(response.headers.get('content-length')) > MAX_CONTENT_BYTES) {
      await response.body?.cancel()
      return null
    }
    if (!response.body) return null
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8', { fatal: true })
    let size = 0
    let content = ''
    try {
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) return content + decoder.decode()
        size += chunk.value.byteLength
        if (size > MAX_CONTENT_BYTES) {
          await reader.cancel()
          return null
        }
        content += decoder.decode(chunk.value, { stream: true })
      }
    } catch {
      await reader.cancel().catch(() => undefined)
      return null
    } finally {
      reader.releaseLock()
    }
  } catch {
    return null
  }
}
