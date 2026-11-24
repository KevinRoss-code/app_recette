import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { CloudProvider } from './components/CloudProvider'
import Compte from './components/Compte'
import Courses from './components/Courses'
import { IconCompte, IconCourses, IconMenu, IconRecettes, IconTirage } from './components/Icons'
import Menu from './components/Menu'
import RecetteDetail from './components/RecetteDetail'
import Recettes from './components/Recettes'
import Tirage from './components/Tirage'
import type { Recette } from './domain/types'

const ONGLETS = {
  tirage: { titre: 'Tirage', Icone: IconTirage },
  menu: { titre: 'Menu', Icone: IconMenu },
  courses: { titre: 'Courses', Icone: IconCourses },
  recettes: { titre: 'Recettes', Icone: IconRecettes },
  compte: { titre: 'Compte', Icone: IconCompte },
} as const
type Onglet = keyof typeof ONGLETS

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('tirage')
  const [ouverte, setOuverte] = useState<{ recette: Recette; portions?: number } | null>(null)
  const voir = (recette: Recette, portions?: number) => setOuverte({ recette, portions })

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let annule = false
    let ecouteur: { remove: () => Promise<void> } | undefined
    void import('@capacitor/app').then(async ({ App: Appli }) => {
      const h = await Appli.addListener('backButton', () => {
        if (ouverte) setOuverte(null)
        else if (onglet !== 'tirage') setOnglet('tirage')
        else void Appli.exitApp()
      })
      if (annule) void h.remove()
      else ecouteur = h
    })
    return () => {
      annule = true
      void ecouteur?.remove()
    }
  }, [ouverte, onglet])

  return (
    <CloudProvider>
      <header className="app-header"><h1>Carnet de recettes</h1></header>
      <nav className="nav" aria-label="Navigation principale">
        {(Object.keys(ONGLETS) as Onglet[]).map((o) => {
          const { titre, Icone } = ONGLETS[o]
          return (
            <button key={o} aria-current={o === onglet ? 'page' : undefined} onClick={() => { setOuverte(null); setOnglet(o) }}>
              <Icone />
              <span>{titre}</span>
            </button>
          )
        })}
      </nav>
      <main>
        {ouverte ? (
          <RecetteDetail {...ouverte} onRetour={() => setOuverte(null)} />
        ) : onglet === 'tirage' ? (
          <Tirage onVoir={voir} />
        ) : onglet === 'menu' ? (
          <Menu onVoir={voir} />
        ) : onglet === 'courses' ? (
          <Courses />
        ) : onglet === 'compte' ? (
          <Compte />
        ) : (
          <Recettes onVoir={voir} />
        )}
      </main>
    </CloudProvider>
  )
}
