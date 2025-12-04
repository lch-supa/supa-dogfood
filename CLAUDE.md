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
2. **Authentication**: User sign-up, sign-in, and profile management
3. **Poem Set Management**: Create, edit, publish, and delete custom poem sets
4. **AI Generation**: Generate poems using Supabase Edge Functions
5. **Collaboration**: Invite collaborators to co-edit poem sets
6. **Community**: Explore and use published poem sets from other users
7. **Save & Load**: Save favorite poem combinations and reload them later
8. **Theme Support**: Dark/light mode toggle

### Routing Structure

Routes defined in `App.tsx`:
- `/` → Index page (landing page with FlipReader)
- `/explore` → Explore page (browse community poem sets)
- `/my-sets` → MySets page (user's created/collaborated poem sets)
- `/my-sets/:id/edit` → EditPoemSet page (edit poem set with collaboration)
- `/poem-set/:id` → PoemSetView page (view individual poem set details)
- `*` → NotFound page (404)

**Important**: All routes must be added ABOVE the catch-all `*` route.

### Pages

**Index** (`src/pages/Index.tsx`): Main landing page
- Contains Hero, AboutSection, and Footer
- Displays FlipReader for poem interaction
- Integrates GeneratePoemsDialog and SavedPoemsDialog

**Explore** (`src/pages/Explore.tsx`): Community exploration
- Browse published poem sets from all users
- Filter and search functionality
- Load poem sets into FlipReader

**MySets** (`src/pages/MySets.tsx`): User's poem sets
- Display sets created by user or where user is a collaborator
- Create new sets (manual or AI-generated)
- Edit, publish/unpublish, delete sets
- View collaborator information

**EditPoemSet** (`src/pages/EditPoemSet.tsx`): Edit poem sets
- Edit poem set title, description, and poems
- Invite collaborators
- See collaborator list with roles
- Draft/published status toggle

**PoemSetView** (`src/pages/PoemSetView.tsx`): View poem set details
- Display poem set metadata
- Show all poems in the set
- View creator and collaborator information

**NotFound** (`src/pages/NotFound.tsx`): 404 error page

### Core Components

**FlipReader** (`src/components/FlipReader.tsx`): Main interactive component
- Manages state for all 14 line selections
- Calculates current combination number using BigInt arithmetic
- Handles line flipping (up/down), randomization, and reset
- Integrates with poem sets from Supabase
- Save/load functionality

**PoemLine** (`src/components/PoemLine.tsx`): Individual line component
- Displays a single line with navigation controls
- Handles hover states and flip animations
- Shows which source poem the line comes from

**Header** (`src/components/Header.tsx`): Navigation header
- Navigation links to main pages
- Authentication state display
- Sign in/out functionality
- Theme toggle

**Hero** (`src/components/Hero.tsx`): Hero section for landing page

**Footer** (`src/components/Footer.tsx`): Footer component

**AboutSection** (`src/components/AboutSection.tsx`): About section explaining the app

**AuthDialog** (`src/components/AuthDialog.tsx`): Authentication modal
- Sign in and sign up forms
- Email/password authentication via Supabase
- Profile creation on sign-up

**GeneratePoemsDialog** (`src/components/GeneratePoemsDialog.tsx`): AI generation
- Input theme for AI-generated poems
- Calls Supabase Edge Function to generate poems
- Creates new poem set with generated content

**SavedPoemsDialog** (`src/components/SavedPoemsDialog.tsx`): Load saved poems
- Display user's saved poem combinations
- Load selections into FlipReader
- Delete saved poems

**PoemSetSelector** (`src/components/PoemSetSelector.tsx`): Select poem sets
- Dropdown to choose active poem set
- Switch between sample and user-created sets

**InviteCollaboratorDialog** (`src/components/InviteCollaboratorDialog.tsx`): Collaboration
- Invite users to collaborate on poem sets
- Input email address of collaborator
- Create collaborator relationship

**theme-provider** (`src/components/theme-provider.tsx`): Theme context provider

**theme-toggle** (`src/components/theme-toggle.tsx`): Dark/light mode toggle button

### Data Structure

**Sample Poems** (`src/data/samplePoems.ts`):
```typescript
{
  title: string;
  theme: string;
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

**use-saved-poems** (`src/hooks/use-saved-poems.ts`): Saved poem combinations
- `useSavedPoems()` - Fetch user's saved poems with lines
- `useSavePoem()` - Save new poem combination
- `useDeletePoem()` - Delete saved poem

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
- Theme context for dark/light mode
- Authentication context via Supabase

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
create table profiles (
  id uuid references auth.users(id) primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### poem_sets
Stores user-created poem sets:
```sql
create table poem_sets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  theme text,
  poems jsonb not null,  -- Array of poem objects with lines
  created_by uuid references auth.users(id) not null,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### poem_set_collaborators
Manages collaboration on poem sets:
```sql
create table poem_set_collaborators (
  id uuid default gen_random_uuid() primary key,
  poem_set_id uuid references poem_sets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'editor',
  invited_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(poem_set_id, user_id)
);
```

#### saved_poems
Stores user's saved poem combinations:
```sql
create table saved_poems (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  poem_set_id uuid references poem_sets(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### saved_poem_lines
Stores individual line selections for saved poems:
```sql
create table saved_poem_lines (
  id uuid default gen_random_uuid() primary key,
  saved_poem_id uuid references saved_poems(id) on delete cascade not null,
  line_number integer not null,
  poem_index integer not null,
  line_text text not null
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
- AI-powered poem generation using OpenAI or Anthropic
- Takes theme as input, generates 10 sonnets (14 lines each)
- Returns structured poem data matching the app's format

## Adding New UI Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn@latest add [component-name]
```

Components are configured via `components.json` and will be added to `src/components/ui/`.

### Currently Used UI Components

The following shadcn/ui components are actively used:
- accordion, alert-dialog, avatar, badge, button, card, dialog, dropdown-menu
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
1. User signs up with email/password
2. Supabase creates auth user and profile record
3. User can create poem sets, save poems, and collaborate
4. Session persists across page reloads

### Collaboration Flow
1. Poem set owner invites collaborator by email
2. System looks up user by email
3. Creates collaborator record with "editor" role
4. Collaborator sees set in their "My Sets" page
5. Both owner and collaborators can edit the set
