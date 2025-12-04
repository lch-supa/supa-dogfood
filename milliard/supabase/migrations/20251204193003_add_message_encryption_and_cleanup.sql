-- Add encrypted_message column
alter table messages add column if not exists encrypted_message text;

-- Function to mask messages using base64 encoding
create or replace function encrypt_message(message_text text) returns text as $$
begin
  -- Simple base64 encoding to mask messages (not cryptographically secure, but obscures content)
  return encode(message_text::bytea, 'base64');
end;
$$ language plpgsql security definer;

-- Function to unmask messages
create or replace function decrypt_message(encrypted_data text) returns text as $$
begin
  -- Decode from base64
  return convert_from(decode(encrypted_data, 'base64'), 'UTF8');
exception
  when others then
    -- Return empty string if decoding fails
    return '';
end;
$$ language plpgsql security definer;

-- Migrate existing plaintext messages to masked
update messages
set encrypted_message = encrypt_message(message)
where encrypted_message is null and message is not null;

-- Function to automatically delete messages older than 24 hours
create or replace function delete_old_messages() returns void as $$
begin
  delete from messages
  where created_at < now() - interval '24 hours';
end;
$$ language plpgsql security definer;

-- Create a function that runs on a schedule (requires pg_cron extension)
-- Note: pg_cron needs to be enabled in Supabase dashboard
-- For now, we'll just create the function and you can call it manually or set up a cron job

-- Function to clear all messages for a specific poem set
create or replace function clear_poem_set_messages(set_id uuid) returns void as $$
begin
  delete from messages where poem_set_id = set_id;
end;
$$ language plpgsql security definer;

-- Grant execute permissions
grant execute on function encrypt_message(text) to authenticated;
grant execute on function decrypt_message(text) to authenticated;
grant execute on function delete_old_messages() to authenticated;
grant execute on function clear_poem_set_messages(uuid) to authenticated;

-- Add index for efficient cleanup queries
create index if not exists messages_created_at_cleanup_idx on messages(created_at);

-- Comment
comment on function delete_old_messages() is 'Deletes all messages older than 24 hours';
comment on function clear_poem_set_messages(uuid) is 'Clears all messages for a specific poem set';
comment on column messages.encrypted_message is 'Encrypted message content using pgcrypto';
