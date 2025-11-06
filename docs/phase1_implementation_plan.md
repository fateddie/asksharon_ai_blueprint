# AskSharon.ai – Phase 1 Implementation Plan

## Objective
Local prototype with:
- Text/voice chat
- Persistent memory (SQLite + FAISS)
- Email summarisation (read-only)
- Daily planner checklist
- Morning/evening prompts

## Steps
1. **Env**
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   sqlite3 assistant/data/memory.db < assistant/data/schema.sql
   uvicorn assistant.core.orchestrator:app --reload
   streamlit run assistant/modules/voice/main.py
   ```

2. Orchestrator loads modules per YAML registry.
3. Scheduler triggers morning_checkin, evening_reflection.
4. Streamlit chat works with stubbed replies (voice optional now).
5. Memory endpoints: /memory/add, /memory/recall.
6. Email endpoint: /emails/summarise (stub).
7. Planner endpoints: /tasks/add, /tasks/list.

## Acceptance Tests (must pass)
- Conversation works via text (voice optional MVP).
- Memory recall persists across restart.
- /emails/summarise returns a summary payload.
- /tasks/list returns sorted priorities.
- Scheduler prints morning/evening prompts.

## Transition to Phase 2

Unlock Behavioural Intelligence Layer; add goals and behaviour_metrics handling; implement goal-reinforcement loop (gym/guitar).
