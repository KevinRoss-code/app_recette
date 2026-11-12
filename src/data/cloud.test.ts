import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { backendSupabase, diagnostiquer, normaliserUrl } from './cloud'

function faux(total: number) {
  const appels = { gte: [] as string[], rpc: [] as { fn: string; n: number }[] }
  const lignes = Array.from({ length: total }, (_, i) => ({ tbl: 'recettes', id: `r${i}`, data: {}, updated_at: i, synced_at: 's' }))
  const client = {
    from: () => {
      let debut = 0, fin = 0
      const q: Record<string, unknown> = {
        select: () => q, order: () => q,
        range: (d: number, f: number) => { debut = d; fin = f; return q },
        gte: (_c: string, v: string) => { appels.gte.push(v); return q },
        then: (ok: (v: unknown) => unknown) => ok({ data: lignes.slice(debut, fin + 1), error: null }),
      }
      return q
    },
    rpc: async (fn: string, args: { rows: unknown[] }) => { appels.rpc.push({ fn, n: args.rows.length }); return { error: null } },
  }
  return { client: client as unknown as SupabaseClient, appels }
}

describe('backendSupabase', () => {
  test('pull parcourt toutes les pages', async () => {
    const { client } = faux(2300)
    expect(await backendSupabase(client).pull(null)).toHaveLength(2300)
  })
  test('pull filtre sur synced_at quand un curseur est donné', async () => {
    const { client, appels } = faux(3)
    await backendSupabase(client).pull('2026-01-01T00:00:00.000Z')
    expect(appels.gte).toEqual(['2026-01-01T00:00:00.000Z'])
  })
  test('push envoie par lots de 200 via push_rows', async () => {
    const { client, appels } = faux(0)
    const lignes = Array.from({ length: 450 }, (_, i) => ({ tbl: 't', id: `${i}`, data: { updatedAt: 1 }, updated_at: 1 }))
    await backendSupabase(client).push(lignes)
    expect(appels.rpc).toEqual([{ fn: 'push_rows', n: 200 }, { fn: 'push_rows', n: 200 }, { fn: 'push_rows', n: 50 }])
  })
})

describe('normaliserUrl', () => {
  test.each([
    ['https://abc.supabase.co', 'https://abc.supabase.co'],
    ['https://abc.supabase.co/', 'https://abc.supabase.co'],
    ['https://abc.supabase.co/rest/v1/', 'https://abc.supabase.co'],
    ['  https://abc.supabase.co/auth/v1  \n', 'https://abc.supabase.co'],
    ['abc.supabase.co', 'https://abc.supabase.co'],
  ])('%j -> %s', (entree, attendu) => expect(normaliserUrl(entree)).toBe(attendu))
  test.each([[undefined], [''], ['   '], ['http://']])('%j -> non configuré', (entree) => expect(normaliserUrl(entree)).toBeUndefined())
})

describe('diagnostiquer', () => {
  const client = (serveur: { tbl: string }[], ecriture: { message: string } | null, relues: number) => ({
    auth: { getSession: async () => ({ data: { session: { user: { email: 'a@b.fr', id: '12345678-aaaa' } } } }) },
    from: () => ({
      select: () => {
        const q: Record<string, unknown> = { eq: () => ({ then: (ok: (v: unknown) => unknown) => ok({ data: new Array(relues).fill({ id: 'test' }), error: null }) }),
          then: (ok: (v: unknown) => unknown) => ok({ data: serveur, error: null }) }
        return q
      },
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
    rpc: async () => ({ error: ecriture }),
  }) as unknown as SupabaseClient

  test('rapporte les comptes locaux et serveur et une écriture réussie', async () => {
    const r = await diagnostiquer(client([{ tbl: 'recettes' }, { tbl: 'recettes' }, { tbl: 'menu' }], null, 1), { recettes: 2 })
    expect(r.join('\n')).toContain('a@b.fr')
    expect(r.join('\n')).toContain('recettes 2')
    expect(r.join('\n')).toContain('recettes 2, menu 1')
    expect(r.join('\n')).toContain('Écriture serveur : OK')
  })
  test('serveur vide et erreur d\'écriture visibles', async () => {
    const r = await diagnostiquer(client([], { message: 'permission denied' }, 0), { recettes: 2 })
    expect(r.join('\n')).toContain('aucune ligne')
    expect(r.join('\n')).toContain('ERREUR permission denied')
  })
  test('écriture acceptée mais rien relu = échec silencieux signalé', async () => {
    const r = await diagnostiquer(client([], null, 0), {})
    expect(r.join('\n')).toContain('ÉCHEC silencieux')
  })
})
