import { useState } from 'react'
import Courses from './components/Courses'
import Menu from './components/Menu'
import Recettes from './components/Recettes'
import Tirage from './components/Tirage'

const ONGLETS = { tirage: 'Tirage', menu: 'Menu', courses: 'Courses', recettes: 'Recettes' } as const
type Onglet = keyof typeof ONGLETS

export default function App() {
  const [onglet, setOnglet] = useState<Onglet>('tirage')
  return (
    <main>
      <h1>Carnet de recettes</h1>
      <nav className="row">
        {(Object.keys(ONGLETS) as Onglet[]).map((o) => (
          <button key={o} aria-pressed={o === onglet} onClick={() => setOnglet(o)}>{ONGLETS[o]}</button>
        ))}
      </nav>
      {onglet === 'tirage' ? <Tirage /> : onglet === 'menu' ? <Menu /> : onglet === 'courses' ? <Courses /> : <Recettes />}
    </main>
  )
}
