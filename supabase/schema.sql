-- À exécuter une fois dans Supabase : SQL Editor > New query > Run.
-- Une seule table générique ; chaque ligne appartient à un utilisateur (RLS).

create table if not exists public.sync_rows (
  user_id    uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  tbl        text   not null,
  id         text   not null,
  data       jsonb  not null,
  updated_at bigint not null,
  synced_at  timestamptz not null default clock_timestamp(),
  primary key (user_id, tbl, id)
);

create index if not exists sync_rows_synced_at_idx on public.sync_rows (user_id, synced_at);

alter table public.sync_rows enable row level security;

drop policy if exists "lecture de ses lignes" on public.sync_rows;
drop policy if exists "ecriture de ses lignes" on public.sync_rows;
create policy "lecture de ses lignes" on public.sync_rows
  for select using (user_id = auth.uid());
create policy "ecriture de ses lignes" on public.sync_rows
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.touch_synced_at() returns trigger language plpgsql as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists sync_rows_touch on public.sync_rows;
create trigger sync_rows_touch before insert or update on public.sync_rows
  for each row execute function public.touch_synced_at();

-- Écriture groupée : une ligne n'est remplacée que si la nouvelle est plus récente.
create or replace function public.push_rows(rows jsonb) returns void
language sql security invoker as $$
  insert into public.sync_rows (user_id, tbl, id, data, updated_at)
  select auth.uid(), r->>'tbl', r->>'id', r->'data', (r->>'updated_at')::bigint
  from jsonb_array_elements(rows) r
  on conflict (user_id, tbl, id) do update
    set data = excluded.data, updated_at = excluded.updated_at
    where public.sync_rows.updated_at < excluded.updated_at;
$$;

revoke all on function public.push_rows(jsonb) from public, anon;
grant execute on function public.push_rows(jsonb) to authenticated;
