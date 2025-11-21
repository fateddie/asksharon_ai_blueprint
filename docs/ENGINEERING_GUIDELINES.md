# Engineering Guidelines – AskSharon

These guidelines define how code in this repo should be structured.

They **extend** the project-level principles defined in:

- `docs/principles.md`

If there is any conflict between this file and `docs/principles.md`,
**`docs/principles.md` takes precedence.**

---

## 1. Current Architecture Overview

AskSharon is currently organised as:

```text
assistant/
  core/           # core logic, shared behaviour
  modules/        # feature/integration modules
    voice/
    email/
    calendar/
    planner/
    behavioural_intelligence/
```

Plus separate UI code (e.g. Streamlit / frontend entrypoints).

For now we treat:
- `assistant/core/` as the **Core layer**
- `assistant/modules/*` as the **Modules / Services layer**
- Any UI files (Streamlit, web frontend) as the **UI layer**

A future refactor may migrate this to a standard structure:

```text
app/
  api/
  core/
  services/
  db/
ui/
```

That refactor is tracked separately in `docs/FUTURE_REFACTOR.md`.

---

## 2. Layered Architecture Rules (AskSharon v1)

### 2.1 Layers

Conceptual layers in this repo:

- **UI layer**
  - Any Streamlit / web frontend files (e.g. under `ui/` or top-level app entry).
  - Responsible only for display & user interaction.

- **Core layer**
  - `assistant/core/`
  - Business rules, workflows, shared domain logic.

- **Modules / Services layer**
  - `assistant/modules/` and its subpackages (email, calendar, planner, voice, behavioural_intelligence).
  - Integrations, concrete features, external API wrappers.

Later we may introduce explicit `api/` and `db/` layers; for now this guideline covers what exists.

### 2.2 Allowed dependencies

- **UI layer MAY**:
  - Call backend services via clearly defined functions or HTTP APIs.
  - Import thin client wrappers if we define them later.

- **Core layer MAY**:
  - Import and use `assistant/modules/*` where needed.

- **Modules / Services layer MAY**:
  - Import shared utilities from `assistant/core` only if they are generic and reusable,
    not business-logic that belongs in core.

### 2.3 Forbidden dependencies (conceptual)

- **UI MUST NOT**:
  - Import `assistant.core` directly for heavy business logic.
  - Import `assistant.modules` directly for low-level integrations.
  - Talk to DB or external APIs directly.

- **Core MUST NOT**:
  - Import any UI code (no knowledge of Streamlit / web frameworks).

- **Modules SHOULD NOT**:
  - Import UI code.
  - Embed UI concerns (rendering, formatting for display, etc.).

These rules are partially enforced automatically by `tools/check_architecture.py`.

---

## 3. Separation of Concerns

- **UI code**:
  - Handles layout, forms, navigation, and interaction.
  - Delegates decisions and data operations to core/modules via clear functions/APIs.
  - Does not contain complex business logic.

- **Core code** (`assistant/core`):
  - Implements business rules, workflows and decision logic.
  - Converts inputs from UI/services into decisions and output structures.
  - Avoids direct knowledge of UI frameworks or external HTTP clients where possible.

- **Modules** (`assistant/modules`):
  - Encapsulate feature-specific behaviour (email, calendar, planner, voice, behavioural intelligence).
  - Wrap external APIs, SDKs, and third-party integrations behind clean interfaces.
  - Should not depend on UI.

---

## 4. Data Models & Single Source of Truth

- Each important domain concept (e.g. task, appointment, goal, email context) should have
  a clear, canonical representation (e.g. a dataclass, Pydantic model, or similar).

- Avoid multiple slightly-different versions of the same concept scattered around the code.

- External systems remain the source of truth for their own data, e.g.:
  - Gmail / Calendar own raw email and calendar data.
  - AskSharon owns internal status, notes, metadata (e.g. task state, priority, behavioural tags).

Whenever possible, centralise shared models in `assistant/core` (or a dedicated models module)
rather than duplicating structures inside each module.

---

## 5. Pure vs Impure Functions

- Prefer **pure functions** in `assistant/core` for core decision-making:
  - Same input → same output.
  - No external I/O (no network calls, no DB, no direct Gmail/Calendar calls).

- Impure operations (network, file system, database, environment) should be encapsulated in:
  - `assistant/modules/*` (or dedicated integration wrappers),
  - or clearly-marked boundary functions.

This makes it easier to:
- Test important logic,
- Reuse logic across UI, agents, and future APIs,
- Evolve modules without breaking core behaviour.

---

## 6. Error Handling & Logging

- Avoid bare `except:` blocks. Always catch specific exception types.
- Do not silently swallow errors that affect system behaviour.
- Prefer:
  - Logging meaningful errors at module boundaries,
  - Returning structured error information up to the caller.

If/when a central logging util is introduced, modules should use that consistently.

---

## 7. Testing Expectations

- Any non-trivial logic in `assistant/core` SHOULD have unit tests under `tests/unit/`.
- Modules that wrap external APIs should have:
  - At least basic integration tests (possibly with mocks),
  - Or smoke tests that verify end-to-end behaviour in a safe environment.

We are not enforcing a strict testing percentage, but core logic should be testable
and tested where it matters.

---

## 8. Architecture Checker

This repo includes `tools/check_architecture.py`, which enforces a subset of these rules by:
- Scanning imports in `.py` files.
- Blocking obvious violations of layering (e.g. UI importing `assistant.core` or `assistant.modules`).

All code changes are expected to pass this checker.

If a change legitimately needs to break a rule, it MUST be documented in code comments
and ideally in an issue or `docs/FUTURE_REFACTOR.md`, and the rules updated consciously,
not accidentally.

---

## 9. UI Testing Requirements (Streamlit, Mandatory for New Features)

AskSharon currently uses **Streamlit** for its UI.
UI bugs are expensive, and subjective "it seems to work" is not acceptable.

For **any new UI feature or behaviour change**, the following rules apply:

### 9.1 Scope – What counts as UI?

For now, "UI" means:

- **Streamlit-based user interfaces**:
  - Streamlit entrypoints or pages that users interact with (e.g., `assistant/modules/voice/main.py`).

Later, when we add a web frontend (React/Next), these rules will be extended, but they currently apply only to the Streamlit UI.

### 9.2 When tests are required

A Playwright E2E test is **required** when:

- A new UI feature is added (new button, form, page, or interaction).
- Existing UI behaviour is changed (e.g. different flow, new data displayed, changed response).

Tests are **recommended but not strictly required** for:

- Purely cosmetic changes (styling only).
- Minor bug fixes that do not change the overall flow.

### 9.3 What the E2E test must cover

For each new/changed UI feature, Claude (or any AI assistant) MUST:

1. **Create a Playwright E2E test** under:
   - `tests/e2e/test_<feature>_ui.py`

2. **Use the correct Playwright configuration**:
   - Config file: `tests/e2e/conftest.py` (or `playwright.config.ts` if created)
   - All UI tests must use this shared configuration

3. The test MUST verify at least:

   - ✅ The relevant UI element(s) exist on the page (e.g. button, input field, link)
   - ✅ The element is visible and interactive (not hidden/disabled)
   - ✅ The user interaction works (clicks, form submissions, navigation, etc.)
   - ✅ The correct result appears in the UI (new data shown, list updated, confirmation message, etc.)
   - ✅ No obvious error state is shown in the UI (e.g. no visible error banner unless this is the expected behaviour)

4. **Minimum bar for valid tests**:
   - A test that only checks `page.goto()` without meaningful assertions **DOES NOT COUNT**
   - Tests must verify: element exists + interaction works + result appears
   - Empty/trivial tests that pass but don't test behavior are **INVALID**

A typical pattern:

```python
def test_create_task_button_adds_task_to_list(page):
    """E2E: Create Task button creates a task and shows it in the list."""
    # Navigate to the app
    page.goto("http://localhost:8501")

    # Verify button exists and is visible
    button = page.get_by_role("button", name="Create Task")
    assert button.is_visible()

    # Fill the form
    page.fill("input[name='task_title']", "Test Task")

    # Click the button
    button.click()

    # Allow async operations to complete
    page.wait_for_timeout(500)

    # Verify the task appears in the UI
    task_item = page.get_by_text("Test Task")
    assert task_item.is_visible()

    # Verify no error state
    assert "error" not in page.content().lower()
```

### 9.4 Execution requirement (Medium strictness)

- The E2E test must be **executed** before claiming the UI feature "works".
- The expected command (or equivalent) is:

```bash
pytest tests/e2e/test_<feature>_ui.py -v
```

Claude MUST:
- Write the test,
- Show the test code,
- Show the passing test output (or explain failures honestly).

This is a **MEDIUM strictness** rule:
- The test MUST be written and run.
- Whether the test is "good enough" is a human decision.
- The system does not yet hard-block changes based solely on missing tests, but any claim that "the UI works" without a passing E2E test is considered invalid.

### 9.5 Forbidden behaviour

The following are explicitly forbidden:
- ❌ Claiming "the UI/button/flow works" without a Playwright E2E test for new/changed features.
- ❌ Writing a test but not executing it.
- ❌ Assuming functionality works because "it should work" or because it passes manual poking only.
- ❌ Introducing new UI flows without adding or updating E2E coverage.
- ❌ Writing trivial tests (goto-only, no assertions) to game the rule.

### 9.6 Future extensions (not enforced yet)

These may be added later, but are out of scope for now:
- Performance assertions (page load time, interaction latency).
- Visual regression baselines and screenshot comparison.
- Automated accessibility (a11y) checks.

For now, focus is on functional correctness of UI flows.

**See also:** `docs/UI_TESTING_STANDARDS.md` for comprehensive testing guide.

---

## 10. AI / Claude Usage Rules

Claude and any AI agents MUST:

1. Read this file and `docs/principles.md` before major changes.
2. Use the **Plan → Implement → Self-review** workflow for any substantial feature (see `docs/AI_WORKFLOW.md`).
3. In the Self-review, explicitly state:
   - Any violations of these guidelines.
   - Any tight coupling between layers.
   - Any duplicated models or logic.

---

**Version**: 1.1
**Last Updated**: 2025-11-21
**Maintained By**: Engineering Team
