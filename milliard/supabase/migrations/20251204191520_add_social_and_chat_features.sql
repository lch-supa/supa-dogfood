-- ============================================
-- SOCIAL FEATURES (FRIENDS & CHAT)
-- ============================================

-- Create friends table for managing friend relationships
create table if not exists friends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  friend_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone,
  unique(user_id, friend_id),
  check (user_id != friend_id)
);

alter table friends enable row level security;

-- Users can view their own friend requests and friendships
create policy "Users can view their friend relationships"
  on friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Users can send friend requests
create policy "Users can send friend requests"
  on friends for insert
  with check (auth.uid() = user_id);

-- Users can update friend requests they received (accept/reject)
create policy "Users can respond to friend requests"
  on friends for update
  using (auth.uid() = friend_id and status = 'pending');

-- Users can delete their own friend relationships
create policy "Users can delete friend relationships"
  on friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Indexes for friends
create index if not exists friends_user_id_idx on friends(user_id);
create index if not exists friends_friend_id_idx on friends(friend_id);
create index if not exists friends_status_idx on friends(status);

-- Comments
comment on table friends is 'Manages friend relationships between users';
comment on column friends.status is 'pending: awaiting response, accepted: friends, rejected: request declined';

-- Create messages table for poem set chat
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  poem_set_id uuid references poem_sets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

-- Collaborators can view messages for poem sets they have access to
create policy "Collaborators can view messages"
  on messages for select
  using (
    exists (
      select 1 from poem_set_collaborators
      where poem_set_collaborators.poem_set_id = messages.poem_set_id
      and poem_set_collaborators.user_id = auth.uid()
    )
    or exists (
      select 1 from poem_sets
      where poem_sets.id = messages.poem_set_id
      and poem_sets.user_id = auth.uid()
    )
  );

-- Collaborators can send messages to poem sets they have access to
create policy "Collaborators can send messages"
  on messages for insert
  with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from poem_set_collaborators
        where poem_set_collaborators.poem_set_id = messages.poem_set_id
        and poem_set_collaborators.user_id = auth.uid()
      )
      or exists (
        select 1 from poem_sets
        where poem_sets.id = messages.poem_set_id
        and poem_sets.user_id = auth.uid()
      )
    )
  );

-- Users can update their own messages
create policy "Users can update their own messages"
  on messages for update
  using (auth.uid() = user_id);

-- Users can delete their own messages
create policy "Users can delete their own messages"
  on messages for delete
  using (auth.uid() = user_id);

-- Indexes for messages
create index if not exists messages_poem_set_id_idx on messages(poem_set_id);
create index if not exists messages_user_id_idx on messages(user_id);
create index if not exists messages_created_at_idx on messages(created_at desc);
create index if not exists messages_poem_set_created_idx on messages(poem_set_id, created_at desc);

-- Comments
comment on table messages is 'Chat messages for collaborative poem set editing';
comment on column messages.poem_set_id is 'The poem set this message belongs to';

-- One-time fix: Add existing poem set owners as collaborators if they have collaboration enabled
insert into poem_set_collaborators (poem_set_id, user_id, role, invited_by)
select id, user_id, 'owner', user_id
from poem_sets
where allow_collaboration = true
  and user_id is not null
  and not exists (
    select 1 from poem_set_collaborators
    where poem_set_collaborators.poem_set_id = poem_sets.id
    and poem_set_collaborators.user_id = poem_sets.user_id
  )
on conflict (poem_set_id, user_id) do nothing;

-- Update trigger to add owner as collaborator when collaboration is enabled
drop trigger if exists on_poem_set_collaboration_enabled on poem_sets;
create trigger on_poem_set_collaboration_enabled
  after update on poem_sets
  for each row
  when (old.allow_collaboration = false and new.allow_collaboration = true)
  execute procedure public.add_owner_as_collaborator();
