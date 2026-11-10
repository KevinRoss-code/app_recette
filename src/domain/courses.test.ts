import { describe, expect, test } from 'vitest'
import { agreger, cleArticle, enTexte, libelle, parRayon } from './courses'
import type { Ingredient, Recette } from './types'

const ing = (nom: string, quantite: number, unite = 'g', rayon: Ingredient['rayon'] = 'Épicerie'): Ingredient => ({ nom, quantite, unite, rayon })
const rec = (portions: number, ingredients: Ingredient[]): Recette => ({ id: 1, titre: 'R', portions, ingredients, etapes: [], tags: [] })

describe('agreger', () => {
  test('additionne même nom + unité entre recettes', () => {
    const res = agreger([
      { recette: rec(2, [ing('Farine', 100)]), portions: 2 },
      { recette: rec(4, [ing('farine ', 200)]), portions: 4 },
    ])
    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({ quantite: 300, nom: 'Farine' })
  })
  test('met à l\'échelle selon les portions du menu', () => {
    const res = agreger([{ recette: rec(2, [ing('riz', 150)]), portions: 5 }])
    expect(res[0].quantite).toBe(375)
  })
  test('unités différentes = lignes séparées', () => {
    const res = agreger([{ recette: rec(1, [ing('lait', 20, 'cl', 'Crèmerie'), ing('lait', 1, 'L', 'Crèmerie')]), portions: 1 }])
    expect(res).toHaveLength(2)
  })
  test('insensible aux accents et à la casse', () => {
    expect(cleArticle('Crème', 'G')).toBe(cleArticle('creme ', 'g'))
  })
  test('arrondit à 2 décimales', () => {
    const res = agreger([{ recette: rec(3, [ing('x', 1)]), portions: 1 }])
    expect(res[0].quantite).toBe(0.33)
  })
  test('fusionne les articles manuels et les marque', () => {
    const res = agreger([{ recette: rec(1, [ing('sel', 1, 'g')]), portions: 1 }], [ing('Sel', 2, 'g'), ing('piles', 4, '', 'Autre')])
    expect(res.find((l) => l.nom === 'sel')?.quantite).toBe(3)
    expect(res.find((l) => l.nom === 'piles')?.manuel).toBe(true)
  })
  test('menu vide', () => expect(agreger([])).toEqual([]))
})

describe('parRayon / texte', () => {
  const lignes = agreger([{ recette: rec(1, [ing('riz', 100), ing('tomate', 2, '', 'Fruits et légumes'), ing('ail', 1, '', 'Fruits et légumes')]), portions: 1 }])
  test('ordre des rayons puis alphabétique, rayons vides omis', () => {
    const g = parRayon(lignes)
    expect(g.map((x) => x.rayon)).toEqual(['Fruits et légumes', 'Épicerie'])
    expect(g[0].lignes.map((l) => l.nom)).toEqual(['ail', 'tomate'])
  })
  test('libellé sans quantité nulle', () => {
    expect(libelle(ing('sel', 0, ''))).toBe('sel')
    expect(libelle(ing('riz', 100))).toBe('100 g riz')
    expect(libelle(ing('ail', 2, ''))).toBe('2 ail')
  })
  test('texte exclut les articles cochés', () => {
    const coches = new Set([cleArticle('riz', 'g')])
    expect(enTexte(lignes, coches)).toBe('Fruits et légumes\n- 1 ail\n- 2 tomate')
  })
})

import { mettreALEchelle } from './courses'
test('mettreALEchelle', () => {
  expect(mettreALEchelle(100, 2, 5)).toBe(250)
  expect(mettreALEchelle(1, 3, 1)).toBe(0.33)
})
