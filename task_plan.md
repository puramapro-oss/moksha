# MOKSHA — Task Plan

## P1: Structure + Auth + DB ✅
## P2: Features core (BRIEF) ✅
## P3: Universels (parrainage, wallet, concours, tuto) ✅
## P4: Admin + Aide + FAQ ✅
## P5: Design + Anim + i18n 16 ✅
## P6: Audit + 21 SIM + Lighthouse ✅

## P7: Mobile Expo (iOS + Android) ✅
- [x] create-expo-app + deps (nativewind, reanimated, supabase, secure-store, zustand, lucide, etc.)
- [x] app.json + eas.json config (bundle dev.purama.moksha, dark mode, plugins)
- [x] tailwind.config.js + babel.config.js + nativewind setup
- [x] lib/supabase.ts with SecureStore adapter (CRITIQUE auth mobile)
- [x] lib/constants.ts (colors, plans, formes juridiques, points)
- [x] lib/utils.ts (cn, formatPrice, formatDate, isSuperAdmin)
- [x] hooks/useAuth.ts (session, profile, signIn/Up/Out)
- [x] hooks/useStore.ts (zustand state)
- [x] components/ui/ (Button, Card, Input, Badge, EmptyState, Skeleton)
- [x] app/_layout.tsx (AuthGuard + routing)
- [x] app/(tabs)/ — 5 tabs (Accueil, JurisIA, ProofVault, Cadeau, Profil)
- [x] app/auth/ (login, signup, forgot-password)
- [x] app/creer/ (choix, wizard entreprise 6 étapes, wizard association 5 étapes)
- [x] app/simulateur/ (comparaison statuts fiscaux)
- [x] app/parrainage/ (code, partage, filleuls, tiers)
- [x] app/wallet/ (solde, historique, retrait)
- [x] app/points/ (balance, comment gagner, boutique)
- [x] app/settings/ (dark mode, langue, notifs, RGPD, suppression compte)
- [x] app/aide/ (FAQ 8 questions, recherche, chatbot JurisIA)
- [x] app/rappels/ (liste, toggle complete, overdue detection)
- [x] app/partage/ (8 canaux: natif, WhatsApp, SMS, Telegram, Twitter, LinkedIn, Email, copier)
- [x] Icons Pollinations (icon 1024, adaptive-icon, splash, favicon)
- [x] 10 flows Maestro YAML (auth, navigation, jurisia, wizard entreprise/asso, proofvault, simulateur, parrainage/wallet, daily gift, settings/profile)
- [x] store.config.json 16 langues (fr, en, es, de, it, pt, nl, pl, sv, ar, zh, ja, ko, hi, ru, tr)
- [x] GOOGLE_PLAY_SETUP.md (3 min setup)
- [x] EAS workflow full-deploy.yaml (build + submit iOS + Android)
- [x] .env mobile
- [x] tsc --noEmit = 0 erreur
