-- Fix Realtime publication for messages table
-- Properly add messages to the realtime publication

-- Ensure the supabase_realtime publication exists
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Remove messages from publication if it exists (to re-add it properly)
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'messages'
  ) then
    alter publication supabase_realtime drop table messages;
  end if;
end $$;

-- Add messages table to the publication
alter publication supabase_realtime add table messages;

-- Verify replica identity is set to full
alter table messages replica identity full;

-- Add helpful comment
comment on table messages is 'Chat messages for collaborative poem set editing. Realtime enabled via supabase_realtime publication.';
