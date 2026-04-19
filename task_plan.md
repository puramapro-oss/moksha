# MOKSHA — Task Plan

## P1: Structure + Auth + DB ✅
## P2: Features core (BRIEF) ✅
## P3: Universels (parrainage, wallet, concours, tuto) ✅
## P4: Admin + Aide + FAQ ✅
## P5: Design + Anim + i18n 16 ✅
## P6: Audit + 21 SIM + Lighthouse ✅
## P7: Mobile Expo (iOS + Android) ✅

## UPDATE V5 — Audit + Corrections ✅ COMPLET
- [x] Theme dark/light/OLED (ThemeProvider, CSS, toggle /parametres)
- [x] Couche spirituelle (SpiritualLayer, WisdomFooter, /breathe, /gratitude, awakening.ts)
- [x] Module /financer (wizard 4 étapes, 45 aides, bandeau pricing, lien footer)
- [x] Micro-textes empowering (loading/empty states)
- [x] Table moksha_gratitude_entries sur VPS avec RLS
- [x] Lien /financer dans footer public
- [x] Vérification : tsc 0, build OK, grep clean, curl 200 toutes pages
- [x] Deploy Vercel prebuilt prod OK

## AUDIT V5 — Phase A: DB + /financer complet ✅
- [x] Table moksha_aides dans schema moksha (45 aides seedées + RLS)
- [x] Table moksha_dossiers_financement (+ RLS + CRUD)
- [x] API /api/financer (GET matching aides depuis DB)
- [x] API /api/financer/dossiers (GET/POST/PATCH)
- [x] /financer connecté au DB (plus de JS statique)
- [x] Vraie génération PDF avec jsPDF
- [x] Permissions GRANT schema moksha

## AUDIT V5 — Phase B: Persistence spirituelle ✅
- [x] Table moksha_breath_sessions + RLS
- [x] Table moksha_intentions + RLS
- [x] Table moksha_awakening_events + RLS
- [x] /breathe connecté DB (sessions, historique, +50pts auto)
- [x] /intentions page créée (quotidienne, toggle, streak)
- [x] Sidebar + Intentions nav item

## AUDIT V5 — Phase C: Engagement ✅
- [x] Système streak via moksha_daily_gifts.streak_count + StreakBadge visible dashboard
- [x] Daily gift fonctionnel (/api/points/daily-gift + /dashboard/points)
- [x] Onboarding 10sec — WelcomeBonus component (affirmation + 100pts + action immédiate)
- [x] API /api/points/welcome-bonus (GET check + POST claim, anti-double-réclamation)
- [x] Table moksha_point_transactions déjà en place avec 10 types validés

## AUDIT V5 — Phase D: Social ✅
- [x] Classement hebdo avec 10 ligues (Bronze → Purama) — lib/ligues.ts + /dashboard/classement
- [x] CRON /api/cron/weekly-contest — calcul score dimanche 23h59, upsert top 100
- [x] Tables moksha_influencer_profiles + moksha_influencer_clicks + RLS
- [x] /devenir-influenceur (landing publique 8 paliers)
- [x] /go/[slug] (redirect avec cookie ref 30j + tracking clicks)
- [x] /api/influencer (GET profil+stats / POST création profil avec slug unique)
- [x] /dashboard/influencer (création profil + lien + stats clicks/conversions)
- [x] Sidebar + Influenceur + Classement nav items

## AUDIT V5 — Phase E: Polish ✅
- [x] Conversion popup — ConversionPopup toast bas droite, triggers contextuels (gains en attente / upgrade)
- [x] Tables moksha_popups_shown + moksha_email_sequences (dedup + cooldown 7j)
- [x] Notifications IA adaptatives — /api/notifications/adaptive (7 suggestions prioritisées)
- [x] Email sequences Resend (J1 astuce / J3 relance / J7 tips / J14 upgrade / J21 témoignage / J30 winback)
- [x] CRON /api/cron/email-sequences (daily 10h) — dedup par email_type
- [x] CRON /api/cron/wrapped-monthly (1er du mois 9h) — stats mois précédent + envoi Resend
- [x] Page /dashboard/wrapped (stats mois en cours : points, gratitudes, breath min, intentions, streak, ligue)

## V7 UPGRADE — 2026-04-16 — Waves 1→3 ✅ DEPLOYED
- [x] **Wave 1 — Fondations**
  - [x] Modèles IA via env (ANTHROPIC_MODEL_MAIN/FAST/PRO → sonnet-4-6/haiku-4-5/opus-4-6)
  - [x] 3 fichiers migrés : lib/claude.ts + api/aide/chat + api/jurisia/chat
  - [x] .env.local : PURAMA_PHASE=1, WALLET_MODE=points, PRIME_MODE=phase1, IN_APP_PURCHASE=false
  - [x] .claude/agents/qa-agent.md (22 points) + security-agent.md
  - [x] .claude/commands/ : /deploy /test-full /audit
- [x] **Wave 2 — Paiement V7 §11**
  - [x] SQL migration VPS : moksha_subscriptions + retractions + fiscal_notifications + annual_summaries + profiles.subscription_started_at + referrals.level (RLS)
  - [x] Webhook Stripe: 7 events (ajout customer.subscription.created + invoice.payment_failed + charge.refunded)
  - [x] Prime J+0 = +25€ wallet auto (idempotent) + notif
  - [x] charge.refunded <30j = prime déduite + plan→gratuit + insert retractions
  - [x] PaiementClient wording L221-28 + "Démarrer & recevoir ma prime"
  - [x] /dashboard/parametres/abonnement + résiliation 3 étapes (pertes→pause→feedback)
  - [x] /api/stripe/portal (cancel_at_period_end)
- [x] **Wave 3 — Fiscal §17**
  - [x] /fiscal page publique (seuils 3000€, case 5NG, abattement 34%)
  - [x] /api/fiscal/summary (PDF jsPDF à la demande)
  - [x] CRON /api/cron/fiscal-thresholds (quotidien 7h, paliers 1500/2500/3000, email Resend)
  - [x] CRON /api/cron/prime-tranches (quotidien 6h, M+1=+25€, M+2=+50€)
  - [x] middleware /fiscal + /financer publics
- [x] Deploy Vercel prod OK → https://moksha.purama.dev (curl 200 /, /fiscal, /paiement)

## V7 UPGRADE — Waves 4+5 ✅ DEPLOYED
- [x] **Wave 4** — Components UI Phase 1 (CardTeaser + waitlist RPC, WalletPhase1 solde+points, PrimeTracker 3 paliers 25/25/50) intégrés `/dashboard` + `/dashboard/wallet`
- [x] **Wave 4** — FiscalBanner in-app doré (>3000€/an, fenêtre 1er janv → 15 juin, dismiss persisté sur moksha_fiscal_notifications.acknowledged) monté dans dashboard layout
- [x] **Wave 5** — Parrainage V4 3 niveaux : lib/referrals.ts (getReferralChain + payReferralCommissions idempotent) branché sur checkout.session.completed + invoice.payment_succeeded. Taux 50/15/7%. Unique constraint (referrer, referee, level).
- [x] **Wave 5** — /dashboard/parrainage : stats N1/N2/N3 (count + gains) + arbre visuel 3 niveaux colorés
- [x] Stripe webhook — 7 events enregistrés incl. charge.refunded (we_1TJDwb4Y1unNvKtXntwehEDn)
- [x] Vercel prod env — PURAMA_PHASE=1, WALLET_MODE=points, PRIME_MODE=phase1, IN_APP_PURCHASE=false, ANTHROPIC_MODEL_MAIN/FAST/PRO
- [x] SQL migration VPS : moksha_card_waitlist + moksha_card_waitlist_count() RPC + unique constraint referrals + index fiscal_notifications
- [x] Deploy Vercel prod → 200 sur / /fiscal /paiement /dashboard /dashboard/parrainage

## V4 STRIPE_CONNECT_KARMA — 2026-04-19 ✅ DEPLOYED (10/13 waves)

**Source of truth** : ~/purama/STRIPE_CONNECT_KARMA_V4.md

### ✅ COMPLÉTÉES

- [x] **Wave A** — Pricing 29,99€ single Premium + grandfather Autopilote/Pro legacy. Coupon Stripe ANNUAL_20 créé (livemode forever -20%). PaiementClient refondé (toggle mensuel/annuel, 8 features, mention primes alignées paiements J1/J30/J60).
- [x] **Wave B** — SQL 12 tables V4 appliquées sur VPS (moksha_connect_accounts, moksha_user_wallets, moksha_primes_v4, moksha_bourses_inclusion, moksha_user_tax_profiles, moksha_tax_declarations, moksha_facturx_invoices, moksha_cpa_earnings, moksha_karma_tickets, moksha_karma_draws, moksha_karma_winners, moksha_reglements). RLS owner-only + public (draws/reglements). Fonction SECURITY DEFINER apply_wallet_transaction_v4.
- [x] **Wave C** — Stripe Connect Express + Embedded Components. `lib/stripe-connect.ts` (createConnectAccount type=express FR, controller.fees.payer=account, dashboard=none), API /api/connect/onboard + /status, /dashboard/wallet/connect avec ConnectOnboarding + ConnectPayouts, webhook account.updated sync DB. Webhook Stripe endpoint we_1TJDwb4Y1unNvKtXntwehEDn étendu 11 events.
- [x] **Wave D** — Onboarding fiscal 4 profils (particulier_occasionnel/bnc, autoentrepreneur, entreprise). `lib/tax.ts` (seuils 305/77700/188700/36800€, Luhn SIRET, computeThresholdAlert, getRetraitMessage). API /api/tax/profile GET/POST. Modal TaxProfileOnboarding (2 étapes) dans dashboard layout.
- [x] **Wave E** — Primes V4 refactor J1/J30/J60 = 25/25/50€ alignées paiements. `lib/primes-v4.ts` (ensurePrimeRow idempotent, markSubscriptionPayment, suspendPrimePalier, disbursePrimePalier atomique via Stripe Transfer + wallet materialization, computePayablePaliers, reclaimPrime rétractation). CRON /api/cron/primes-v4-daily (30 6 * * *). Webhook invoice.paid compte paiements validés → palier correspondant. invoice.payment_failed → palier_suspended. charge.refunded <30j → reclaim. PrimeTrackerV4 UI.
- [x] **Wave F** — Flow fiscal 1 (occasionnel) + 2 (BNC 2042-C-PRO). API /api/tax/prefill-2042 (génère PDF jsPDF avec case 5NG/5KU, abattement 34%, instructions 1-click). Page /dashboard/fiscalite adaptée au profil (KPIs, alertes seuils, boutons download). CRON /api/cron/tax-thresholds-v4 (8h daily) scan wallets>1000€, email Resend branded, flag threshold_*_alerted.
- [x] **Wave I** — Bourses Asso inclusion dual circuit strict. `lib/bourses.ts` (7 profils sociaux CAF/rural/jeune/senior/demandeur_emploi/etudiant/handicap avec montants 100-200€, 10 missions citoyennes, 12 subventions renouvelables). API /api/bourses/eligibility + /verify-mission + /disburse (refuse si financement_source != subvention_*). Page /dashboard/bourse + /eligibilite. BourseClient pour soumettre preuves.
- [x] **Wave L** — Règlement jeux-concours OriginStamp blockchain. `lib/originstamp.ts` (SHA-256 + API Tezos free tier, fallback gracieux si clé absente). API /api/reglement/publish admin-only. Page /reglement publique (9 articles obligatoires, hash live) + /remboursement (formulaire frais → Resend).
- [x] **Wave J** — NAMA-Business coach IA + /karma public. `lib/nama-business.ts` (system prompt 15 ans, règles action concrète, redirect JurisIA). API /api/nama/chat streaming SSE (quota 10 msg/j gratuit, illimité payant, model sonnet-4-6/haiku-4-5). Page /dashboard/nama chat plein écran. Page /karma (cagnottes live, 6 jeux, 18 façons, mentions ANJ).
- [x] **Wave K** — 18 façons gratuites gagner tickets + ×5 multiplicateur abonné. `lib/karma-tickets.ts` (20 TicketSource, rules max_per_day, buildTicketInserts, getCurrentDrawPeriod ISO). API /api/karma/ticket (POST anti-abus + ×5 if paying, GET tickets+totals).
- [x] **Wave M** — CRONs karma draws. /api/cron/karma-weekly-draw (dim 23h59, pool 2% CA min 10€, 1 gagnant pondéré). /api/cron/karma-monthly-draw (1er 00:05, pool 3% CA min 50€, 3 gagnants 60/25/15%). Idempotent par period+rank. Transfer Connect + notif.
- [x] **Wave O** — Deploy prod Vercel OK (dpl_HoYQ8exMcLcyqxESf4sz4fWdjSrz). Smoke tests prod : /, /paiement, /reglement, /remboursement, /karma = 200. /dashboard/* = 307 auth redirect OK. tsc 0 erreur, build 0 erreur.

### 🔜 RESTANTES (bloquées par credentials externes)

- [ ] **Wave G** — Flow 3 AE URSSAF Tierce Déclaration. Besoin : URSSAF_TIERCE_API_KEY + URSSAF_TIERCE_MANDATE_TEMPLATE_ID. Code prêt à écrire (DocuSeal mandat 2min, CRON trimestriel). Fallback: génération PDF déclaration trimestrielle + instructions 1-click.
- [ ] **Wave H** — Flow 4 Entreprise Pennylane OAuth + Factur-X. Besoin : PENNYLANE_OAUTH_CLIENT_ID + PENNYLANE_OAUTH_SECRET. Code Factur-X XML CII D16B + PDF/A-3 à écrire. Fallback: EDI-TDFC cert `.p12`.
- [ ] **Wave N** — CPA tracking MOKSHA (Qonto 115€ + Pennylane 60€ + Blank 40€ = 215€) + Google Ad Grants prep (Solidatech + Asso RNA). Besoin : RNA + SIREN Asso + signatures partenaires.

### 📋 ENV VARS À AJOUTER (Vercel dashboard)

```
STRIPE_CONNECT_CLIENT_ID=ca_[à_générer_stripe_dashboard]
KARMA_MIN_WITHDRAWAL_EUR=20
KARMA_RECOMMENDED_WITHDRAWAL_EUR=50
ORIGINSTAMP_API_KEY=[créer_compte_gratuit_originstamp.com]
TAX_THRESHOLD_OCCASIONAL_EUR=305
TAX_THRESHOLD_BNC_MICRO_EUR=77700
TAX_THRESHOLD_BIC_MICRO_EUR=188700
TAX_THRESHOLD_TVA_FRANCHISE_EUR=36800
ASSO_RNA=[RNA_PENDING]
ASSO_SIREN=[SIREN_PENDING]
HELLOASSO_CLIENT_ID=[HELLOASSO_PENDING]
HELLOASSO_CLIENT_SECRET=[HELLOASSO_PENDING]
```

### 🏛️ DUAL CIRCUIT CONFIRMÉ

- **SASU** finance : primes 100€/app (source `cpa_earnings`) — jamais Asso
- **Asso** finance : bourses 50-200€ (source `bourses_inclusion.financement_source='subvention_*'`) — jamais SASU
- Check stricts : DB (CHECK constraint) + code applicatif (disburse refuse 'pending' 402)

### 🎯 PROCHAIN RELANCE

"Continue V4 Waves G/H/N" quand les credentials externes (URSSAF API, Pennylane OAuth, Asso RNA/SIREN, partenaires CPA) sont disponibles.

---

## V7 SUPREME — 2026-04-16 — 3 BLOCS + CROSS-PROMO + AMBASSADEUR ✅ DEPLOYED
- [x] **SQL** migration VPS : moksha.moksha_cross_promos (10 colonnes, 5 index, RLS SELECT own) — tracking cross-promo
- [x] **Coupon Stripe WELCOME50** vérifié existant (créé par MIDAS, -50% once, livemode)
- [x] **Route /go/[slug]** étendue — détecte ?coupon=WELCOME50 + cookie purama_promo HttpOnly 7j + insert cross_promos. Whitelist apps (19) + whitelist coupons. Préserve flow influenceur existant.
- [x] **/api/stripe/checkout** lit cookie purama_promo → applique `discounts:[{coupon:WELCOME50}]` auto. Rattache clic anonyme récent ou crée row. Passe cross_promo_id en metadata. Cookie effacé post-consommation.
- [x] **Webhook Stripe** checkout.session.completed marque moksha_cross_promos.converted=true via metadata.cross_promo_id
- [x] **Renommage Influenceur → Ambassadeur** : nouvelles pages /ambassadeur (landing 9 paliers V7 §20 Bronze 200€ → Éternel 200 000€) + /dashboard/ambassadeur. Ancien /devenir-influenceur et /dashboard/influencer = permanentRedirect 308. Sidebar DashboardShell mise à jour. Middleware PUBLIC_PATHS incl. /ambassadeur. Mot "Influenceur" absent UI.
- [x] **BLOC 1 ReferralBlock** — card glass : lien copy 1 tap + QR code (qrcode.react) + compteur filleuls live + gains cumulés + CTA navigator.share avec fallback copy. Empty state first-filleul.
- [x] **BLOC 2 AmbassadorBlock** — card glass dorée : 9 paliers Bronze→Éternel colorés, palier actuel surligné+glow palier suivant, barre progression, prime delta. CTA /ambassadeur.
- [x] **BLOC 3 CrossPromoBlock** — promotion JurisPurama (KASH 404, fallback mapping V7 §15). Lien https://jurispurama.purama.dev/go/moksha?coupon=WELCOME50. Tracking clic sortant optimiste.
- [x] **Intégration dashboard/page.tsx** : 3 blocs `grid-cols-3 lg:` above the fold après greeting. Ancienne tuile Parrainage retirée (doublon).
- [x] **Redirects CLAUDE.md §12** : /pricing→/paiement, /login→/auth, /devenir-influenceur→/ambassadeur, /dashboard/influencer→/dashboard/ambassadeur
- [x] **Next.js 16.2.4** (HIGH DoS patched via security-agent)
- [x] **Verdicts agents** : qa-agent après fixes = OK | security-agent = PROD OK grade A
- [x] Deploy Vercel prod → dpl_FKjwWzMNrTMZSFEk73BJgNkuZm2K → https://moksha.purama.dev (200 sur / /pricing /login /ambassadeur /paiement /fiscal /dashboard + redirects 307/308 corrects + cookie purama_promo validé Secure+HttpOnly+SameSite=lax+7j)
