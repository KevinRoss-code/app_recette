import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ajouterArticle, cocher, lireCourses, nouvelleListe, retirerArticle, type EtatCourses } from '../data/courses'
import { enTexte, libelle, parRayon } from '../domain/courses'
import { RAYONS, type Rayon } from '../domain/types'

const vide: EtatCourses = { lignes: [], coches: new Set() }

export default function Courses() {
  const { lignes, coches } = useLiveQuery(lireCourses, [], vide)
  const [nom, setNom] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [unite, setUnite] = useState('')
  const [rayon, setRayon] = useState<Rayon>('Autre')
  const [message, setMessage] = useState('')

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    try {
      await ajouterArticle({ nom, quantite, unite, rayon })
      setNom('')
      setMessage('')
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(enTexte(lignes, coches))
      setMessage('Liste copiée')
    } catch {
      setMessage('Copie impossible')
    }
  }

  const restants = lignes.filter((l) => !coches.has(l.cle)).length
  const pct = lignes.length ? Math.round(((lignes.length - restants) / lignes.length) * 100) : 0

  return (
    <section>
      <h2>Liste de courses</h2>
      {lignes.length === 0 && <div className="vide"><span>🛒</span>Liste vide : validez un menu ou ajoutez un article.</div>}
      {lignes.length > 0 && (
        <>
          <p className="meta">{restants} article(s) restant(s) sur {lignes.length}</p>
          <div className="progres" role="progressbar" aria-label="Avancement des courses" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      {parRayon(lignes).map((g) => (
        <div key={g.rayon}>
          <h3>{g.rayon}</h3>
          <ul className="liste">
            {g.lignes.map((l) => (
              <li key={l.cle}>
                <label className={`courses-item${coches.has(l.cle) ? ' fait' : ''}`}>
                  <input type="checkbox" checked={coches.has(l.cle)} onChange={(e) => cocher(l.cle, e.target.checked)} /> {libelle(l)}
                </label>
                {l.manuel && <button className="petit danger" aria-label={`Retirer ${l.nom}`} onClick={() => retirerArticle(l.nom, l.unite)}>✕</button>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <h3>Ajouter un article</h3>
      <form className="carte ajout" onSubmit={ajouter}>
        <input placeholder="Article" value={nom} onChange={(e) => setNom(e.target.value)} />
        <input type="number" min={0} step="any" aria-label="Quantité" value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} />
        <input placeholder="unité" value={unite} onChange={(e) => setUnite(e.target.value)} />
        <select aria-label="Rayon" value={rayon} onChange={(e) => setRayon(e.target.value as Rayon)}>
          {RAYONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button className="primary" type="submit">Ajouter</button>
      </form>
      <div className="actions">
        {lignes.length > 0 && <button onClick={copier}>Copier la liste</button>}
        <button className="danger" onClick={() => confirm('Décocher tout et supprimer les articles ajoutés à la main ?') && nouvelleListe()}>Nouvelle liste</button>
      </div>
      {message && <p className="meta" role="status">{message}</p>}
    </section>
  )
}
