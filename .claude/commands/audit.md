---
description: Audit sécurité + perf sans deploy
---

Audit complet sans toucher à la prod :

1. Invoque `security-agent` → rapport.
2. `npm audit --production` → liste critiques/hautes.
3. `npx lhci autorun --collect.url=https://moksha.purama.dev --assert.preset=lighthouse:recommended` → score perf / a11y / SEO.
4. `grep -rE "any\s*:|TODO|FIXME|console\.log" src/` → liste.
5. Rapport consolidé : CRITIQUES / HAUTES / MOYENNES / RECOMMANDATIONS.

Ne modifie AUCUN fichier. Rapport seulement.
