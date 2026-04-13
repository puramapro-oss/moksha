# MOKSHA — Task Plan

## P1: Structure + Auth + DB ✅
## P2: Features core (BRIEF) ✅
## P3: Universels (parrainage, wallet, concours, tuto) ✅
## P4: Admin + Aide + FAQ ✅
## P5: Design + Anim + i18n 16 ✅
## P6: Audit + 21 SIM + Lighthouse ✅
## P7: Mobile Expo (iOS + Android) ✅

## UPDATE V5 — Audit + Corrections ✅
- [x] Phase 1 — Toggle Theme dark/light/OLED
  - [x] ThemeProvider (src/components/shared/ThemeProvider.tsx)
  - [x] CSS variables light + OLED dans globals.css
  - [x] Script anti-flash dans layout.tsx head
  - [x] Theme selector dans /parametres
  - [x] DashboardShell utilise CSS vars au lieu de hardcoded colors
- [x] Phase 2 — Bottom tab mobile (déjà existant dans DashboardShell)
- [x] Phase 3 — Couche spirituelle
  - [x] src/lib/awakening.ts (affirmations, citations, micro-textes, niveaux éveil)
  - [x] src/hooks/useAwakening.ts
  - [x] src/components/shared/SpiritualLayer.tsx (affirmation modal au login)
  - [x] src/components/shared/WisdomFooter.tsx (citations rotatives)
  - [x] /dashboard/breathe (respiration 4-7-8 avec cercle animé)
  - [x] /dashboard/gratitude (journal 3/jour + streak)
  - [x] Sidebar: section "Bien-être" avec Respiration + Gratitude
  - [x] WisdomFooter intégré dans DashboardShell
  - [x] SpiritualLayer intégré dans DashboardShell
- [x] Phase 4 — Module /financer
  - [x] src/lib/aides-data.ts (45 aides avec matching + cumul)
  - [x] /dashboard/financer — wizard 4 étapes (profil → matching → PDF → suivi)
  - [x] Bandeau vert sur Pricing "La plupart ne paient rien grâce aux aides"
  - [x] Lien /financer dans sidebar (section Croissance)
- [x] Phase 5 — Vérification
  - [x] tsc --noEmit = 0 erreurs
  - [x] npm run build = OK (toutes pages incluses)
  - [x] grep TODO/console.log/Lorem/faux contenu = 0
