import { db } from './db'
import { maintenant, tombe, uuid } from './ids'
import { agreger, cleArticle, type LigneCourses } from '../domain/courses'
import type { Ingredient } from '../domain/types'
import { lireMenu } from './menu'

export interface EtatCourses {
  lignes: LigneCourses[]
  coches: Set<string>
}

export async function lireCourses(): Promise<EtatCourses> {
  const [menu, manuels, coches] = await Promise.all([
    lireMenu(),
    db.articles.filter((a) => !a.deletedAt).toArray(),
    db.coches.filter((c) => !c.deletedAt).toArray(),
  ])
  return { lignes: agreger(menu, manuels), coches: new Set(coches.map((c) => c.cle)) }
}

export async function cocher(cle: string, coche: boolean): Promise<void> {
  await db.coches.put(coche ? { cle, updatedAt: maintenant() } : { cle, ...tombe() })
}

export async function ajouterArticle(a: Ingredient): Promise<void> {
  if (!a.nom.trim()) throw new Error('Nom requis')
  if (!(a.quantite >= 0)) throw new Error('Quantité invalide')
  await db.articles.add({ ...a, id: uuid(), updatedAt: maintenant() })
}

export async function retirerArticle(nom: string, unite: string): Promise<void> {
  await db.articles
    .filter((a) => !a.deletedAt && cleArticle(a.nom, a.unite) === cleArticle(nom, unite))
    .modify(tombe())
}

export async function nouvelleListe(): Promise<void> {
  await db.transaction('rw', db.articles, db.coches, async () => {
    await db.articles.filter((a) => !a.deletedAt).modify(tombe())
    await db.coches.filter((c) => !c.deletedAt).modify(tombe())
  })
}
