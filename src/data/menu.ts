import { db } from './db'
import { maintenant, tombe, uuid } from './ids'
import type { MenuItem, Recette } from '../domain/types'

export interface LigneMenu extends MenuItem {
  recette: Recette
}

const actifs = () => db.menu.filter((m) => !m.deletedAt)

export async function lireMenu(): Promise<LigneMenu[]> {
  const items = (await actifs().toArray()).sort((a, b) => a.ordre - b.ordre)
  const recettes = await db.recettes.bulkGet(items.map((i) => i.recetteId))
  return items.flatMap((item, k) => {
    const recette = recettes[k]
    return recette && !recette.deletedAt ? [{ ...item, recette }] : []
  })
}

export async function remplacerMenu(recettes: Recette[]): Promise<void> {
  await db.transaction('rw', db.menu, db.coches, async () => {
    await actifs().modify(tombe())
    await db.coches.filter((c) => !c.deletedAt).modify(tombe())
    const t = maintenant()
    await db.menu.bulkAdd(recettes.map((r, ordre) => ({ id: uuid(), recetteId: r.id, portions: r.portions, ordre, updatedAt: t })))
  })
}

export async function ajouterAuMenu(recette: Recette): Promise<void> {
  if (await actifs().filter((m) => m.recetteId === recette.id).count()) return
  const ordre = (await actifs().toArray()).reduce((m, i) => Math.max(m, i.ordre), -1) + 1
  await db.menu.add({ id: uuid(), recetteId: recette.id, portions: recette.portions, ordre, updatedAt: maintenant() })
}

export async function changerPortions(id: string, portions: number): Promise<void> {
  if (!Number.isInteger(portions) || portions < 1) throw new Error('Portions >= 1 requises')
  await db.menu.update(id, { portions, updatedAt: maintenant() })
}

export const retirerDuMenu = (id: string) => db.menu.update(id, tombe())
export const viderMenu = () => actifs().modify(tombe())
