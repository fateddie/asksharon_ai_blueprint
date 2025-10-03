# Personal Assistant - Voice-First Productivity App

## 🎯 Overview

A comprehensive voice-first personal assistant web application built with Next.js 14, designed for personal productivity and scalable to become a commercial SaaS product ("Ask Sharon"). The app combines intelligent voice commands with a beautiful dashboard interface to help users manage tasks, track habits, organize notes, and stay focused.

## ✨ Features

### Core Modules (Phase 1 - Personal Use)
- **🎤 Voice Control**: Real-time speech recognition with Web Speech API and text-to-speech responses
- **✅ Task Manager**: CRUD operations with priority levels, due dates, and tagging system
- **💪 Habit Tracker**: Daily habit tracking with streak counting and progress visualization
- **📝 Notes & Lists**: Quick capture and categorization (general, todo, ideas, people, meetings)
- **📊 Dashboard**: Today's Focus view with productivity metrics and summaries

### Planned Features (Phase 2)
- **📧 Email Manager**: Gmail/Outlook integration with AI categorization and auto-reply templates
- **📅 Calendar Integration**: Google/Outlook calendar sync with smart scheduling
- **🤖 AI Coaching**: Morning briefings, evening reflections, and productivity nudges
- **📈 Analytics**: Weekly summaries, productivity trends, and balance reports

### Future Commercial Features (Phase 3 - "Ask Sharon")
- **👥 Multi-user Support**: Team collaboration and shared workflows
- **💼 Executive Features**: Advanced insights, delegation tracking, and team management
- **💳 SaaS Infrastructure**: Payments, subscriptions, and enterprise features

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router and Server-Side Rendering
- **TypeScript** for type safety and better developer experience
- **TailwindCSS** for utility-first styling
- **shadcn/ui** components for consistent, accessible UI
- **Lucide React** for beautiful, consistent icons

### Backend & Database
- **Supabase** for PostgreSQL database, authentication, and real-time features
- **Supabase Auth** for secure user management (currently single-user)
- **Row Level Security (RLS)** for data protection

### Voice & AI
- **Web Speech API** for speech-to-text (Chrome/Safari)
- **Speech Synthesis API** for text-to-speech responses
- **OpenAI GPT** (planned) for intent recognition and smart responses
- **Whisper API** (planned) for enhanced voice recognition

### Development & Deployment
- **ESLint** and **TypeScript** for code quality
- **Vercel** for deployment and hosting
- **Git** for version control with comprehensive commit history

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern browser with Web Speech API support (Chrome recommended)
- Supabase account (for database setup)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd PersonalAssistant
npm install
```

2. **Environment Setup:**
Create `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Database Setup:**
Run the SQL schema in your Supabase dashboard:
```bash
# Copy contents of supabase-schema.sql into Supabase SQL Editor
```

4. **Start Development Server:**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your personal assistant!

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 📁 Project Structure

```
PersonalAssistant/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── globals.css         # Global styles with CSS variables
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Main dashboard page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   │   ├── button.tsx      # Reusable button component
│   │   │   ├── card.tsx        # Card layout components
│   │   │   ├── input.tsx       # Form input component
│   │   │   └── badge.tsx       # Status and priority badges
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx      # Main navigation header
│   │   │   └── Sidebar.tsx     # Collapsible sidebar (future)
│   │   └── features/           # Feature-specific components
│   │       ├── VoiceControl.tsx    # Voice recognition interface
│   │       ├── TaskManager.tsx     # Task CRUD interface
│   │       └── HabitTracker.tsx    # Habit tracking interface
│   ├── lib/
│   │   ├── utils.ts            # Utility functions (cn, dates, greetings)
│   │   └── supabase.ts         # Supabase client configuration
│   └── types/
│       ├── index.ts            # Core type definitions
│       └── speech.d.ts         # Speech API type declarations
├── supabase-schema.sql         # Complete database schema
├── claude.md                   # Project guidelines and instructions
└── package.json               # Dependencies and scripts
```

## 🎨 Design Philosophy

### Component Architecture
- **Flat component structure**: All components in `/components` without deep nesting
- **Feature-based organization**: Group related components by functionality
- **Reusable UI primitives**: shadcn/ui components for consistency
- **TypeScript-first**: Full type safety across the application

### Voice-First Design
- **Primary interaction**: Voice commands for all major actions
- **Visual feedback**: Real-time transcription and command confirmation
- **Fallback UI**: Complete dashboard functionality without voice
- **Accessibility**: Screen reader support and keyboard navigation

### Database Design
- **Scalable schema**: Designed for future multi-user expansion
- **Relationship modeling**: Tasks can link to Projects and Goals
- **Audit trails**: Created/updated timestamps on all entities
- **Flexible metadata**: JSON fields for extensible properties

## 🗣️ Voice Commands

### Task Management
- "Add task: Review quarterly reports"
- "Mark task workout as complete"
- "Show me my high priority tasks"

### Habit Tracking
- "Mark habit morning workout as done"
- "Show my habit streaks"
- "Add new habit: drink water"

### General Commands
- "What's on my schedule today?"
- "Create note about meeting ideas"
- "Give me my productivity summary"

## 🔄 Development Workflow

### Quality Standards
1. **TypeScript compilation** must pass without errors
2. **ESLint** must pass with no warnings
3. **Component documentation** required for all new components
4. **Responsive design** tested on mobile and desktop
5. **Voice functionality** tested in Chrome browser

### Git Workflow
- Feature branches for new functionality
- Conventional commit messages
- Pull requests for code review (when working with others)

## 🚦 Current Status

### ✅ Completed (Phase 1 MVP)
- [x] Next.js 14 project setup with TypeScript
- [x] TailwindCSS and shadcn/ui component system
- [x] Supabase integration and database schema
- [x] Voice recognition and speech synthesis
- [x] Task Manager with CRUD operations
- [x] Habit Tracker with streak counting
- [x] Dashboard with Today's Focus view
- [x] Responsive design and accessibility

### 🔄 In Progress
- [ ] Supabase data integration (currently using mock data)
- [ ] Voice command processing with OpenAI
- [ ] Enhanced error handling and loading states

### 📋 Planned (Phase 2)
- [ ] Email integration (Gmail/Outlook APIs)
- [ ] Calendar integration (Google/Outlook)
- [ ] AI coaching and insights
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native or PWA)

### 🎯 Future (Phase 3 - Commercial)
- [ ] Multi-tenant architecture
- [ ] Team collaboration features
- [ ] Payment integration (Stripe)
- [ ] Enterprise security features
- [ ] Advanced AI and automation

## 🤝 Contributing

This is currently a personal project, but the codebase is designed with future collaboration in mind. If you're interested in contributing or building similar functionality:

1. Fork the repository
2. Create a feature branch
3. Follow the existing code conventions
4. Add comprehensive documentation
5. Submit a pull request

## 📄 License

This project is currently private and for personal use. Future commercial use under "Ask Sharon" branding is planned.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code) by Anthropic
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Database and auth by [Supabase](https://supabase.com/)
- Hosted on [Vercel](https://vercel.com/)

---

**Personal Assistant** - Your voice-first productivity companion 🎤✨