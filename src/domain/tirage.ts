import type { Recette } from './types'

export interface CriteresTirage {
  nombre: number
  tags?: string[]
  tempsMax?: number
  exclureIds?: string[]
  recenteJours?: number
  maintenant?: number
  rng?: () => number
}

const JOUR = 86_400_000

function melanger<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function tirer(recettes: Recette[], c: CriteresTirage): Recette[] {
  const { nombre, tags = [], tempsMax, exclureIds = [], recenteJours = 14, rng = Math.random } = c
  const maintenant = c.maintenant ?? Date.now()
  const eligibles = recettes.filter(
    (r) =>
      !exclureIds.includes(r.id) &&
      tags.every((t) => r.tags.includes(t)) &&
      (tempsMax === undefined || r.tempsMinutes === undefined || r.tempsMinutes <= tempsMax),
  )
  const estRecente = (r: Recette) =>
    r.dernierTirage !== undefined && maintenant - r.dernierTirage < recenteJours * JOUR
  const fraiches = melanger(eligibles.filter((r) => !estRecente(r)), rng)
  const recentes = melanger(eligibles.filter(estRecente), rng)
  return [...fraiches, ...recentes].slice(0, Math.max(0, nombre))
}

export function relancer(
  recettes: Recette[],
  selection: Recette[],
  id: string,
  c: Omit<CriteresTirage, 'nombre'> = {},
): Recette[] {
  const [remplacante] = tirer(recettes, {
    ...c,
    nombre: 1,
    exclureIds: [...(c.exclureIds ?? []), ...selection.map((r) => r.id)],
  })
  return remplacante ? selection.map((r) => (r.id === id ? remplacante : r)) : selection
}
