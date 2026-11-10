import { useState } from 'react'
import { libelle, mettreALEchelle } from '../domain/courses'
import type { Recette } from '../domain/types'

interface Props {
  recette: Recette
  portions?: number
  onRetour: () => void
}

export default function RecetteDetail({ recette, portions, onRetour }: Props) {
  const [p, setP] = useState(portions ?? recette.portions)

  return (
    <article className="fiche">
      <button className="petit" onClick={onRetour}>← Retour</button>
      <h2>{recette.titre}</h2>
      <div className="chips">
        {recette.tempsMinutes ? <span className="chip">⏱ {recette.tempsMinutes} min</span> : null}
        {recette.tags.map((t) => <span className="chip" key={t}>#{t}</span>)}
      </div>
      <h3>Ingrédients</h3>
      <div className="carte">
        <div className="stepper">
          <button className="rond" aria-label="Moins de portions" disabled={p <= 1} onClick={() => setP(p - 1)}>−</button>
          <span>{p} pers.</span>
          <button className="rond" aria-label="Plus de portions" onClick={() => setP(p + 1)}>+</button>
        </div>
        {recette.ingredients.length === 0 && <p>Aucun ingrédient renseigné.</p>}
        <ul>
          {recette.ingredients.map((i, k) => (
            <li key={k}>{libelle({ ...i, quantite: mettreALEchelle(i.quantite, recette.portions, p) })}</li>
          ))}
        </ul>
      </div>
      <h3>Préparation</h3>
      {recette.etapes.length === 0 && <p>Aucune étape renseignée.</p>}
      <ol>
        {recette.etapes.map((e, k) => <li key={k}>{e}</li>)}
      </ol>
    </article>
  )
}
