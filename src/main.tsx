import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { migrerAnciennesDonnees } from './data/migration'

migrerAnciennesDonnees()
  .catch((e) => console.error('Migration des anciennes données impossible', e))
  .finally(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
