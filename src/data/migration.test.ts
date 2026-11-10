// @vitest-environment jsdom
import Dexie from 'dexie'
import { beforeEach, describe, expect, test } from 'vitest'
import { CarnetDb } from './db'
import { migrerAnciennesDonnees } from './migration'

const ANCIENNE = 'ancienne-test'
let cible: CarnetDb

async function creerAncienneBase() {
  await Dexie.delete(ANCIENNE)
  const vieux = new Dexie(ANCIENNE)
  vieux.version(3).stores({ recettes: '++id, titre, dernierTirage, *tags', menu: '++id, recetteId', coches: 'cle', articles: '++id' })
  await vieux.table('recettes').bulkAdd([
    { titre: 'Gratin', portions: 4, ingredients: [], etapes: ['Cuire'], tags: ['hiver'], dernierTirage: 42 },
    { titre: 'Pâtes', portions: 2, ingredients: [], etapes: [], tags: [] },
  ])
  await vieux.table('menu').bulkAdd([{ recetteId: 2, portions: 3 }, { recetteId: 1, portions: 4 }, { recetteId: 99, portions: 1 }])
  await vieux.table('coches').add({ cle: 'riz|g' })
  await vieux.table('articles').add({ nom: 'piles', quantite: 4, unite: '', rayon: 'Autre' })
  vieux.close()
}

beforeEach(async () => {
  await Dexie.delete('cible-test')
  cible = new CarnetDb('cible-test')
  await creerAncienneBase()
})

describe('migrerAnciennesDonnees', () => {
  test('copie tout avec des UUID et conserve les liens menu -> recette et l\'ordre', async () => {
    expect(await migrerAnciennesDonnees(cible, ANCIENNE)).toBe(true)
    const recettes = await cible.recettes.toArray()
    expect(recettes.map((r) => r.titre).sort()).toEqual(['Gratin', 'Pâtes'])
    expect(recettes.every((r) => /^[0-9a-f-]{36}$/.test(r.id) && r.updatedAt > 0)).toBe(true)
    expect(recettes.find((r) => r.titre === 'Gratin')).toMatchObject({ dernierTirage: 42, tags: ['hiver'] })
    const menu = (await cible.menu.toArray()).sort((a, b) => a.ordre - b.ordre)
    const titre = (id: string) => recettes.find((r) => r.id === id)?.titre
    expect(menu.map((m) => [titre(m.recetteId), m.portions])).toEqual([['Pâtes', 3], ['Gratin', 4]])
    expect(await cible.coches.toArray()).toMatchObject([{ cle: 'riz|g' }])
    expect(await cible.articles.toArray()).toMatchObject([{ nom: 'piles', quantite: 4 }])
  })
  test('ne s\'exécute qu\'une fois (pas de doublons)', async () => {
    await migrerAnciennesDonnees(cible, ANCIENNE)
    expect(await migrerAnciennesDonnees(cible, ANCIENNE)).toBe(false)
    expect(await cible.recettes.count()).toBe(2)
  })
  test('laisse l\'ancienne base intacte', async () => {
    await migrerAnciennesDonnees(cible, ANCIENNE)
    const vieux = new Dexie(ANCIENNE)
    await vieux.open()
    expect(await vieux.table('recettes').count()).toBe(2)
    expect(await vieux.table('menu').count()).toBe(3)
    vieux.close()
  })
  test('rien à faire sans ancienne base', async () => {
    await Dexie.delete(ANCIENNE)
    expect(await migrerAnciennesDonnees(cible, ANCIENNE)).toBe(false)
    expect(await cible.recettes.count()).toBe(0)
  })
})
