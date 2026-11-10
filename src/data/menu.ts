import { db } from './db'
import type { MenuItem, Recette } from '../domain/types'

export interface LigneMenu extends MenuItem {
  recette: Recette
}

export async function lireMenu(): Promise<LigneMenu[]> {
  const items = await db.menu.toArray()
  const recettes = await db.recettes.bulkGet(items.map((i) => i.recetteId))
  return items.flatMap((item, k) => (recettes[k] ? [{ ...item, recette: recettes[k]! }] : []))
}

export async function remplacerMenu(recettes: Recette[]): Promise<void> {
  await db.transaction('rw', db.menu, db.coches, async () => {
    await db.menu.clear()
    await db.coches.clear()
    await db.menu.bulkAdd(recettes.map((r) => ({ recetteId: r.id!, portions: r.portions })))
  })
}

export async function ajouterAuMenu(recette: Recette): Promise<void> {
  if (await db.menu.where('recetteId').equals(recette.id!).count()) return
  await db.menu.add({ recetteId: recette.id!, portions: recette.portions })
}

export async function changerPortions(id: number, portions: number): Promise<void> {
  if (!Number.isInteger(portions) || portions < 1) throw new Error('Portions >= 1 requises')
  await db.menu.update(id, { portions })
}

export const retirerDuMenu = (id: number) => db.menu.delete(id)
export const viderMenu = () => db.menu.clear()
