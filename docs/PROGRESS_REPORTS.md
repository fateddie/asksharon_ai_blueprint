# Progress Reports Guide
## Track Your Activity Across ManagementTeam + AskSharon

**Status:** Active ✅
**Last Updated:** 2025-11-12

---

## 🎯 Overview

The progress report system shows what you worked on across both **ManagementTeam** and **AskSharon.ai**:

- ✅ **Daily summaries** - What you did yesterday
- ✅ **Weekly reports** - Progress over the last week
- ✅ **Last session** - Activity since you last logged in
- ✅ **Cross-system tracking** - Business projects + personal tasks

### Why Progress Reports?

**Problem:** Hard to remember what you worked on yesterday or see progress over time

**Solution:** Automated reports that query shared memory to show:
- ManagementTeam projects approved/updated
- AskSharon tasks created/completed
- Connections between projects and tasks
- Timeline of activity

---

## 🚀 Quick Start

### View Yesterday's Activity

```bash
cd /Users/robertfreyne/Documents/ClaudeCode/asksharon_ai_blueprint
python scripts/progress_report.py yesterday
```

**Output:**
```
======================================================================
📅 Daily Progress Report - Monday, November 11, 2025
======================================================================

🏢 ManagementTeam Activity
----------------------------------------------------------------------
  Projects worked on: 2

  • 14:30 - AI_Receptionist
    Status: APPROVED (by strategy_agent)
    Notes: High market demand, strong ROI potential

  • 16:45 - Email_Automation_Tool
    Status: IN_PROGRESS (by technical_architect)
    Notes: Architecture design phase

👤 Personal Activity (AskSharon)
----------------------------------------------------------------------
  Tasks created: 3
  Tasks completed: 5

  ✅ Completed Tasks:
    • 09:15 - Research competitor pricing (Project: AI_Receptionist)
    • 11:30 - Draft marketing copy (Project: AI_Receptionist)
    • 15:00 - Review technical specs

  📝 New Tasks:
    • 17:00 - Build MVP prototype (U:5 I:5)
    • 17:15 - Schedule customer interviews (U:4 I:5)

🔗 Project-Task Connections
----------------------------------------------------------------------
  • AI_Receptionist: 2/5 tasks completed
  • Email_Automation_Tool: 0/2 tasks completed

======================================================================
📊 Summary
----------------------------------------------------------------------
  Total activities: 10
  Business projects: 2
  Personal tasks: 3 created, 5 completed
======================================================================
```

---

## 📋 All Commands

### 1. Yesterday's Activity

```bash
python scripts/progress_report.py yesterday
```

Shows what you did yesterday (default command).

---

### 2. Today's Activity

```bash
python scripts/progress_report.py today
```

Shows what you've done so far today.

---

### 3. Weekly Report

```bash
python scripts/progress_report.py week
```

Shows activity for the last 7 days.

**Output includes:**
- Overview stats (projects, tasks, completion rate)
- Projects worked on with update counts
- Top 10 completed tasks
- Project progress (% complete)

**Custom weeks:**
```bash
python scripts/progress_report.py week --weeks 2  # Last 2 weeks
python scripts/progress_report.py week --weeks 4  # Last month
```

---

### 4. Since Last Session

```bash
python scripts/progress_report.py last-session
```

Shows activity since you last logged in (tracks login time automatically).

**First time:** Uses last 24 hours as baseline
**Subsequent runs:** Shows activity since last `progress_report.py` run

---

### 5. Custom Date Range

```bash
python scripts/progress_report.py --since "2025-11-10"
```

Shows activity for a specific date.

---

## 🔄 Integration with Morning Check-In

Progress reports are automatically shown in your morning check-in (7:30 AM).

### What's Shown:

**Morning check-in displays:**
1. Active ManagementTeam projects (top 5)
2. Tasks linked to each project
3. Project status and who approved it
4. Quick links to view/create tasks

**To manually trigger:**
```bash
# Start the scheduler
python assistant/core/scheduler.py

# Or use the event system
python -c "from assistant.core.orchestrator import publish; publish('morning_checkin', {'time': '07:30'})"
```

---

## 📊 Report Types Explained

### Daily Report

**What it shows:**
- All activity for a specific date
- Grouped by system (ManagementTeam vs AskSharon)
- Chronological timeline with timestamps
- Cross-system connections

**Best for:**
- Daily review
- Checking yesterday's work
- Preparing daily standup

---

### Weekly Report

**What it shows:**
- High-level stats (projects, tasks, completion %)
- All projects worked on with update counts
- Top 10 completed tasks
- Project progress bars

**Best for:**
- Weekly review meetings
- Tracking progress on projects
- Identifying patterns

---

### Last Session Report

**What it shows:**
- Quick summary of new activity
- Projects updated since last login
- Tasks completed since last login
- "Catch up" view

**Best for:**
- Starting your work session
- After vacation/weekend
- Quick status check

---

## 🎨 Example Use Cases

### Use Case 1: Daily Standup Prep

```bash
# See what you did yesterday
python scripts/progress_report.py yesterday

# Copy output to standup notes
```

**Output shows:**
- What business projects you worked on
- What tasks you completed
- What you created/planned

---

### Use Case 2: Weekly Review

```bash
# Generate weekly report
python scripts/progress_report.py week > weekly_review.txt

# Review progress on each project
grep "Project Progress" weekly_review.txt
```

**Shows:**
- Projects with <50% completion (need attention)
- Projects with >80% completion (almost done)
- Total tasks completed this week

---

### Use Case 3: Back from Vacation

```bash
# What happened since I was last online?
python scripts/progress_report.py last-session
```

**Shows:**
- New projects approved
- Tasks that were completed
- What needs your attention

---

### Use Case 4: Monthly Review

```bash
# Last 4 weeks
python scripts/progress_report.py week --weeks 4 > monthly_report.txt

# Analyze patterns
cat monthly_report.txt | grep "Completion Rate"
```

---

## 🔗 Session Tracking

The system automatically tracks when you last logged in using:

**File:** `/Users/robertfreyne/Documents/ClaudeCode/asksharon_ai_blueprint/data/last_session.txt`

**How it works:**
1. First time: Uses last 24 hours as baseline
2. Runs `progress_report.py last-session`
3. Updates `last_session.txt` with current timestamp
4. Next time: Shows activity since that timestamp

**Manual reset:**
```bash
# Reset session tracking
rm /Users/robertfreyne/Documents/ClaudeCode/asksharon_ai_blueprint/data/last_session.txt

# Next run will use last 24 hours
python scripts/progress_report.py last-session
```

---

## 💡 Pro Tips

### Tip 1: Morning Routine

Create a morning script:

```bash
#!/bin/bash
# morning_routine.sh

echo "🌅 Good morning! Here's what you did yesterday:"
echo ""
python scripts/progress_report.py yesterday
echo ""
echo "🎯 Active projects:"
python assistant/core/supabase_memory.py stats
```

### Tip 2: Export to File

```bash
# Save yesterday's report
python scripts/progress_report.py yesterday > daily_$(date +%Y%m%d).txt

# Archive weekly reports
python scripts/progress_report.py week > weekly_$(date +%Y%m%d).txt
```

### Tip 3: Grep for Specific Projects

```bash
# Show only AI_Receptionist activity
python scripts/progress_report.py week | grep -A 5 "AI_Receptionist"

# Count completions
python scripts/progress_report.py week | grep "✅" | wc -l
```

### Tip 4: Completion Rate Tracking

```bash
# Track weekly completion rates
for i in {1..4}; do
  echo "Week $i:"
  python scripts/progress_report.py week --weeks $i | grep "Completion Rate"
done
```

---

## 🛠️ Customization

### Add Custom Queries

Edit `/asksharon_ai_blueprint/scripts/progress_report.py`:

```python
def get_asksharon_activity(since_date: datetime):
    """Add your custom query logic here"""
    supabase = _get_supabase_client()

    # Example: Query high-priority tasks only
    result = supabase.table("user_tasks")\
        .select("*")\
        .gte("urgency", 4)\
        .gte("created_at", since_date.isoformat())\
        .execute()

    return result.data
```

### Custom Report Format

Create your own report generator:

```python
def generate_custom_report():
    """Your custom report logic"""
    mt_activity = get_managementteam_activity(since_date)
    as_activity = get_asksharon_activity(since_date)

    # Format output however you want
    return f"Projects: {mt_activity['total_projects']}"
```

---

## ⚠️ Troubleshooting

### "Supabase not configured"

**Solution:**
```bash
# Check .env file
cat config/.env | grep SUPABASE

# Should have:
SUPABASE_URL=https://coxnsvusaxfniqivhlar.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# If missing, see: docs/MEMORY_QUICKSTART.md
```

### No data showing

**Possible causes:**
1. Date range too far back (no data yet)
2. Supabase tables empty
3. Wrong credentials

**Solution:**
```bash
# Test connection
python assistant/core/supabase_memory.py test

# Check if data exists
python assistant/core/supabase_memory.py stats

# Try broader date range
python scripts/progress_report.py week --weeks 4
```

### Last session time incorrect

**Solution:**
```bash
# Reset session tracking
rm data/last_session.txt

# Run again
python scripts/progress_report.py last-session
```

---

## 📚 Related Documentation

- [Shared Memory Guide](/ManagementTeam/docs/setup/SHARED_MEMORY_GUIDE.md)
- [Memory Integration](./MEMORY_INTEGRATION.md)
- [Memory Quick Start](./MEMORY_QUICKSTART.md)
- [AskSharon Architecture](./ARCHITECTURE.md)

---

## 🎯 Next Steps

1. **Try it out:**
   ```bash
   python scripts/progress_report.py yesterday
   ```

2. **Set up morning routine:**
   - Create `morning_routine.sh`
   - Add to cron or run manually

3. **Customize reports:**
   - Edit `scripts/progress_report.py`
   - Add your own queries

4. **Track long-term:**
   - Export weekly reports
   - Archive in `/docs/progress/`

---

**Questions?** See [MEMORY_INTEGRATION.md](./MEMORY_INTEGRATION.md)
