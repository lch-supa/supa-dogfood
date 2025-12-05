# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Sonnet-Machine" is a React-based web application inspired by Raymond Queneau's "Cent Mille Milliards de Poèmes" (A Hundred Thousand Billion Poems). It allows users to create combinatorial poems by mixing and matching individual lines from custom poem sets, save their creations, collaborate with others, and explore community-created poem sets.

**Tech Stack:**
- Vite + React 18
- TypeScript
- shadcn/ui component library
- Tailwind CSS
- Framer Motion for animations
- React Router for navigation
- TanStack Query for data management
- Supabase for backend/database/authentication
- Supabase Edge Functions for AI poem generation

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm preview
```

## Architecture

### Core Concept
The FlipReader component implements a combinatorial poem generator where each of the 14 lines of a sonnet can be independently selected from any poem in the active poem set, creating massive combinatorial possibilities (10^14 for a set of 10 poems).

### Key Features

1. **Interactive Poem Reader**: Flip through different line combinations from poem sets
2. **Authentication**: User sign-up, sign-in, and profile management with handle system
3. **Poem Set Management**: Create, edit, publish, and delete custom poem sets
4. **AI Generation**: Generate poems using Supabase Edge Functions
5. **Collaboration**: Invite collaborators to co-edit poem sets
6. **Community**: Explore and use published poem sets from other users
7. **Groups**: Create and manage groups, invite members, assign poem sets to groups
8. **Messaging**: Direct messaging between users and group conversations
9. **Chat Widget**: Persistent floating chat interface across the app
10. **Theme Support**: Dark/light mode toggle

### Routing Structure

Routes defined in `App.tsx`:
- `/` → Index page (landing page with FlipReader)
- `/explore` → Explore page (browse community poem sets)
- `/my-sets` → MySets page (user's created/collaborated poem sets)
- `/profile` → Profile page (user profile and settings)
- `/my-sets/:id/edit` → EditPoemSet page (edit poem set with collaboration)
- `/poem-set/:id` → PoemSetView page (view individual poem set details)
- `/groups` → Groups page (browse and manage groups)
- `/groups/:id` → GroupDetail page (view group details and members)
- `*` → NotFound page (404)

**Important**: All routes must be added ABOVE the catch-all `*` route.

### Pages

**Index** (`src/pages/Index.tsx`): Main landing page
- Contains Hero, AboutSection, and Footer
- Displays FlipReader for poem interaction
- Integrates GeneratePoemsDialog

**Explore** (`src/pages/Explore.tsx`): Community exploration
- Browse published poem sets from all users
- Filter and search functionality
- Load poem sets into FlipReader

**MySets** (`src/pages/MySets.tsx`): User's poem sets
- Display sets created by user or where user is a collaborator
- Create new sets (manual or AI-generated)
- Edit, publish/unpublish, delete sets
- Assign sets to groups
- View collaborator information

**Profile** (`src/pages/Profile.tsx`): User profile page
- Display and edit user profile information
- Manage display name, handle, and avatar
- View friends list
- Send and manage friend requests

**EditPoemSet** (`src/pages/EditPoemSet.tsx`): Edit poem sets
- Edit poem set title, description, and poems
- Real-time collaboration with live presence
- Invite collaborators
- See collaborator list with roles
- Draft/published status toggle
- Export poem sets
- Preview poem sets

**PoemSetView** (`src/pages/PoemSetView.tsx`): View poem set details
- Display poem set metadata
- Show all poems in the set
- View creator and collaborator information

**Groups** (`src/pages/Groups.tsx`): Groups management
- Browse all available groups
- View user's groups
- Create new groups
- Join/leave groups

**GroupDetail** (`src/pages/GroupDetail.tsx`): Group details
- View group information and members
- Manage group settings (if owner)
- Invite members to group
- View poem sets assigned to group
- Assign/unassign poem sets

**Messages** (`src/pages/Messages.tsx`): Messages page (not currently routed)
- View all conversations
- Start new direct messages or group conversations

**ConversationView** (`src/pages/ConversationView.tsx`): Conversation view (not currently routed)
- View and send messages in a specific conversation
- Real-time message updates

**NotFound** (`src/pages/NotFound.tsx`): 404 error page

### Core Components

#### Poem Components (`src/components/poems/`)

**FlipReader**: Main interactive component
- Manages state for all 14 line selections
- Calculates current combination number using BigInt arithmetic
- Handles line flipping (up/down), randomization, and reset
- Integrates with poem sets from Supabase
- Save/load functionality

**PoemLine**: Individual line component
- Displays a single line with navigation controls
- Handles hover states and flip animations
- Shows which source poem the line comes from

#### Layout Components (`src/components/layout/`)

**Header**: Navigation header
- Navigation links to main pages
- Authentication state display
- Sign in/out functionality
- Theme toggle
- Access to chat widget

**Footer**: Footer component

#### Landing Components (`src/components/landing/`)

**Hero**: Hero section for landing page

**AboutSection**: About section explaining the app

#### Chat Components (`src/components/chat/`)

**ChatWidget**: Floating chat interface
- Persistent across all pages
- Lists active conversations
- Quick access to direct messages
- Real-time message updates

**ConversationsList**: List of conversations
- Display recent conversations
- Show unread message counts
- Quick navigation to conversations

**ChatBubble**: Individual message bubble
- Display message content and metadata
- Show sender information
- Handle message timestamps

#### Social Components (`src/components/social/`)

**FriendsList**: Friends management
- Display user's friends
- Send/accept/reject friend requests
- Search for users by email or handle

**PoemSetChat**: Chat within poem set collaboration
- Real-time messaging between collaborators
- Message history for poem set discussions
- Collaborative context for editing

#### Dialog Components (`src/components/dialogs/`)

**AuthDialog**: Authentication modal
- Sign in and sign up forms
- Email/password and OAuth authentication
- Profile creation on sign-up

**GeneratePoemsDialog**: AI generation
- Input tags for AI-generated poems (comma-separated)
- Calls Supabase Edge Function to generate poems
- Creates new poem set with generated content

**InviteCollaboratorDialog**: Collaboration
- Invite users to collaborate on poem sets
- Input email address or handle of collaborator
- Create collaborator relationship

**HandleSetupDialog**: OAuth user setup
- Prompts OAuth users to set their handle
- Ensures unique handle selection
- Required before full app access

**CreateGroupDialog**: Group creation
- Create new groups
- Set group name and description
- Optional avatar URL

**InviteToGroupDialog**: Group invitations
- Invite users to groups
- Search by email or handle
- Manage group membership

**CreateConversationDialog**: Start conversations
- Create direct or group conversations
- Select participants
- Initialize conversation

**AssignToGroupDialog**: Poem set assignment
- Assign poem sets to groups
- Select target group
- Manage group content

**EditMetadataDialog**: Edit poem set metadata
- Update title and description
- Edit tags
- Modify publication settings

**PreviewPoemSetDialog**: Preview poems
- View poem set before publishing
- Test FlipReader with poem set
- Preview all combinations

**ExportPoemSetDialog**: Export functionality
- Export poem sets in various formats
- Download options
- Share poem sets

#### Providers (`src/components/providers/`)

**theme-provider**: Theme context provider
- Manages dark/light mode state
- Persists theme preference

#### UI Components (`src/components/ui/`)

**theme-toggle**: Dark/light mode toggle button

**checkbox**: Checkbox input component (shadcn/ui)

*(Plus standard shadcn/ui components: button, dialog, input, etc.)*

### Data Structure

**Sample Poems** (`src/data/samplePoems.ts`):
```typescript
{
  title: string;
  tags: string[];
  poems: Array<{ lines: string[] }>;  // Variable number of poems × 14 lines each
}
```

### Hooks

**use-auth** (`src/hooks/use-auth.ts`): Authentication & profiles
- `useAuth()` - Get current user session
- `useProfile()` - Get user profile data
- `useSignIn()` - Sign in mutation
- `useSignUp()` - Sign up mutation
- `useSignOut()` - Sign out mutation
- `useUpdateProfile()` - Update user profile (display name, handle, avatar)

**use-poem-sets** (`src/hooks/use-poem-sets.ts`): Poem set management
- `usePoemSets()` - Fetch all published poem sets
- `useUserPoemSets()` - Fetch user's created/collaborated sets
- `usePoemSet(id)` - Fetch single poem set by ID
- `useCreatePoemSet()` - Create new poem set
- `useUpdatePoemSet()` - Update poem set
- `useDeletePoemSet()` - Delete poem set
- `usePublishPoemSet()` - Publish/unpublish poem set

**use-collaborators** (`src/hooks/use-collaborators.ts`): Collaboration
- `useCollaborators(poemSetId)` - Fetch collaborators for a set
- `useInviteCollaborator()` - Invite new collaborator
- `useRemoveCollaborator()` - Remove collaborator

**use-friends** (`src/hooks/use-friends.ts`): Friend management
- `useFriends()` - Fetch user's friends
- `useFriendRequests()` - Fetch pending friend requests
- `useSendFriendRequest()` - Send friend request
- `useAcceptFriendRequest()` - Accept friend request
- `useRejectFriendRequest()` - Reject friend request
- `useRemoveFriend()` - Remove friend

**use-groups** (`src/hooks/use-groups.ts`): Group management
- `useUserGroups()` - Fetch groups user is member of
- `useAllGroups()` - Fetch all groups for discovery
- `useGroup(id)` - Fetch single group by ID
- `useCreateGroup()` - Create new group
- `useUpdateGroup()` - Update group
- `useDeleteGroup()` - Delete group

**use-group-members** (`src/hooks/use-group-members.ts`): Group membership
- `useGroupMembers(groupId)` - Fetch members of a group
- `useAddGroupMember()` - Add member to group
- `useRemoveGroupMember()` - Remove member from group
- `useUpdateMemberRole()` - Update member role

**use-group-invites** (`src/hooks/use-group-invites.ts`): Group invitations
- `useGroupInvites()` - Fetch pending group invites
- `useSendGroupInvite()` - Send group invite
- `useAcceptGroupInvite()` - Accept group invite
- `useRejectGroupInvite()` - Reject group invite

**use-conversations** (`src/hooks/use-conversations.ts`): Conversation management
- `useConversations()` - Fetch all user conversations
- `useConversation(id)` - Fetch single conversation by ID
- `useCreateConversation()` - Create new conversation (direct or group)
- `useAddParticipant()` - Add participant to conversation
- `useUpdateLastRead()` - Update last read timestamp
- `useGetOrCreateDirectConversation()` - Get or create direct conversation with user

**use-direct-messages** (`src/hooks/use-direct-messages.ts`): Direct messaging
- `useDirectMessages(conversationId)` - Fetch messages for conversation with real-time updates
- `useSendDirectMessage()` - Send message
- `useUpdateDirectMessage()` - Update message
- `useDeleteDirectMessage()` - Delete message
- `useUnreadMessageCount()` - Get unread message count

**use-chat** (`src/hooks/use-chat.ts`): Chat context integration
- Provides chat widget state management
- Integrates with ChatContext

**use-toast** (`src/hooks/use-toast.ts`): Toast notifications

**use-mobile** (`src/hooks/use-mobile.tsx`): Mobile device detection

### Styling Approach
- Uses shadcn/ui components from `src/components/ui/`
- Custom Tailwind classes defined in `src/index.css`
- Import alias `@/` points to `src/`
- Component customization through Tailwind's CSS variables
- Paper texture and book-shadow effects for vintage aesthetic
- Dark/light theme support via theme provider

### State Management
- Local React state for UI interactions
- TanStack Query for server state (Supabase data)
- Theme context for dark/light mode (via ThemeProvider)
- Authentication context via Supabase
- Chat context for chat widget state (via ChatProvider in `src/contexts/ChatContext.tsx`)
  - Manages chat widget open/close state
  - Provides global chat functionality

## Path Aliases

Configured in both `vite.config.ts` and `tsconfig.json`:
- `@/components` → `src/components`
- `@/hooks` → `src/hooks`
- `@/lib` → `src/lib`
- `@/data` → `src/data`
- `@/` → `src/`

## TypeScript Configuration

TypeScript is configured with relaxed strictness for rapid development:
- `noImplicitAny: false`
- `strictNullChecks: false`
- `noUnusedParameters: false`
- `noUnusedLocals: false`

## Supabase Integration

### Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Add your credentials to `.env.local`:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. The Supabase client is configured in `src/lib/supabase.ts`

### Database Schema

The application uses the following tables:

#### profiles
Stores user profile information:
```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text,
  handle text UNIQUE,  -- Unique username/handle for mentions and search
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### poem_sets
Stores user-created poem sets:
```sql
CREATE TABLE public.poem_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  tags text[],  -- Array of tags for categorization and filtering
  poems jsonb NOT NULL,  -- Array of poem objects with lines
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  is_public boolean DEFAULT false,
  status text DEFAULT 'draft',  -- 'draft' or 'published'
  allow_collaboration boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_poem_sets_tags ON poem_sets USING GIN(tags);
```

#### poem_set_collaborators
Manages collaboration on poem sets:
```sql
CREATE TABLE public.poem_set_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poem_set_id uuid NOT NULL REFERENCES public.poem_sets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'editor',
  invited_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(poem_set_id, user_id)
);
```

#### groups
Stores user-created groups:
```sql
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### group_members
Manages group membership:
```sql
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',  -- 'owner', 'admin', 'member'
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(group_id, user_id)
);
```

#### group_invites
Manages group invitations:
```sql
CREATE TABLE public.group_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles(id),
  invitee_id uuid NOT NULL REFERENCES public.profiles(id),
  status text DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### group_poem_sets
Associates poem sets with groups:
```sql
CREATE TABLE public.group_poem_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  poem_set_id uuid NOT NULL REFERENCES public.poem_sets(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(group_id, poem_set_id)
);
```

#### conversations
Stores conversations (direct and group):
```sql
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,  -- 'direct' or 'group'
  name text,  -- Optional name for group conversations
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### conversation_participants
Manages participants in conversations:
```sql
CREATE TABLE public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_read_at timestamp with time zone,  -- For tracking unread messages
  UNIQUE(conversation_id, user_id)
);
```

#### direct_messages
Stores messages in conversations:
```sql
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### friend_requests
Manages friend requests between users:
```sql
CREATE TABLE public.friend_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  receiver_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### friendships
Stores accepted friendships (bidirectional):
```sql
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid NOT NULL REFERENCES public.profiles(id),
  user2_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### messages
Stores chat messages within poem sets for collaboration:
```sql
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poem_set_id uuid NOT NULL REFERENCES public.poem_sets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Row Level Security (RLS)

All tables should have RLS enabled with appropriate policies:
- Public read access for published poem sets
- Users can only edit/delete their own content
- Collaborators can edit shared poem sets
- Users can only access their own saved poems

### Supabase Edge Functions

**generate-poems** (`supabase/functions/generate-poems/index.ts`):
- AI-powered poem generation using Anthropic (Claude)
- Takes tags array as input, generates 10 sonnets (14 lines each) incorporating those themes
- Returns structured poem data matching the app's format

## Adding New UI Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn@latest add [component-name]
```

Components are configured via `components.json` and will be added to `src/components/ui/`.

### Currently Used UI Components

The following shadcn/ui components are actively used:
- accordion, alert-dialog, avatar, badge, button, card, checkbox, dialog, dropdown-menu
- input, label, scroll-area, select, separator, sheet, skeleton
- sonner, tabs, textarea, toast, toaster, toggle, tooltip

## Key Implementation Details

### Combination Calculation
The app uses BigInt arithmetic to calculate the current poem combination number from line selections, as the number of possible combinations (10^14) exceeds JavaScript's safe integer range.

### Poem Set Loading
FlipReader can load poems from:
1. Sample poems (hardcoded in `src/data/samplePoems.ts`)
2. User-created poem sets (from Supabase)
3. Community poem sets (published sets from other users)

### Authentication Flow
1. User signs up with email/password or OAuth
2. Supabase creates auth user and profile record
3. OAuth users are prompted to set a unique handle via HandleSetupDialog
4. User can create poem sets, join groups, send messages, and collaborate
5. Session persists across page reloads

### Handle System
- Each user has a unique handle (username) for mentions and search
- OAuth users must set handle on first login
- Handles are used for user search and @mentions
- Handles can be updated via Profile page

### Collaboration Flow
1. Poem set owner invites collaborator by email or handle
2. System looks up user by email or handle
3. Creates collaborator record with "editor" role
4. Collaborator sees set in their "My Sets" page
5. Both owner and collaborators can edit the set
6. Real-time presence shows active collaborators during editing
7. Integrated chat allows collaboration discussion

### Groups System
1. Users can create groups with name, description, and avatar
2. Group owners can invite members by email or handle
3. Members can be assigned roles (owner, admin, member)
4. Poem sets can be assigned to groups
5. Group members can view and use assigned poem sets
6. Groups support discovery and browsing

### Messaging System
1. **Direct Messages**: One-on-one conversations between users
2. **Group Conversations**: Multi-user conversations (separate from Groups)
3. **Poem Set Chat**: Collaboration chat within poem set editing
4. Real-time message updates via Supabase subscriptions
5. Unread message tracking via last_read_at timestamps
6. ChatWidget provides global access to conversations

### Real-time Features
- Message subscriptions for instant chat updates
- Presence tracking for collaborative editing
- Typing indicators in poem set chat
- Live updates for friend requests and group invites
