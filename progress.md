# MOKSHA — Progress

## Current Phase: AUDIT V5 — Phase A+B TERMINÉES

### Deploy:
- URL: https://moksha.purama.dev
- Status: 200 OK
- Method: Vercel prebuilt --prod

### Phase A — DB + /financer complet ✅
- Table `moksha.moksha_aides` créée avec 45 aides seedées + RLS
- Table `moksha.moksha_dossiers_financement` créée + RLS
- API `/api/financer` (GET — matching aides depuis DB)
- API `/api/financer/dossiers` (GET/POST/PATCH — CRUD dossiers)
- /financer connecté au DB au lieu de JS statique
- Vraie génération PDF avec jsPDF
- Step 4 suivi avec persistence DB (statut en_cours/accepte/refuse)
- Permissions GRANT sur schema moksha pour service_role/anon/authenticated

### Phase B — Persistence spirituelle ✅
- Table `moksha.moksha_breath_sessions` créée + RLS
- Table `moksha.moksha_intentions` créée + RLS
- Table `moksha.moksha_awakening_events` créée + RLS
- /breathe connecté au DB (sauvegarde sessions, historique, +50pts auto après 3min)
- /intentions page créée (intention quotidienne, toggle accomplie, streak, historique)
- Sidebar mise à jour avec lien Intentions (icône Sparkles)

### Fichiers modifiés cette session:
**NEW FILES:**
- src/app/api/financer/route.ts
- src/app/api/financer/dossiers/route.ts
- src/app/(dashboard)/dashboard/intentions/page.tsx
- schema-financer.sql
- schema-moksha.sql

**MODIFIED FILES:**
- src/app/(dashboard)/dashboard/financer/page.tsx (DB + PDF + dossiers)
- src/app/(dashboard)/dashboard/breathe/page.tsx (DB persistence + historique)
- src/components/dashboard/DashboardShell.tsx (+ intentions nav)

**DB (schema moksha):**
- moksha_aides (45 rows seeded)
- moksha_dossiers_financement
- moksha_breath_sessions
- moksha_intentions
- moksha_awakening_events

### Reste à faire (Phases C-E):
- Phase C: Streak system + daily gift + onboarding + point_transactions
- Phase D: Classement + contests CRONs + influenceur
- Phase E: Conversion popup + notifications IA + email sequences + wrapped
