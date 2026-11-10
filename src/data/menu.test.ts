import { beforeEach, describe, expect, test } from 'vitest'
import { db } from './db'
import { creer, supprimer } from './recettes'
import { ajouterAuMenu, changerPortions, lireMenu, remplacerMenu, retirerDuMenu, viderMenu } from './menu'
import type { NouvelleRecette, Recette } from '../domain/types'

const base = (titre: string, portions = 2): NouvelleRecette => ({
  titre, portions, ingredients: [], etapes: [], tags: [],
})
const nouvelle = async (titre: string, portions = 2): Promise<Recette> =>
  (await db.recettes.get(await creer(base(titre, portions))))!

beforeEach(async () => { await db.recettes.clear(); await db.menu.clear() })

describe('menu', () => {
  test('remplacer reprend les portions de la recette et écrase l\'ancien menu', async () => {
    const a = await nouvelle('A', 4), b = await nouvelle('B', 2)
    await remplacerMenu([a])
    await remplacerMenu([b, a])
    expect((await lireMenu()).map((l) => [l.recette.titre, l.portions])).toEqual([['B', 2], ['A', 4]])
  })
  test('ajouter ne crée pas de doublon', async () => {
    const a = await nouvelle('A')
    await ajouterAuMenu(a)
    await ajouterAuMenu(a)
    expect(await lireMenu()).toHaveLength(1)
  })
  test('changer les portions, valider les valeurs', async () => {
    const a = await nouvelle('A')
    await ajouterAuMenu(a)
    const [{ id }] = await lireMenu()
    await changerPortions(id!, 6)
    expect((await lireMenu())[0].portions).toBe(6)
    await expect(changerPortions(id!, 0)).rejects.toThrow('Portions')
    await expect(changerPortions(id!, 1.5)).rejects.toThrow('Portions')
  })
  test('retirer et vider', async () => {
    const a = await nouvelle('A'), b = await nouvelle('B')
    await remplacerMenu([a, b])
    await retirerDuMenu((await lireMenu())[0].id!)
    expect(await lireMenu()).toHaveLength(1)
    await viderMenu()
    expect(await lireMenu()).toEqual([])
  })
  test('supprimer une recette la retire du menu', async () => {
    const a = await nouvelle('A'), b = await nouvelle('B')
    await remplacerMenu([a, b])
    await supprimer(a.id!)
    expect((await lireMenu()).map((l) => l.recette.titre)).toEqual(['B'])
    expect(await db.menu.count()).toBe(1)
  })
})
