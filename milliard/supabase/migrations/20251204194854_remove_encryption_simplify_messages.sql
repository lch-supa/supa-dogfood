-- Remove encryption and simplify messages table

-- Drop the encrypted_message column
alter table messages drop column if exists encrypted_message;

-- Drop encryption functions
drop function if exists encrypt_message(text);
drop function if exists decrypt_message(text);

-- Enable full replica identity for real-time updates
-- This ensures all columns are included in real-time events
alter table messages replica identity full;

-- Add comment
comment on table messages is 'Chat messages for collaborative poem set editing. Messages are plaintext and protected by RLS policies.';
