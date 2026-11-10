import { describe, expect, test } from 'vitest'
import { relancer, tirer } from './tirage'
import type { Recette } from './types'

const R = (id: number, extra: Partial<Recette> = {}): Recette => ({
  id, titre: `R${id}`, portions: 2, ingredients: [], etapes: [], tags: [], ...extra,
})
const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length] }
const NOW = 1_000_000_000_000

describe('tirer', () => {
  test('renvoie le nombre demandé sans doublon', () => {
    const res = tirer([R(1), R(2), R(3), R(4)], { nombre: 3 })
    expect(res).toHaveLength(3)
    expect(new Set(res.map((r) => r.id)).size).toBe(3)
  })
  test('moins de recettes que demandé', () => {
    expect(tirer([R(1)], { nombre: 5 })).toHaveLength(1)
    expect(tirer([], { nombre: 2 })).toEqual([])
  })
  test('rng déterministe', () => {
    const a = tirer([R(1), R(2), R(3)], { nombre: 3, rng: seq(0, 0, 0) })
    const b = tirer([R(1), R(2), R(3)], { nombre: 3, rng: seq(0, 0, 0) })
    expect(a).toEqual(b)
  })
  test('filtre tags (tous requis) et temps', () => {
    const rs = [
      R(1, { tags: ['veggie', 'rapide'], tempsMinutes: 15 }),
      R(2, { tags: ['veggie'], tempsMinutes: 15 }),
      R(3, { tags: ['veggie', 'rapide'], tempsMinutes: 60 }),
      R(4, { tags: ['veggie', 'rapide'] }),
    ]
    const ids = tirer(rs, { nombre: 9, tags: ['veggie', 'rapide'], tempsMax: 30 }).map((r) => r.id).sort()
    expect(ids).toEqual([1, 4])
  })
  test('exclut les ids demandés', () => {
    expect(tirer([R(1), R(2)], { nombre: 2, exclureIds: [1] }).map((r) => r.id)).toEqual([2])
  })
  test('privilégie les recettes non récentes', () => {
    const rs = [R(1, { dernierTirage: NOW - 1000 }), R(2), R(3, { dernierTirage: NOW - 30 * 86_400_000 })]
    const res = tirer(rs, { nombre: 2, maintenant: NOW })
    expect(res.map((r) => r.id).sort()).toEqual([2, 3])
  })
  test('complète avec les récentes si besoin', () => {
    const rs = [R(1, { dernierTirage: NOW - 1000 }), R(2)]
    expect(tirer(rs, { nombre: 2, maintenant: NOW })).toHaveLength(2)
  })
})

describe('relancer', () => {
  test('remplace par une recette hors sélection', () => {
    const tout = [R(1), R(2), R(3)]
    const res = relancer(tout, [tout[0], tout[1]], 1)
    expect(res.map((r) => r.id)).toEqual([3, 2])
  })
  test('garde la sélection si aucune remplaçante', () => {
    const tout = [R(1), R(2)]
    expect(relancer(tout, tout, 1)).toEqual(tout)
  })
})
