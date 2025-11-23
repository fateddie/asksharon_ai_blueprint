# Developer Onboarding Summary

**Project:** AskSharon.ai
**Type:** Modular Personal Assistant (Python/FastAPI)
**Status:** Phase 1 MVP Ready for Implementation

---

## Quick Summary

- **Core:** orchestrator, scheduler, context manager.
- **Modules:** voice, memory, email, planner, BIL (behavioural).
- **Data:** SQLite + FAISS (see schema.sql).
- **Planning:** phases with goals, tasks, acceptance tests.

---

## Run Locally

**Quick Start (Recommended):**
```bash
# 1. Setup (first time only)
./scripts/setup.sh

# 2. Start all services
./scripts/start.sh

# 3. Check status
./scripts/status.sh

# 4. Stop when done
./scripts/stop.sh
```

**Manual Start (Advanced):**
```bash
# Terminal 1: Backend
source .venv/bin/activate
uvicorn assistant.core.orchestrator:app --reload

# Terminal 2: Frontend
source .venv/bin/activate
streamlit run assistant/modules/voice/main.py
```

**Access:**
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Chat UI: http://localhost:8501

**All Scripts:** See [scripts/README.md](scripts/README.md)

---

## System Architecture

```
User → Streamlit Chat UI
           ↓
    FastAPI Orchestrator (Event Bus)
           ↓
    Modules (voice, memory, email, planner, BIL)
           ↓
    SQLite + FAISS (persistent storage)
```

**Event Flow:**
```
Scheduler → morning_checkin event → BIL → console output
Scheduler → evening_reflection event → BIL → goal tracking
```

---

## Module System

All modules follow the **register() contract:**

```python
def register(app, publish, subscribe):
    """Register module with orchestrator"""
    app.include_router(router, prefix="/module")  # Add API routes
    subscribe("event_name", handle_event)         # Listen to events
    publish("module_loaded", {"name": "module"})  # Announce loaded
```

**Enable/Disable Modules:**
Edit `assistant/configs/module_registry.yaml`:
```yaml
modules:
  - name: voice
    enabled: true  # Set to false to disable
```

---

## API Endpoints

**Memory:**
- `POST /memory/add` - Store memory entry
- `GET /memory/recall` - Retrieve similar memories

**Tasks:**
- `POST /tasks/add` - Create task (urgency, importance, effort)
- `GET /tasks/list` - Get prioritized task list

**Email:**
- `GET /emails/summarise` - Get email summary (stub in Phase 1)

**Test with curl:**
```bash
curl -X POST http://localhost:8000/memory/add \
  -H "Content-Type: application/json" \
  -d '{"content":"Remember to buy coffee"}'

curl http://localhost:8000/tasks/list
```

---

## Phase-Gated Development

**Current Phase:** Phase 1 MVP

**Workflow:**
1. Work only in active phase (`planning/phase_1_mvp/`)
2. Implement tasks per `tasks.md`
3. Verify per `acceptance_tests.md`
4. Update `planning/progress.yaml` when complete

**Phase Progression:**
```
Phase 1 (MVP) → Phase 2 (Behaviour) → Phase 3 (Planner) → Phase 4 (Fitness) → Phase 5 (Expansion)
```

---

## Testing

**Manual Testing:**
1. Start backend: `uvicorn assistant.core.orchestrator:app --reload`
2. Check console output: Should see "✅ Loaded module: ..." for each module
3. Start Streamlit: `streamlit run assistant/modules/voice/main.py`
4. Type message in chat, verify stub reply
5. Test API: `curl http://localhost:8000/tasks/list`

**Automated Testing (Future):**
```bash
pytest tests/
black assistant/
mypy assistant/
```

---

## Definition of Done (Per Phase)

Before marking a phase complete:

- ✅ **Acceptance tests pass** - All criteria in `acceptance_tests.md`
- ✅ **No cross-module imports** - Event bus only
- ✅ **Documentation updated** - Code comments + README updates
- ✅ **progress.yaml updated** - Phase status changed to `completed`

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `docs/system_design_blueprint.md` | **Comprehensive architecture** (read this first!) |
| `docs/IMPLEMENTATION_CONTROL_PLAN.md` | Implementation batches and verification |
| `.cursorrules` | 26 development rules |
| `claude.md` | AI assistant context |
| `planning/progress.yaml` | Phase status tracker |

---

## Common Commands

```bash
# Run backend (FastAPI)
uvicorn assistant.core.orchestrator:app --reload

# Run frontend (Streamlit)
streamlit run assistant/modules/voice/main.py

# Format code
black assistant/

# Type check
mypy assistant/

# Run tests
pytest

# Database shell
sqlite3 assistant/data/memory.db

# View logs
tail -f logs/app.log  # (if logging configured)
```

---

## Troubleshooting

**Import errors:**
```bash
# Ensure virtual env is activated
source .venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Module not loading:**
- Check `assistant/configs/module_registry.yaml` - module enabled?
- Check console for error messages
- Verify module has `register(app, publish, subscribe)` function

**Database not found:**
```bash
# Create database from schema
sqlite3 assistant/data/memory.db < assistant/data/schema.sql
```

---

## Next Steps

1. **Read:** `docs/system_design_blueprint.md` for full architecture
2. **Implement:** Phase 1 MVP per `planning/phase_1_mvp/tasks.md`
3. **Test:** Verify acceptance tests pass
4. **Document:** Log decisions in `docs/DECISIONS.md`

---

## Getting Help

- **Architecture Questions:** See `docs/system_design_blueprint.md`
- **Implementation Plan:** See `docs/IMPLEMENTATION_CONTROL_PLAN.md`
- **Module Development:** See `claude.md` for AI assistant guidance
- **Code Standards:** See `.cursorrules` for 26 Rules

---

**Welcome to AskSharon.ai! 🚀**
