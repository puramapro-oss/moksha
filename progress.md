# MOKSHA — Progress

## Current Phase: V7.1 / V4.1 MIGRATION ✅ DEPLOYED (2026-04-21)

### État global

- **Deploy actuel** : https://moksha.purama.dev (200 OK)
- **Derniers dépôts Vercel** :
  - `dpl_7UgGCcdAceDP9nXhaTFpKBHW1TPh` — Chantier #3 Connect Embedded V4.1
  - `moksha-3674g53dd` — secondaires F4 + F5 (ZFRR/JEI + ACRE/ARCE)
- **Stack** : Next.js 16.2.4, TS strict, Tailwind 4, Supabase self-hosted (schema `moksha`), Stripe Live, Stripe Connect Express + Embedded 7 composants
- **Branche** : main (20 commits ahead origin/main)

### V7.1 / V4.1 — Résumé complet

✅ **Chantier #1 INSEE Sirene** (F1.1 → F1.13 — déjà déployé au début de session)
- `lib/insee.ts` API Sirene V3.11 + cache 30j (`moksha_siret_cache`) + rate-limit token-bucket 25/min
- Routes GET `/api/siret/[siret]` + `/api/siren/[siren]`
- `pappers.ts` priorité INSEE > recherche-entreprises.api.gouv.fr
- Composant `SiretLookup` + intégration wizard + `TaxProfileOnboarding`
- Tests vitest 26 (Luhn SIRET/SIREN, parsing INSEE) + Playwright live

✅ **Chantier #2 OpenTimestamps Bitcoin** (F2.1 → F2.10 — déjà déployé au début de session)
- `lib/opentimestamps.ts` stampHash/verifyProof/upgradeProof via blockchain Bitcoin
- SQL migration `moksha_reglements` → colonnes bitcoin + préservation `originstamp_*` backcompat
- Routes API `/api/reglement/publish` + `/api/reglement/verify/[id]` publique
- Page `/reglement` V4.1 — 9 articles + terme UI "Preuve blockchain Purama"
- Suppression `lib/originstamp.ts`
- Tests vitest hashContent/verifyContent + Playwright /reglement

✅ **Chantier #3 Connect Embedded V4.1** (F3.1 → F3.9 — FAIT CE SESSION)
- `lib/stripe-connect.ts` étendu → 7 composants (account_onboarding, account_management,
  notification_banner, payouts, payments, balances, documents)
- Endpoint dédié `POST /api/connect/account-session` (auth required, 404 si pas onboardé, client_secret)
- `ConnectProvider` wrapper réutilisable avec loading/ready/not-onboarded/unauth/error
- 7 pages `/compte/{notifications,gestion,virements,paiements,soldes,documents,configuration}`
  mappées sur les Site Links Stripe Dashboard
- Layout `/compte` + nav latérale 7 sections
- Middleware /compte/* protégé via absence de PUBLIC_PATHS
- Tests vitest 4/4 (auth, 404, success, erreur Stripe) + Playwright 8/8

✅ **Secondaires F4 + F5 + F6** (FAIT CE SESSION)
- **F4** ZFRR / JEI cochables dans WizardEntreprise (section verte StepRecap, masquée si
  forme=micro). `lib/claude.ts` injecte clauses art. 44 quindecies CGI (ZFRR) + art. 44
  sexies-0 A CGI (JEI) dans le prompt statuts → JurisIA produit statuts avec articles dédiés
- **F5** `/dashboard/demarches/aides-creation` — 3 étapes pré-remplies (ACRE URSSAF 45j /
  ARCE France Travail 60% ARE / dépôt statuts MOKSHA), liens 1-click officiels (Cerfa
  13584*02, Cerfa 14263*02, Guichet INPI, annonce légale), persistance localStorage +
  auto-détection dossier actif, print/PDF one-click, CTA visible depuis /dashboard/demarches
- **F6** Audit : 0 TODO/FIXME/Lorem/coming soon/témoignage inventé dans `src/`

### Tests

- vitest : 5 fichiers / **55 passés** / 1 skipped
- Playwright : `compte-pages.spec.ts` 8/8, `reglement.spec.ts` 4/4
- tsc --noEmit : 0 erreur
- npm run build : 0 erreur

### Smoke tests production

```
GET  /                         → 200
GET  /reglement                → 200
GET  /paiement                 → 200
GET  /fiscal                   → 200
GET  /karma                    → 200
GET  /ambassadeur              → 200
GET  /compte/notifications     → 307 (redirect /auth)
GET  /compte/gestion           → 307
GET  /compte/virements         → 307
GET  /compte/paiements         → 307
GET  /compte/soldes            → 307
GET  /compte/documents         → 307
GET  /compte/configuration     → 307
POST /api/connect/account-session → 401 "Non authentifié"
```

### Prochaines étapes (relance future)

- Waves V4 restantes bloquées par credentials externes :
  - Wave G — Flow 3 AE URSSAF Tierce Déclaration (URSSAF_TIERCE_API_KEY + MANDATE_TEMPLATE_ID)
  - Wave H — Flow 4 Entreprise Pennylane OAuth + Factur-X (PENNYLANE_OAUTH_*)
  - Wave N — CPA tracking MOKSHA (Qonto/Pennylane/Blank) + Google Ad Grants (RNA + SIREN Asso)
- Tests E2E live avec compte Stripe Connect onboardé (actuellement skippés)
