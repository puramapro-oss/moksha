# MOKSHA — Google Play Setup (3 min)

## Pré-requis
- Google Play Console ouverte (25$ one-time, déjà payé)
- `google-service-account.json` dans le dossier `mobile/`

## Étapes (3 min de clics)

### 1. Créer l'application (30 sec)
1. Google Play Console > "Créer une application"
2. **Nom** : `MOKSHA - Crée ton Entreprise`
3. **Langue** : Français
4. **Type** : Application
5. **Gratuit/Payant** : Gratuit
6. Cocher les déclarations > Créer

### 2. Fiche Store (1 min)
1. **Description courte** : `Lance ta boîte en 10 min. Agent juridique IA intégré.`
2. **Description complète** : Copier depuis `store.config.json` > google > fr-FR > fullDescription
3. **Icône** : Uploader `assets/images/icon.png` (512x512)
4. **Feature graphic** : Uploader `assets/images/feature.png` (1024x500)
5. **Screenshots** : Uploader les screenshots du dossier `maestro/screenshots/`

### 3. Catégorie & Coordonnées (30 sec)
1. **Catégorie** : Entreprise
2. **Email** : matiss.frasne@gmail.com
3. **Site web** : https://moksha.purama.dev
4. **Politique de confidentialité** : https://moksha.purama.dev/politique-confidentialite

### 4. Classification du contenu (30 sec)
1. Questionnaire IARC > Répondre "Non" à tout
2. Résultat attendu : "Tous publics" (PEGI 3)

### 5. Gestion des versions (30 sec)
Le build est soumis automatiquement via EAS Submit.
1. Vérifier que le build apparaît dans "Production"
2. Cliquer "Examiner" > "Lancer le déploiement"

## Automatisation
Après le setup initial, tout est automatique :
- `eas build --platform android --profile production`
- `eas submit --platform android --profile production`
- Ou via le workflow : `git push origin main`

## Service Account
Le fichier `google-service-account.json` est configuré dans `eas.json` :
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

## Checklist
- [ ] Application créée sur Google Play Console
- [ ] Fiche store remplie (FR + EN)
- [ ] Screenshots uploadés
- [ ] Classification du contenu complétée
- [ ] Premier build soumis via EAS
- [ ] Version publiée en production
