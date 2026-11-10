import { useLiveQuery } from 'dexie-react-hooks'
import { lister } from '../data/recettes'
import { ajouterAuMenu, changerPortions, lireMenu, retirerDuMenu, viderMenu, type LigneMenu } from '../data/menu'
import type { Recette } from '../domain/types'

export default function Menu({ onVoir }: { onVoir: (r: Recette, portions: number) => void }) {
  const lignes = useLiveQuery(lireMenu, [], [] as LigneMenu[])
  const recettes = useLiveQuery(lister, [], [] as Recette[])
  const horsMenu = recettes.filter((r) => !lignes.some((l) => l.recetteId === r.id))

  return (
    <section>
      <h2>Menu de la semaine</h2>
      {lignes.length === 0 && <div className="vide"><span>📅</span>Menu vide : validez un tirage ou ajoutez une recette.</div>}
      <ul className="liste">
        {lignes.map((l) => (
          <li key={l.id}>
            <button className="lien" onClick={() => onVoir(l.recette, l.portions)}><strong>{l.recette.titre}</strong></button>
            <span className="stepper">
              <button className="rond" aria-label={`Moins de portions ${l.recette.titre}`} disabled={l.portions <= 1} onClick={() => changerPortions(l.id!, l.portions - 1)}>−</button>
              <span>{l.portions} pers.</span>
              <button className="rond" aria-label={`Plus de portions ${l.recette.titre}`} onClick={() => changerPortions(l.id!, l.portions + 1)}>+</button>
              <button className="petit danger" onClick={() => retirerDuMenu(l.id!)}>Retirer</button>
            </span>
          </li>
        ))}
      </ul>
      <div className="actions">
        {horsMenu.length > 0 && (
          <select aria-label="Ajouter une recette" value="" onChange={(e) => {
            const r = horsMenu.find((x) => x.id === Number(e.target.value))
            if (r) ajouterAuMenu(r)
          }}>
            <option value="">+ Ajouter une recette…</option>
            {horsMenu.map((r) => <option key={r.id} value={r.id}>{r.titre}</option>)}
          </select>
        )}
        {lignes.length > 0 && <button className="danger" onClick={() => confirm('Vider le menu ?') && viderMenu()}>Vider le menu</button>}
      </div>
    </section>
  )
}
