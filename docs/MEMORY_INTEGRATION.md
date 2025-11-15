# Long-Term Memory Integration
## Shared Supabase pgvector Memory Layer

**Status:** Active (Phase 2)
**Last Updated:** 2025-11-12
**Systems:** AskSharon.ai + ManagementTeam

---

## 🎯 Overview

AskSharon.ai shares a **long-term semantic memory layer** with ManagementTeam using Supabase PostgreSQL with pgvector extension. This enables:

- ✅ **Cross-system intelligence** - Personal tasks linked to business projects
- ✅ **Semantic search** - Find related information across both systems
- ✅ **Unified timeline** - Business decisions → personal actions
- ✅ **Context awareness** - AI understands both business and personal context

### Why Shared Memory?

**Problem:** Disconnected systems lead to:
- Manual task creation after project approvals
- Lost context between business strategy and personal execution
- No way to see "what personal tasks support which projects"

**Solution:** Shared Supabase database with semantic search enables:
- Automatic task suggestions when projects are approved
- "Show me all tasks for the AI Receptionist project"
- Email arrives about dentistry → Finds related business projects

---

## 🏗️ Architecture

### Shared Infrastructure

```
┌──────────────────────────────────────────────────────┐
│         Supabase PostgreSQL (Shared Cloud)           │
│      https://coxnsvusaxfniqivhlar.supabase.co       │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  pgvector Extension (Semantic Search)          │  │
│  │  - 1536-dim embeddings (OpenAI ada-002)        │  │
│  │  - Cosine similarity search (IVFFlat index)    │  │
│  │  - Sub-second queries on 100K+ memories        │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  📊 Tables:                                          │
│  ├─ long_term_memory (shared semantic memory)       │
│  ├─ project_decisions (ManagementTeam)              │
│  ├─ user_tasks (AskSharon personal)                 │
│  └─ memory_links (cross-references)                 │
└──────────────────────────────────────────────────────┘
         ↑                              ↑
         │                              │
   ┌─────┴──────┐              ┌────────┴────────┐
   │ Management │              │  AskSharon.ai   │
   │    Team    │←─── Bridge ──→│                │
   │            │   REST API    │                 │
   │ - Projects │              │ - Personal      │
   │ - Agents   │              │ - Tasks/Goals   │
   │ - Strategy │              │ - Email/Calendar│
   └────────────┘              └─────────────────┘
```

### Data Isolation & Security

```
Supabase Row-Level Security (RLS):

long_term_memory table:
├─ source_system: 'management_team' | 'asksharon'
├─ user_id: 'strategy_agent' | 'rob' | 'financial_agent' | etc.
│
├─ READ: Both systems can read each other (for context)
└─ WRITE: Each system can only write to its own records
```

**Credentials:**
- **ManagementTeam:** Uses `SUPABASE_SERVICE_ROLE_KEY` (admin)
- **AskSharon:** Uses `SUPABASE_ANON_KEY` (user-level, RLS enforced)

---

## 📊 Database Schema

### Tables

#### 1. long_term_memory (Shared Semantic Memory)

The core table for cross-system semantic search.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `content` | TEXT | Full text content for semantic search |
| `embedding` | VECTOR(1536) | OpenAI ada-002 embedding |
| `source_system` | TEXT | 'management_team' or 'asksharon' |
| `entity_type` | TEXT | 'project', 'task', 'decision', 'goal', 'email' |
| `entity_id` | TEXT | Original record ID |
| `user_id` | TEXT | Owner (agent name or 'rob') |
| `metadata` | JSONB | Flexible attributes |
| `created_at` | TIMESTAMPTZ | Timestamp |

**Indexes:**
- Vector index (IVFFlat) on `embedding`
- B-tree on `source_system`, `entity_type`, `user_id`

#### 2. project_decisions (ManagementTeam)

Business project approvals/rejections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `project_name` | TEXT | Project name |
| `decision` | TEXT | 'approved', 'rejected', 'on_hold', 'completed' |
| `agent_name` | TEXT | 'strategy_agent', etc. |
| `notes` | TEXT | Additional context |
| `created_at` | TIMESTAMPTZ | When decided |
| `memory_id` | INTEGER | → long_term_memory.id |

#### 3. user_tasks (AskSharon Personal)

Your personal tasks with RICE scoring.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `title` | TEXT | Task title |
| `description` | TEXT | Details |
| `urgency` | INTEGER | 1-5 (RICE) |
| `importance` | INTEGER | 1-5 (RICE) |
| `effort` | INTEGER | 1-5 (RICE) |
| `completed` | BOOLEAN | Status |
| `project_reference` | TEXT | → ManagementTeam project |
| `due_date` | DATE | Optional |
| `memory_id` | INTEGER | → long_term_memory.id |

#### 4. memory_links (Cross-References)

Explicit relationships between memories.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `memory_id_1` | INTEGER | First memory |
| `memory_id_2` | INTEGER | Second memory |
| `relationship_type` | TEXT | 'implements', 'related_to', 'depends_on' |
| `confidence` | REAL | 0.0 to 1.0 |

---

## 🔌 API Usage

### AskSharon.ai Python API

```python
from assistant.core.supabase_memory import (
    store_task_with_context,
    find_related_business_projects,
    get_tasks_for_project,
    link_task_to_project
)

# Store a task with semantic memory
memory_id = store_task_with_context(
    title="Build AI Receptionist MVP",
    description="Create working prototype for dental clinics",
    urgency=5,
    importance=5,
    effort=4,
    project_reference="AI_Receptionist"  # Links to ManagementTeam
)

# Find related business projects
projects = find_related_business_projects("dental automation software")
# Returns: [
#   {"similarity": 0.89, "metadata": {"project": "AI_Receptionist", "decision": "approved"}},
#   ...
# ]

# Get all tasks for a project
tasks = get_tasks_for_project("AI_Receptionist")
# Returns: List of your tasks linked to this project

# Create explicit link
link_task_to_project(task_id=123, project_name="AI_Receptionist")
```

### ManagementTeam Python API

```python
from memory.supabase_memory import (
    store_project_decision,
    recall_related_projects,
    get_project_status
)

# Store project decision
memory_id = store_project_decision(
    project_name="AI_Receptionist",
    decision="approved",
    agent_name="strategy_agent",
    notes="High market demand, strong ROI"
)

# Search for related projects
results = recall_related_projects("healthcare AI solutions")
# Returns semantic matches across all ManagementTeam projects

# Check project status
status = get_project_status("AI_Receptionist")
# Returns: {"decision": "approved", "agent_name": "strategy_agent", ...}
```

### SQL Direct Queries

```sql
-- Semantic search across all memories
SELECT * FROM search_memory(
  '[0.1, 0.2, ...]'::vector(1536),  -- Your query embedding
  0.7,                                -- Min similarity
  5,                                  -- Max results
  'management_team',                  -- Filter by source (optional)
  'project_decision'                  -- Filter by type (optional)
);

-- Get recent project activity
SELECT * FROM recent_project_activity
ORDER BY created_at DESC
LIMIT 10;

-- Task summary by project
SELECT * FROM task_summary_by_project
WHERE project_reference = 'AI_Receptionist';
```

---

## 🚀 Use Cases

### 1. Project → Task Automation

**Scenario:** ManagementTeam approves "AI Receptionist" project

**Flow:**
1. Strategy agent stores decision in Supabase: `store_project_decision()`
2. AskSharon morning check-in detects new project
3. Suggests tasks: "Draft MVP spec", "Research competitors", "Build prototype"
4. You confirm → tasks created with `project_reference="AI_Receptionist"`

**Code (ManagementTeam):**
```python
# In strategy agent
store_project_decision("AI_Receptionist", "approved", "strategy_agent")

# Optional: Auto-create AskSharon tasks via API
requests.post("http://localhost:8000/tasks/from-project", json={
    "project": "AI_Receptionist",
    "suggested_tasks": [
        {"title": "Draft MVP spec", "urgency": 4, "importance": 5},
        {"title": "Research competitors", "urgency": 3, "importance": 4}
    ]
})
```

**Code (AskSharon):**
```python
# Morning check-in enhancement
from assistant.core.supabase_memory import find_related_business_projects

def morning_checkin():
    # Find newly approved projects
    new_projects = find_related_business_projects("active approved projects")

    for project in new_projects:
        project_name = project["metadata"]["project"]
        print(f"📊 New business project: {project_name}")
        print(f"   Would you like to create tasks for this?")
```

### 2. Email → Project Context

**Scenario:** Email arrives: "Interested in dental practice automation"

**Flow:**
1. AskSharon processes email with AI
2. Queries Supabase: `find_related_business_projects("dental practice automation")`
3. Finds "AI_Receptionist" project (status: approved, MVP in progress)
4. Suggests: "Link this inquiry to AI Receptionist project"
5. Creates task: "Follow up on dental inquiry" with `project_reference`

**Code:**
```python
# In email processor
def process_email(email):
    # Extract key terms
    summary = summarize_email(email)

    # Find related projects
    projects = find_related_business_projects(summary)

    if projects:
        top_project = projects[0]
        print(f"🔗 This email relates to: {top_project['metadata']['project']}")

        # Create task
        store_task_with_context(
            title=f"Follow up: {email.subject}",
            description=summary,
            urgency=3,
            importance=4,
            project_reference=top_project["metadata"]["project"]
        )
```

### 3. Unified Timeline

**Scenario:** Checking morning priorities

**AskSharon Display:**
```
☀️ Good morning, Rob!

📊 Active Business Projects (ManagementTeam):
  • AI Receptionist (3 tasks pending)
    └─ Last update: Strategy agent approved, MVP deadline Dec 15
  • Swing FX Trading (1 task pending)

✅ Today's High-Priority Tasks:
  1. [Business] Build AI Receptionist MVP (U:5/I:5/E:4)
     Project: AI_Receptionist | Due: Dec 10

  2. [Personal] Book dentist appointment (U:3/I:2/E:1)

  3. [Business] Research dental practice competitors (U:3/I:4/E:2)
     Project: AI_Receptionist
```

**Code:**
```python
def get_daily_summary():
    # Get active projects from ManagementTeam
    projects = supabase.table("recent_project_activity")\
        .select("*")\
        .limit(5)\
        .execute()

    # Get high-priority tasks
    tasks = supabase.table("user_tasks")\
        .select("*")\
        .eq("completed", False)\
        .order("urgency", desc=True)\
        .limit(10)\
        .execute()

    return {
        "projects": projects.data,
        "tasks": tasks.data
    }
```

---

## 🔐 Security & Privacy

### Row-Level Security (RLS)

Supabase RLS policies ensure data isolation:

```sql
-- ManagementTeam can only write management_team records
CREATE POLICY "ManagementTeam can insert own records"
ON long_term_memory FOR INSERT
WITH CHECK (
  source_system = 'management_team'
  AND auth.role() = 'service_role'
);

-- AskSharon can only write asksharon records
CREATE POLICY "AskSharon can insert own records"
ON long_term_memory FOR INSERT
WITH CHECK (
  source_system = 'asksharon'
  AND auth.uid()::text = user_id
);

-- Both can read each other (for context)
CREATE POLICY "Allow read access to all memories"
ON long_term_memory FOR SELECT
USING (true);
```

### Credential Separation

| System | Credential | Access Level |
|--------|-----------|--------------|
| **ManagementTeam** | `SUPABASE_SERVICE_ROLE_KEY` | Full admin (bypasses RLS) |
| **AskSharon** | `SUPABASE_ANON_KEY` | User-level (RLS enforced) |

**Why?**
- ManagementTeam needs admin to write on behalf of multiple agents
- AskSharon respects user-level permissions
- RLS prevents accidental cross-writes

### Data Residency

- **Storage:** Supabase cloud (AWS US East)
- **Embeddings:** Generated via OpenAI API (not stored by OpenAI per policy)
- **Backups:** Supabase automatic daily backups (7-day retention on free tier)

---

## 💰 Cost Estimate

### Supabase Free Tier

- ✅ 500 MB database (sufficient for ~50,000 memories)
- ✅ 50,000 monthly active users
- ✅ 2 GB bandwidth
- ✅ 500 MB file storage
- ✅ Daily automatic backups (7 days)

### OpenAI Embeddings

- **Cost:** $0.00010 per 1K tokens
- **Average:** ~100 tokens per memory = $0.00001 per memory
- **Monthly estimate:**
  - 1,000 new memories/month = **$0.01/month**
  - 10,000 new memories/month = **$0.10/month**

### Total Monthly Cost

**For typical usage (1,000 memories/month):**
- Supabase: **$0** (free tier)
- OpenAI embeddings: **$0.01**
- **Total: ~$0/month** ✅

**Upgrade triggers:**
- Database > 500MB: Supabase Pro ($25/month, 8GB)
- Embeddings > 100K/month: ~$1-5/month (still cheap!)

---

## 📁 File Locations

### AskSharon.ai
```
asksharon_ai_blueprint/
├── docs/
│   ├── MEMORY_INTEGRATION.md (this file)
│   └── sql/setup_shared_memory.sql
├── assistant/core/
│   └── supabase_memory.py (main API)
└── config/.env (credentials)
```

### ManagementTeam
```
ManagementTeam/
├── memory/
│   ├── supabase_memory.py (main API)
│   └── *.json (legacy, can keep as backup)
├── scripts/
│   └── migrate_to_supabase.py (one-time migration)
└── config/.env (credentials)
```

---

## 🛠️ Setup Instructions

### 1. Run SQL Setup (One Time)

```bash
# Copy SQL to clipboard
cat docs/sql/setup_shared_memory.sql | pbcopy

# Go to Supabase SQL Editor:
# https://supabase.com/dashboard/project/coxnsvusaxfniqivhlar/sql

# Paste and run the SQL
# Takes ~5 seconds to create all tables and indexes
```

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%memory%';

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. Install Dependencies

**AskSharon:**
```bash
cd asksharon_ai_blueprint
source venv/bin/activate
pip install supabase openai
```

**ManagementTeam:**
```bash
cd ManagementTeam
source venv/bin/activate
pip install supabase openai
```

### 3. Configure Credentials

**Both systems use same Supabase instance** (already in `.env` files):

**AskSharon** (`config/.env`):
```bash
SUPABASE_URL=https://coxnsvusaxfniqivhlar.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...  # Already set
OPENAI_API_KEY=sk-proj-...       # Already set
```

**ManagementTeam** (`config/.env` - ADD THESE):
```bash
SUPABASE_URL=https://coxnsvusaxfniqivhlar.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Copy from AskSharon .env.local
ENABLE_SUPABASE_MEMORY=true
```

### 4. Test Connections

**AskSharon:**
```bash
python assistant/core/supabase_memory.py test
```

**ManagementTeam:**
```bash
python memory/supabase_memory.py test
```

### 5. Migrate Existing Data (Optional)

**ManagementTeam only** (if you have existing JSON memories):
```bash
# Dry run first
python scripts/migrate_to_supabase.py --dry-run

# Real migration
python scripts/migrate_to_supabase.py --backup
```

---

## 🔧 Maintenance

### Rebuild Vector Index (if searches become slow)

```sql
REINDEX INDEX long_term_memory_embedding_idx;
```

### Purge Old Memories (optional, recommended yearly)

```sql
-- Delete personal tasks older than 1 year
DELETE FROM long_term_memory
WHERE created_at < NOW() - INTERVAL '1 year'
  AND source_system = 'asksharon'
  AND entity_type = 'task';
```

### Monitor Database Size

```sql
SELECT
  source_system,
  entity_type,
  COUNT(*) as count,
  pg_size_pretty(pg_total_relation_size('long_term_memory')) as size
FROM long_term_memory
GROUP BY source_system, entity_type;
```

### Check Memory Growth

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as memories_created
FROM long_term_memory
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ⚠️ Troubleshooting

### "Extension vector does not exist"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### "Function search_memory does not exist"

**Solution:** Re-run the function creation SQL from `setup_shared_memory.sql` (section 6).

### Slow semantic searches

**Causes:**
- Index not created
- Too many memories (>100K) with default index settings

**Solutions:**
```sql
-- Check index exists
\d long_term_memory

-- Rebuild index
REINDEX INDEX long_term_memory_embedding_idx;

-- For >100K memories, increase lists parameter
DROP INDEX long_term_memory_embedding_idx;
CREATE INDEX long_term_memory_embedding_idx
ON long_term_memory
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 500);  -- Increased from 100
```

### "Permission denied" errors

**Cause:** RLS policies preventing access

**Solution:** Verify credentials in `.env`:
- AskSharon uses `SUPABASE_ANON_KEY`
- ManagementTeam uses `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI API rate limits

**Cause:** Too many embedding requests

**Solution:**
```python
# Add caching layer
from functools import lru_cache

@lru_cache(maxsize=1000)
def generate_embedding_cached(text: str):
    return generate_embedding(text)
```

---

## 📚 Related Documentation

### AskSharon.ai Documentation
- [AskSharon Architecture](./ARCHITECTURE.md)
- [Memory Quick Start](./MEMORY_QUICKSTART.md) - 10-minute setup guide

### ManagementTeam Documentation
- [Shared Memory Guide](/ManagementTeam/docs/setup/SHARED_MEMORY_GUIDE.md) - ManagementTeam-focused setup
- [ManagementTeam Architecture](/ManagementTeam/docs/ARCHITECTURE.md) - Memory architecture section
- [ManagementTeam README](/ManagementTeam/README.md) - Shared memory overview
- [ManagementTeam Principles](/ManagementTeam/docs/PRINCIPLES.md) - System principles

### External Resources
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai/vector-indexes)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

## 🎯 Progress Reports (NEW!)

**Status:** ✅ Active

Track your activity across both systems with automated progress reports!

### Available Reports

```bash
# Yesterday's activity
python scripts/progress_report.py yesterday

# Weekly progress (last 7 days)
python scripts/progress_report.py week

# Since last login
python scripts/progress_report.py last-session
```

### What's Included

- **ManagementTeam activity:** Projects approved, updated, or completed
- **AskSharon activity:** Tasks created and completed
- **Cross-system insights:** Projects with linked tasks
- **Timeline view:** Chronological activity log
- **Completion rates:** Track progress over time

### Morning Check-In Integration

Progress summaries are automatically shown in morning check-in (7:30 AM):
- Active business projects
- Tasks linked to each project
- Quick statistics

**Enable yesterday's summary in morning check-in:**
```bash
# Add to config/.env
MORNING_SHOW_YESTERDAY=true
```

**📖 Full Guide:** See [docs/PROGRESS_REPORTS.md](./PROGRESS_REPORTS.md)

---

## 🔮 Future Enhancements

### Phase 3: Advanced Intelligence

- **Auto-task generation:** Project approved → Suggested tasks created automatically
- **Priority scoring:** AI suggests which tasks to do first based on project status
- **Email intelligence:** Incoming email → Auto-link to relevant projects

### Phase 4: Mobile Integration

- Mobile app queries same Supabase instance
- Push notifications when new projects approved
- Voice commands: "What tasks do I have for the AI Receptionist project?"

---

**Last Updated:** 2025-11-12
**Maintained By:** Rob Freyne
**Questions?** See [ARCHITECTURE.md](./ARCHITECTURE.md) or ManagementTeam [PRINCIPLES.md](/ManagementTeam/docs/PRINCIPLES.md)
