# Claude Code Coach Pack

Drop these files in your repo root. Start each session by referencing `claude_coach.md` and loading `principles.md`.

## Files

- `principles.md` — rules and rituals
- `claude_coach.md` — coaching-mode system prompt
- `session_checklist.md` — checklist
- `learning_log.md` — log insights
- `prompt_templates.md` — prompt starters
- `config/coach_config.yaml` — wrapper config
- `claude_coach.py` — Python wrapper script
- `README.md` — this guide

## Ritual

1. New task → open branch → run "Start Session" prompt.
2. Approve plan → act small → validate.
3. Capture insights in `learning_log.md`.
4. PR with diffs + validation evidence.

## Usage

### Option 1: Manual

Copy content from `claude_coach.md` and `principles.md` into Claude Code, then specify your task.

### Option 2: Python Wrapper

```bash
python claude_coach.py "your task description"
```

This loads all coaching context and generates a complete prompt to paste into Claude Code.

## Project Context

This Coach Pack is configured for a **Personal Assistant** project with:

- Next.js 14 + TypeScript + App Router
- Supabase backend
- DaisyUI styling
- Vercel deployment

See `claude.md` for full project specifications and `config/coach_config.yaml` for configuration details.

