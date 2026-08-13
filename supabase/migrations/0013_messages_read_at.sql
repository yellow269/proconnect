-- Migration 0013: Add read_at to messages for unread tracking
-- Safe to re-run: checks if column already exists before adding.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'messages' and column_name = 'read_at'
  ) then
    alter table public.messages add column read_at timestamptz;
  end if;
end $$;
