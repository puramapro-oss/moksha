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

## V7 UPGRADE — RESTE (Waves 4-5)
- [ ] **Wave 4** — Components UI Phase 1 (CardTeaser, WalletPhase1, PrimeTracker) intégrés dashboard
- [ ] **Wave 4** — Banner in-app "Tu as gagné >3000€, pense à déclarer" (logique CRON déjà en place, manque composant React)
- [ ] **Wave 5** — Parrainage V4 3 niveaux : colonne `level` déjà ajoutée, reste logique N2/N3 dans webhook invoice.payment_succeeded + dashboard arbre visuel
- [ ] Enregistrer les 3 nouveaux events dans Stripe Dashboard (invoice.payment_failed, charge.refunded, customer.subscription.created) via curl ou UI
- [ ] Ajouter ANTHROPIC_MODEL_MAIN/FAST/PRO + PURAMA_PHASE=1 + WALLET_MODE=points + PRIME_MODE=phase1 + IN_APP_PURCHASE=false sur Vercel env prod
