import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from './config'

function pickFromHeader(accept: string | null): Locale | null {
  if (!accept) return null
  const parts = accept.split(',').map((p) => p.split(';')[0]?.trim().toLowerCase().slice(0, 2))
  for (const p of parts) {
    if (p && (locales as readonly string[]).includes(p)) return p as Locale
  }
  return null
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined
  let locale: Locale = defaultLocale
  if (fromCookie && (locales as readonly string[]).includes(fromCookie)) {
    locale = fromCookie
  } else {
    const h = await headers()
    const fromHeader = pickFromHeader(h.get('accept-language'))
    if (fromHeader) locale = fromHeader
  }

  const messages = (await import(`../../messages/${locale}.json`)).default
  return { locale, messages }
})
