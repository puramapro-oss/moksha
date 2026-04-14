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

## AUDIT V5 — Phase E: Polish ❌
- [ ] Conversion popup (triggers contextuels)
- [ ] Notifications IA adaptatives
- [ ] Email sequences Resend (10 emails)
- [ ] Wrapped mensuel
