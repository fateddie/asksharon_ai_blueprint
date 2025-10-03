# Claude Code — Agentic Coding Principles (Coach Pack)

A reusable framework to keep your Claude Code sessions aligned with best practices from the *Claude Code: A Highly Agentic Coding Assistant* course and Anthropic guidance.

## Core Principles
1. **Agentic workflow (Model + Tools + Environment)**  
   - Treat Claude Code as an *agent* that plans and acts via tools in your local environment.
2. **Prefer tool use over giant prompts**  
   - Retrieve exactly what you need (read/search/edit/test) instead of pasting whole codebases.
3. **Agentic search, not full indexing**  
   - Let the assistant find relevant files on demand; avoid sending full repos by default.
4. **Project memory** (`claude.md` / `principles.md`)  
   - Persist style guides, conventions, and preferences in local markdown files loaded each session.
5. **Plan → act → check**  
   - Break work into steps (discover → design → implement → test → review). Make the plan explicit.
6. **Extensibility**  
   - Add MCP tools or custom utilities (linters, Playwright, Firecrawl, CI, Postman collections, etc.).
7. **Beyond "write code"**  
   - Use Claude Code for discovery, explanation, refactoring, debugging, docs, analysis, and visualization.
8. **Simplicity & transparency**  
   - Keep the system simple; surface plans, assumptions, and tool calls for inspection.
9. **Guardrails & validation**  
   - Prefer executable tests and checks (unit tests, type checks, linters) over vibes.
10. **Human-in-the-loop**  
   - Accept/deny edits, inspect diffs, and run tests at each milestone.

---

## Coaching Rules
- At session start: load `principles.md` and `claude.md`. Summarize constraints.
- For each task: propose a plan (steps, tools, tests). Get consent.
- While acting: keep changes small, reversible, visible. Explain *why* each step maps to a principle.
- After action: reflect on adherence, list deviations, suggest next improvements.
- If context is missing: ask for artifacts (ERDs, API specs, style guides, tests) before coding.
- When risky: use scratch files and safe diffs; minimize destructive edits.

---

## Tags (shorthand)
- **A**: Agentic (1)  
- **T**: Tool-first (2)  
- **S**: Agentic search (3)  
- **M**: Memory used (4)  
- **P**: Planned steps (5)  
- **X**: Extensible/tools (6)  
- **D**: Discovery/Docs (7)  
- **Z**: Transparency (8)  
- **V**: Validation/tests (9)  
- **H**: Human loop (10)

Example: `(A,T,P,V,H)`

---

## Pre-flight Checklist
- [ ] Architecture/ERD available
- [ ] API specs/contracts linked
- [ ] Style guide/lint rules loaded
- [ ] Test strategy defined
- [ ] Env vars & secrets handled safely
- [ ] Rollback plan (git branch, diffs)

---

## Builder–Reviewer Loop
1. **Builder** proposes minimal diffs.  
2. **Reviewer** critiques against specs, style, and principles.  
3. Iterate until validation passes, then merge.

---

## Orchestration > Model Power
Prefer a tight workflow:
- Context configs (`principles.md`, `claude.md`)
- Tooling (search/read/edit/test/run)
- Validation gates (tests/linters/CI)
- Human review

---

## Prompt Templates (Quick Start)
- **Session start:** "Load project memory, summarize constraints, propose plan + tests; act in small reversible steps; coach me as we go."
- **Design:** "Before coding, explain current behavior, alternatives, trade-offs, and test impact."
- **Refactor:** "Identify hotspots with minimal risky change; provide diffs + rationale; include tests."
- **Debug:** "Reproduce, hypothesize, patch, add regression tests."
- **Docs:** "Generate concise developer docs tied to real code and tests."

---

## Security Defaults
- Minimize code exfiltration; prefer local tools.
- Redact secrets; never print tokens/keys.
- Use least-privilege when running shell commands.

