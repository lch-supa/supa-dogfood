-- Enable Realtime for messages table
-- This ensures the table publishes changes to the Realtime server

-- Ensure the supabase_realtime publication exists
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Add messages table to the publication (if not already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

-- Verify replica identity is set to full for better realtime support
alter table messages replica identity full;

-- Add comment
comment on table messages is 'Chat messages for collaborative poem set editing. Realtime enabled.';
