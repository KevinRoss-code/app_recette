import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { creer, exporterJson, importerJson, lister, modifier, supprimer } from '../data/recettes'
import type { Recette } from '../domain/types'
import RecetteForm from './RecetteForm'

export default function Recettes({ onVoir }: { onVoir: (r: Recette) => void }) {
  const recettes = useLiveQuery(lister, [], [] as Recette[])
  const [edition, setEdition] = useState<Recette | 'nouvelle' | null>(null)
  const [message, setMessage] = useState('')

  async function exporter() {
    const url = URL.createObjectURL(new Blob([await exporterJson()], { type: 'application/json' }))
    Object.assign(document.createElement('a'), { href: url, download: 'recettes.json' }).click()
    URL.revokeObjectURL(url)
  }

  async function importer(file?: File) {
    if (!file) return
    try {
      setMessage(`${await importerJson(await file.text())} recette(s) importée(s)`)
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  if (edition) {
    return (
      <RecetteForm
        initiale={edition === 'nouvelle' ? undefined : edition}
        onAnnuler={() => setEdition(null)}
        onSubmit={async (r) => {
          if (edition === 'nouvelle') await creer(r)
          else await modifier(edition.id!, r)
          setEdition(null)
        }}
      />
    )
  }

  return (
    <section>
      <div className="row">
        <button onClick={() => setEdition('nouvelle')}>+ Nouvelle recette</button>
        <button onClick={exporter}>Exporter</button>
        <label className="btn">Importer<input type="file" accept="application/json" hidden onChange={(e) => importer(e.target.files?.[0])} /></label>
      </div>
      {message && <p>{message}</p>}
      {recettes.length === 0 && <p>Aucune recette : ajoutez-en une pour commencer.</p>}
      <ul className="liste">
        {recettes.map((r) => (
          <li key={r.id}>
            <button className="lien" onClick={() => onVoir(r)}><strong>{r.titre}</strong></button> <small>{r.tempsMinutes ? `${r.tempsMinutes} min · ` : ''}{r.portions} pers. {r.tags.map((t) => `#${t}`).join(' ')}</small>
            <span className="row">
              <button onClick={() => setEdition(r)}>Modifier</button>
              <button onClick={() => confirm(`Supprimer « ${r.titre} » ?`) && supprimer(r.id!)}>Supprimer</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
