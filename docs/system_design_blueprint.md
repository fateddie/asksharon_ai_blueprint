# AskSharon.ai – System Design Blueprint

**Version:** 1.0
**Internal Package:** `asksharon_ai_blueprint`
**Public Brand:** AskSharon.ai
**Last Updated:** 2025-11-05

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Core Components](#core-components)
4. [Module System](#module-system)
5. [Event Bus Pattern](#event-bus-pattern)
6. [Data Architecture](#data-architecture)
7. [API Endpoints](#api-endpoints)
8. [Planner Scoring System](#planner-scoring-system)
9. [Behavioural Intelligence Layer (BIL)](#behavioural-intelligence-layer-bil)
10. [Phase-Gated Development](#phase-gated-development)
11. [Security Model](#security-model)
12. [Mobile Scalability](#mobile-scalability)
13. [Deployment](#deployment)

---

## System Overview

AskSharon.ai is a **modular, voice-enabled personal assistant** designed for phase-gated, plug-in style development. It manages email, tasks, routines, and behaviour with persistent memory and a behavioural-psychology layer.

### Core Characteristics

- ✅ **Automation** - One-command setup, automated testing, self-healing
- 🔔 **Notifications** - Proactive system events with clear communication
- 🛡️ **Error Handling** - Robust, structured, user-friendly error management
- 📝 **Decision Documentation** - Every technical choice logged with rationale

### Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Backend** | FastAPI | 0.115.2 | REST API framework |
| **Server** | uvicorn | 0.31.0 | ASGI server |
| **Frontend** | Streamlit | 1.37.0 | Chat UI (voice-ready) |
| **Database** | SQLite | 3.x | Structured data storage |
| **Semantic** | FAISS | 1.8.0 | Vector similarity search (128-dim) |
| **ORM** | SQLAlchemy | 2.0.32 | Database abstraction |
| **AI** | OpenAI API | 1.43.0 | Natural language processing |
| **Scheduler** | schedule | 1.2.2 | Background task scheduling |
| **Testing** | pytest | 8.3.2 | Unit and integration tests |
| **Formatting** | black + mypy | Latest | Code quality |

---

## Architecture Principles

### 1. Modular Design
- Each module is a self-contained plug-in
- Modules can be enabled/disabled via YAML config
- No direct cross-module imports (event bus only)

### 2. Event-Driven Communication
- Central event bus for all inter-module communication
- Publish/subscribe pattern
- Loose coupling between components

### 3. Phase-Gated Development
- Work only in active phase
- Clear acceptance tests per phase
- Progress tracked in `progress.yaml`

### 4. Local-First
- Runs entirely on local machine (MVP)
- Optional cloud sync in future phases
- User controls all data

### 5. Voice-Ready
- Text interface in Phase 1
- Voice capabilities scaffolded for future
- Streamlit provides easy voice integration path

---

## Core Components

### 1. Orchestrator (`assistant/core/orchestrator.py`)

**Purpose:** Central brain that boots FastAPI and loads modules

**Key Functions:**
```python
def publish(event: str, data: dict)
    """Broadcast event to all subscribers"""

def subscribe(event: str, callback)
    """Register event listener"""

def load_modules()
    """Load enabled modules from YAML registry"""
```

**Responsibilities:**
- FastAPI app initialization
- Module registry management
- Event bus coordination
- Error handling for event delivery

**Event Flow:**
```
Module A → publish("task_created", {...}) → Event Bus → Module B, C, D (subscribers)
```

---

### 2. Scheduler (`assistant/core/scheduler.py`)

**Purpose:** Background daemon for timed events

**Schedule:**
- **07:30 AM** - `morning_checkin` event
- **21:00 PM** - `evening_reflection` event

**Implementation:**
- Daemon thread (non-blocking)
- 30-second poll interval
- Publishes events to bus

**Usage:**
```python
from assistant.core.scheduler import start_scheduler
start_scheduler()  # Runs in background
```

---

### 3. Context Manager (`assistant/core/context_manager.py`)

**Purpose:** Unified memory API (SQLite + FAISS)

**Key Functions:**
```python
def store(text_entry: str, vector: np.array)
    """Store text + 128-dim vector in memory"""

def recall(query_vector: np.array, top_k: int = 5)
    """Retrieve top-k similar memories"""
```

**Architecture:**
- **SQLite** - Structured storage (text, timestamps, metadata)
- **FAISS** - Semantic search (L2 distance on 128-dim vectors)
- **Index Type:** IndexFlatL2 (exact search, suitable for MVP)

**Database Path:** `assistant/data/memory.db`

---

## Module System

### Module Contract

Every module **must** implement:

```python
def register(app, publish, subscribe):
    """
    Register module with orchestrator

    Args:
        app: FastAPI application instance
        publish: Function to broadcast events
        subscribe: Function to listen to events
    """
    # Include FastAPI routes (if any)
    app.include_router(router, prefix="/module")

    # Subscribe to events
    subscribe("event_name", handler_function)

    # Announce module loaded
    publish("module_loaded", {"name": "module_name"})
```

### Module Structure

```
assistant/modules/<module_name>/
    main.py         # Module implementation with register() function
    __init__.py     # (optional) Package initialization
```

### Module Registry

**File:** `assistant/configs/module_registry.yaml`

```yaml
modules:
  - name: voice
    enabled: true
    description: "Streamlit chat UI (voice-ready)"
  - name: memory
    enabled: true
    description: "SQLite + FAISS conversation memory"
  # ... more modules
```

**Loading Process:**
1. Orchestrator reads YAML
2. For each enabled module:
   - Import `assistant.modules.<name>.main`
   - Call `module.register(app, publish, subscribe)`
   - Module self-registers routes and event handlers

---

## Event Bus Pattern

### Core Events

| Event Name | Published By | Consumed By | Payload |
|------------|-------------|-------------|---------|
| `morning_checkin` | Scheduler | BIL | `{"time": "07:30"}` |
| `evening_reflection` | Scheduler | BIL | `{"time": "21:00"}` |
| `task_completed` | Planner | BIL, Memory | `{"task_id": "...", "title": "..."}` |
| `goal_missed` | BIL | Planner, Voice | `{"goal": "gym", "streak": 0}` |
| `module_loaded` | Modules | Orchestrator | `{"name": "module_name"}` |

### Event Flow Example

**Morning Check-In:**
```
Scheduler (07:30)
    ↓
publish("morning_checkin", {"time": "07:30"})
    ↓
Event Bus distributes to:
    → BIL: morning_prompt() → prints "Plan your top 3 priorities"
    → Voice: (future) speak greeting
    → Planner: (future) prepare priority list
```

### Why Event Bus?

1. **Decoupling** - Modules don't import each other
2. **Extensibility** - New modules can subscribe without changing existing code
3. **Testing** - Easy to mock events and test handlers
4. **Debugging** - Centralized event logging
5. **Future-Proof** - Can replace with Redis/RabbitMQ for scaling

---

## Data Architecture

### Database Schema

**File:** `assistant/data/schema.sql`

#### 1. Memory Table
```sql
CREATE TABLE memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Store conversational memory entries
**FAISS:** Parallel index stores 128-dim vectors for semantic search

#### 2. Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  urgency INTEGER,      -- 1-5 scale
  importance INTEGER,   -- 1-5 scale
  effort INTEGER,       -- 1-5 scale
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Store user tasks with priority scoring inputs

#### 3. Emails Table
```sql
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender TEXT,
  subject TEXT,
  date_received DATETIME,
  summary TEXT
);
```
**Purpose:** Cache email metadata and AI-generated summaries

#### 4. Goals Table
```sql
CREATE TABLE goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,              -- e.g., "gym", "guitar"
  target_per_week INTEGER,  -- e.g., 4
  completed INTEGER DEFAULT 0,
  last_update DATETIME
);
```
**Purpose:** Track behavioural goals for BIL system

#### 5. Behaviour Metrics Table
```sql
CREATE TABLE behaviour_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  domain TEXT,      -- e.g., "fitness", "learning"
  question TEXT,    -- Elicitation question asked
  response TEXT,    -- User's response
  sentiment REAL    -- Sentiment score (-1 to 1)
);
```
**Purpose:** Store conversational data elicitation for BIL analysis

### Seed Data

**File:** `assistant/data/seeds.json`

```json
{
  "tasks": [
    { "title": "Check emails", "urgency": 3, "importance": 4, "effort": 1 },
    { "title": "15 min guitar practice", "urgency": 2, "importance": 5, "effort": 2 }
  ],
  "goals": [
    { "name": "gym", "target_per_week": 4, "completed": 0 },
    { "name": "guitar", "target_per_week": 4, "completed": 0 }
  ]
}
```

---

## API Endpoints

### Memory Module

**Base:** `/memory`

#### POST /memory/add
```python
Request:
{
  "content": "Remember to buy coffee tomorrow"
}

Response:
{
  "status": "stored"
}
```

#### GET /memory/recall
```python
Response:
{
  "results": [
    "Remember to buy coffee tomorrow",
    "Need to finish project report",
    "Call dentist for appointment"
  ]
}
```

**Note:** Phase 1 uses dummy vectors. Phase 2+ will use OpenAI embeddings.

---

### Planner Module

**Base:** `/tasks`

#### POST /tasks/add
```python
Request:
{
  "title": "Write blog post",
  "urgency": 4,
  "importance": 5,
  "effort": 3
}

Response:
{
  "status": "added",
  "task": { ... }
}
```

#### GET /tasks/list
```python
Response:
{
  "prioritised_tasks": [
    ["Write blog post", 4.1],      // highest priority
    ["Check emails", 3.5],
    ["15 min guitar practice", 3.2]
  ]
}
```

**Sorted by priority score (descending)**

---

### Email Module

**Base:** `/emails`

#### GET /emails/summarise
```python
Response:
{
  "summary": "Fetched 5 emails. 2 likely important (invites), 3 marketing."
}
```

**Phase 1:** Stub response
**Phase 2+:** IMAP connection + GPT-4 summarization + actionable tags

---

## Planner Scoring System

### Priority Formula

```
priority = (importance × 0.6) + (urgency × 0.3) - (effort × 0.1)
```

### Component Weights

| Factor | Weight | Rationale |
|--------|--------|-----------|
| **Importance** | 0.6 | Most critical - long-term impact |
| **Urgency** | 0.3 | Secondary - time sensitivity |
| **Effort** | -0.1 | Penalty - encourage quick wins |

### Examples

**High Priority Task:**
```python
Task: "Prepare presentation for tomorrow"
importance = 5, urgency = 5, effort = 3
priority = (5 × 0.6) + (5 × 0.3) - (3 × 0.1) = 3.0 + 1.5 - 0.3 = 4.2
```

**Low Priority Task:**
```python
Task: "Organize desk (someday)"
importance = 2, urgency = 1, effort = 4
priority = (2 × 0.6) + (1 × 0.3) - (4 × 0.1) = 1.2 + 0.3 - 0.4 = 1.1
```

### Future Enhancements (Phase 3)

- **Eisenhower Matrix:** Categorize into quadrants (Urgent/Important)
- **Calendar Aware:** Factor in available time slots
- **Context Aware:** Boost priority based on current location/time
- **Learning:** Adjust weights based on completion patterns

---

## Behavioural Intelligence Layer (BIL)

### Concept

BIL is a behavioural-psychology layer that provides:
- **Goal encoding** (e.g., gym 4×/week; guitar 4×/week 15m)
- **Conversational data elicitation** (no forms)
- **Adaptive scheduling & rescheduling**
- **Weekly feedback loop** and education snippets

### Phase 1 Implementation (MVP)

**File:** `assistant/modules/behavioural_intelligence/main.py`

**Current Features:**
- Subscribes to `morning_checkin` and `evening_reflection`
- Tracks goal adherence (gym/guitar)
- Prints nudges when <50% completion

**Example Interaction:**
```
🌅 Morning check-in (07:30): plan your top 3 priorities today.
🌙 Evening reflection: what went well, what blocked you?
🔔 You're behind on 'gym'. Shall we book time tomorrow?
```

### Phase 2 Expansion

**Goal Encoding:**
```python
goals = {
  "gym": {
    "target_per_week": 4,
    "duration_minutes": 45,
    "preferred_times": ["07:00", "18:00"],
    "completed_this_week": 1
  },
  "guitar": {
    "target_per_week": 4,
    "duration_minutes": 15,
    "completed_this_week": 2
  }
}
```

**Adaptive Rescheduling:**
- Detect missed sessions by Thursday
- Propose 2-3 alternative time slots
- Consider calendar availability
- Factor in energy levels (via sentiment analysis)

**Weekly Review:**
```python
weekly_review = {
  "adherence_percentage": 75,  // 6/8 sessions completed
  "blocks": ["Sick on Tuesday", "Late meeting Thursday"],
  "suggestions": [
    "Try morning sessions - 100% completion rate",
    "Block calendar 18:00-18:45 Wed/Fri"
  ],
  "hypothesis": "Evening sessions more prone to conflicts"
}
```

### Conversational Data Elicitation

**No Forms Approach:**

Instead of:
```
❌ Form: "How many times per week do you want to exercise? [___]"
```

Use conversational prompts:
```
✅ "I noticed you went to the gym twice this week.
    Is that the pace you're aiming for, or would you like to go more often?"
```

**Data Capture:**
User says: "I'd like to go 4 times a week"
→ Store in behaviour_metrics table
→ Create/update goal in goals table
→ Schedule prompts accordingly

---

## Phase-Gated Development

### Phase Overview

| Phase | Name | Goal | Status |
|-------|------|------|--------|
| **1** | MVP Core | Local prototype with basic features | `not_started` |
| **2** | Behaviour | Goal reinforcement + BIL | `locked` |
| **3** | Planner | Calendar integration + Eisenhower | `locked` |
| **4** | Fitness | Workout sessions + nutrition | `locked` |
| **5** | Expansion | Plugin modules (habits, finance, etc.) | `locked` |

### Phase 1: MVP Core

**File:** `planning/phase_1_mvp/`

**Goal:** Create local prototype with:
- Text/voice conversation (voice optional MVP)
- Persistent memory (SQLite + FAISS)
- Email summarisation (read-only)
- Daily planner (task add/list with scoring)
- Morning/evening prompts via scheduler

**Tasks:**
1. Orchestrator: load modules from YAML
2. Scheduler: morning/evening events
3. Streamlit chat UI (stub replies OK)
4. Memory endpoints: /memory/add, /memory/recall
5. Email summary stub: /emails/summarise
6. Planner endpoints: /tasks/add, /tasks/list
7. Verify end-to-end loop

**Acceptance Tests:**
- ✅ Startup loads all modules without error
- ✅ Text chat works; replies render in UI
- ✅ /memory/add then /memory/recall returns prior entry after restart
- ✅ /emails/summarise returns a summary payload
- ✅ /tasks/list returns tasks sorted by score
- ✅ Scheduler prints morning/evening prompts to console

### Phase Transition Criteria

**To unlock Phase 2:**
1. All Phase 1 acceptance tests pass
2. Update `planning/progress.yaml`: `phase_1_mvp: completed`
3. No critical bugs
4. Documentation updated

---

## Security Model

### Local-First Approach

**Phase 1 (MVP):**
- All data stored locally in SQLite
- No external authentication
- No network calls (except optional OpenAI)
- User controls data location

**API Keys:**
- Stored in `.env` file (not committed)
- OpenAI API key optional (stubbed responses work without it)

### Future Security (Phase 2+)

**Row-Level Security (RLS):**
```sql
-- When moving to multi-user PostgreSQL
CREATE POLICY "Users can only access own data"
ON tasks
USING (user_id = auth.uid());
```

**Authentication:**
- NextAuth.js or Supabase Auth
- OAuth providers (Google, GitHub)
- JWT tokens for API access

**Data Encryption:**
- At rest: SQLCipher for encrypted SQLite
- In transit: HTTPS only
- Secrets: Environment variables + Vault (production)

---

## Mobile Scalability

### Migration Path: Streamlit → Next.js/React Native

**Current (Phase 1):**
```
User ←→ Streamlit UI ←→ FastAPI Backend
```

**Future (Phase 3+):**
```
User ←→ Next.js Web App   ←→ FastAPI Backend
        React Native App  ←→
```

**Why Keep FastAPI:**
- REST API remains stable
- Mobile clients consume same endpoints
- Business logic stays in backend
- Easy to add GraphQL layer if needed

**Migration Strategy:**
1. **Phase 1-2:** Use Streamlit (rapid prototyping)
2. **Phase 3:** Add Next.js alongside Streamlit
3. **Phase 4:** Deprecate Streamlit, full Next.js
4. **Phase 5:** Add React Native mobile app

**API Stability Guarantee:**
All `/memory`, `/tasks`, `/emails` endpoints remain unchanged during frontend migration.

---

## Deployment

### Local Development

```bash
# 1. Setup
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Initialize database
sqlite3 assistant/data/memory.db < assistant/data/schema.sql

# 3. Configure (optional)
cp .env.example .env
# Edit .env with OpenAI API key

# 4. Run backend
uvicorn assistant.core.orchestrator:app --reload

# 5. Run frontend (separate terminal)
streamlit run assistant/modules/voice/main.py
```

**Access:**
- FastAPI: http://localhost:8000
- Streamlit: http://localhost:8501
- API Docs: http://localhost:8000/docs

### Production Deployment (Future)

**Backend (FastAPI):**
- Docker container
- Deploy to: Railway, Render, Fly.io, or AWS
- Environment variables via platform secrets

**Frontend (Next.js):**
- Vercel (recommended)
- Static export for CDN
- Edge functions for server-side logic

**Database:**
- PostgreSQL (Supabase or Neon)
- Redis for caching
- S3 for file storage

---

## Appendices

### A. File Structure

```
asksharon_ai_blueprint/
├── README.md
├── requirements.txt
├── .env.example
├── claude.md
├── .cursorrules                    # 26 Rules for development
├── principles.md                   # Development philosophy
├── DEVELOPER_ONBOARDING.md         # Quick start guide
│
├── docs/
│   ├── system_design_blueprint.md  # This file
│   ├── phase1_implementation_plan.md
│   ├── architecture.puml
│   ├── IMPLEMENTATION_CONTROL_PLAN.md
│   └── DECISIONS.md
│
├── assistant/
│   ├── core/
│   │   ├── orchestrator.py         # Event bus + module loader
│   │   ├── scheduler.py            # Background tasks
│   │   └── context_manager.py      # Memory (SQLite + FAISS)
│   │
│   ├── modules/
│   │   ├── voice/main.py           # Streamlit chat UI
│   │   ├── memory/main.py          # Memory endpoints
│   │   ├── email/main.py           # Email summary
│   │   ├── planner/main.py         # Task management
│   │   └── behavioural_intelligence/main.py  # BIL
│   │
│   ├── configs/
│   │   └── module_registry.yaml    # Module enable/disable
│   │
│   └── data/
│       ├── schema.sql               # Database tables
│       ├── seeds.json               # Test data
│       └── memory.db                # (Created on init)
│
└── planning/
    ├── progress.yaml                # Phase tracker
    ├── phase_1_mvp/
    ├── phase_2_behaviour/
    ├── phase_3_planner/
    ├── phase_4_fitness/
    └── phase_5_expansion/
```

### B. Key Decisions

**Why FastAPI?**
- Modern Python web framework
- Automatic OpenAPI docs
- Async support (future scaling)
- Type hints integration

**Why Streamlit?**
- Rapid prototyping
- Built-in widgets (chat, forms)
- Easy voice integration
- Pythonic (no JavaScript needed)

**Why SQLite + FAISS?**
- SQLite: Zero-config, perfect for local MVP
- FAISS: Production-grade vector search from Meta AI
- Both can scale to production

**Why Event Bus?**
- Decouples modules
- Easy to add/remove features
- Testable
- Future: can swap to Redis Pub/Sub

### C. Glossary

- **BIL** - Behavioural Intelligence Layer
- **FAISS** - Facebook AI Similarity Search
- **MVP** - Minimum Viable Product
- **RLS** - Row-Level Security
- **SSR** - Server-Side Rendering

---

**End of System Design Blueprint**

**Version:** 1.0
**Last Updated:** 2025-11-05
**Maintainer:** AskSharon.ai Team
