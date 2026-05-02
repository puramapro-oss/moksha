# MOKSHA — Progress

## Current Phase: V8 DESIGN REFRESH ✅ DEPLOYED (2026-05-02)

### État global

- **Deploy actuel** : https://moksha.purama.dev (200 OK)
- **Dernier dépôt Vercel** : `dpl_3Mxd17Y3YdJqoEvHfdDRLPpgXX18` — V8 Design Refresh
- **Stack** : Next.js 16.2.4, TS strict, Tailwind 4, Supabase self-hosted (schema `moksha`), Stripe Live + Connect Embedded 7 composants, INSEE Sirene live, OpenTimestamps Bitcoin
- **Branche** : main (commits locaux non pushés vers GitHub remote — décision Tissma)

### V8 — Design Refresh + Bugs + Refonte UX premium (5 phases)

#### ✅ Phase 1 — Audit factuel (AUDIT.md committed)

- tsc 0 / vitest 55-passed-1-skipped / 0 TODO/Lorem/console.log/any
- 26 routes publiques 200 + 23 routes auth 307 OK
- Supabase auth Google OAuth = `google: true`, email = `true`, autoconfirm OK
- INSEE Sirene live (testé avec EDF SIRET réel)
- Stripe checkout + Connect AccountSession 401 sans auth (correct)
- 🚨 Pappers v2 = 401 quota épuisé (100 req/mois saturé) — fallback recherche-entreprises actif
- 🚨 VPS SSH unreachable mais Supabase auth OK donc non-bloquant

#### ✅ Phase 2 — Design system V2 (commit `397f892`)

- Migration palette : `#FF6B35 → #FF3D00` (incandescent), `#FFD700 → #FFB300` (or chaud)
  + nouveau intermédiaire `#FF6B00` (feu pur)
- Gradient principal : 3 stops `linear-gradient(135deg, #FF3D00 0%, #FF6B00 45%, #FFB300 100%)`
- 9 nouvelles utility classes : `.moksha-mesh-bg`, `.moksha-halo`, `.moksha-btn-primary`,
  `.moksha-btn-secondary`, `.moksha-card-featured`, `.moksha-card-standard`,
  `.moksha-trust-strip`, `.moksha-badge-featured`, `.moksha-eyebrow-chip`
- Shadows stratifiées `--shadow-fire-{sm,md,lg}` (orange + or)
- 122 fichiers patchés via sed (hex + rgba équivalents)
- public/manifest.json + favicon.svg + icon.svg + layout.tsx themeColor alignés
- Light + OLED themes mis à jour avec nouvelles couleurs

#### ✅ Phase 3 — Refonte UI premium (commit `9ba1d28`)

- **Home `/` → écran d'accueil app pur** (style ChatGPT / Linear)
  - Suppression définitive des 10 sections marketing (Hero/Choices/Features/HowItWorks/
    DemoJurisIA/Comparatif/Testimonials/Pricing/FAQ/CTAFinal)
  - Composants conservés en lib pour réutilisation /aide ou /comparatif futur
  - Nouveau composant `AppEntrance.tsx` : logo XL centré + eyebrow chip + H1 gradient
    + sous-titre + 2 CTAs (Commencer / Se connecter) + trust strip 3 signaux
  - Background : `.moksha-mesh-bg` + `FireParticles.tsx` (38 particules feu lazy ssr:false)
- **`/demarrer` refonte asymétrique premium**
  - Card Entreprise FEATURED 2 col (`.moksha-card-featured` glow conique animé)
    + badge "Le plus choisi" + 4 micro-bénéfices coches verts
  - Card Asso 1 col + Card Conseil JurisIA 1 col (`.moksha-card-standard`)
  - Section "Pourquoi MOKSHA" 3 piliers (Liberté / Vitesse / Sécurité)
  - CTA secondaire bottom "Voir les tarifs" → /pricing
- **`/aide` (nouvelle page publique)** avec FAQ + 3 channels
  + ajout `/aide` à `PUBLIC_PATHS` du middleware
- **LandingNav** simplifié : suppression ancres mortes (#features #how #faq) → routes réelles
- **Footer** corrigé : `/#pricing → /pricing`, `/#faq → /aide`
- i18n : fr.json + en.json hero copy alignée nouvelle UX

#### ✅ Phase 4 — Bugs + APIs (commit `e0965a1`)

- **Wizards Entreprise + Association** :
  - `isStepValid(step, data)` : validation par étape (longueur min, format email, Luhn etc.)
  - Bouton "Suivant" disabled tant que l'étape courante invalide
  - Persistance sessionStorage à chaque update + hydratation 1× au mount
  - Cleanup sessionStorage post-submit succès
  - Boutons utilisent `.moksha-btn-primary` (V2 design)
- **`/api/check-denomination`** + `lib/pappers.checkDenominationAvailable` :
  - Nouveau champ `verified: boolean`
  - Si index gouv vide ET requête courte (<5 chars) → `verified: false`
  - StepDenomination affiche "Vérification limitée" au lieu de faux positif
- **`/creer/formalites`** (refonte client component) :
  - Auto-finalisation post-auth : détecte sessionStorage wizard → POST /api/demarches/create
    → fetch /deposer en background → route vers /dashboard/demarches/[id]
  - 3 phases UI : auth-pending / submitting / error avec messages FR explicites

#### ✅ Phase 5 — Tests 5 niveaux + deploy

- **N1 Statique** : tsc 0 / build 0 / ESLint 0 / 0 TODO/Lorem/console.log/any
- **N2 Unitaire** : vitest 55 passés / 1 skipped (5 fichiers)
- **N3 E2E Playwright** :
  - Nouveau `landing-v2.spec.ts` (6 tests) : home écran d'accueil pur, /demarrer asymétrique,
    /aide, responsive 375 / 768 / 1440 — **6/6 passés contre prod**
  - Existant `compte-pages.spec.ts` + `reglement.spec.ts` : **14/14 passés contre prod**
- **N4 Smoke prod** : 12 routes testées toutes 200 (`/`, `/demarrer`, `/aide`,
  `/creer/entreprise`, `/creer/association`, `/creer/formalites`, `/paiement`, `/pricing`,
  `/auth`, `/reglement`, `/karma`, `/ambassadeur`)
- **N5 Visual humain** : confirmé via curl HTML — `moksha-mesh-bg`, `moksha-card-featured`,
  `moksha-badge-featured`, "Le plus choisi", "Crée ton entreprise", "Sans bureaucratie",
  "Garantie zéro refus" présents dans le DOM live

### Smoke tests prod live (2026-05-02)

```
GET  /                         → 200 (AppEntrance pur, plus de 10 sections)
GET  /demarrer                 → 200 (grid asymétrique, badge "Le plus choisi")
GET  /aide                     → 200 (NOUVELLE page publique, FAQ + 3 channels)
GET  /creer/entreprise         → 200 (wizard avec validation par étape)
GET  /creer/association        → 200 (wizard avec validation par étape)
GET  /creer/formalites         → 200 (auto-finalize post-auth)
GET  /paiement                 → 200
GET  /pricing                  → 200
GET  /auth                     → 200
GET  /reglement                → 200
GET  /karma                    → 200
GET  /ambassadeur              → 200
```

### Bugs résiduels non bloquants (à traiter en suivi)

- 🚨 **Pappers v2 quota épuisé** (100 req/mois saturé) — décision business :
  upgrade plan Pappers ou Pay-as-you-go côté Tissma
- 🚨 **VPS SSH 22 reset by peer** — Supabase auth fonctionne donc non bloquant ;
  à investiguer (firewall fail2ban ?)
- ⚠️ **Rate-limit Upstash** : pas appliqué sur `/api/stripe/checkout`,
  `/api/connect/account-session`, `/api/jurisia/chat`, `/api/demarches/create`
  → recommandé pour P1 future

### Prochaines étapes (relance future)

- Push commits vers GitHub remote (4 commits locaux : `397f892`, `9ba1d28`, `e0965a1` + AUDIT.md)
- Pappers : upgrade plan ou Pay-as-you-go
- Rate-limit Upstash sur endpoints critiques
- Lighthouse audit complet (CLS / LCP / FID)
- Waves V4 restantes (G/H/N) bloquées par credentials externes
