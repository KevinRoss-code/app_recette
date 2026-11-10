import Dexie from 'dexie'
import { db as dbParDefaut, type CarnetDb } from './db'
import { uuid } from './ids'
import type { Ingredient, Recette } from '../domain/types'

export const ANCIENNE_BASE = 'carnet-recettes'

interface AncienneRecette extends Omit<Recette, 'id' | 'updatedAt'> { id: number }
interface AncienMenu { recetteId: number; portions: number }
type AncienArticle = Ingredient

/** Copie l'ancienne base (ids numériques) vers la nouvelle (UUID). L'ancienne n'est jamais modifiée ni supprimée. */
export async function migrerAnciennesDonnees(cible: CarnetDb = dbParDefaut, ancienne = ANCIENNE_BASE): Promise<boolean> {
  if ((await cible.meta.get('migre-depuis-v3'))?.valeur) return false
  if (!(await Dexie.exists(ancienne))) return false

  const vieux = new Dexie(ancienne)
  await vieux.open()
  try {
    const lire = async <T>(nom: string): Promise<T[]> =>
      vieux.tables.some((t) => t.name === nom) ? ((await vieux.table(nom).toArray()) as T[]) : []
    const [recettes, menu, coches, articles] = await Promise.all([
      lire<AncienneRecette>('recettes'), lire<AncienMenu>('menu'), lire<{ cle: string }>('coches'), lire<AncienArticle>('articles'),
    ])
    const t = Date.now()
    const nouvelId = new Map(recettes.map((r) => [r.id, uuid()]))

    await cible.transaction('rw', cible.recettes, cible.menu, cible.coches, cible.articles, cible.meta, async () => {
      await cible.recettes.bulkAdd(recettes.map((r) => ({ ...r, id: nouvelId.get(r.id)!, updatedAt: t })))
      await cible.menu.bulkAdd(
        menu.flatMap((m, ordre) => (nouvelId.has(m.recetteId)
          ? [{ id: uuid(), recetteId: nouvelId.get(m.recetteId)!, portions: m.portions, ordre, updatedAt: t }]
          : [])),
      )
      await cible.coches.bulkPut(coches.map((c) => ({ cle: c.cle, updatedAt: t })))
      await cible.articles.bulkAdd(articles.map((a) => ({ nom: a.nom, quantite: a.quantite, unite: a.unite, rayon: a.rayon, id: uuid(), updatedAt: t })))
      await cible.meta.put({ cle: 'migre-depuis-v3', valeur: true })
    })
    return true
  } finally {
    vieux.close()
  }
}
