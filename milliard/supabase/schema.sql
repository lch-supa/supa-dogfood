-- Create poem_sets table for storing AI-generated poem collections
create table if not exists poem_sets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  theme text not null,
  poems jsonb not null, -- Array of poem objects with lines
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id), -- Optional: for authenticated users
  is_public boolean default true,
  status text default 'published' check (status in ('draft', 'published'))
);

-- Enable Row Level Security
alter table poem_sets enable row level security;

-- Policy for public read access (only published public sets)
create policy "Public can read published public poem sets"
  on poem_sets for select
  using (is_public = true AND status = 'published');

-- Policy for users to read their own sets (drafts and published)
create policy "Users can read their own poem sets"
  on poem_sets for select
  using (auth.uid() = user_id);

-- Policy for inserting poem sets (anyone can create)
create policy "Anyone can insert poem sets"
  on poem_sets for insert
  with check (true);

-- Policy for users to update their own sets
create policy "Users can update their own poem sets"
  on poem_sets for update
  using (auth.uid() = user_id);

-- Policy for users to delete their own sets
create policy "Users can delete their own poem sets"
  on poem_sets for delete
  using (auth.uid() = user_id);

-- Create indexes for faster queries
create index if not exists poem_sets_created_at_idx on poem_sets(created_at desc);
create index if not exists poem_sets_user_id_idx on poem_sets(user_id);
create index if not exists poem_sets_is_public_idx on poem_sets(is_public);
create index if not exists poem_sets_status_idx on poem_sets(status);
create index if not exists poem_sets_user_status_idx on poem_sets(user_id, status);

-- Add comment explaining the structure
comment on table poem_sets is 'Stores collections of 10 sonnets';
comment on column poem_sets.poems is 'JSONB array of poem objects, each with a "lines" array of 14 strings';

-- User profiles table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create saved_poems table
create table if not exists saved_poems (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  user_id uuid references auth.users(id) on delete cascade,
  poem_set_id uuid references poem_sets(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table saved_poems enable row level security;

-- Saved poems policies
create policy "Users can view their own saved poems"
  on saved_poems for select
  using (auth.uid() = user_id);

create policy "Users can create their own saved poems"
  on saved_poems for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved poems"
  on saved_poems for delete
  using (auth.uid() = user_id);

-- Create saved_poem_lines table
create table if not exists saved_poem_lines (
  id uuid default gen_random_uuid() primary key,
  saved_poem_id uuid references saved_poems(id) on delete cascade not null,
  line_number integer not null check (line_number >= 1 and line_number <= 14),
  line_text text not null,
  poem_position integer not null check (poem_position >= 0 and poem_position <= 9),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(saved_poem_id, line_number)
);

alter table saved_poem_lines enable row level security;

-- Saved poem lines policies (inherit permissions from saved_poems)
create policy "Users can view lines of their saved poems"
  on saved_poem_lines for select
  using (
    exists (
      select 1 from saved_poems
      where saved_poems.id = saved_poem_lines.saved_poem_id
      and saved_poems.user_id = auth.uid()
    )
  );

create policy "Users can create lines for their saved poems"
  on saved_poem_lines for insert
  with check (
    exists (
      select 1 from saved_poems
      where saved_poems.id = saved_poem_lines.saved_poem_id
      and saved_poems.user_id = auth.uid()
    )
  );

create policy "Users can delete lines of their saved poems"
  on saved_poem_lines for delete
  using (
    exists (
      select 1 from saved_poems
      where saved_poems.id = saved_poem_lines.saved_poem_id
      and saved_poems.user_id = auth.uid()
    )
  );

-- Indexes for better performance
create index if not exists saved_poems_user_id_idx on saved_poems(user_id);
create index if not exists saved_poems_poem_set_id_idx on saved_poems(poem_set_id);
create index if not exists saved_poems_created_at_idx on saved_poems(created_at desc);
create index if not exists saved_poem_lines_saved_poem_id_idx on saved_poem_lines(saved_poem_id);
create index if not exists saved_poem_lines_line_number_idx on saved_poem_lines(line_number);

-- Comments
comment on table profiles is 'User profile information';
comment on table saved_poems is 'User-created poems composed by mixing lines from poem sets';
comment on table saved_poem_lines is 'Individual lines of saved poems with their source position in the poem set';
comment on column saved_poem_lines.line_number is 'Position of this line in the poem (1-14)';
comment on column saved_poem_lines.poem_position is 'Which poem in the set this line came from (0-9)';

-- ============================================
-- COLLABORATIVE EDITING FEATURE
-- ============================================

-- Add collaboration flag to poem_sets
alter table poem_sets add column if not exists allow_collaboration boolean default false;

-- Create poem_set_collaborators table
create table if not exists poem_set_collaborators (
  id uuid default gen_random_uuid() primary key,
  poem_set_id uuid references poem_sets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(poem_set_id, user_id)
);

alter table poem_set_collaborators enable row level security;

-- Collaborators can view their collaborations
create policy "Users can view their collaborations"
  on poem_set_collaborators for select
  using (auth.uid() = user_id or auth.uid() = invited_by);

-- Owners and editors can add collaborators
create policy "Owners and editors can add collaborators"
  on poem_set_collaborators for insert
  with check (
    exists (
      select 1 from poem_set_collaborators
      where poem_set_id = poem_set_collaborators.poem_set_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
    )
    or exists (
      select 1 from poem_sets
      where id = poem_set_collaborators.poem_set_id
      and user_id = auth.uid()
    )
  );

-- Owners can remove collaborators
create policy "Owners can remove collaborators"
  on poem_set_collaborators for delete
  using (
    exists (
      select 1 from poem_set_collaborators as pc
      where pc.poem_set_id = poem_set_collaborators.poem_set_id
      and pc.user_id = auth.uid()
      and pc.role = 'owner'
    )
  );

-- Update poem_sets policies to allow collaborators
-- Collaborators can read poem sets they have access to
create policy "Collaborators can read poem sets"
  on poem_sets for select
  using (
    id in (
      select poem_set_id from poem_set_collaborators
      where user_id = auth.uid()
    )
  );

-- Editors can update poem sets they collaborate on
create policy "Collaborators can update poem sets"
  on poem_sets for update
  using (
    id in (
      select poem_set_id from poem_set_collaborators
      where user_id = auth.uid()
      and role in ('owner', 'editor')
    )
  );

-- Create indexes for collaborators
create index if not exists poem_set_collaborators_poem_set_id_idx on poem_set_collaborators(poem_set_id);
create index if not exists poem_set_collaborators_user_id_idx on poem_set_collaborators(user_id);

-- Comments
comment on table poem_set_collaborators is 'Tracks users who can collaborate on poem sets';
comment on column poem_set_collaborators.role is 'owner: full control, editor: can edit content, viewer: read-only access';
comment on column poem_sets.allow_collaboration is 'Whether this poem set allows real-time collaborative editing';

-- Function to automatically add owner as collaborator when creating poem set
create or replace function public.add_owner_as_collaborator()
returns trigger as $$
begin
  if new.user_id is not null and new.allow_collaboration = true then
    insert into public.poem_set_collaborators (poem_set_id, user_id, role)
    values (new.id, new.user_id, 'owner')
    on conflict (poem_set_id, user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to add owner as collaborator on INSERT
drop trigger if exists on_poem_set_created on poem_sets;
create trigger on_poem_set_created
  after insert on poem_sets
  for each row execute procedure public.add_owner_as_collaborator();

-- Trigger to add owner as collaborator on UPDATE (when collaboration is enabled)
drop trigger if exists on_poem_set_collaboration_enabled on poem_sets;
create trigger on_poem_set_collaboration_enabled
  after update on poem_sets
  for each row
  when (old.allow_collaboration = false and new.allow_collaboration = true)
  execute procedure public.add_owner_as_collaborator();

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
