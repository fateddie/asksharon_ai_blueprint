# Personal Assistant - System Architecture

## 📐 Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagrams](#architecture-diagrams)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [API Design](#api-design)
- [Database Architecture](#database-architecture)
- [Authentication & Security](#authentication--security)
- [External Integrations](#external-integrations)
- [Performance Considerations](#performance-considerations)

---

## System Overview

Personal Assistant is built as a modern full-stack web application using the **JAMstack architecture** with Next.js 14, leveraging server-side rendering (SSR) and API routes.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         React Components (Client-Side)                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │  Voice   │  │   Task   │  │  Habit   │   ...     │  │
│  │  │ Control  │  │ Manager  │  │ Tracker  │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 (Vercel)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              App Router (Server-Side)                  │  │
│  │  /app/page.tsx  │  /app/dashboard/  │  /app/tasks/   │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  API Routes                            │  │
│  │  /api/tasks  │  /api/habits  │  /api/calendar         │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Services (/src/lib)                       │  │
│  │  gmail.ts  │  calendar.ts  │  dashboard.ts  │  ...    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────┬─────────────────────┬─────────────────────────┘
               │                     │
               ▼                     ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│   Supabase (PostgreSQL)  │   │   External APIs             │
│  ┌────────────────────┐  │   │  ┌───────────────────────┐  │
│  │  user_profiles     │  │   │  │  Google Gmail API     │  │
│  │  tasks             │  │   │  │  Google Calendar API  │  │
│  │  habits            │  │   │  │  OpenAI API           │  │
│  │  calendar_events   │  │   │  └───────────────────────┘  │
│  │  ...               │  │   └─────────────────────────────┘
│  └────────────────────┘  │
│  Auth, Real-time, Storage│
└──────────────────────────┘
```

### Technology Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Presentation** | React 18 + Next.js 14 App Router | UI components, routing, SSR |
| **State Management** | React Hooks (useState, useEffect, useContext) | Client-side state |
| **Styling** | Tailwind CSS + DaisyUI | Responsive, component-based styling |
| **API Layer** | Next.js API Routes | Backend endpoints |
| **Services** | TypeScript modules in /src/lib | Business logic, external API wrappers |
| **Database** | Supabase (PostgreSQL) | Data persistence, auth, real-time |
| **Authentication** | NextAuth.js + Supabase Auth | User management, OAuth |
| **Hosting** | Vercel | Serverless deployment, CDN |

---

## Architecture Diagrams

### Request Flow Diagram

```
User Action (e.g., "Add task")
    │
    ├─ Voice Command Path
    │   ├─ Web Speech API (Browser)
    │   ├─ VoiceControl Component processes
    │   ├─ POST /api/voice
    │   │   ├─ OpenAI API (intent recognition)
    │   │   └─ POST /api/tasks (internal)
    │   └─ Response to user (TTS + UI update)
    │
    └─ UI Path
        ├─ User clicks "Add Task" button
        ├─ TaskManager Component handles
        ├─ POST /api/tasks
        │   ├─ Validate user authentication
        │   ├─ Insert into Supabase tasks table
        │   └─ Return created task
        └─ UI updates with new task
```

### Component Hierarchy

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (metadata, providers)
│   ├── page.tsx                    # Homepage/Dashboard
│   ├── dashboard/
│   │   └── page.tsx                # Detailed dashboard view
│   ├── tasks/
│   │   └── page.tsx                # Tasks page
│   ├── calendar/
│   │   └── page.tsx                # Calendar view
│   └── api/
│       ├── tasks/
│       │   ├── route.ts            # GET, POST /api/tasks
│       │   └── [id]/route.ts       # GET, PATCH, DELETE /api/tasks/:id
│       ├── habits/
│       ├── calendar/
│       ├── email/
│       └── voice/
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # Main navigation header
│   │   └── Sidebar.tsx             # Sidebar (future)
│   ├── features/
│   │   ├── TaskManager.tsx         # Task CRUD interface
│   │   ├── HabitTracker.tsx        # Habit tracking interface
│   │   ├── VoiceControl.tsx        # Voice recognition UI
│   │   ├── CalendarManager.tsx     # Calendar events
│   │   ├── EmailManager.tsx        # Email management
│   │   ├── GoogleAccountPrompt.tsx # OAuth prompts
│   │   └── SyncStatus.tsx          # Sync status indicators
│   └── ui/
│       ├── button.tsx              # Reusable button component
│       ├── card.tsx                # Card containers
│       ├── input.tsx               # Form inputs
│       ├── badge.tsx               # Status badges
│       └── textarea.tsx            # Text areas
│
├── lib/
│   ├── supabase.ts                 # Supabase client setup
│   ├── gmail.ts                    # Gmail API wrapper
│   ├── calendar.ts                 # Calendar API wrapper
│   ├── dashboard.ts                # Dashboard data aggregation
│   ├── utils.ts                    # Utility functions
│   ├── logger.ts                   # Logging service
│   └── error-handler.ts            # Error handling utilities
│
├── types/
│   ├── index.ts                    # Core type definitions
│   └── next-auth.d.ts              # NextAuth type augmentation
│
└── hooks/
    ├── useUser.ts                  # User authentication hook
    └── useGoogleAuth.ts            # Google OAuth hook
```

---

## Data Flow

### Task Creation Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Input                                                │
│    └─ User fills task form in TaskManager component         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Client-Side Validation                                    │
│    ├─ Check title not empty                                 │
│    ├─ Validate priority (low/medium/high)                   │
│    └─ Validate due_date format                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API Request                                               │
│    POST /api/tasks                                           │
│    Headers: { Authorization: Bearer <token> }               │
│    Body: { title, description, priority, due_date }         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Server-Side Processing (API Route)                       │
│    ├─ Extract user from session (NextAuth)                  │
│    ├─ Validate user is authenticated                        │
│    ├─ Sanitize input data                                   │
│    ├─ Add user_id to task data                              │
│    └─ Call Supabase client                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Database Operation (Supabase)                             │
│    ├─ Check RLS policy (user can only create own tasks)     │
│    ├─ INSERT INTO tasks (...) VALUES (...)                  │
│    ├─ Auto-generate UUID for task.id                        │
│    ├─ Set created_at, updated_at timestamps                 │
│    └─ Return inserted row                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. API Response                                              │
│    Status: 201 Created                                       │
│    Body: { success: true, data: { task } }                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Client-Side Update                                        │
│    ├─ Add new task to local state                           │
│    ├─ Re-render TaskManager component                       │
│    ├─ Show success toast notification                       │
│    └─ Clear form inputs                                     │
└─────────────────────────────────────────────────────────────┘
```

### Real-Time Sync Flow (Future Enhancement)

```
User Device A creates task
    │
    ▼
Supabase INSERT triggers real-time event
    │
    ├─────────────► User Device B subscribes
    │               ├─ Receives real-time update
    │               └─ UI updates automatically
    │
    └─────────────► User Device C (mobile)
                    ├─ Receives push notification
                    └─ Opens app, sees new task
```

---

## API Design

### API Architecture Principles

1. **RESTful Design** - Standard HTTP methods (GET, POST, PATCH, DELETE)
2. **Consistent Response Format** - All responses follow same structure
3. **Authentication First** - All routes check auth before processing
4. **Error Handling** - Graceful errors with meaningful messages
5. **Versioning Ready** - Structure supports /api/v1/ when needed

### API Response Format

#### Success Response
```typescript
{
  success: true,
  data: T,  // The actual response data
  message?: string  // Optional success message
}
```

#### Error Response
```typescript
{
  success: false,
  error: {
    code: string,  // Machine-readable error code
    message: string,  // Human-readable error message
    details?: any  // Additional error context
  }
}
```

### API Endpoints

#### Tasks API
```
GET    /api/tasks              # List all tasks for current user
POST   /api/tasks              # Create new task
GET    /api/tasks/[id]         # Get specific task
PATCH  /api/tasks/[id]         # Update task
DELETE /api/tasks/[id]         # Delete task
```

#### Habits API
```
GET    /api/habits             # List all habits
POST   /api/habits             # Create new habit
GET    /api/habits/[id]        # Get specific habit
PATCH  /api/habits/[id]        # Update habit
DELETE /api/habits/[id]        # Delete habit
POST   /api/habits/[id]/entry  # Log habit completion
```

#### Calendar API
```
GET    /api/calendar/events    # List calendar events
POST   /api/calendar/sync      # Trigger calendar sync
GET    /api/calendar/stats     # Get calendar statistics
```

#### Email API
```
GET    /api/email/messages     # List email messages
GET    /api/email/stats        # Get email statistics
POST   /api/email/sync         # Trigger email sync
```

#### Voice API
```
POST   /api/voice              # Process voice command
```

#### Dashboard API
```
GET    /api/dashboard          # Get aggregated dashboard data
```

#### Auth API
```
GET    /api/auth/[...nextauth] # NextAuth.js endpoints
GET    /api/google-auth        # Google OAuth initiation
GET    /api/google-auth/status # Check Google auth status
```

---

## Database Architecture

### Database Schema Overview

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for full details.

**Key Design Decisions:**

1. **User ID as UUID** - Using Supabase auth.users UUID for all user references
2. **Soft Deletes** - Future: Add `deleted_at` for important tables
3. **Timestamps** - All tables have `created_at` and `updated_at`
4. **JSONB for Flexibility** - Use JSONB for extensible metadata fields
5. **Foreign Key Cascades** - Proper CASCADE and SET NULL behaviors
6. **Indexes** - Strategic indexes on foreign keys and query fields

### Row-Level Security (RLS)

All tables use RLS policies to ensure users can only access their own data:

```sql
-- Example RLS policy
CREATE POLICY "Users can manage own tasks"
ON public.tasks
USING (auth.uid() = user_id);
```

This prevents:
- User A accessing User B's tasks
- SQL injection bypassing authorization
- Accidental data leaks

---

## Authentication & Security

### Authentication Flow

```
1. User clicks "Sign in with Google"
    │
    ▼
2. NextAuth.js redirects to Google OAuth
    │
    ▼
3. User grants permissions (Gmail, Calendar)
    │
    ▼
4. Google redirects back with authorization code
    │
    ▼
5. NextAuth exchanges code for access token
    │
    ▼
6. NextAuth creates session and stores tokens
    │
    ▼
7. User redirected to dashboard with active session
    │
    ▼
8. Subsequent requests include session cookie
    │
    ▼
9. API routes verify session via getServerSession()
```

### Security Measures

| Area | Implementation |
|------|---------------|
| **Authentication** | NextAuth.js with Google OAuth 2.0 |
| **Authorization** | Row-level security in Supabase |
| **API Keys** | Stored in environment variables only |
| **HTTPS** | Enforced by Vercel (automatic) |
| **Input Validation** | All user inputs sanitized |
| **SQL Injection** | Prevented by Supabase parameterized queries |
| **XSS** | React automatic escaping + DOMPurify |
| **CSRF** | NextAuth.js built-in protection |
| **Rate Limiting** | Vercel edge functions (future) |

### Token Management

```typescript
// Tokens stored in user_profiles table
{
  google_access_token: string,  // Short-lived (1 hour)
  google_refresh_token: string, // Long-lived (persistent)
  google_token_expires_at: timestamp
}

// Token refresh flow
if (tokenExpired) {
  const newTokens = await refreshGoogleToken(refreshToken)
  await updateUserTokens(userId, newTokens)
}
```

---

## External Integrations

### Google APIs Integration

**Architecture:**
- Service wrappers in `/src/lib/gmail.ts` and `/src/lib/calendar.ts`
- OAuth tokens managed per user in database
- Automatic token refresh on expiration
- Rate limiting and retry logic

**Gmail Integration:**
```
User ──► /api/email/sync ──► gmail.ts ──► Google Gmail API
                                │
                                ▼
                          Supabase (cache emails)
```

**Calendar Integration:**
```
User ──► /api/calendar/events ──► calendar.ts ──► Google Calendar API
                                      │
                                      ▼
                                Supabase (cache events)
```

### OpenAI Integration (Planned)

**Voice Command Processing:**
```
Voice input ──► Web Speech API ──► /api/voice
                                       │
                                       ▼
                                  OpenAI GPT-4
                                  (intent recognition)
                                       │
                                       ▼
                                  Extract intent + entities
                                       │
                                       ▼
                                  Execute action
                                  (create task, etc.)
```

---

## Performance Considerations

### Optimization Strategies

1. **Server-Side Rendering (SSR)**
   - Faster initial page load
   - Better SEO
   - Reduced client-side JavaScript

2. **Code Splitting**
   - Next.js automatic code splitting by route
   - Dynamic imports for heavy components

3. **Caching Strategy**
   - Browser cache for static assets (Vercel CDN)
   - API response caching (planned)
   - Supabase query caching (planned)

4. **Database Query Optimization**
   - Indexes on frequently queried fields
   - Limit result sets
   - Aggregate data in database, not client

5. **Bundle Size Management**
   - Tree shaking unused code
   - Minimize dependencies
   - Monitor bundle size in CI

### Performance Metrics

| Metric | Current | Target |
|--------|---------|--------|
| First Contentful Paint | 1.2s | <1.0s |
| Largest Contentful Paint | 2.1s | <1.8s |
| Time to Interactive | 3.2s | <2.5s |
| Cumulative Layout Shift | 0.05 | <0.1 |
| Total JS Bundle | 215KB | <200KB |

---

## Scalability Considerations

### Current Limitations (Single-User)
- Session-based authentication
- No multi-tenancy
- Single Supabase project

### Future Scalability (Multi-User SaaS)

1. **Database Scaling**
   - Connection pooling
   - Read replicas for analytics
   - Partitioning large tables (events, emails)

2. **API Scaling**
   - Vercel serverless handles traffic automatically
   - CDN for static assets
   - Edge functions for global performance

3. **Multi-Tenancy**
   - Add `team_id` to all tables
   - RLS policies updated for team access
   - Workspace isolation

4. **Monitoring & Observability**
   - Error tracking (Sentry)
   - Performance monitoring (Vercel Analytics)
   - Database query analysis

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    GitHub Repository                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  main branch  │  feature/* branches                │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────┘
                            │ Git push
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    Vercel CI/CD                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  1. Install dependencies                           │  │
│  │  2. Run tests                                      │  │
│  │  3. Build Next.js app                              │  │
│  │  4. Deploy to preview/production                   │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Preview Environment   │   │ Production Environment  │
│  (feature branches)     │   │    (main branch)        │
│  unique-url.vercel.app  │   │  personalassist.com     │
└─────────────────────────┘   └─────────────────────────┘
```

---

## Future Architecture Enhancements

### Phase 2 Additions
- React Query for data fetching and caching
- Websockets for real-time updates
- Service workers for offline support
- PWA capabilities for mobile

### Phase 3 (SaaS) Additions
- Multi-region deployment
- Redis for session management
- Message queue for async tasks (emails, syncs)
- Microservices for heavy workloads

---

**Last Updated:** 2025-10-03
**Next Review:** Every 2 weeks during active development
