import { useState } from 'react'
import Courses from './components/Courses'
import Menu from './components/Menu'
import RecetteDetail from './components/RecetteDetail'
import Recettes from './components/Recettes'
import Tirage from './components/Tirage'
import type { Recette } from './domain/types'

const ONGLETS = { tirage: 'Tirage', menu: 'Menu', courses: 'Courses', recettes: 'Recettes' } as const
type Onglet = keyof typeof ONGLETS

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('tirage')
  const [ouverte, setOuverte] = useState<{ recette: Recette; portions?: number } | null>(null)
  const voir = (recette: Recette, portions?: number) => setOuverte({ recette, portions })
  return (
    <main>
      <h1>Carnet de recettes</h1>
      <nav className="row">
        {(Object.keys(ONGLETS) as Onglet[]).map((o) => (
          <button key={o} aria-pressed={o === onglet} onClick={() => { setOuverte(null); setOnglet(o) }}>{ONGLETS[o]}</button>
        ))}
      </nav>
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
  )
}
