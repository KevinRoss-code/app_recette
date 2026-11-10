import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { lister, marquerTirees } from '../data/recettes'
import { remplacerMenu } from '../data/menu'
import { relancer, tirer } from '../domain/tirage'
import type { Recette } from '../domain/types'

export default function Tirage({ onVoir }: { onVoir: (r: Recette) => void }) {
  const recettes = useLiveQuery(lister, [], [] as Recette[])
  const [nombre, setNombre] = useState(4)
  const [tagsSel, setTagsSel] = useState<string[]>([])
  const [tempsMax, setTempsMax] = useState('')
  const [selection, setSelection] = useState<Recette[]>([])
  const [valide, setValide] = useState(false)

  const tousTags = [...new Set(recettes.flatMap((r) => r.tags))].sort()
  const criteres = { tags: tagsSel, tempsMax: tempsMax ? Number(tempsMax) : undefined }

  return (
    <section>
      <h2>Que mange-t-on ?</h2>
      <div className="carte">
        <div className="reglages">
          <label>Nombre <input type="number" min={1} max={14} value={nombre} onChange={(e) => setNombre(Number(e.target.value))} /></label>
          <label>Temps max (min) <input type="number" min={0} value={tempsMax} onChange={(e) => setTempsMax(e.target.value)} /></label>
        </div>
        {tousTags.length > 0 && (
          <div className="chips">
            {tousTags.map((t) => (
              <label className="chip" key={t}>
                <input type="checkbox" checked={tagsSel.includes(t)} onChange={(e) => setTagsSel(e.target.checked ? [...tagsSel, t] : tagsSel.filter((x) => x !== t))} />
                {t}
              </label>
            ))}
          </div>
        )}
        <div className="actions">
          <button className="primary" onClick={() => { setSelection(tirer(recettes, { nombre, ...criteres })); setValide(false) }}>🎲 Tirer</button>
        </div>
      </div>
      {recettes.length === 0 && <div className="vide"><span>🍳</span>Ajoutez d'abord des recettes dans l'onglet Recettes.</div>}
      {selection.length > 0 && selection.length < nombre && <p className="meta">Seulement {selection.length} recette(s) correspondent.</p>}
      <ul className="liste">
        {selection.map((r) => (
          <li key={r.id}>
            <span>
              <button className="lien" onClick={() => onVoir(r)}><strong>{r.titre}</strong></button>
              <span className="meta">{r.tempsMinutes ? `${r.tempsMinutes} min · ` : ''}{r.portions} pers.</span>
            </span>
            <button className="petit" disabled={valide} onClick={() => setSelection(relancer(recettes, selection, r.id, criteres))}>Relancer</button>
          </li>
        ))}
      </ul>
      {selection.length > 0 && (
        <div className="actions">
          <button className="primary" disabled={valide} onClick={async () => { await marquerTirees(selection.map((r) => r.id)); await remplacerMenu(selection); setValide(true) }}>
            {valide ? 'Menu enregistré ✓' : 'Valider : en faire le menu'}
          </button>
        </div>
      )}
    </section>
  )
}
