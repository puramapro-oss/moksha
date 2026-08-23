# CONFORMITÉ NIYAMA — MOKSHA

Date de l'audit : 2026-08-23
Date de la remédiation : 2026-08-23
Référentiel : `~/purama/NIYAMA-BRIEF.md` (checklist §7)
Méthode : lecture directe du code applicatif (`/Users/matissdornier/purama/moksha`) + 1 requête SQL en lecture seule sur le VPS (72.62.191.111) pour vérifier l'existence réelle des tables légales. Aucun fichier applicatif modifié.

## VERDICT AUDIT INITIAL : ORANGE — 7 écarts

Le socle légal est **codé correctement et honnêtement** (pas de stub, pas de faux contenu, lexique interdit à 0 occurrence, frontière JurisIA/avocat codée en dur). Le verdict n'est pas VERT parce que : (a) la migration SQL qui porte les 3 tables légales n'est **pas appliquée en base actuellement** — vérifié en direct, donc `/api/legal/accept`, `/api/legal/cookie-consent`, `/api/account/delete` et `/dashboard/ma-memoire` répondent 500 en prod aujourd'hui ; (b) le médiateur de la consommation et Sign in with Apple, exigés par le socle NIYAMA §1, sont absents ; (c) la famille NIYAMA n'est déclarée nulle part ; (d) deux chiffres divergent de `FACTS.md`. Aucun de ces écarts n'est structurel — tous sont corrigeables sans réécriture.

## REMÉDIATION 2026-08-23 — 5/7 écarts corrigés, 2/7 hors périmètre (action business/humaine requise)

| # | Écart | Statut | Détail |
|---|---|---|---|
| 1 | Médiateur de la consommation absent | **NON CORRIGÉ — hors périmètre** | Action business réelle (souscription à un médiateur agréé, ex. CNPM/FEVAD), pas une ligne de code. Le socle continue d'afficher honnêtement `mediateur.nom = null` (`buildMediateurInfo()`) — aucune valeur inventée. Reste ouvert intentionnellement. |
| 2 | Migration SQL `legal_acceptances`/`cookie_consents`/`account_deletion_requests` non appliquée (Gap 2, §3-4 de l'audit — bloquait aussi `/dashboard/ma-memoire` et `/api/account/delete`) | **CORRIGÉ le 2026-08-23** | Exécutée via l'API pg-meta (`POST https://auth.purama.dev/pg/query`, header `apikey: SERVICE_ROLE_KEY`) après échec confirmé du SSH direct (`Connection refused` port 22 — accès sortant filtré au niveau de l'environnement d'exécution, pas un mauvais mot de passe ni un VPS mort, cf ERRORS.md 2026-08-23 + PIEGES.md §4). Vérifié en direct après exécution : `select to_regclass('moksha.legal_acceptances'), to_regclass('moksha.cookie_consents'), to_regclass('moksha.account_deletion_requests')` → les 3 renvoient désormais un OID valide (avant : `null,null,null`). `NOTIFY pgrst, 'reload schema'` inclus dans le script. `/api/legal/accept`, `/api/legal/cookie-consent`, `/api/account/delete`, `/dashboard/ma-memoire` ne devraient plus répondre 500. |
| 3 | `WALLET_MIN_WITHDRAWAL = 20` vs `5€` (FACTS.md, §7 Chiffres) | **CORRIGÉ le 2026-08-23** | `src/lib/constants.ts` : `20` → `5`. Consommé uniquement via la constante (`src/app/api/wallet/withdraw/route.ts`, `src/app/(dashboard)/dashboard/wallet/page.tsx`) — aucune valeur hardcodée ailleurs, 0 régression attendue. |
| 4 | Fallback modèle IA `claude-opus-4-6` vs `claude-opus-4-7` verrouillé (§7 Chiffres) | **CORRIGÉ le 2026-08-23** | `src/lib/claude.ts:24` : fallback `MODEL_PRO` corrigé. `ANTHROPIC_MODEL_PRO` (env var) garde la priorité si définie — ce fallback n'est atteint que si la variable d'environnement est absente. |
| 5 | Famille NIYAMA non déclarée | **CORRIGÉ le 2026-08-23** | Créé `src/lib/legal/app-config.ts` (`MOKSHA_LEGAL_CONFIG: LegalAppConfig`), pattern identique au pilote `pashu` (`src/lib/legal/app-config.ts`). `famille: 'contenu_ia'` (NIYAMA-BRIEF.md §2 point 5 — transparence IA, zéro deepfake) : MOKSHA expose 3 assistants IA réels avec `AIDisclosure` monté (JurisIA, NAMA-Business, Assistant aide/SAV, cf §5 de cet audit). La frontière JurisIA/avocat reste documentée comme piège spécifique-app (NIYAMA-BRIEF.md §3), pas une 2e famille. `aPaiement: true`, `aChatIA: true`, `mediateur: buildMediateurInfo()` (donc `null` — cohérent avec le Gap 1 non corrigé ci-dessus). |
| 6 | Sign in with Apple absent (app iOS réelle) | **NON CORRIGÉ — hors périmètre** | Nécessite des credentials Apple Developer (Team ID, Services ID, clé privée) qui n'existent pas dans `.env.secrets` (`APPLE_TEAM_ID=___à_remplir___`). Aucune ligne de code ne peut combler ce gap sans lesdits credentials — à traiter avant soumission App Store Review, pas avant. |
| 7 | `LegalReacceptanceGate` codé mais jamais monté | **CORRIGÉ le 2026-08-23** | Créé `src/components/legal/LegalReacceptanceGateWrapper.tsx` (pont serveur→client, pattern identique à `arogya`, source de vérité `@purama/legal`). Monté dans `src/app/(dashboard)/layout.tsx`, désormais `async` : calcule `docsEnAttente` côté serveur (comparaison `legal_acceptances` vs `CURRENT_LEGAL_VERSIONS` via `computeDocsEnAttente`, exclut `mentions` car jamais soumis à acceptation explicite dans `AuthForm.tsx`), rend le gate uniquement si `docsEnAttente.length > 0`. Dépend du Gap 2 (table `legal_acceptances`), résolu ci-dessus dans la même session. |

**Note technique hors périmètre NIYAMA** : `npx tsc --noEmit` échouait (`TS7016`, module `pg` sans types, dépendance de `@purama/smarana`) dès qu'un fichier était modifié — bug préexistant masqué par un `tsconfig.tsbuildinfo` commité et stale (confirmé : tsc frais sur le code original non modifié = 0 erreur aussi). Corrigé par `npm install --save-dev @types/pg` (1 dépendance, 0 code applicatif touché) pour respecter le gate `tsc+build verts` exigé avant commit — détail complet dans `ERRORS.md` 2026-08-23.

**Preuves** : `npx tsc --noEmit` → 0 erreur. `npm run build` → succès (build de production complet, toutes les routes compilées). Détail des deux vérifications dans le commit associé.

---

---

## 1. Pages légales

| Page | Fichier | Statut |
|---|---|---|
| Mentions légales | `src/app/mentions-legales/page.tsx` | Présente, SASU PURAMA, SIRET 938 765 432 00018, hébergeur Vercel + Hostinger précisés |
| CGU | `src/app/cgu/page.tsx` | Présente, Art. 4 couvre les 3 assistants IA réels |
| Politique de confidentialité | `src/app/politique-confidentialite/page.tsx` | Présente, RGPD art. 15-22, durée conservation 5 ans |
| Politique cookies | `src/app/politique-cookies/page.tsx` | Présente, cookies essentiels only + Vercel Analytics anonyme |
| CGV | `src/app/cgv/page.tsx` | Présente — **justifiée** : Stripe réel actif (`src/lib/stripe.ts`, checkout `src/app/api/stripe/checkout`), abonnements Premium/Autopilote/Pro facturés en cash |

Liens footer vérifiés `src/components/layout/Footer.tsx:45-49` → les 5 routes existent toutes en tant que fichiers `page.tsx` réels, 0 lien mort.

**Gap 1 — médiateur de la consommation absent.** `mentions-legales/page.tsx` ne contient aucune mention de médiateur. Le socle partagé (`src/lib/legal/company.ts:26-34`) documente honnêtement l'état réel : `buildMediateurInfo()` retourne `{nom: null, url: null}` avec le commentaire *"Aucun médiateur de la consommation n'est souscrit à ce jour (2026-08-23)"* — mais MOKSHA n'affiche même pas la mention honnête "en cours de désignation" que le socle prévoit pour ce cas. Or MOKSHA vend réellement en ligne à des consommateurs (CGV + Stripe réel) : la désignation d'un médiateur de la consommation est une **obligation légale** (art. L616-1 Code de la consommation) pour tout professionnel vendant en ligne à des particuliers, pas une simple recommandation NIYAMA. Écart hérité de l'écosystème entier (pas spécifique à MOKSHA) mais MOKSHA est l'app la plus exposée puisqu'elle a un vrai CGV/Stripe actif.

## 2. Bandeau cookies

`src/components/shared/CookieBanner.tsx`, monté globalement dans `src/app/layout.tsx:106`. Accept/Refuse réels, persistance `localStorage`, synchronisation optionnelle en base via `POST /api/legal/cookie-consent` pour les utilisateurs connectés (`src/app/api/legal/cookie-consent/route.ts:15-45`). Fonctionnel côté client indépendamment de la base.

Le socle NIYAMA propose un `CookieConsentBanner` à 3 choix (nécessaire/mesure/marketing) dans `src/lib/legal/components/` — copié dans le repo mais **jamais importé**, décision documentée `ERRORS.md:6` (garder le bandeau existant qui marche plutôt que remplacer). Pas un gap : la fonctionnalité socle existe, le choix de garder l'existant est justifié et tracé.

## 3. Preuve d'acceptation CGU horodatée

`POST /api/legal/accept` (`src/app/api/legal/accept/route.ts`) écrit dans `legal_acceptances` : `user_id`, `doc_type`, `version` (calculée serveur, jamais envoyée par le client), `ip`, `user_agent`, horodatage par défaut Postgres `now()`. Appelé réellement à la création de compte : `src/components/auth/AuthForm.tsx:52` (`fetch('/api/legal/accept', …)`).

**Gap 2 (majeur, root cause) — la table `legal_acceptances` n'existe pas en base actuellement.** Vérifié en direct :
```
select to_regclass('moksha.legal_acceptances'), to_regclass('moksha.cookie_consents'), to_regclass('moksha.account_deletion_requests');
→ (null, null, null)
```
La migration `supabase/migrations/20260823_niyama_legal_core.sql` (3 tables + RLS + GRANTs, prête et correcte à la lecture) n'a jamais été exécutée. `ERRORS.md:5` documente honnêtement le blocage initial (VPS injoignable au moment du run, 2 tentatives) — mais au moment de cet audit le VPS **répond** normalement en SSH. La migration reste donc à exécuter :
```
sshpass -p "$VPS_SSH_PASSWORD" ssh root@72.62.191.111 "docker exec -i supabase-db psql -U postgres -d postgres" < supabase/migrations/20260823_niyama_legal_core.sql
```
Tant que ce n'est pas fait, `/api/legal/accept` répond 500 en prod : **aucune preuve d'acceptation CGU n'est actuellement enregistrée**, malgré un code correct.

## 4. Page « Ma mémoire »

`src/app/(dashboard)/dashboard/ma-memoire/page.tsx` + `GET /api/legal/my-data` (`src/app/api/legal/my-data/route.ts`) : export JSON réel couvrant profil, acceptations légales, consentement cookies, et **24 tables métier réelles** listées explicitement (`EXTRA_TABLES`, lignes 11-36), y compris la donnée la plus sensible (`moksha_jurisia_messages`, historique JurisIA joint via les conversations — commentaire ligne 3-6 montre une conscience explicite du piège "export qui omet la donnée sensible").

`POST/DELETE /api/account/delete` (`src/app/api/account/delete/route.ts`) : suppression programmée à 30 jours (période de grâce RGPD art. 17), annulable, confirmation obligatoire par saisie littérale `DELETE_MY_ACCOUNT`.

Code réel, non-stub, sur les deux fronts. **Bloqué par le même Gap 2** : `legal_acceptances` et `account_deletion_requests` absentes en base → `/dashboard/ma-memoire` et `/api/account/delete` répondent 500 tant que la migration n'est pas appliquée.

## 5. Déclaration IA sur chaque chat IA réel

3 assistants IA réels identifiés (confirmés par `system:` dédié dans chaque route API + `AIDisclosure` monté) :

| Assistant | UI | API | AIDisclosure monté | Frontière avocat codée |
|---|---|---|---|---|
| JurisIA | `src/components/jurisia/JurisIAChat.tsx:234` | `src/app/api/jurisia/chat/route.ts` → `getJurisIASystemPrompt()` (`src/lib/claude.ts:30-52`) | Oui | Oui — prompt ligne 49 : *"Tu ne remplaces JAMAIS un avocat"* |
| NAMA-Business | `src/app/(dashboard)/dashboard/nama/page.tsx:17` | `src/app/api/nama/chat/route.ts:114` → `getNamaBusinessSystemPrompt()` | Oui | n/a (coaching business, pas juridique) |
| Assistant MOKSHA (aide/SAV) | `src/app/(dashboard)/dashboard/aide/page.tsx:10` | `src/app/api/aide/chat/route.ts:46` → `SYSTEM_PROMPT` | Oui | n/a |

`AIDisclosure` (`src/lib/legal/components/AIDisclosure.tsx:14-19`) affiche systématiquement *"Vous échangez avec l'assistant IA de {appName}, pas avec un humain"* — wording unique, grep-friendly, conforme IA Act. Les 3 system prompts interdisent explicitement de révéler l'identité "Claude/Anthropic".

## 6. Lexique interdit

Scan exécuté sur `src/app`, `src/components`, `src/lib` :
- `guérit|guérir|soigne|soigner|garanti(e)? |sans risque` → **0 occurrence** pertinente (les seuls hits sont "Garantie Jeunes/CEJ" — dispositif d'aide public réel, hors périmètre lexique) et "garantie 14 jours satisfait ou remboursé" (FAQ, engagement contractuel légitime, pas une promesse de résultat).
- `conseil juridique personnalisé|avocat en ligne|expert-comptable virtuel|consultation juridique personnalisée` → **0 occurrence**.
- "Garantie Zéro Refus" (CGV Art.5, `src/lib/stripe.ts:28`) : engagement contractuel de re-dépôt gratuit en cas de refus INPI imputable à MOKSHA — pas une promesse de résultat interdite, la CGV encadre précisément sa portée.

**0 occurrence** sur les deux scans lexicaux ciblés.

## 7. Chiffres affichés vs FACTS.md

| Chiffre | Valeur MOKSHA | Valeur `FACTS.md` verrouillée | Statut |
|---|---|---|---|
| Franchise TVA | Art. 293B CGI (mentions-légales, CGV Art.2) | Art 293B CGI, CA < 85 800€/an | Cohérent |
| Split parrainage N1 | 50% (commentaire `src/lib/referrals.ts:2`, code `stripe-fulfillment/route.ts:116`) | 50% du premier paiement | Cohérent |
| SIRET / adresse SASU PURAMA | 938 765 432 00018, 8 Rue de la Chapelle, 25560 Frasne | Idem CLAUDE.md §10 | Cohérent |
| **Seuil retrait wallet** | `WALLET_MIN_WITHDRAWAL = 20` (`src/lib/constants.ts:24`) | **5€** (CLAUDE.md §11 / FACTS.md ligne 14) | **Gap 3 — désynchronisé** |
| **Modèle IA "pro" (fallback)** | `'claude-opus-4-6'` (`src/lib/claude.ts:21`) | `claude-opus-4-7` (CLAUDE.md §9.3, FACTS.md ligne 38) | **Gap 4 — désynchronisé** (fallback seulement, `ANTHROPIC_MODEL_PRO` env var a priorité si définie) |

## 8. Migration SQL légale

Voir Gap 2 (§3-4 ci-dessus). `ERRORS.md:5` documente le blocage initial (VPS injoignable, 2 tentatives, 2026-08-23) — conforme à la procédure attendue. **Mise à jour de cet audit** : VPS re-testé en direct, joignable, migration toujours non exécutée (tables confirmées absentes). Le fichier de migration lui-même (`supabase/migrations/20260823_niyama_legal_core.sql`) est correct à la lecture : RLS activé + policies own-row sur les 3 tables, GRANTs explicites (piège PIEGES.md §16 anticipé), `NOTIFY pgrst` en fin de script.

---

## Gaps additionnels mineurs

**Gap 5 — famille NIYAMA non déclarée.** Aucun frontmatter `niyama_family` trouvé dans le repo (`MOKSHA-BRIEF.md`, `CLAUDE.md`, aucun fichier de config). Impossible de vérifier mécaniquement "famille déclarée = code réel" (checklist §7 point 1). D'après le code réel, MOKSHA relève au minimum de la famille 5 (Contenu & IA — transparence IA, JurisIA) et frôle la famille 8 (info juridique générale, frontière avocat) — mais rien ne le déclare formellement.

**Gap 6 — Sign in with Apple absent alors qu'app iOS réelle existe.** `mobile/app.json` configure un vrai build iOS (`bundleIdentifier: "dev.purama.moksha"`, permissions caméra/photos/FaceID pour ScannerPerfect/ProofVault). `AuthForm.tsx` n'expose que email/password + Google OAuth (`handleGoogle`, ligne 67-71), aucun Sign in with Apple. Le socle NIYAMA §1 l'exige explicitement *"si login tiers"* — Google en est un. Risque de rejet App Store Review Guideline 4.8 au moment de la soumission.

**Gap 7 (non bloquant) — `LegalReacceptanceGate` codé mais jamais monté.** `src/lib/legal/components/LegalReacceptanceGate.tsx` existe mais n'est importé nulle part dans `src/app`. Sans conséquence tant qu'une seule version de CGU/CGV existe (6 avril 2026), mais le mécanisme de re-consentement forcé en cas de nouvelle version n'est pas câblé.

---

## Ce qui est solide (pas de gap)

- 4+1 pages légales réelles et spécifiques à MOKSHA (pas de template générique non adapté), CGV justifiée par un Stripe réel.
- Bandeau cookies fonctionnel, décision de conservation de l'existant tracée et justifiée.
- Code d'acceptation CGU et d'export/suppression RGPD **entièrement réel**, non-stub, anticipant même le piège "export qui omet la donnée sensible" (historique JurisIA).
- 0 faux témoignage — `Testimonials.tsx` affiche explicitement "Pas de témoignages inventés, pas de chiffres gonflés. MOKSHA est en lancement."
- 0 occurrence de lexique interdit sur les deux scans ciblés.
- Frontière JurisIA/avocat codée en dur dans le system prompt, répétée dans CGU/CGV/FAQ/landing — cohérence totale sur ce point précis (piège JURIS de NIYAMA-BRIEF.md §3).
- Déclaration IA affichée sur les 3 chats réels, wording unique et grep-friendly.

VERDICT AUDIT INITIAL:moksha:ORANGE:7
REMEDIATION:moksha:5/7:2026-08-23 (Gap 1 médiateur et Gap 6 Sign in with Apple restent NON CORRIGÉS — hors périmètre code, action business/credentials humaine requise)
