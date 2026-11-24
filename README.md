# app_recette
App for creating shopping lists and recipes 
```bash
npm install
npm run dev     # serveur de dev
npm test        # tests
npm run build   # build PWA dans dist/
```
Node 18 : vite 5 et workbox-build épinglé à 7.3.0 (voir overrides).

## Déploiement
GitHub Pages via `.github/workflows/deploy.yml` (push sur `main`).
Réglage unique : Settings > Pages > Source = « GitHub Actions ».
URL : https://kevinross-code.github.io/app_recette/

## Synchronisation (Supabase)
Les données restent d'abord dans le navigateur (IndexedDB) ; Supabase n'en est qu'une copie partagée entre appareils.
1. Créer un projet sur supabase.com, puis exécuter `supabase/schema.sql` (SQL Editor).
2. Authentication > Providers > Email : désactiver « Confirm email » (usage perso) ou confirmer l'e-mail une fois.
3. Récupérer Project URL et clé `anon` (Settings > API). Jamais la clé `service_role`.
4. Local : copier `.env.example` en `.env.local`. Déploiement : GitHub > Settings > Secrets and variables > Actions > onglet Variables > `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
5. Dans l'appli, onglet Compte : créer le compte, puis se connecter avec le même e-mail sur chaque appareil.

Fonctionnement : chaque ligne a un `updatedAt`, la plus récente gagne ; les suppressions sont des « tombstones » (`deletedAt`) pour se propager. Les anciennes données (base `carnet-recettes`, ids numériques) sont copiées une fois vers `carnet-v2` (UUID) sans jamais être supprimées.

## Application Android (APK hors-ligne)
Capacitor 6 embarque le build web (`npm run build:android`, base `./`, sans service worker) dans un APK ; le projet natif est dans `android/` (versionné).
- Fabrication : GitHub Actions, workflow `Build Android APK`. Pousser un tag `android-vN` (ex. `git tag android-v1 && git push origin android-v1`) publie l'APK dans une Release ; le lien stable est `https://github.com/KevinRoss-code/app_recette/releases/latest/download/carnet-recettes.apk`.
- Installation : ouvrir ce lien sur le téléphone, autoriser « sources inconnues » pour le navigateur, installer. Pour mettre à jour : nouveau tag, télécharger, installer par-dessus (même signature).
- Signature : la clé n'est **pas** dans le dépôt. Elle est créée une fois (`keytool`), stockée hors dépôt (sauvegardez-la : perdue, les mises à jour ne s'installent plus par-dessus) et fournie à la CI par 2 secrets GitHub : `KEYSTORE_BASE64` (fichier encodé en base64) et `KEYSTORE_PASSWORD` (Settings > Secrets and variables > Actions > onglet Secrets). Alias : `carnet`.
- Données : le WebView de l'appli a sa propre base (distincte de celle de Chrome) ; se connecter dans l'onglet Compte pour récupérer les recettes par la synchro.
- Local : pas d'Android SDK requis tant qu'on ne fabrique pas l'APK ici ; `npm run build:android && npx cap sync android` suffit pour mettre à jour le projet natif.
