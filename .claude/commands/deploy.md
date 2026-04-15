---
description: Deploy MOKSHA en prod après QA + Security validés. Bloque si 1 agent refuse.
---

Déploiement MOKSHA production. Exécute dans l'ordre, stoppe au premier ❌ :

1. Invoque le sub-agent `qa-agent` — attends le VERDICT. Si BLOQUÉ → STOP, affiche les bloquants.
2. Invoque le sub-agent `security-agent` — attends le VERDICT. Si BLOQUÉ → STOP.
3. `npx tsc --noEmit` → 0 erreur
4. `npm run build` → 0 erreur
5. `vercel --prod --token $VERCEL_TOKEN --scope puramapro-oss --yes`
6. `curl -sI https://moksha.purama.dev` → 200
7. Test curl sur : `/login`, `/pricing`, `/financer`, `/fiscal`, `/subscribe` → 200
8. Rapport final : URL live + commit SHA + statut.

Si QA ou Security BLOQUÉ → ne déploie PAS. Liste les correctifs.
