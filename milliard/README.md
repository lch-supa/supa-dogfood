# Sonnet-Machine

> *A collaborative platform for creating sets of a hundred thousand billion poems, inspired by Raymond Queneau's "Cent Mille Milliards de Poèmes"*

**Sonnet-Machine** is a web application that for the production and distribution of combinatorial sonnets. Combine lines from 10 different sonnets with identical rhyme schemes to create billions of unique poems, collaborate with others in real-time, and explore poem sets published by others.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account
- Claude Console access for edge function calls to the API (WARNING: about 3 cents a pop)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/sonnet-machine.git
   cd sonnet-machine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

---

## 🛠 Tech Stack

Built with modern web technologies for a fast, responsive experience:

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (Database, Auth, Realtime, Edge Functions, Storage)
- **AI Integration**: Claude via Supabase Edge Functions

---

## 📖 How It Works

### The Combinatorial Engine

Each poem set contains multiple sonnets (14 lines each). The **FlipReader** component allows readers to independently select any line from any poem in the "stack"

### Collaboration at its Core

- **Live Presence**: See who's editing a poem set in real-time
- **Chat Integration**: Discuss changes without leaving the editor
- **Version Control**: Track collaborators and ownership
- **Groups**: Organize poem sets into themed collections

### Social Features

- **Friend System**: Connect with other poets
- **Direct Messaging**: One-on-one conversations
- **Group Chats**: Multi-user discussions
- **Discovery**: Browse and explore community creations

