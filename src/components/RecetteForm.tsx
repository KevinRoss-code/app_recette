import { useState } from 'react'
import { RAYONS, type Ingredient, type NouvelleRecette, type Recette } from '../domain/types'

const vide: Ingredient = { nom: '', quantite: 1, unite: '', rayon: 'Autre' }

interface Props {
  initiale?: Recette
  onSubmit: (r: NouvelleRecette) => Promise<void>
  onAnnuler: () => void
}

export default function RecetteForm({ initiale, onSubmit, onAnnuler }: Props) {
  const [titre, setTitre] = useState(initiale?.titre ?? '')
  const [portions, setPortions] = useState(initiale?.portions ?? 2)
  const [temps, setTemps] = useState(initiale?.tempsMinutes?.toString() ?? '')
  const [tags, setTags] = useState(initiale?.tags.join(', ') ?? '')
  const [etapes, setEtapes] = useState(initiale?.etapes.join('\n') ?? '')
  const [ings, setIngs] = useState<Ingredient[]>(initiale?.ingredients ?? [{ ...vide }])
  const [erreur, setErreur] = useState('')

  const majIng = (i: number, p: Partial<Ingredient>) =>
    setIngs(ings.map((x, k) => (k === i ? { ...x, ...p } : x)))

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    try {
      await onSubmit({
        titre,
        portions,
        tempsMinutes: temps ? Number(temps) : undefined,
        tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        etapes: etapes.split('\n').map((l) => l.trim()).filter(Boolean),
        ingredients: ings.filter((i) => i.nom.trim()),
        dernierTirage: initiale?.dernierTirage,
      })
    } catch (err) {
      setErreur((err as Error).message)
    }
  }

  return (
    <form onSubmit={envoyer} className="form">
      <h2>{initiale ? 'Modifier la recette' : 'Nouvelle recette'}</h2>
      <label>Titre <input value={titre} onChange={(e) => setTitre(e.target.value)} required /></label>
      <div className="row">
        <label>Portions <input type="number" min={1} value={portions} onChange={(e) => setPortions(Number(e.target.value))} /></label>
        <label>Temps (min) <input type="number" min={0} value={temps} onChange={(e) => setTemps(e.target.value)} /></label>
      </div>
      <label>Tags (séparés par des virgules) <input value={tags} onChange={(e) => setTags(e.target.value)} /></label>
      <fieldset>
        <legend>Ingrédients</legend>
        {ings.map((ing, i) => (
          <div className="ing" key={i}>
            <input placeholder="Nom" value={ing.nom} onChange={(e) => majIng(i, { nom: e.target.value })} />
            <input type="number" min={0} step="any" aria-label="Quantité" value={ing.quantite} onChange={(e) => majIng(i, { quantite: Number(e.target.value) })} />
            <input placeholder="unité" value={ing.unite} onChange={(e) => majIng(i, { unite: e.target.value })} />
            <select value={ing.rayon} onChange={(e) => majIng(i, { rayon: e.target.value as Ingredient['rayon'] })}>
              {RAYONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button type="button" className="petit danger" aria-label="Retirer" onClick={() => setIngs(ings.filter((_, k) => k !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="petit" onClick={() => setIngs([...ings, { ...vide }])}>+ Ingrédient</button>
      </fieldset>
      <label>Étapes (une par ligne) <textarea rows={5} value={etapes} onChange={(e) => setEtapes(e.target.value)} /></label>
      {erreur && <p role="alert" className="err">{erreur}</p>}
      <div className="actions">
        <button type="submit" className="primary">Enregistrer</button>
        <button type="button" onClick={onAnnuler}>Annuler</button>
      </div>
    </form>
  )
}
