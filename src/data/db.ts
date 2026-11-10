import Dexie, { type Table } from 'dexie'
import type { ArticleManuel, Coche, MenuItem, Recette } from '../domain/types'

export class CarnetDb extends Dexie {
  recettes!: Table<Recette, string>
  menu!: Table<MenuItem, string>
  coches!: Table<Coche, string>
  articles!: Table<ArticleManuel, string>
  meta!: Table<{ cle: string; valeur: unknown }, string>
  constructor(nom = 'carnet-v2') {
    super(nom)
    this.version(1).stores({
      recettes: 'id, titre, dernierTirage, *tags, updatedAt',
      menu: 'id, recetteId, updatedAt',
      coches: 'cle, updatedAt',
      articles: 'id, updatedAt',
      meta: 'cle',
    })
  }
}

export const db = new CarnetDb()
