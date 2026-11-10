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
