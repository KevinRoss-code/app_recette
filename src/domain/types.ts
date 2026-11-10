export const RAYONS = [
  'Fruits et légumes', 'Boucherie / Poissonnerie', 'Crèmerie', 'Épicerie',
  'Boulangerie', 'Surgelés', 'Boissons', 'Autre',
] as const
export type Rayon = (typeof RAYONS)[number]

export interface Ingredient {
  nom: string
  quantite: number
  unite: string
  rayon: Rayon
}

export interface Recette {
  id?: number
  titre: string
  portions: number
  ingredients: Ingredient[]
  etapes: string[]
  tags: string[]
  tempsMinutes?: number
  dernierTirage?: number
}

export type NouvelleRecette = Omit<Recette, 'id'>

export interface MenuItem {
  id?: number
  recetteId: number
  portions: number
}

export interface ArticleManuel extends Ingredient {
  id?: number
}
