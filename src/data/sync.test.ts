// @vitest-environment jsdom
import Dexie from 'dexie'
import { beforeEach, describe, expect, test } from 'vitest'
import { CarnetDb } from './db'
import { synchroniser, type Backend, type LigneDistante } from './sync'
import type { Recette } from '../domain/types'

class FauxServeur implements Backend {
  lignes = new Map<string, LigneDistante>()
  horloge = Date.parse('2026-01-01T00:00:00Z')
  panne = false
  async pull(depuis: string | null) {
    if (this.panne) throw new Error('réseau')
    return [...this.lignes.values()].filter((l) => !depuis || l.synced_at >= depuis)
  }
  async push(lignes: Omit<LigneDistante, 'synced_at'>[]) {
    if (this.panne) throw new Error('réseau')
    for (const l of lignes) {
      const cle = `${l.tbl}/${l.id}`
      const existante = this.lignes.get(cle)
      if (existante && existante.updated_at >= l.updated_at) continue
      this.horloge += 1000
      this.lignes.set(cle, { ...l, synced_at: new Date(this.horloge).toISOString() })
    }
  }
}

const recette = (id: string, titre: string, updatedAt: number, extra: Partial<Recette> = {}): Recette =>
  ({ id, titre, portions: 2, ingredients: [], etapes: [], tags: [], updatedAt, ...extra })

let A: CarnetDb, B: CarnetDb, serveur: FauxServeur
let tA = 1000, tB = 1000
const syncA = () => synchroniser(serveur, A, () => (tA += 10))
const syncB = () => synchroniser(serveur, B, () => (tB += 10))

beforeEach(async () => {
  await Promise.all([Dexie.delete('sync-A'), Dexie.delete('sync-B')])
  A = new CarnetDb('sync-A'); B = new CarnetDb('sync-B'); serveur = new FauxServeur(); tA = 1000; tB = 1000
})

describe('synchroniser', () => {
  test('une recette créée sur A arrive sur B', async () => {
    await A.recettes.add(recette('r1', 'Gratin', 1500))
    expect(await syncA()).toEqual({ recues: 0, envoyees: 1 })
    expect(await syncB()).toEqual({ recues: 1, envoyees: 0 })
    expect(await B.recettes.get('r1')).toMatchObject({ titre: 'Gratin' })
  })
  test('modification propagée, la plus récente gagne', async () => {
    await A.recettes.add(recette('r1', 'Gratin', 1500))
    await syncA(); await syncB()
    await B.recettes.put(recette('r1', 'Gratin B', 2000))
    await A.recettes.put(recette('r1', 'Gratin A', 1800))
    await syncB(); await syncA()
    expect((await A.recettes.get('r1'))?.titre).toBe('Gratin B')
    await syncB()
    expect((await B.recettes.get('r1'))?.titre).toBe('Gratin B')
  })
  test('un enregistrement ancien n\'écrase pas un plus récent côté serveur', async () => {
    await B.recettes.add(recette('r1', 'Récent', 3000))
    await syncB()
    await A.recettes.add(recette('r1', 'Vieux', 2000))
    await syncA()
    expect((await A.recettes.get('r1'))?.titre).toBe('Récent')
    expect(serveur.lignes.get('recettes/r1')?.data.titre).toBe('Récent')
  })
  test('suppression douce propagée', async () => {
    await A.recettes.add(recette('r1', 'Gratin', 1500))
    await syncA(); await syncB()
    await A.recettes.put(recette('r1', 'Gratin', 2500, { deletedAt: 2500 }))
    await syncA(); await syncB()
    expect((await B.recettes.get('r1'))?.deletedAt).toBe(2500)
  })
  test('toutes les tables se synchronisent (menu, coches, articles)', async () => {
    await A.menu.add({ id: 'm1', recetteId: 'r1', portions: 3, ordre: 0, updatedAt: 1500 })
    await A.coches.add({ cle: 'riz|g', updatedAt: 1500 })
    await A.articles.add({ id: 'a1', nom: 'piles', quantite: 4, unite: '', rayon: 'Autre', updatedAt: 1500 })
    await syncA(); await syncB()
    expect(await B.menu.count()).toBe(1)
    expect(await B.coches.get('riz|g')).toBeTruthy()
    expect(await B.articles.get('a1')).toMatchObject({ nom: 'piles' })
  })
  test('idempotent : rien à renvoyer quand rien n\'a changé', async () => {
    await A.recettes.add(recette('r1', 'Gratin', 500))
    await syncA()
    const bilan = await synchroniser(serveur, A, () => (tA += 5000))
    expect(bilan.envoyees).toBe(0)
    expect(await A.recettes.count()).toBe(1)
  })
  test('une panne réseau ne perd rien et le prochain essai envoie tout', async () => {
    await A.recettes.add(recette('r1', 'Gratin', 1500))
    serveur.panne = true
    await expect(syncA()).rejects.toThrow('réseau')
    serveur.panne = false
    expect(await syncA()).toMatchObject({ envoyees: 1 })
    expect(serveur.lignes.size).toBe(1)
  })
  test('table inconnue ignorée', async () => {
    serveur.lignes.set('x/1', { tbl: 'x', id: '1', data: { updatedAt: 1 }, updated_at: 1, synced_at: '2026-01-01T00:00:01.000Z' })
    expect(await syncA()).toEqual({ recues: 0, envoyees: 0 })
  })
})
