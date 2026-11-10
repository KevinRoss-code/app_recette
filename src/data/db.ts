import Dexie, { type Table } from 'dexie'
import type { ArticleManuel, MenuItem, Recette } from '../domain/types'

class CarnetDb extends Dexie {
  recettes!: Table<Recette, number>
  menu!: Table<MenuItem, number>
  coches!: Table<{ cle: string }, string>
  articles!: Table<ArticleManuel, number>
  constructor(nom = 'carnet-recettes') {
    super(nom)
    this.version(1).stores({ recettes: '++id, titre, dernierTirage, *tags' })
    this.version(2).stores({ recettes: '++id, titre, dernierTirage, *tags', menu: '++id, recetteId' })
    this.version(3).stores({
      recettes: '++id, titre, dernierTirage, *tags',
      menu: '++id, recetteId',
      coches: 'cle',
      articles: '++id',
    })
  }
}

export const db = new CarnetDb()
