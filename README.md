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
