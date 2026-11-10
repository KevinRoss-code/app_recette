export const RAYONS = [
  'Fruits et légumes', 'Boucherie / Poissonnerie', 'Crèmerie', 'Épicerie',
  'Boulangerie', 'Surgelés', 'Boissons', 'Autre',
] as const
export type Rayon = (typeof RAYONS)[number]

export interface Synchro {
  updatedAt: number
  deletedAt?: number
}

export interface Ingredient {
  nom: string
  quantite: number
  unite: string
  rayon: Rayon
}

export interface Recette extends Synchro {
  id: string
  titre: string
  portions: number
  ingredients: Ingredient[]
  etapes: string[]
  tags: string[]
  tempsMinutes?: number
  dernierTirage?: number
}

export type NouvelleRecette = Omit<Recette, 'id' | 'updatedAt' | 'deletedAt'>

export interface MenuItem extends Synchro {
  id: string
  recetteId: string
  portions: number
  ordre: number
}

export interface Coche extends Synchro {
  cle: string
}

export interface ArticleManuel extends Ingredient, Synchro {
  id: string
}
