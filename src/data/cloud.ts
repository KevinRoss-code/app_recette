import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Backend, LigneDistante } from './sync'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const cloudConfigure = Boolean(url && cle)
export const supabase: SupabaseClient | null = cloudConfigure ? createClient(url!, cle!) : null

const PAGE = 1000
const LOT = 200

export function backendSupabase(client: SupabaseClient): Backend {
  return {
    async pull(depuis) {
      const lignes: LigneDistante[] = []
      for (let debut = 0; ; debut += PAGE) {
        let q = client.from('sync_rows').select('tbl,id,data,updated_at,synced_at')
          .order('synced_at').order('tbl').order('id').range(debut, debut + PAGE - 1)
        if (depuis) q = q.gte('synced_at', depuis)
        const { data, error } = await q
        if (error) throw new Error(error.message)
        lignes.push(...(data as LigneDistante[]))
        if (data.length < PAGE) return lignes
      }
    },
    async push(lignes) {
      for (let i = 0; i < lignes.length; i += LOT) {
        const { error } = await client.rpc('push_rows', { rows: lignes.slice(i, i + LOT) })
        if (error) throw new Error(error.message)
      }
    },
  }
}
