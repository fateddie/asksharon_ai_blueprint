# AskSharon.ai - Implementation Control Plan

**Version:** 1.0
**Created:** 2025-11-05
**Purpose:** Master plan for implementing the complete Python-based AskSharon.ai blueprint

---

## 📋 Executive Summary

This document controls the implementation of **33 new files** from the AskSharon.ai blueprint, organized into **8 batches** with checkpoints for review and approval.

**Total Files:** 33
**Implementation Method:** Phased batches with user approval gates
**Estimated Time:** ~30-40 minutes (with reviews)
**Compliance:** 26 Rules from `.cursorrules`

---

## 🎯 Implementation Strategy

### Control Mechanism
1. **Batch Creation** - Files created in logical groups (3-6 files)
2. **Checkpoint** - User reviews and approves each batch
3. **Verification** - Compliance checks per batch
4. **Progression** - Move to next batch only after approval

### Benefits
- ✅ Maximum control over output
- ✅ Review small chunks at a time
- ✅ Easy to fix issues early
- ✅ Can pause/resume anytime
- ✅ Clear progress tracking

---

## 📊 Complete File Manifest

### Core System (3 files)
| # | File | Size | Purpose | Rules |
|---|------|------|---------|-------|
| 1 | `assistant/core/orchestrator.py` | ~70 lines | FastAPI app, event bus, module loader | #1, #3, #8, #10, #13 |
| 2 | `assistant/core/scheduler.py` | ~30 lines | Background scheduler for morning/evening | #24, #25 |
| 3 | `assistant/core/context_manager.py` | ~35 lines | SQLite + FAISS memory system | #8, #11, #13 |

### Modules (5 files)
| # | File | Size | Purpose | Rules |
|---|------|------|---------|-------|
| 4 | `assistant/modules/voice/main.py` | ~35 lines | Streamlit chat UI | #1, #3, #7 |
| 5 | `assistant/modules/memory/main.py` | ~30 lines | Memory add/recall endpoints | #4, #10, #14 |
| 6 | `assistant/modules/email/main.py` | ~20 lines | Email summary stub | #9 |
| 7 | `assistant/modules/planner/main.py` | ~35 lines | Task management with scoring | #4, #14 |
| 8 | `assistant/modules/behavioural_intelligence/main.py` | ~35 lines | BIL event handlers | #1, #25 |

### Configuration & Data (3 files)
| # | File | Size | Purpose | Rules |
|---|------|------|---------|-------|
| 9 | `assistant/configs/module_registry.yaml` | ~15 lines | Module enable/disable config | #19 |
| 10 | `assistant/data/schema.sql` | ~50 lines | 5 database tables | #8, #11 |
| 11 | `assistant/data/seeds.json` | ~15 lines | Sample test data | #18 |

### Planning Documentation (14 files)
| # | File | Size | Purpose | Rules |
|---|------|------|---------|-------|
| 12 | `planning/progress.yaml` | ~12 lines | Phase status tracker | #18, #21 |
| 13 | `planning/phase_1_mvp/goal.md` | ~10 lines | Phase 1 objectives | #18 |
| 14 | `planning/phase_1_mvp/tasks.md` | ~12 lines | Phase 1 tasks | #21 |
| 15 | `planning/phase_1_mvp/acceptance_tests.md` | ~10 lines | Phase 1 tests | #12 |
| 16 | `planning/phase_2_behaviour/goal.md` | ~10 lines | Phase 2 objectives | #18 |
| 17 | `planning/phase_2_behaviour/tasks.md` | ~10 lines | Phase 2 tasks | #21 |
| 18 | `planning/phase_2_behaviour/acceptance_tests.md` | ~8 lines | Phase 2 tests | #12 |
| 19 | `planning/phase_3_planner/goal.md` | ~8 lines | Phase 3 objectives | #18 |
| 20 | `planning/phase_3_planner/tasks.md` | ~8 lines | Phase 3 tasks | #21 |
| 21 | `planning/phase_3_planner/acceptance_tests.md` | ~6 lines | Phase 3 tests | #12 |
| 22 | `planning/phase_4_fitness/goal.md` | ~8 lines | Phase 4 objectives | #18 |
| 23 | `planning/phase_4_fitness/tasks.md` | ~8 lines | Phase 4 tasks (NEW) | #21 |
| 24 | `planning/phase_4_fitness/acceptance_tests.md` | ~6 lines | Phase 4 tests | #12 |
| 25 | `planning/phase_5_expansion/goal.md` | ~6 lines | Phase 5 objectives | #18 |
| 26 | `planning/phase_5_expansion/tasks.md` | ~6 lines | Phase 5 tasks | #21 |
| 27 | `planning/phase_5_expansion/acceptance_tests.md` | ~6 lines | Phase 5 tests (NEW) | #12 |

### Documentation (5 files)
| # | File | Size | Purpose | Rules |
|---|------|------|---------|-------|
| 28 | `docs/phase1_implementation_plan.md` | ~60 lines | Phase 1 guide | #3, #18 |
| 29 | `docs/architecture.puml` | ~50 lines | PlantUML system diagram | #3, #20 |
| 30 | `docs/system_design_blueprint.md` | ~400 lines | Master architecture doc | #3, #7, #18 |
| 31 | `DEVELOPER_ONBOARDING.md` | ~40 lines | Quick start guide | #3 |
| 32 | `docs/IMPLEMENTATION_CONTROL_PLAN.md` | ~600 lines | This file | #18, #21 |

**TOTAL: 33 files, ~1,500 lines of code/docs**

---

## 🔄 Implementation Batches

### BATCH 0: Control Document ✅ (CURRENT)
**Status:** Creating now
**Files:** 1 file (this document)
**Purpose:** Establish master plan and control mechanism

**Checkpoint:** User reviews control plan before proceeding

---

### BATCH 1: Core Infrastructure
**Status:** Pending approval
**Files:** 3 files
**Dependencies:** None (foundation layer)

**Files:**
1. `assistant/core/orchestrator.py`
2. `assistant/core/scheduler.py`
3. `assistant/core/context_manager.py`

**Purpose:** Establish FastAPI app, event bus, memory system

**Verification Checklist:**
- [ ] orchestrator.py has publish/subscribe functions
- [ ] orchestrator.py loads modules from YAML
- [ ] scheduler.py has morning/evening jobs
- [ ] context_manager.py has recall/store functions
- [ ] All have type hints (Rule #13)
- [ ] All have docstrings (Rule #3)
- [ ] All have error handling (Rule #10)

**Checkpoint:** Verify core files compile and have correct structure

---

### BATCH 2: Configuration
**Status:** Pending
**Files:** 3 files
**Dependencies:** None (data layer)

**Files:**
9. `assistant/configs/module_registry.yaml`
10. `assistant/data/schema.sql`
11. `assistant/data/seeds.json`

**Purpose:** Define module registry and database structure

**Verification Checklist:**
- [ ] module_registry.yaml has 5 modules listed
- [ ] schema.sql creates 5 tables
- [ ] seeds.json has sample tasks and goals
- [ ] Schema matches context_manager.py expectations
- [ ] YAML follows Rule #19 (tech stack)

**Checkpoint:** Verify config files are valid YAML/SQL/JSON

---

### BATCH 3: Modules Part 1
**Status:** Pending
**Files:** 3 files
**Dependencies:** Batch 1 (orchestrator.py)

**Files:**
4. `assistant/modules/voice/main.py`
5. `assistant/modules/memory/main.py`
6. `assistant/modules/email/main.py`

**Purpose:** Core functionality modules

**Verification Checklist:**
- [ ] Each has register(app, publish, subscribe) function
- [ ] voice/main.py has streamlit_chat() function
- [ ] memory/main.py has /add and /recall endpoints
- [ ] email/main.py has /summarise endpoint
- [ ] All follow module contract (Rule #1)
- [ ] All have FastAPI routers (Rule #4)

**Checkpoint:** Test module registration works

---

### BATCH 4: Modules Part 2
**Status:** Pending
**Files:** 2 files
**Dependencies:** Batch 1 (orchestrator.py)

**Files:**
7. `assistant/modules/planner/main.py`
8. `assistant/modules/behavioural_intelligence/main.py`

**Purpose:** Advanced modules (planner + BIL)

**Verification Checklist:**
- [ ] planner/main.py has priority scoring formula
- [ ] planner/main.py has /add and /list endpoints
- [ ] BIL/main.py subscribes to morning_checkin
- [ ] BIL/main.py subscribes to evening_reflection
- [ ] Both follow event bus pattern (Rule #1)
- [ ] Pydantic models for validation (Rule #14)

**Checkpoint:** All 5 modules can load together

---

### BATCH 5: Planning Phase 1
**Status:** Pending
**Files:** 4 files
**Dependencies:** None (documentation)

**Files:**
12. `planning/progress.yaml`
13. `planning/phase_1_mvp/goal.md`
14. `planning/phase_1_mvp/tasks.md`
15. `planning/phase_1_mvp/acceptance_tests.md`

**Purpose:** Phase 1 MVP planning documentation

**Verification Checklist:**
- [ ] progress.yaml sets phase_1 to not_started
- [ ] goal.md lists 5 MVP objectives
- [ ] tasks.md lists 7 concrete tasks
- [ ] acceptance_tests.md has 6 test criteria
- [ ] Follows planning structure (Rule #18)

**Checkpoint:** Phase 1 planning complete

---

### BATCH 6: Planning Phases 2-3
**Status:** Pending
**Files:** 6 files
**Dependencies:** None (documentation)

**Files:**
16-18. Phase 2 Behaviour (goal, tasks, acceptance_tests)
19-21. Phase 3 Planner (goal, tasks, acceptance_tests)

**Purpose:** Behaviour and Planner phase planning

**Verification Checklist:**
- [ ] Phase 2 has BIL goals and tasks
- [ ] Phase 3 has calendar integration tasks
- [ ] All follow same structure as Phase 1
- [ ] Acceptance tests are measurable

**Checkpoint:** Mid-phase planning done

---

### BATCH 7: Planning Phases 4-5
**Status:** Pending
**Files:** 5 files
**Dependencies:** None (documentation)

**Files:**
22-24. Phase 4 Fitness (goal, tasks, acceptance_tests)
25-27. Phase 5 Expansion (goal, tasks, acceptance_tests)

**Purpose:** Fitness and Expansion phase planning

**Verification Checklist:**
- [ ] Phase 4 has fitness tracking goals
- [ ] Phase 5 has plugin expansion tasks
- [ ] Missing files created (tasks/acceptance_tests)
- [ ] Consistent with earlier phases

**Checkpoint:** All phase planning complete

---

### BATCH 8: Documentation
**Status:** Pending
**Files:** 4 files
**Dependencies:** All previous batches (references them)

**Files:**
28. `docs/phase1_implementation_plan.md`
29. `docs/architecture.puml`
30. `docs/system_design_blueprint.md`
31. `DEVELOPER_ONBOARDING.md`

**Purpose:** Comprehensive system documentation

**Verification Checklist:**
- [ ] phase1_implementation_plan.md matches Phase 1 tasks
- [ ] architecture.puml shows all components
- [ ] system_design_blueprint.md is comprehensive
- [ ] DEVELOPER_ONBOARDING.md has 5-step setup
- [ ] All reference existing files correctly

**Checkpoint:** Documentation complete

---

## 🔍 Verification Matrix

### Per-File Compliance (26 Rules)

| Rule Category | Files Affected | Verification Method |
|--------------|----------------|---------------------|
| **#1-3: Module Architecture** | Core + Modules (8 files) | Check register() contract, <200 lines, docstrings present |
| **#4-7: API & Performance** | Modules (5 files) | Check FastAPI routers, async patterns, API docstrings |
| **#8-12: DB & Errors** | Core + Modules (11 files) | Check SQLAlchemy usage, error handling, type hints |
| **#13-17: Security & Types** | All Python (11 files) | Check type hints, Pydantic models, env validation |
| **#18-23: Process** | Planning + Docs (19 files) | Check planning first, consistent patterns, file paths |
| **#24-26: Automation** | Core + Modules (8 files) | Check notifications, self-healing patterns |

### Post-Implementation Tests

**After Batch 1-4 (All code):**
```bash
# Type checking
mypy assistant/

# Code formatting
black --check assistant/

# Import verification
python -c "from assistant.core.orchestrator import app"
```

**After Batch 5-7 (Planning):**
```bash
# Verify YAML
python -c "import yaml; yaml.safe_load(open('planning/progress.yaml'))"

# Count phase files (should be 14)
find planning/ -type f | wc -l
```

**After Batch 8 (Documentation):**
```bash
# Verify PlantUML syntax
plantuml -checkonly docs/architecture.puml

# Count total files created
find assistant/ planning/ docs/ DEVELOPER_ONBOARDING.md -type f | wc -l
```

---

## 📐 Dependency Graph

```
Batch 0 (Control Plan)
    ↓
Batch 1 (Core) ← Required by Batch 3 & 4
    ↓
Batch 2 (Config) ← Required by Batch 1
    ↓
Batch 3 (Modules 1-3) ← Requires Batch 1
    ↓
Batch 4 (Modules 4-5) ← Requires Batch 1
    ↓
Batch 5 (Planning P1) ← Independent
    ↓
Batch 6 (Planning P2-3) ← Independent
    ↓
Batch 7 (Planning P4-5) ← Independent
    ↓
Batch 8 (Documentation) ← References all batches
```

---

## 🎛️ User Control Points

### At Each Checkpoint You Can:

1. **Approve & Continue** - Proceed to next batch
2. **Request Changes** - Modify specific files before proceeding
3. **Pause** - Stop and resume later
4. **Skip** - Skip a batch if not needed
5. **Reorder** - Change batch sequence
6. **Add Requirements** - Request additional files/changes

### How to Control:

**Approve:**
```
"Looks good, proceed to Batch N"
"Continue"
"Next batch"
```

**Request Changes:**
```
"Change file X to have Y"
"Add Z to file X"
"Rewrite file X with..."
```

**Pause:**
```
"Pause here"
"Stop, I'll review later"
```

---

## 📈 Progress Tracking

### Current Status
- ✅ **Batch 0:** IMPLEMENTATION_CONTROL_PLAN.md (COMPLETE)
- ⏸️ **Batch 1:** Awaiting approval
- ⏸️ **Batch 2:** Awaiting Batch 1
- ⏸️ **Batch 3:** Awaiting Batch 1
- ⏸️ **Batch 4:** Awaiting Batch 1
- ⏸️ **Batch 5:** Awaiting approval
- ⏸️ **Batch 6:** Awaiting approval
- ⏸️ **Batch 7:** Awaiting approval
- ⏸️ **Batch 8:** Awaiting all previous

### Completion Estimate
- **With approvals:** 30-40 minutes
- **Code only:** ~15 minutes
- **Planning only:** ~10 minutes
- **Documentation only:** ~10 minutes

---

## 🔐 Safety Measures

### What Will NOT Be Modified:
- ✅ `.cursorrules` (26 Rules)
- ✅ `claude.md` (AI context)
- ✅ `README.md` (project overview)
- ✅ `requirements.txt` (dependencies)
- ✅ `principles.md` (philosophy)
- ✅ `prompt_templates.md`
- ✅ Existing `docs/` files (Next.js docs)
- ✅ Any other existing files

### Only NEW Files:
All 33 files are **new creations** in empty directories or new paths.

---

## 📚 Reference Materials

### Source Blueprint:
All content based on specifications provided in chat:
- Orchestrator code
- Module implementations
- Schema definitions
- Planning structure
- Documentation outlines

### Rules Compliance:
See `.cursorrules` for complete 26 Rules reference.

### Architecture:
See `docs/system_design_blueprint.md` (will be created in Batch 8).

---

## 🚀 Next Steps

1. **Review this control plan**
2. **Approve proceeding to Batch 1** (Core Infrastructure)
3. **Review and approve each subsequent batch**
4. **Verify final implementation**

---

**Questions or concerns before proceeding?**

Ready to start Batch 1 when you approve.
