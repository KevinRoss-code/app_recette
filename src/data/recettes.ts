import { db } from './db'
import type { NouvelleRecette, Recette } from '../domain/types'

function valider(r: NouvelleRecette) {
  if (!r.titre.trim()) throw new Error('Titre requis')
  if (!(r.portions > 0)) throw new Error('Portions > 0 requises')
  if (r.ingredients.some((i) => !i.nom.trim() || !(i.quantite >= 0)))
    throw new Error('Ingrédient invalide')
}

export const lister = () => db.recettes.orderBy('titre').toArray()
export const lire = (id: number) => db.recettes.get(id)

export async function creer(r: NouvelleRecette): Promise<number> {
  valider(r)
  return db.recettes.add({ ...r, titre: r.titre.trim() })
}

export async function modifier(id: number, r: NouvelleRecette): Promise<void> {
  valider(r)
  if (!(await db.recettes.update(id, { ...r, titre: r.titre.trim() })))
    throw new Error(`Recette ${id} introuvable`)
}

export const supprimer = (id: number) =>
  db.transaction('rw', db.recettes, db.menu, async () => {
    await db.menu.where('recetteId').equals(id).delete()
    await db.recettes.delete(id)
  })

export async function exporterJson(): Promise<string> {
  return JSON.stringify({ version: 1, recettes: await lister() }, null, 2)
}

export async function importerJson(json: string): Promise<number> {
  const data = JSON.parse(json) as { version?: number; recettes?: Recette[] }
  if (data.version !== 1 || !Array.isArray(data.recettes)) throw new Error('Format inconnu')
  const sansId = data.recettes.map((r) => ({ ...r, id: undefined }) as NouvelleRecette)
  sansId.forEach(valider)
  await db.recettes.bulkAdd(sansId)
  return sansId.length
}

export async function marquerTirees(ids: number[], quand = Date.now()): Promise<void> {
  await db.recettes.bulkUpdate(ids.map((key) => ({ key, changes: { dernierTirage: quand } })))
}
