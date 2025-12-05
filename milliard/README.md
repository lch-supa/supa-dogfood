# Sonnet Machine

> *A collaborative platform for creating combinatorial poetry, inspired by Raymond Queneau's "Cent Mille Milliards de Poèmes"*

**Sonnet Machine** is a web application that reimagines poetry creation through the lens of combinatorial literature. Mix and match lines from different sonnets to create billions of unique poems, collaborate with others in real-time, and explore a vibrant community of poetry enthusiasts.

---

## ✨ What Makes It Special

**Sonnet Machine** transforms the traditional reading experience into an interactive, generative art form. Each sonnet's 14 lines can be independently selected from any poem in a set—creating up to **10¹⁴ possible combinations** from just 10 base poems.

### Core Features

🎨 **Interactive Poem Generator**
Flip through line combinations with an intuitive interface that makes exploring billions of poems effortless

🤝 **Real-Time Collaboration**
Invite friends to co-create poem sets with live presence tracking, integrated chat, and collaborative editing

🤖 **AI-Powered Generation**
Generate custom poem sets using Claude AI—just provide tags and themes, and watch poetry come to life

🌍 **Community & Discovery**
Publish your creations, explore sets from other poets, and join groups to share and curate collections

💬 **Built-In Messaging**
Connect with other users through direct messages, group conversations, and poem set chat rooms

🎭 **Groups & Collections**
Create communities around shared interests, assign poem sets to groups, and build collaborative libraries

🌓 **Beautiful Design**
Vintage-inspired aesthetic with paper textures, smooth animations, and full dark/light mode support

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier works great)

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
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **AI Integration**: Anthropic Claude via Supabase Edge Functions

---

## 📖 How It Works

### The Combinatorial Engine

Each poem set contains multiple sonnets (14 lines each). The **FlipReader** component allows readers to independently select any line from any poem, creating astronomical numbers of unique combinations:

- 10 sonnets = 10¹⁴ possible poems (100 trillion)
- Each combination is tracked using BigInt arithmetic
- Smooth flip animations make exploration delightful

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

---

## 🎯 Key Capabilities

### For Creators

- Create poem sets manually or generate them with AI
- Edit poems collaboratively with real-time sync
- Export and share your creations
- Organize sets with tags and descriptions
- Preview combinations before publishing

### For Readers

- Explore billions of poem combinations
- Save favorite combinations for later
- Discover new poets and styles
- Join groups around shared interests
- Interact with creators via chat

### For Communities

- Create public or private groups
- Assign curated poem sets to groups
- Invite members and manage roles
- Foster collaborative curation

---

## 📁 Project Structure

```
src/
├── components/
│   ├── poems/          # FlipReader and poem UI
│   ├── chat/           # Messaging components
│   ├── dialogs/        # Modal interfaces
│   ├── social/         # Friends, groups, collaboration
│   ├── layout/         # Header, footer, navigation
│   └── ui/             # shadcn/ui components
├── hooks/              # React Query hooks for data
├── pages/              # Route components
├── contexts/           # React contexts (Chat, Theme)
├── lib/                # Utilities and Supabase client
└── data/               # Sample poems and constants
```

---

## 🔐 Authentication

Supports multiple authentication methods:

- **Email/Password**: Traditional account creation
- **OAuth**: Google, GitHub, and other providers
- **Profile System**: Unique handles, avatars, and display names

---

## 🌐 Database Architecture

Built on Supabase PostgreSQL with the following key tables:

- `profiles` - User accounts and settings
- `poem_sets` - Poem collections with metadata
- `poem_set_collaborators` - Multi-user editing permissions
- `groups` - Community organizations
- `conversations` - Direct and group messaging
- `messages` - Poem set collaboration chat
- `friend_requests` / `friendships` - Social connections

All tables use Row Level Security (RLS) for privacy and access control.

---

## 🎨 Design Philosophy

**Vintage Meets Modern**

- Paper textures and book-inspired shadows
- Smooth, purposeful animations
- Accessible typography and color contrast
- Responsive design for all devices
- Dark and light modes for different reading environments

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 Design enhancements

Please open an issue or submit a pull request.

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

Inspired by **Raymond Queneau's** groundbreaking 1961 work *"Cent Mille Milliards de Poèmes"* (A Hundred Thousand Billion Poems), which pioneered the concept of combinatorial literature.

---

## 📬 Contact

Questions? Feedback? We'd love to hear from you!

- GitHub Issues: [Report a bug or request a feature](https://github.com/your-org/sonnet-machine/issues)
- Documentation: [Full technical docs](./CLAUDE.md)

---

<div align="center">

**Built with ❤️ for the love of poetry and code**

[Live Demo](#) • [Documentation](./CLAUDE.md) • [Report Bug](https://github.com/your-org/sonnet-machine/issues)

</div>
