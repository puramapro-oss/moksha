import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'node:path'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // Package workspace `@purama/smarana` livré en source TS (pas de build step) —
  // Next.js n'applique SWC qu'aux packages listés ici, sinon node_modules est ignoré par défaut.
  transpilePackages: ['@purama/smarana'],
  // `@purama/smarana` vit hors de `moksha/` (lié par symlink npm `file:../packages/smarana`) —
  // sans ce flag, Next refuse de bundler un module résolu en dehors du dossier racine du projet.
  experimental: { externalDir: true },
  outputFileTracingRoot: path.join(__dirname, '..'),
  turbopack: {
    root: path.join(__dirname, '..'),
    resolveAlias: {
      '@purama/smarana': '../packages/smarana/src/index.ts',
    },
  },
}

export default withNextIntl(nextConfig)
