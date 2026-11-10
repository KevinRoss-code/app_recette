import { useState } from 'react'
import Courses from './components/Courses'
import { IconCourses, IconMenu, IconRecettes, IconTirage } from './components/Icons'
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
} as const
type Onglet = keyof typeof ONGLETS

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('tirage')
  const [ouverte, setOuverte] = useState<{ recette: Recette; portions?: number } | null>(null)
  const voir = (recette: Recette, portions?: number) => setOuverte({ recette, portions })

  return (
    <>
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
        ) : (
          <Recettes onVoir={voir} />
        )}
      </main>
    </>
  )
}
