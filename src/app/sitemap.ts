import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://moksha.purama.dev'
  const now = new Date()
  const routes = [
    '',
    '/demarrer',
    '/creer/entreprise',
    '/creer/association',
    '/auth',
    '/mentions-legales',
    '/politique-confidentialite',
    '/cgv',
    '/cgu',
    '/politique-cookies',
  ]
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }))
}
