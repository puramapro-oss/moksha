# MOKSHA — Progress

## Current Phase: V7.1 / V4.1 MIGRATION — Chantier #1 INSEE Sirene live (DÉMARRÉ 2026-04-21)

### État global
- **Deploy actuel** : https://moksha.purama.dev (200 OK)
- **Stack** : Next.js 16.2.4, TS strict, Tailwind 4, Supabase self-hosted (schema `moksha`), Stripe Live, Stripe Connect Express + Embedded (Wave C V4 partiel)
- **Branche** : main
- **Pré-requis V7.1/V4.1** : INSEE_API_KEY ✅ (.env.local + Vercel prod) | @stripe/connect-js ✅ | OriginStamp encore présent (4 fichiers à migrer) | vitest pas installé

### Plan de la session
3 chantiers majeurs séquentiels (CLAUDE.md V7.1 §36 + STRIPE_CONNECT_KARMA_V4.md V4.1) :
1. **CHANTIER #1 INSEE Sirene live + cache 30j + rate-limit 25/min** (13 features) — EN COURS
2. CHANTIER #2 OpenTimestamps Bitcoin (10 features)
3. CHANTIER #3 Connect Embedded V4.1 7 components + 7 pages /compte/* (9 features)
+ secondaires : ZFRR/JEI cochables, ACCRE/ARCE workflow, audit placeholders

Stratégie : 1 chantier entier → "Phase X terminée, relance-moi" → stop. Feature-par-feature, commit atomique après chaque, vitest si logique pure, Playwright si UI.

### Chantier #1 — INSEE Sirene (en cours)

**Objectif** : remplacer 100% des appels anonymes à `recherche-entreprises.api.gouv.fr` par INSEE Sirene officielle (`api.insee.fr/entreprises/sirene/V3.11`) avec cache Supabase 30j + rate-limit token-bucket 25 req/min (free tier INSEE = 30/min, marge sécurité 5).

**Endpoints cibles** :
- GET `/api/siret/[siret]` — récupère établissement (siège ou tout) + dénomination + NAF + adresse + état + date création
- GET `/api/siren/[siren]` — récupère unité légale + siège

**Cache** : table `moksha.moksha_siret_cache` (siret PK, payload jsonb, fetched_at, expires_at, source 'insee'|'fallback'). Hit cache → retour direct. Miss → fetch INSEE → upsert. Invalidation manuelle via DELETE par admin.

**Rate-limit** : token-bucket en mémoire (in-process) — 25 jetons régénérés à 25/min. File d'attente FIFO si saturé. En prod multi-instance Vercel : risque de dépassement éventuel mais marge 5/min couvre.

**Fallback** : si INSEE 429/500 → fallback vers `recherche-entreprises.api.gouv.fr` avec marqueur `source=fallback` dans le cache (TTL réduit 7j).

### Fichiers cibles cette phase (à créer/modifier)

**NEW** :
- `vitest.config.ts`
- `src/lib/insee.ts` + `src/lib/insee.test.ts`
- `src/app/api/siret/[siret]/route.ts` + test
- `src/app/api/siren/[siren]/route.ts` + test
- `src/components/wizard/SiretLookup.tsx`
- `tests/wizard-siret.spec.ts` (Playwright)
- `supabase/migrations/20260421_v71_siret_cache.sql`

**MODIFIED** :
- `src/lib/pappers.ts` (ajout `getEntrepriseFromSiret` qui prefer INSEE)
- `src/components/wizard/WizardEntreprise.tsx` (case reprise)
- `src/components/wizard/StepDirigeant.tsx` (SIRET dirigeant existant)
- `package.json` (vitest + jsdom + javascript-opentimestamps en avance pour chantier 2)

### Reste à faire après Chantier #1
- Chantier #2 OpenTimestamps : `lib/opentimestamps.ts`, suppression `lib/originstamp.ts`, route verify, migration SQL
- Chantier #3 Connect Embedded V4.1 : 7 components, endpoint dédié `/api/connect/account-session`, 7 pages `/compte/*`
- Secondaires F4-F5-F6
