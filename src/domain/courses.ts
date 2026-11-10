import { RAYONS, type Ingredient, type Rayon, type Recette } from './types'

export interface LigneCourses extends Ingredient {
  cle: string
  manuel?: boolean
}

const norme = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')

export const cleArticle = (nom: string, unite: string) => `${norme(nom)}|${norme(unite)}`
const arrondi = (n: number) => Math.round(n * 100) / 100

export function agreger(menu: { recette: Recette; portions: number }[], manuels: Ingredient[] = []): LigneCourses[] {
  const map = new Map<string, LigneCourses>()
  const ajouter = (ing: Ingredient, facteur: number, manuel?: boolean) => {
    const cle = cleArticle(ing.nom, ing.unite)
    const existant = map.get(cle)
    if (existant) existant.quantite += ing.quantite * facteur
    else map.set(cle, { ...ing, nom: ing.nom.trim(), unite: ing.unite.trim(), quantite: ing.quantite * facteur, cle, manuel })
  }
  for (const { recette, portions } of menu)
    for (const ing of recette.ingredients) ajouter(ing, portions / recette.portions)
  for (const m of manuels) ajouter(m, 1, true)
  return [...map.values()].map((l) => ({ ...l, quantite: arrondi(l.quantite) }))
}

export function parRayon(lignes: LigneCourses[]): { rayon: Rayon; lignes: LigneCourses[] }[] {
  return RAYONS.map((rayon) => ({
    rayon,
    lignes: lignes.filter((l) => l.rayon === rayon).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
  })).filter((g) => g.lignes.length > 0)
}

export const libelle = (l: Ingredient) =>
  `${l.quantite > 0 ? `${l.quantite}${l.unite ? ` ${l.unite}` : ''} ` : ''}${l.nom}`.trim()

export function enTexte(lignes: LigneCourses[], coches: Set<string> = new Set()): string {
  return parRayon(lignes.filter((l) => !coches.has(l.cle)))
    .map((g) => `${g.rayon}\n${g.lignes.map((l) => `- ${libelle(l)}`).join('\n')}`)
    .join('\n\n')
}
