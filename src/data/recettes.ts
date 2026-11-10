import { db } from './db'
import { maintenant, tombe, uuid } from './ids'
import type { NouvelleRecette, Recette } from '../domain/types'

function valider(r: NouvelleRecette) {
  if (!r.titre.trim()) throw new Error('Titre requis')
  if (!(r.portions > 0)) throw new Error('Portions > 0 requises')
  if (r.ingredients.some((i) => !i.nom.trim() || !(i.quantite >= 0)))
    throw new Error('Ingrédient invalide')
}

export const lister = () => db.recettes.orderBy('titre').filter((r) => !r.deletedAt).toArray()

export async function lire(id: string): Promise<Recette | undefined> {
  const r = await db.recettes.get(id)
  return r && !r.deletedAt ? r : undefined
}

export async function creer(r: NouvelleRecette): Promise<string> {
  valider(r)
  const id = uuid()
  await db.recettes.add({ ...r, id, titre: r.titre.trim(), updatedAt: maintenant() })
  return id
}

export async function modifier(id: string, r: NouvelleRecette): Promise<void> {
  valider(r)
  const existante = await lire(id)
  if (!existante) throw new Error(`Recette ${id} introuvable`)
  await db.recettes.put({ ...existante, ...r, id, titre: r.titre.trim(), updatedAt: maintenant() })
}

export const supprimer = (id: string) =>
  db.transaction('rw', db.recettes, db.menu, async () => {
    await db.menu.where('recetteId').equals(id).filter((m) => !m.deletedAt).modify(tombe())
    await db.recettes.update(id, tombe())
  })

export async function exporterJson(): Promise<string> {
  const recettes = (await lister()).map(
    (r): NouvelleRecette => ({
      titre: r.titre, portions: r.portions, ingredients: r.ingredients, etapes: r.etapes,
      tags: r.tags, tempsMinutes: r.tempsMinutes, dernierTirage: r.dernierTirage,
    }),
  )
  return JSON.stringify({ version: 1, recettes }, null, 2)
}

export async function importerJson(json: string): Promise<number> {
  const data = JSON.parse(json) as { version?: number; recettes?: NouvelleRecette[] }
  if (data.version !== 1 || !Array.isArray(data.recettes)) throw new Error('Format inconnu')
  data.recettes.forEach(valider)
  const t = maintenant()
  await db.recettes.bulkAdd(
    data.recettes.map((r) => ({ ...r, id: uuid(), titre: r.titre.trim(), updatedAt: t })),
  )
  return data.recettes.length
}

export async function marquerTirees(ids: string[], quand = maintenant()): Promise<void> {
  const t = maintenant()
  await db.recettes.bulkUpdate(ids.map((key) => ({ key, changes: { dernierTirage: quand, updatedAt: t } })))
}
