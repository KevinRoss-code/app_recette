import { beforeEach, describe, expect, test } from 'vitest'
import depart from './recettes-depart.json'
import { db } from './db'
import { chargerRecettesDepart, lister } from './recettes'
import { validerLot } from './validationRecettes'
import { agreger, cleArticle } from '../domain/courses'
import type { Recette } from '../domain/types'

describe('recettes de départ (fichier livré)', () => {
  test('500 recettes valides, sans doublon de titre, 125 par saison', () => {
    const { erreurs, stats } = validerLot(depart, { attendu: 500 })
    expect(erreurs).toEqual([])
    expect(stats.saison).toEqual({ printemps: 125, été: 125, automne: 125, hiver: 125 })
    expect(stats.repas.midi + stats.repas.soir).toBe(500)
    expect(Object.keys(stats.niveau).sort()).toEqual(['léger', 'riche', 'équilibré'].sort())
  })
  test('chaque combinaison saison x repas x niveau offre au moins 10 recettes (tirage filtré possible)', () => {
    const compte: Record<string, number> = {}
    for (const r of depart) {
      const k = ['printemps', 'été', 'automne', 'hiver'].find((t) => r.tags.includes(t)) + '/' + (r.tags.includes('midi') ? 'midi' : 'soir') + '/' + ['léger', 'équilibré', 'riche'].find((t) => r.tags.includes(t))
      compte[k] = (compte[k] ?? 0) + 1
    }
    expect(Object.keys(compte)).toHaveLength(24)
    expect(Math.min(...Object.values(compte))).toBeGreaterThanOrEqual(10)
  })
  test('aucun nom d\'ingrédient ne répète son unité (« 1 gousse gousses d\'ail »)', () => {
    const mots = /^(gousses?|bottes?|brins?|tranches?|boîtes?|sachets?|pincées?)\b/i
    const fautifs = depart.flatMap((r) => r.ingredients.filter((i) => mots.test(i.nom)).map((i) => `${r.titre} : ${i.nom}`))
    expect(fautifs).toEqual([])
  })
  test('« ail » de plusieurs recettes se fusionne dans la liste de courses', () => {
    const avecAil = depart.filter((r) => r.ingredients.some((i) => cleArticle(i.nom, i.unite) === cleArticle('ail', 'gousse'))).slice(0, 3)
    expect(avecAil.length).toBe(3)
    const lignes = agreger(avecAil.map((r) => ({ recette: { ...r, id: r.titre, updatedAt: 0 } as Recette, portions: 4 })))
    expect(lignes.filter((l) => l.cle === cleArticle('ail', 'gousse'))).toHaveLength(1)
  })
})

describe('chargement dans la base', () => {
  beforeEach(() => db.recettes.clear())
  test('charge les 500 recettes puis reste idempotent', async () => {
    expect(await chargerRecettesDepart()).toEqual({ ajoutees: 500, dejaPresentes: 0 })
    expect(await lister()).toHaveLength(500)
    expect(await chargerRecettesDepart()).toEqual({ ajoutees: 0, dejaPresentes: 500 })
  })
})
