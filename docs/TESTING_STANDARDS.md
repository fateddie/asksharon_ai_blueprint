# Testing Standards for AskSharon.ai

## Overview

This document defines testing standards for the AskSharon.ai project, with emphasis on **Rule 27: Verify UI Interactions with E2E Tests**.

---

## Rule 27: Verify UI Interactions with E2E Tests

**Purpose:** Ensure all interactive UI elements (buttons, links, forms) are verified with automated E2E tests before claiming they work.

**Requirement:** Before responding to the user that a UI feature "works", you MUST:
1. Write a Playwright test that verifies the interaction
2. Run the test and confirm it passes
3. Capture screenshots for visual verification
4. Include test results in your response

---

## When to Write Playwright Tests

### REQUIRED (Must Test):
- ✅ New buttons added to UI (sidebar, header, main area)
- ✅ New links or navigation elements
- ✅ Form submissions
- ✅ Interactive widgets (dropdowns, toggles, modals)
- ✅ Any element that triggers backend API calls
- ✅ Multi-step user flows (e.g., OAuth flow, multi-page forms)

### OPTIONAL (Nice to Have):
- 🟡 Static content changes (text, styling)
- 🟡 Non-interactive visual elements
- 🟡 Console logging or debugging output

### NOT REQUIRED:
- ❌ Backend-only changes (no UI impact)
- ❌ Configuration file updates
- ❌ Documentation changes

---

## Test File Naming Convention

**Pattern:** `tests/test_<component>_<interaction>.py`

**Examples:**
- `tests/test_button_clicks.py` - Tests for sidebar button interactions
- `tests/test_frontend_e2e.py` - General frontend E2E tests
- `tests/test_calendar_oauth.py` - Tests for OAuth flow
- `tests/test_chat_input.py` - Tests for chat input functionality

---

## Playwright Test Structure

### Basic Button Click Test Template

```python
"""
Test template for verifying button clicks with Playwright
"""

import pytest
from playwright.sync_api import Page, expect
import time


@pytest.fixture(scope="session")
def base_url():
    return "http://localhost:8501"


def test_<feature>_button_actually_works(page: Page, base_url: str):
    """Test that clicking '<Feature>' button actually displays <expected_result>"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)  # Wait for Streamlit to fully render

    # Take screenshot before click
    page.screenshot(path="tests/screenshots/before_<feature>_click.png")

    # Find the button
    button = page.get_by_role("button", name="<Button Label>")

    # Verify button exists and is visible
    assert button.count() > 0, "<Feature> button not found"
    expect(button.first).to_be_visible()

    # Click the button
    print("🖱️  Clicking '<Feature>' button...")
    button.first.click()

    # Wait for response
    time.sleep(8)  # Wait for backend processing

    # Take screenshot after click
    page.screenshot(path="tests/screenshots/after_<feature>_click.png")

    # Check that expected content appeared
    page_content = page.content()
    print(f"📄 Page content length after click: {len(page_content)}")

    # Assert expected keywords in response
    has_expected_content = any(keyword in page_content for keyword in [
        "<expected_keyword_1>",
        "<expected_keyword_2>",
        "<expected_keyword_3>"
    ])

    assert has_expected_content, "❌ <Feature> button click did not display expected content"
    print("✅ <Feature> button works!")
```

---

## Real-World Example: Events Button Test

From session 2025-11-15 (timezone bug fix):

```python
def test_events_button_actually_works(page: Page, base_url: str):
    """Test that clicking 'Today's Events' button actually displays events"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    # Take screenshot before click
    page.screenshot(path="tests/screenshots/before_events_click.png")

    # Find the events button
    events_button = page.get_by_role("button", name="📅 Today's Events")

    # Verify button exists and is visible
    assert events_button.count() > 0, "Events button not found"
    expect(events_button.first).to_be_visible()

    # Click the button
    print("🖱️  Clicking 'Today's Events' button...")
    events_button.first.click()

    # Wait for response
    time.sleep(8)

    # Take screenshot after click
    page.screenshot(path="tests/screenshots/after_events_click.png")

    # Check that events content appeared
    page_content = page.content()
    print(f"📄 Page content length after click: {len(page_content)}")

    # Should see events or "no events" message
    has_event_content = any(keyword in page_content for keyword in [
        "Upcoming Events",
        "Today's Events",
        "No upcoming events",
        "event(s)",
        "GOOGLE CALENDAR",
        "FROM EMAIL"
    ])

    assert has_event_content, "❌ Events button click did not display event content"
    print("✅ Events button works!")
```

**Result:** This test caught a timezone comparison bug that caused the button to display an error instead of events!

---

## Screenshot Verification Pattern

### Always Capture:
1. **Before interaction** - Shows initial UI state
2. **After interaction** - Shows result of user action

### Screenshot Naming:
```
tests/screenshots/
├── before_events_click.png
├── after_events_click.png
├── before_goals_click.png
├── after_goals_click.png
└── sidebar_buttons.png  # For multi-button overview
```

### Viewing Screenshots:
```bash
# In test output, look for paths like:
# tests/screenshots/after_events_click.png

# Use Read tool to view:
Read(file_path="/path/to/screenshot.png")
```

---

## Running Playwright Tests

### Run All E2E Tests
```bash
source .venv/bin/activate
pytest tests/test_frontend_e2e.py -c pytest_e2e.ini -v
```

### Run Specific Button Tests
```bash
source .venv/bin/activate
pytest tests/test_button_clicks.py -c pytest_e2e.ini -v
```

### Run Single Test with Output
```bash
source .venv/bin/activate
pytest tests/test_button_clicks.py::test_events_button_actually_works -c pytest_e2e.ini -v -s
```

### Debug Mode (Show Browser)
```bash
PWDEBUG=1 pytest tests/test_button_clicks.py::test_events_button_actually_works -c pytest_e2e.ini -s
```

---

## Test Configuration

### pytest_e2e.ini
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*

addopts =
    -v
    --tb=short
    --maxfail=3

markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    e2e: marks tests as end-to-end tests

filterwarnings =
    ignore::UserWarning
    ignore::DeprecationWarning
```

---

## Best Practices

### 1. Test What the User Experiences
**Good:**
```python
# Test actual click → response flow
button.click()
time.sleep(8)  # Wait for full backend processing
assert "expected_content" in page.content()
```

**Bad:**
```python
# Just check button exists
assert button.is_visible()
# User can't tell if clicking it actually works!
```

### 2. Wait for Full Rendering
```python
# Streamlit needs time to process and re-render
page.goto(base_url)
page.wait_for_load_state("networkidle")
time.sleep(3)  # Wait for Streamlit initialization

button.click()
time.sleep(8)  # Wait for: API call → backend processing → re-render
```

### 3. Use Specific Selectors
```python
# ✅ GOOD - Specific role and name
button = page.get_by_role("button", name="📅 Today's Events")

# 🟡 OK - Text selector
button = page.get_by_text("Today's Events").first

# ❌ BAD - Generic CSS selector (brittle)
button = page.locator("button:nth-child(3)")
```

### 4. Print Debug Information
```python
print("🖱️  Clicking 'Events' button...")
time.sleep(8)
print(f"📄 Page content length after click: {len(page_content)}")
print("✅ Events button works!")
```

This helps diagnose failures in test output.

### 5. Create Screenshots Directory
```bash
mkdir -p tests/screenshots
```

Tests will fail if the directory doesn't exist.

---

## Common Issues and Solutions

### Issue 1: Test Passes But Button Doesn't Actually Work

**Symptom:** Test finds button and passes, but clicking shows error message.

**Cause:** Test only verified button existence, not the result of clicking it.

**Solution:** Check page content AFTER clicking for expected response:
```python
button.click()
time.sleep(8)
page_content = page.content()

# Verify actual response, not just "something happened"
assert "Expected Success Message" in page_content
assert "Error" not in page_content  # Also check for errors!
```

**Real Example:** Events button test initially passed because button existed, but clicking it showed timezone error. Fixed by asserting for event content after click.

---

### Issue 2: Timeout - Element Not Found

**Symptom:** `Error: Timeout 30000ms exceeded waiting for element`

**Causes:**
1. Frontend not fully started
2. Wrong selector
3. Element dynamically rendered

**Solutions:**
```python
# 1. Increase wait time for Streamlit
time.sleep(5)  # Instead of 2

# 2. Try multiple selectors
button = page.get_by_role("button", name="Events") or \
         page.get_by_text("📅 Today's Events").first

# 3. Wait for specific element
page.wait_for_selector("button:has-text('Events')", timeout=10000)
```

---

### Issue 3: Screenshot Shows Old/Cached Content

**Symptom:** Screenshot shows error even after fix applied.

**Cause:** Frontend not restarted after code changes.

**Solution:**
```bash
# Restart services to pick up code changes
./scripts/stop.sh
./scripts/start.sh

# Clear Python cache
rm -rf assistant/__pycache__ assistant/modules/__pycache__

# Clear screenshots to force fresh capture
rm tests/screenshots/*.png
```

---

## Checklist: Before Claiming "It Works"

When adding or fixing UI features, verify:

- [ ] Created Playwright test in `tests/test_<component>.py`
- [ ] Test verifies: element exists → click works → backend called → correct response
- [ ] Screenshots captured (before/after)
- [ ] Test passed locally
- [ ] Screenshot reviewed visually (no error messages)
- [ ] Test included in response to user
- [ ] Test added to CI/CD pipeline (if applicable)

**If ANY checkbox is unchecked, DO NOT claim the feature works.**

---

## Integration with Development Workflow

### Rule 27 Workflow:

```
1. User reports: "Button X doesn't work"
   ↓
2. Claude investigates and fixes code
   ↓
3. Claude writes Playwright test for Button X
   ↓
4. Claude runs test: pytest tests/test_button_X.py
   ↓
5. Test PASSES → Claude responds: "✅ Fixed, test passed"
   Test FAILS → Claude debugs further (screenshot shows error)
   ↓
6. Claude includes test results + screenshot in response
```

### Integration with Checklist (from .cursorrules):

```markdown
## Checklist Before Commit
- [ ] Follows Rules 1-27
- [ ] pytest passes
- [ ] black formatting applied
- [ ] mypy type checks pass
- [ ] Error handling implemented
- [ ] Notifications added
- [ ] Docstrings complete
- [ ] Decision logged in DECISIONS.md
- [ ] Playwright E2E tests pass (for UI changes)  ← Rule 27
```

---

## Test Coverage Goals

### Current Coverage (as of 2025-11-15):

**Sidebar Buttons:** ✅ 100% (4/4)
- ✅ Today's Events
- ✅ My Goals
- ✅ My Tasks
- ✅ Weekly Review

**Chat Input:** ✅ Verified
**Backend API Endpoints:** ✅ 100% (6/6)
**Natural Language Queries:** ✅ Verified

### Future Coverage:

- [ ] OAuth flow (calendar, Gmail)
- [ ] Data Verification section (expandable)
- [ ] Chat message flow (multi-turn)
- [ ] Error handling (network timeout, API errors)
- [ ] Mobile responsive design

---

## References

- **Playwright Documentation:** https://playwright.dev/python/docs/intro
- **Rule 27:** `.cursorrules` line 63
- **Example Tests:** `tests/test_button_clicks.py`
- **Session Reference:** 2025-11-15 (timezone bug fix + Rule 27 creation)

---

## Version History

- **v1.0** (2025-11-15): Initial testing standards established
  - Rule 27 added to .cursorrules
  - Button click test patterns documented
  - Screenshot verification workflow defined

---

**Remember: Tests are not optional. They are the proof that your code works.**
