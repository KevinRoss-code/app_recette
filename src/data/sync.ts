import { db as dbParDefaut, type CarnetDb } from './db'
import type { Synchro } from '../domain/types'

export interface LigneDistante {
  tbl: string
  id: string
  data: Synchro & Record<string, unknown>
  updated_at: number
  synced_at: string
}

export interface Backend {
  pull(depuis: string | null): Promise<LigneDistante[]>
  push(lignes: Omit<LigneDistante, 'synced_at'>[]): Promise<void>
}

const TABLES = [
  { nom: 'recettes', cle: 'id' },
  { nom: 'menu', cle: 'id' },
  { nom: 'coches', cle: 'cle' },
  { nom: 'articles', cle: 'id' },
] as const

const CHEVAUCHEMENT_MS = 5000
export let applicationEnCours = false

export interface Bilan { recues: number; envoyees: number }

export async function synchroniser(backend: Backend, base: CarnetDb = dbParDefaut, now = Date.now): Promise<Bilan> {
  const debut = now()
  const curseur = (await base.meta.get('curseur'))?.valeur as string | undefined
  const dernierPush = ((await base.meta.get('dernierPush'))?.valeur as number | undefined) ?? 0
  const depuis = curseur ? new Date(Date.parse(curseur) - CHEVAUCHEMENT_MS).toISOString() : null

  const distantes = await backend.pull(depuis)
  const recuesCles = new Set<string>()
  let recues = 0
  applicationEnCours = true
  try {
    for (const l of distantes) {
      const def = TABLES.find((t) => t.nom === l.tbl)
      if (!def) continue
      const table = base.table(def.nom)
      const locale = (await table.get(l.id)) as Synchro | undefined
      if (!locale || l.updated_at > locale.updatedAt) {
        await table.put(l.data)
        recuesCles.add(`${l.tbl}/${l.id}`)
        recues++
      }
    }
  } finally {
    applicationEnCours = false
  }

  const aEnvoyer: Omit<LigneDistante, 'synced_at'>[] = []
  for (const def of TABLES) {
    const lignes = await base.table(def.nom).where('updatedAt').aboveOrEqual(dernierPush).toArray()
    for (const data of lignes as (Synchro & Record<string, string>)[]) {
      const id = data[def.cle]
      if (!recuesCles.has(`${def.nom}/${id}`)) aEnvoyer.push({ tbl: def.nom, id, data, updated_at: data.updatedAt })
    }
  }
  if (aEnvoyer.length) await backend.push(aEnvoyer)

  const nouveauCurseur = distantes.reduce((m, l) => (l.synced_at > m ? l.synced_at : m), curseur ?? '')
  if (nouveauCurseur) await base.meta.put({ cle: 'curseur', valeur: nouveauCurseur })
  await base.meta.put({ cle: 'dernierPush', valeur: debut })
  await base.meta.put({ cle: 'derniereSynchro', valeur: now() })
  return { recues, envoyees: aEnvoyer.length }
}
