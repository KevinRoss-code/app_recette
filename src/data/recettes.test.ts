import { beforeEach, describe, expect, test } from 'vitest'
import { db } from './db'
import { chargerRecettesDepart, creer, exporterJson, importerJson, lire, lister, marquerTirees, modifier, supprimer } from './recettes'
import type { NouvelleRecette } from '../domain/types'

const base: NouvelleRecette = {
  titre: 'Pâtes tomate', portions: 2, etapes: ['Cuire'], tags: ['rapide'], tempsMinutes: 15,
  ingredients: [{ nom: 'pâtes', quantite: 200, unite: 'g', rayon: 'Épicerie' }],
}

beforeEach(() => Promise.all([db.recettes.clear(), db.menu.clear()]))

describe('recettes', () => {
  test('créer puis lire', async () => {
    const id = await creer(base)
    expect(await lire(id)).toMatchObject({ titre: 'Pâtes tomate', portions: 2 })
  })
  test('lister trié par titre', async () => {
    await creer({ ...base, titre: 'Zèbre' })
    await creer({ ...base, titre: 'Agneau' })
    expect((await lister()).map((r) => r.titre)).toEqual(['Agneau', 'Zèbre'])
  })
  test('modifier et supprimer', async () => {
    const id = await creer(base)
    await modifier(id, { ...base, titre: 'Autre' })
    expect((await lire(id))?.titre).toBe('Autre')
    await supprimer(id)
    expect(await lire(id)).toBeUndefined()
    expect(await lister()).toEqual([])
    expect((await db.recettes.get(id))?.deletedAt).toBeTypeOf('number')
  })
  test('modifier une recette absente échoue', async () => {
    await expect(modifier('absent', base)).rejects.toThrow('introuvable')
  })
  test('validation', async () => {
    await expect(creer({ ...base, titre: '  ' })).rejects.toThrow('Titre')
    await expect(creer({ ...base, portions: 0 })).rejects.toThrow('Portions')
    await expect(
      creer({ ...base, ingredients: [{ nom: '', quantite: 1, unite: 'g', rayon: 'Autre' }] }),
    ).rejects.toThrow('Ingrédient')
  })
  test('export puis import sans perte', async () => {
    await creer(base)
    const json = await exporterJson()
    await db.recettes.clear()
    expect(await importerJson(json)).toBe(1)
    expect(await lister()).toMatchObject([base])
  })
  test('import refuse un format inconnu', async () => {
    await expect(importerJson('{"x":1}')).rejects.toThrow('Format')
  })
})

describe('marquerTirees', () => {
  test('met à jour dernierTirage', async () => {
    const id = await creer(base)
    await marquerTirees([id], 123)
    expect((await lire(id))?.dernierTirage).toBe(123)
  })
})

describe('chargerRecettesDepart', () => {
  const depart = [base, { ...base, titre: 'Gratin de courge' }, { ...base, titre: 'gratin de courge ' }]
  test('ajoute sans doublon et reste idempotent', async () => {
    const source = async () => ({ default: depart })
    expect(await chargerRecettesDepart(source)).toEqual({ ajoutees: 2, dejaPresentes: 1 })
    expect((await lister()).map((r) => r.titre).sort()).toEqual(['Gratin de courge', 'Pâtes tomate'])
    expect(await chargerRecettesDepart(source)).toEqual({ ajoutees: 0, dejaPresentes: 3 })
    expect(await db.recettes.count()).toBe(2)
  })
  test('ne touche pas aux recettes existantes de l\'utilisateur', async () => {
    const id = await creer({ ...base, titre: 'Pâtes Tomate', etapes: ['Ma version'] })
    await chargerRecettesDepart(async () => ({ default: [base] }))
    expect((await lire(id))?.etapes).toEqual(['Ma version'])
    expect(await db.recettes.count()).toBe(1)
  })
})
