import { db } from './db'
import { agreger, cleArticle, type LigneCourses } from '../domain/courses'
import type { Ingredient } from '../domain/types'
import { lireMenu } from './menu'

export interface EtatCourses {
  lignes: LigneCourses[]
  coches: Set<string>
}

export async function lireCourses(): Promise<EtatCourses> {
  const [menu, manuels, coches] = await Promise.all([lireMenu(), db.articles.toArray(), db.coches.toArray()])
  return { lignes: agreger(menu, manuels), coches: new Set(coches.map((c) => c.cle)) }
}

export async function cocher(cle: string, coche: boolean): Promise<void> {
  if (coche) await db.coches.put({ cle })
  else await db.coches.delete(cle)
}

export async function ajouterArticle(a: Ingredient): Promise<void> {
  if (!a.nom.trim()) throw new Error('Nom requis')
  if (!(a.quantite >= 0)) throw new Error('Quantité invalide')
  await db.articles.add(a)
}

export async function retirerArticle(nom: string, unite: string): Promise<void> {
  const ids = (await db.articles.toArray()).filter((a) => cleArticle(a.nom, a.unite) === cleArticle(nom, unite)).map((a) => a.id!)
  await db.articles.bulkDelete(ids)
}

export async function nouvelleListe(): Promise<void> {
  await db.transaction('rw', db.articles, db.coches, async () => {
    await db.articles.clear()
    await db.coches.clear()
  })
}
