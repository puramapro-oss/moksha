// MOKSHA — i18n config (16 langs)

export const locales = [
  'fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh',
  'ja', 'ko', 'hi', 'ru', 'tr', 'nl', 'pl', 'sv',
] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr'

export const localeMeta: Record<Locale, { name: string; native: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  fr: { name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  en: { name: 'English', native: 'English', flag: '🇬🇧', dir: 'ltr' },
  es: { name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
  de: { name: 'German', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  it: { name: 'Italian', native: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  pt: { name: 'Portuguese', native: 'Português', flag: '🇵🇹', dir: 'ltr' },
  ar: { name: 'Arabic', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  zh: { name: 'Chinese', native: '中文', flag: '🇨🇳', dir: 'ltr' },
  ja: { name: 'Japanese', native: '日本語', flag: '🇯🇵', dir: 'ltr' },
  ko: { name: 'Korean', native: '한국어', flag: '🇰🇷', dir: 'ltr' },
  hi: { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  ru: { name: 'Russian', native: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  tr: { name: 'Turkish', native: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  nl: { name: 'Dutch', native: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  pl: { name: 'Polish', native: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  sv: { name: 'Swedish', native: 'Svenska', flag: '🇸🇪', dir: 'ltr' },
}

export const LOCALE_COOKIE = 'NEXT_LOCALE'
