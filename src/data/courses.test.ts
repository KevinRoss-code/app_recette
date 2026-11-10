import { beforeEach, describe, expect, test } from 'vitest'
import { db } from './db'
import { creer } from './recettes'
import { remplacerMenu } from './menu'
import { ajouterArticle, cocher, lireCourses, nouvelleListe, retirerArticle } from './courses'

beforeEach(async () => {
  await Promise.all([db.recettes.clear(), db.menu.clear(), db.coches.clear(), db.articles.clear()])
})

async function menuRiz(portions = 2) {
  const id = await creer({ titre: 'Riz', portions, etapes: [], tags: [], ingredients: [{ nom: 'riz', quantite: 100, unite: 'g', rayon: 'Épicerie' }] })
  await remplacerMenu([(await db.recettes.get(id))!])
}

describe('courses', () => {
  test('liste issue du menu', async () => {
    await menuRiz()
    const { lignes } = await lireCourses()
    expect(lignes).toMatchObject([{ nom: 'riz', quantite: 100 }])
  })
  test('cocher / décocher', async () => {
    await menuRiz()
    const [{ cle }] = (await lireCourses()).lignes
    await cocher(cle, true)
    expect((await lireCourses()).coches.has(cle)).toBe(true)
    await cocher(cle, false)
    expect((await lireCourses()).coches.has(cle)).toBe(false)
  })
  test('un nouveau menu décoche tout', async () => {
    await menuRiz()
    await cocher((await lireCourses()).lignes[0].cle, true)
    await menuRiz()
    expect((await lireCourses()).coches.size).toBe(0)
  })
  test('articles manuels : ajout, validation, retrait', async () => {
    await ajouterArticle({ nom: 'piles', quantite: 4, unite: '', rayon: 'Autre' })
    await expect(ajouterArticle({ nom: ' ', quantite: 1, unite: '', rayon: 'Autre' })).rejects.toThrow('Nom')
    expect((await lireCourses()).lignes).toMatchObject([{ nom: 'piles', manuel: true }])
    await retirerArticle('Piles', '')
    expect((await lireCourses()).lignes).toEqual([])
  })
  test('nouvelle liste vide manuels et coches, garde le menu', async () => {
    await menuRiz()
    await ajouterArticle({ nom: 'piles', quantite: 1, unite: '', rayon: 'Autre' })
    await cocher('riz|g', true)
    await nouvelleListe()
    const { lignes, coches } = await lireCourses()
    expect(lignes.map((l) => l.nom)).toEqual(['riz'])
    expect(coches.size).toBe(0)
  })
})
