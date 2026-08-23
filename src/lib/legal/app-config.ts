import type { LegalAppConfig } from './types';
import { buildCompanyInfo, buildMediateurInfo } from './company';
import { APP_SCHEMA, APP_NAME } from '@/lib/constants';

/**
 * Config NIYAMA de MOKSHA (déclaration famille — NIYAMA-BRIEF.md §0.2/§7, gap CONFORMITE.md
 * §"Gap 5"). `famille: 'contenu_ia'` (NIYAMA-BRIEF.md §2 point 5 : transparence IA, zéro
 * deepfake) — MOKSHA expose 3 assistants IA réels (JurisIA, NAMA-Business, Assistant aide/SAV,
 * cf `src/lib/claude.ts` + `AIDisclosure` monté sur les 3), c'est la famille la plus proche du
 * cœur produit. JurisIA ajoute une frontière supplémentaire propre à l'app (jamais un avocat,
 * codée en dur dans son system prompt et répétée CGU/CGV/FAQ/landing) — pas une famille NIYAMA
 * à part entière, un piège spécifique-app au sens NIYAMA-BRIEF.md §3.
 * `aPaiement=true` (Stripe réel, `src/lib/stripe.ts` + `src/app/api/stripe/checkout`).
 * `aChatIA=true` (JurisIA + NAMA-Business + Assistant MOKSHA, tous avec `AIDisclosure` monté).
 */
export const MOKSHA_LEGAL_CONFIG: LegalAppConfig = {
  slug: APP_SCHEMA,
  nom: APP_NAME,
  domaine: 'moksha.purama.dev',
  famille: 'contenu_ia',
  company: buildCompanyInfo(),
  mediateur: buildMediateurInfo(),
  descriptionActivite:
    "MOKSHA aide à créer une entreprise ou une association en ligne (formalités, dépôt INPI, coffre-fort de preuves) avec l'assistance d'agents IA juridiques et business, sans jamais remplacer un avocat.",
  aPaiement: true,
  aChatIA: true,
};
