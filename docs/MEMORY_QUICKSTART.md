# Memory Integration Quick Start
## Get Shared Memory Running in 10 Minutes

---

## ✅ What You're Setting Up

- **Shared Supabase database** for ManagementTeam + AskSharon
- **Semantic search** across both systems
- **Cross-system intelligence** (business projects ↔ personal tasks)

---

## 📋 Prerequisites

- ✅ Supabase account (already configured in AskSharon)
- ✅ OpenAI API key (already set)
- ✅ Both projects on your machine

---

## 🚀 Step 1: Run SQL Setup (2 minutes)

### Copy SQL to Clipboard
```bash
cat docs/sql/setup_shared_memory.sql | pbcopy
```

### Run in Supabase

1. Go to: https://supabase.com/dashboard/project/coxnsvusaxfniqivhlar/sql
2. Paste the SQL
3. Click "Run" → Takes ~5 seconds
4. You should see: `Success. No rows returned`

### Verify It Worked
```sql
-- Run this in Supabase SQL editor:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('long_term_memory', 'project_decisions', 'user_tasks', 'memory_links');

-- Should return 4 rows
```

---

## 🚀 Step 2: Install Dependencies (2 minutes)

### AskSharon
```bash
cd /Users/robertfreyne/Documents/ClaudeCode/asksharon_ai_blueprint
source venv/bin/activate
pip install supabase openai
```

### ManagementTeam
```bash
cd /Users/robertfreyne/Documents/ClaudeCode/ManagementTeam
source venv/bin/activate
pip install supabase openai
```

---

## 🚀 Step 3: Configure ManagementTeam (1 minute)

Add these to `/ManagementTeam/config/.env`:

```bash
# Supabase Shared Memory (copy from AskSharon)
SUPABASE_URL=https://coxnsvusaxfniqivhlar.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveG5zdnVzYXhmbmlxaXZobGFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA3NzU4MCwiZXhwIjoyMDc0NjUzNTgwfQ.qyAMlwd171_YtNVoKevXpqLBTB5pBcwFQ6f-giAGBWo
ENABLE_SUPABASE_MEMORY=true
```

**Note:** AskSharon already has Supabase configured, no changes needed!

---

## 🚀 Step 4: Test Connections (2 minutes)

### Test AskSharon
```bash
cd /Users/robertfreyne/Documents/ClaudeCode/asksharon_ai_blueprint
python assistant/core/supabase_memory.py test
```

**Expected output:**
```
🧪 Testing AskSharon Supabase integration...
✅ Supabase connected
🧪 Testing embedding generation...
✅ Generated 1536-dimensional embedding
✅ All tests passed!
```

### Test ManagementTeam
```bash
cd /Users/robertfreyne/Documents/ClaudeCode/ManagementTeam
python memory/supabase_memory.py test
```

**Expected output:**
```
🧪 Testing Supabase connection...
✅ Supabase connected
🧪 Testing embedding generation...
✅ Generated 1536-dimensional embedding
✅ All tests passed!
```

---

## 🚀 Step 5: Try It Out! (3 minutes)

### Store a Project Decision (ManagementTeam)
```bash
cd /Users/robertfreyne/Documents/ClaudeCode/ManagementTeam
python memory/supabase_memory.py store \
  --project "Test_Project" \
  --decision approved \
  --agent strategy_agent \
  --notes "Testing shared memory integration"
```

**Output:**
```
✅ Stored: Test_Project - approved (Memory ID: 1)
```

### Create a Task (AskSharon)
```bash
cd /Users/robertfreyne/Documents/ClaudeCode/asksharon_ai_blueprint
python assistant/core/supabase_memory.py add-task \
  --title "Work on Test Project" \
  --description "Test task creation" \
  --urgency 4 \
  --importance 4 \
  --effort 2 \
  --project "Test_Project"
```

**Output:**
```
✅ Task stored: Work on Test Project (Memory ID: 2)
```

### Search Across Systems (AskSharon)
```bash
python assistant/core/supabase_memory.py search --query "test project"
```

**Output:**
```
🔍 Related Business Projects (1):

  0.95 - Test_Project
           Decision: approved
```

### Check in Supabase
Go to: https://supabase.com/dashboard/project/coxnsvusaxfniqivhlar/editor

Look at:
- `long_term_memory` table → Should have 2 rows
- `project_decisions` table → Should have 1 row
- `user_tasks` table → Should have 1 row

---

## 🎉 Done! What Now?

### Migrate Existing Data (Optional)

If you have existing ManagementTeam JSON memories:
```bash
cd /Users/robertfreyne/Documents/ClaudeCode/ManagementTeam
python scripts/migrate_to_supabase.py --dry-run  # Preview
python scripts/migrate_to_supabase.py            # Real migration
```

### Read Full Documentation

**AskSharon.ai:**
- [MEMORY_INTEGRATION.md](./MEMORY_INTEGRATION.md) - Complete integration guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

**ManagementTeam:**
- [Shared Memory Guide](/ManagementTeam/docs/setup/SHARED_MEMORY_GUIDE.md) - ManagementTeam setup
- [ManagementTeam Architecture](/ManagementTeam/docs/ARCHITECTURE.md) - Memory architecture
- [ManagementTeam PRINCIPLES.md](/ManagementTeam/docs/PRINCIPLES.md) - System principles

### Try Advanced Features

**1. Semantic search:**
```python
from assistant.core.supabase_memory import find_related_business_projects

results = find_related_business_projects("dental clinic automation")
# Finds AI Receptionist project if it exists
```

**2. Get project context:**
```python
from assistant.core.supabase_memory import get_project_context

context = get_project_context("AI_Receptionist")
print(f"Tasks: {context['tasks']['total']}")
print(f"Pending: {context['tasks']['pending']}")
```

**3. Link task to project:**
```python
from assistant.core.supabase_memory import link_task_to_project

link_task_to_project(task_id=123, project_name="AI_Receptionist")
```

---

## ⚠️ Troubleshooting

### "Extension vector does not exist"
```sql
-- Run in Supabase SQL editor:
CREATE EXTENSION IF NOT EXISTS vector;
```

### "Function search_memory does not exist"
Re-run the SQL from step 1.

### "Permission denied for table..."
Check your `.env` credentials:
- AskSharon uses `SUPABASE_ANON_KEY`
- ManagementTeam uses `SUPABASE_SERVICE_ROLE_KEY`

### Tests pass but no data appearing
Check RLS policies in Supabase:
https://supabase.com/dashboard/project/coxnsvusaxfniqivhlar/auth/policies

---

## 📊 Monitoring

### Check Memory Stats
```bash
# ManagementTeam
python memory/supabase_memory.py stats

# Output:
# 📈 Memory Statistics:
#    Total memories: 15
#    Active projects: 3
```

### View in Supabase Dashboard
https://supabase.com/dashboard/project/coxnsvusaxfniqivhlar/editor

Tables to monitor:
- `long_term_memory` - All memories
- `recent_project_activity` - View (business summary)
- `task_summary_by_project` - View (task rollup)

---

## 💰 Current Usage

**Free tier limits:**
- Database: 500 MB (you're using ~0.1% with test data)
- Monthly active users: 50,000 (you have 2 "users": ManagementTeam + AskSharon)
- Embeddings: $0.01/1000 memories

**You're well within free tier!** ✅

---

**Questions?** See [MEMORY_INTEGRATION.md](./MEMORY_INTEGRATION.md)
