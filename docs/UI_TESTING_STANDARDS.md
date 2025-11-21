# UI Testing Standards (E2E with Playwright)

This document defines how UI features must be tested using Playwright.

The goal is simple:

> No one (human or AI) is allowed to claim "the UI works" without a passing E2E test for new or changed UI flows.

---

## 1. Scope

For now:

- In **AskSharon**:
  - UI = Streamlit app(s) (e.g., `assistant/modules/voice/main.py`)

In future/template projects:

- UI = Any web UI (Streamlit, React, Next.js, etc.) that end users interact with in a browser.

---

## 2. When E2E tests are required

E2E tests are **required** when:

- You add a **new UI feature**:
  - New button, form, input, page, or interactive flow.
- You **change behaviour** of an existing UI flow:
  - Different result after clicking a button,
  - Different navigation,
  - Different data rendered.

E2E tests are **recommended but not strictly required** for:

- Purely cosmetic changes (styling, text only).
- Tiny bug fixes that do not materially change the user flow.

---

## 3. Where tests live

- All UI E2E tests live under:

  ```text
  tests/e2e/test_<feature>_ui.py
  ```

- Playwright setup (fixtures, drivers, etc.) should live in:
  - `tests/e2e/conftest.py` (or `playwright.config.ts` if you create one).

**Important:** Don't create duplicate Playwright configs. Use the existing one.

---

## 4. What each E2E test must verify

At minimum, each test for a new/changed UI feature must:

1. **Navigate to the relevant page**
   - e.g. `page.goto("http://localhost:8501")`

2. **Assert the important UI elements exist and are visible**
   - Buttons, links, inputs, labels, etc.
   - Use: `page.get_by_role()`, `page.get_by_text()`, etc.

3. **Perform the user action**
   - Click button, submit form, follow link, etc.
   - e.g. `button.click()`, `page.fill()`, `page.press()`

4. **Wait for the expected effect**
   - Small timeout or explicit wait for element/state.
   - e.g. `page.wait_for_timeout(500)` or `page.wait_for_selector()`

5. **Assert the correct result appears in the UI**
   - Examples:
     - New row appears in list.
     - Confirmation message appears.
     - Error message appears (if you are testing error paths).

6. **Avoid obviously broken states**
   - No generic error banners unless they're the intended outcome.
   - No blank screens where data is expected.

**Minimum bar:** A test that only does `page.goto()` with no meaningful assertions **DOES NOT COUNT**.

---

## 5. Test Pattern Example

```python
def test_create_task_button_creates_task_and_shows_in_list(page):
    """
    E2E Test: Create Task button creates a task and displays it in the list.

    User flow:
    1. Navigate to app
    2. Fill in task form
    3. Click "Create Task" button
    4. Verify task appears in task list
    5. Verify no errors shown
    """
    # 1. Navigate
    page.goto("http://localhost:8501")

    # 2. Verify button exists
    create_button = page.get_by_role("button", name="Create Task")
    assert create_button.is_visible(), "Create Task button not found"

    # 3. Fill form
    page.fill("input[name='task_title']", "Buy groceries")
    page.fill("textarea[name='task_description']", "Milk, eggs, bread")

    # 4. Click button
    create_button.click()

    # 5. Wait for async operation
    page.wait_for_timeout(500)

    # 6. Verify task appears in UI
    task_item = page.get_by_text("Buy groceries")
    assert task_item.is_visible(), "Task not found in list after creation"

    # 7. Verify no error state
    page_content = page.content().lower()
    assert "error" not in page_content, "Error message found on page"
    assert "failed" not in page_content, "Failure message found on page"
```

---

## 6. Execution requirement

Before anyone (human or AI) can claim "the UI feature works", they MUST:

1. **Write or update the relevant E2E test(s).**
2. **Run them**, for example:

   ```bash
   pytest tests/e2e/test_<feature>_ui.py -v
   ```

3. **Confirm they pass.**

For AI tools (Claude, etc.) this means:
- Show the test code.
- Show the passing test output (or transparently report failures).

**Strictness level = MEDIUM:**
- Writing + running tests is mandatory.
- A human decides if coverage is sufficient.

---

## 7. Forbidden behaviour

The following are explicitly forbidden:

- ❌ Claiming "the UI works" without a Playwright E2E test for new/changed features.
- ❌ Writing a test but not executing it.
- ❌ Assuming functionality works because "it should work" based on manual testing only.
- ❌ Writing trivial tests (goto-only, no assertions) to game the rule.
- ❌ Creating duplicate Playwright configs instead of using the existing one.

---

## 8. Out of scope (for now)

We may add these later, but they are not required yet:

- **Performance thresholds** (page load time < 2s, click latency < 500ms).
- **Visual regression baselines** (screenshot comparison with baseline images).
- **Accessibility (a11y) automation** (WCAG compliance checks).

For now, the focus is on **functional correctness** of user flows.

---

## 9. Common Playwright Patterns

### Pattern: Test button click

```python
def test_button_triggers_action(page):
    page.goto("http://localhost:8501")
    button = page.get_by_role("button", name="Submit")
    button.click()
    assert page.get_by_text("Success").is_visible()
```

### Pattern: Test form submission

```python
def test_form_submission(page):
    page.goto("http://localhost:8501")
    page.fill("input[name='email']", "test@example.com")
    page.fill("input[name='password']", "secret123")
    page.click("button[type='submit']")
    page.wait_for_url("**/dashboard")
    assert "dashboard" in page.url
```

### Pattern: Test list updates

```python
def test_item_appears_in_list(page):
    page.goto("http://localhost:8501")
    initial_count = page.locator(".list-item").count()
    page.click("button:has-text('Add Item')")
    page.wait_for_timeout(500)
    new_count = page.locator(".list-item").count()
    assert new_count == initial_count + 1
```

### Pattern: Test error handling

```python
def test_error_message_appears_on_invalid_input(page):
    page.goto("http://localhost:8501")
    page.fill("input[name='age']", "-5")  # Invalid input
    page.click("button:has-text('Submit')")
    error_msg = page.get_by_text("Age must be positive")
    assert error_msg.is_visible()
```

---

## 10. Playwright Configuration

**Location:** `tests/e2e/conftest.py`

Example minimal configuration:

```python
import pytest
from playwright.sync_api import sync_playwright

@pytest.fixture(scope="function")
def page():
    """Provide a Playwright page for each test."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        yield page
        context.close()
        browser.close()
```

**Don't create additional configs** - use this shared one for all UI tests.

---

## 11. Quick Start for New Tests

1. **Create test file**: `tests/e2e/test_my_feature_ui.py`
2. **Import pytest and use page fixture**:
   ```python
   def test_my_feature(page):
       # Your test here
       pass
   ```
3. **Write test following Section 4 checklist**
4. **Run**: `pytest tests/e2e/test_my_feature_ui.py -v`
5. **Verify passing output**

---

## 12. Summary

- **New/changed UI flows must have Playwright E2E tests.**
- **Tests must check:** element exists → user action works → correct result shows.
- **Tests must be run and pass** before we declare "the UI works".
- **Cosmetic-only changes** are the main allowed exception.
- **Medium strictness:** Tests mandatory, coverage adequacy is human judgment.

---

**Version**: 1.0
**Last Updated**: 2025-11-21
**Maintained By**: Engineering Team
