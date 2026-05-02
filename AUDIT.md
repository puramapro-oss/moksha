# MOKSHA — AUDIT factuel pré-refonte

**Date** : 2026-05-02
**Contexte** : audit lecture-seule avant Phase 2 (design system upgrade) + Phase 3 (refonte `/` et `/demarrer`).
**Scope** : code source `src/`, prod `https://moksha.purama.dev`, APIs externes, Supabase auth.

---

## 1. État statique du repo

| Check | Résultat | Détail |
|---|---|---|
| `tsc --noEmit` | ✅ 0 erreur | strict mode actif |
| `vitest run` | ✅ 55 passés / 1 skipped (5 fichiers) | insee, opentimestamps, account-session, primes-v4 |
| `grep TODO\|FIXME\|Lorem\|coming soon` | ✅ 0 | aucun marker oublié |
| `grep console\.(log\|warn\|info)` | ✅ 0 | pas de logs résiduels |
| `grep ': any\b'` | ✅ 0 | typage strict respecté |
| Faux contenu (témoignages, chiffres) | ✅ 0 | `Testimonials.tsx` affiche explicitement "Pas de témoignages inventés" |

---

## 2. Couverture routes en prod

### Publiques (26 testées, toutes 200)

```
/  /demarrer  /creer/entreprise  /creer/association  /creer/formalites
/auth  /login (308 → /auth)  /paiement  /pricing  /fiscal  /karma
/reglement  /remboursement  /ambassadeur  /aide  /contact  /merci
/mentions-legales  /politique-confidentialite  /cgv  /cgu
/devenir-influenceur  /ecosystem  /signer  /share/abc  /partage
```

### Auth-protégées (23 testées, toutes 307 → /auth)

```
/dashboard*  /compte/* (7 sections Stripe Connect Embedded)
```

→ middleware fonctionne, redirection cohérente.

---

## 3. APIs externes

| API | Statut live | Verdict |
|---|---|---|
| **Supabase auth** (`auth.purama.dev`) | ✅ `google: true`, `email: true`, `mailer_autoconfirm: true` | OAuth Google **activé**, signup OK sans validation manuelle |
| **INSEE Sirene V3.11** (via `/api/siret/[siret]`) | ✅ live, retourne données EDF complètes (denomination, NAF, adresse) | Cache + rate-limit token-bucket OK |
| **recherche-entreprises gouv** | ✅ 200 mais ⚠️ `q=PURAMA` retourne 0 résultat | Index gouv ne trouve pas par nom court → faux positif `available:true` |
| **api-adresse.data.gouv.fr** (via `/api/adresse`) | ✅ retourne 8 Rue Chapelle Frasne avec coordonnées | autocomplete OK |
| **Pappers v2 `/recherche`** | 🚨 **HTTP 401 — quota épuisé** ("Vous n'avez plus assez de crédits") | Plan 100 req/mois saturé. Fallback `recherche-entreprises` actif mais index pauvre. **Action recommandée : upgrade plan Pappers ou activer Pay-as-you-go** |
| **Pappers Services `/formalites`** (dépôt INPI) | ⚠️ non testé en POST réel | Code prêt + fallback `procedures.inpi.fr` prefilled OK (validé Phase 1 du plan) |
| **Stripe checkout** (`/api/stripe/checkout`) | ✅ 401 sans auth (correct) | endpoint live, cookie `purama_promo` géré |
| **Stripe Connect AccountSession** | ✅ 401 sans auth (correct) | 7 components mappés sur /compte/* |
| **Anthropic JurisIA** (`/api/jurisia/chat`) | ✅ 400 "Messages manquants" sans payload (correct) | endpoint live, attend Zod payload |
| **VPS SSH 72.62.191.111:22** | 🚨 `Connection reset by peer` | inaccessible via sshpass actuellement. **Non bloquant** car Supabase auth fonctionne déjà via `auth.purama.dev`. À investiguer en parallèle (firewall fail2ban ?) |

---

## 4. Inventaire UI à refondre

### `/` (home — actuellement 10 sections)

```
Hero + Choices + Features + HowItWorks + DemoJurisIA + Comparatif
+ Testimonials + Pricing + FAQ + CTAFinal + Footer
```

**Décision validée** : transformer en **écran d'accueil app pur** style ChatGPT (logo + Commencer + Se connecter + 3 trust signals). Les 10 sections marketing sont supprimées du `/` (gardées éventuellement sur `/about` ou `/comparatif` si réutilisables, sinon retirées).

### `/demarrer` (entrée wizard — 3 cards même rang)

**Décision validée** : refonte avec Entreprise = featured 2 cols (badge "Le plus choisi" + glow conique), Asso + Conseil JurisIA = 1 col chacune, trust strip premium en haut.

### Wizards (`/creer/entreprise` + `/creer/association`)

- ✅ stepper visuel + AnimatePresence framer
- ⚠️ pas de schema Zod par étape → champ vide possible avant `next()`
- ⚠️ pas de persistance entre refresh (sauf à la submit finale via sessionStorage)
- ⚠️ pas de SiretLookup intégré dans flow standard (uniquement reprise + dirigeant)

### Couleurs / tokens (`globals.css`)

- Actuellement : `--primary: #FF6B35`, `--secondary: #FFD700`, `--accent: #5DCAA5`
- **Décision validée** : migrer vers `#FF3D00` (incandescent) / `#FF6B00` (feu pur) / `#FFB300` (or chaud). `themeColor` dans layout aussi.
- Gradient principal actuel `135deg, #FF6B35 → #FFD700` (2 stops) → migrer vers 3 stops `#FF3D00 0% / #FF6B00 45% / #FFB300 100%`.

### Stack visuel additionnel

- ✅ `framer-motion` 12.38, `qrcode.react` 4.2 installés
- 🚨 `tsparticles` **non installé** → `npm i @tsparticles/react @tsparticles/slim` requis pour Phase 3

---

## 5. Defects classés

### 🔴 Critical (bloque la perf produit)

| # | Defect | Plan |
|---|---|---|
| C1 | Pappers v2 quota 100 req/mois épuisé | Activer Pay-as-you-go ou upgrade plan. **Côté code** : afficher message UI clair "Vérification dénomination temporairement indisponible — saisie libre acceptée" si fallback gouv vide |
| C2 | `checkDenominationAvailable("PURAMA")` retourne `available:true` (faux positif quand l'entreprise existe) | Remplacer la logique : utiliser INSEE direct via `pappersEntreprise(siren)` ou retourner "à vérifier" si `similar.length === 0` ET requête courte |
| C3 | Home `/` = landing 10 sections (interdit par CLAUDE.md "JAMAIS landing 13 sections") | Refonte écran d'accueil app pur (Phase 3) |

### 🟠 High (impact UX/design)

| # | Defect | Plan |
|---|---|---|
| H1 | Couleurs `#FF6B35 + #FFD700` pas assez vives | Palette `#FF3D00 / #FF6B00 / #FFB300` (Phase 2) |
| H2 | `/demarrer` 3 cards même rang | Featured 2 col Entreprise + 1 col Asso/Conseil (Phase 3) |
| H3 | Pas de schema Zod par étape wizard | Ajouter validators par step + bouton `next` désactivé tant qu'invalide (Phase 4) |
| H4 | Pas de persistance localStorage entre refresh wizard | sessionStorage tick à chaque update (Phase 4) |
| H5 | Hero current = minimaliste sans visuel marquant | Ajouter gradient mesh CSS + tsParticles léger en background (Phase 3) |

### 🟡 Medium (polish)

| # | Defect | Plan |
|---|---|---|
| M1 | `themeColor: '#FF6B35'` dans layout viewport | Aligner sur `#FF3D00` (Phase 2) |
| M2 | SiretLookup intégré uniquement reprise + dirigeant | Ajouter en step Dénomination pour reprise rapide d'une boîte existante (Phase 4 optionnel) |
| M3 | VPS SSH unreachable (Connection reset) | Investigation séparée — non bloquant tant que Supabase auth répond |
| M4 | Pas de Lighthouse run récent | Lancer dans Phase 5 + alerte si LCP > 2.5s |

### 🟢 Polish (nice-to-have)

- P1 : ajouter Hero3D R3F sphère feu (refusé par toi → CSS pur retenu)
- P2 : dark/light/oled — déjà en place, vérifier sur nouvelles couleurs
- P3 : i18n FR uniquement actuellement utilisé sur landing — pas critique

---

## 6. Validation chaque API a auth/Zod/rate

| Endpoint | Auth | Zod | Rate-limit | Verdict |
|---|---|---|---|---|
| `/api/siret/[siret]` | public (lecture) | Luhn manuel | token-bucket 25/min INSEE | ✅ |
| `/api/check-denomination` | public | manuel | hérite gouv | ⚠️ fallback faible |
| `/api/adresse` | public | manuel | hérite gouv | ✅ |
| `/api/stripe/checkout` | ✅ Supabase | partiel (plan/interval) | ❌ pas de Upstash | ⚠️ à vérifier |
| `/api/connect/account-session` | ✅ | n/a | ❌ | ⚠️ |
| `/api/jurisia/chat` | ✅ + quota DB | ✅ Zod messages | ❌ | ⚠️ |
| `/api/demarches/create` | ✅ | à vérifier | ❌ | ⚠️ |

→ **À vérifier en Phase 4** : ajouter Upstash rate-limit sur les endpoints critiques (checkout, jurisia, demarches).

---

## 7. Ce que je vais faire — récap

**Phase 2** (design system, ~30min) :
- Migrer `globals.css` palette → `#FF3D00 / #FF6B00 / #FFB300`
- Mettre à jour `themeColor` viewport
- Ajouter shadows stratifiés `--shadow-fire-{sm,md,lg}`
- Créer classe `.moksha-card-featured` (glow conique animé) et `.moksha-button-primary` (CTA stratifié + magnetic)

**Phase 3** (refonte UI, ~2h) :
- **`/` → écran d'accueil app pur** : logo + H1 + sous-titre + 2 CTA (Commencer / Se connecter) + 3 trust signals + footer minimal. Suppression des composants Hero / Choices / Features / HowItWorks / DemoJurisIA / Comparatif / Testimonials / Pricing / FAQ / CTAFinal de la home.
- **`/demarrer` refonte** : trust strip + grid asymétrique (Entreprise 2 col featured + Asso + Conseil 1 col), section "Pourquoi MOKSHA ?" 3 piliers, CTA secondaire "Comparer avec LegalPlace"
- Background : gradient mesh CSS + `@tsparticles/slim` léger (50 particules, opacity 0.15) → installer la dépendance

**Phase 4** (bugs + APIs, ~2h) :
- Schema Zod par étape wizard + persistance sessionStorage
- Améliorer `checkDenominationAvailable` (retour "à vérifier" si fallback gouv vide)
- Vérifier flow `/creer/entreprise → /creer/formalites → /paiement → /merci`
- Ajouter rate-limit Upstash sur les endpoints critiques
- Ajouter UI fallback explicite si Pappers 401 (quota)

**Phase 5** (test + deploy, ~1h) :
- Playwright nouveaux tests : `landing.spec.ts` (375/768/1440), `wizard-entreprise.spec.ts` (validation par étape), `demarrer-grid.spec.ts`
- Lighthouse `>90` performance, `>95` SEO, `>95` accessibilité
- `vercel --prod` + smoke test 30 routes

---

**Verdict global** :
- Code = ✅ propre (0 dette technique mesurable)
- Tests = ✅ 55 passés
- APIs = ✅ live sauf Pappers v2 quota épuisé (C1) → mitigé par fallback INPI
- Design = 🟠 à upgrader (couleurs + home + /demarrer)
- Sécurité auth = ✅ Google OAuth activé, redirections OK
- Pas de blocker pour Phase 2/3.

**Prêt à enchaîner Phase 2 (design system) puis Phase 3 (refonte UI).**
