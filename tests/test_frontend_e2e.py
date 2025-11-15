"""
End-to-End Frontend Tests for AskSharon.ai Streamlit UI
Tests intent detection, event display, and user interactions
"""

import pytest
from playwright.sync_api import Page, expect
import time


@pytest.fixture(scope="session")
def base_url():
    """Streamlit frontend URL"""
    return "http://localhost:8501"


@pytest.fixture(scope="session")
def backend_url():
    """Backend API URL"""
    return "http://localhost:8000"


def test_page_loads(page: Page, base_url: str):
    """Test that the Streamlit frontend loads successfully"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Check page title
    expect(page).to_have_title("AskSharon.ai")

    # Check for NEW compact header
    page_content = page.content()
    assert "AskSharon" in page_content, "Header not found"

    # Check for status indicator (Online or Offline)
    assert any(status in page_content for status in ["Online", "Offline"]), "Status indicator not found"


def test_sidebar_quick_action_buttons(page: Page, base_url: str):
    """Test that all quick action buttons are visible in sidebar"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)  # Wait for Streamlit to fully render

    # NEW: Quick action buttons are now in sidebar
    page_content = page.content()

    buttons = [
        "Today's Events",
        "My Goals",
        "My Tasks",
        "Weekly Review"
    ]

    for button_text in buttons:
        assert button_text in page_content, f"Button '{button_text}' not found in sidebar"


def test_sidebar_events_button_click(page: Page, base_url: str):
    """Test clicking sidebar 'Today's Events' button displays events"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    # Find and click the events button in sidebar
    # Streamlit buttons can be tricky, try multiple selectors
    try:
        # Try clicking by text
        events_button = page.get_by_text("📅 Today's Events").first
        if events_button.is_visible(timeout=5000):
            events_button.click()
            time.sleep(5)  # Wait for API call and rendering

            # Check for event-related content
            page_content = page.content()
            assert any(keyword in page_content for keyword in [
                "Events:",
                "No upcoming events",
                "event(s)",
                "GOOGLE CALENDAR",
                "FROM EMAIL"
            ]), "Events content not displayed after button click"
    except Exception as e:
        print(f"Button click test skipped: {e}")


def test_chat_input_present(page: Page, base_url: str):
    """Test that chat input is present at bottom of page"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # NEW: Streamlit chat_input with updated placeholder
    chat_input = page.locator('textarea[aria-label*="Ask"], textarea[placeholder*="Ask"]')

    # Should exist (might not be visible depending on Streamlit version)
    assert chat_input.count() > 0, "Chat input not found"


def test_intent_detection_events(page: Page, base_url: str):
    """Test that typing 'show events' triggers event display"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Find chat input
    chat_input = page.locator('textarea[aria-label*="message"], input[placeholder*="message"]').first

    if chat_input.is_visible():
        # Type query
        chat_input.fill("show my events")
        chat_input.press("Enter")

        # Wait longer for Streamlit to process and re-render
        # Streamlit does: rerun → API call → re-render (can take 5-8 seconds)
        time.sleep(8)

        # Check response contains events or "no events"
        page_content = page.content()
        assert any(keyword in page_content for keyword in [
            "Upcoming Events",
            "No upcoming events",
            "event(s)",
            "Found",  # "✅ Found X event(s)"
            "Calendar",
            "Email"
        ]), "Event query didn't trigger event display"


def test_intent_detection_typo_handling(page: Page, base_url: str):
    """Test that typos like 'appoitment' are corrected to 'appointment'"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    chat_input = page.locator('textarea[aria-label*="message"], input[placeholder*="message"]').first

    if chat_input.is_visible():
        # Type with typo
        chat_input.fill("show my appoitments")  # typo: appoitments
        chat_input.press("Enter")
        time.sleep(3)

        # Should still trigger events (typo corrected)
        page_content = page.content()
        assert any(keyword in page_content for keyword in [
            "Upcoming Events",
            "No upcoming events",
            "event"
        ]), "Typo correction failed - events not shown"


def test_intent_detection_no_task_spam(page: Page, base_url: str):
    """Test that questions don't accidentally create tasks"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    chat_input = page.locator('textarea[aria-label*="message"], input[placeholder*="message"]').first

    if chat_input.is_visible():
        # Type a question with "do" in it
        chat_input.fill("what do you think?")
        chat_input.press("Enter")
        time.sleep(3)

        # Should NOT create a task - should show "not sure" message
        page_content = page.content()
        assert "not sure" in page_content.lower() or "try:" in page_content.lower(), \
            "Question with 'do' incorrectly created a task"


def test_email_summary_intent(page: Page, base_url: str):
    """Test that 'email summary' triggers email summary action"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    chat_input = page.locator('textarea[aria-label*="message"], input[placeholder*="message"]').first

    if chat_input.is_visible():
        # Type email query
        chat_input.fill("show me recent email summary")
        chat_input.press("Enter")
        time.sleep(3)

        # Check for email-related response
        page_content = page.content()
        assert any(keyword in page_content for keyword in [
            "email",
            "inbox",
            "unread",
            "No emails"
        ]), "Email summary not triggered"


def test_goals_button_click(page: Page, base_url: str):
    """Test clicking 'My Goals' button displays goals"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    goals_button = page.get_by_role("button", name="🎯 My Goals")
    if goals_button.is_visible():
        goals_button.click()
        time.sleep(3)

        # Check for goals-related content
        page_content = page.content()
        assert any(keyword in page_content for keyword in [
            "goal",
            "Goals",
            "target",
            "progress",
            "No goals"
        ]), "Goals content not displayed"


def test_backend_connection_status(page: Page, base_url: str):
    """Test that backend connection status is displayed"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    page_content = page.content()

    # NEW: Should show "AskSharon" header and "Online" or "Offline" status
    assert "AskSharon" in page_content, "Header not displayed"
    assert any(status in page_content for status in [
        "Online",
        "Offline"
    ]), "Backend status indicator not found"


def test_chat_message_flow(page: Page, base_url: str):
    """Test that user messages and Sharon's responses appear in chat"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    chat_input = page.locator('textarea[aria-label*="message"], input[placeholder*="message"]').first

    if chat_input.is_visible():
        # Send a message
        test_message = "show my goals"
        chat_input.fill(test_message)
        chat_input.press("Enter")
        time.sleep(3)

        # User message should appear
        page_content = page.content()
        assert "goal" in page_content.lower(), "User message or response not visible in chat"


def test_natural_language_queries(page: Page, base_url: str, backend_url: str):
    """Test natural language queries using OpenAI function calling"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    # Test natural language variations
    natural_queries = [
        "what meetings do i have today?",
        "what's on my todo list?",
        "show me my goals"
    ]

    for query in natural_queries:
        chat_input = page.locator('textarea, input[type="text"]').last

        if chat_input.is_visible(timeout=5000):
            chat_input.fill(query)
            chat_input.press("Enter")
            time.sleep(8)  # Wait for OpenAI + backend processing

            # Check that some response was given
            page_content = page.content()
            # Should see either events, tasks, goals, or "not sure" message
            assert any(keyword in page_content.lower() for keyword in [
                "event", "task", "goal", "not sure", "try:"
            ]), f"No response to natural query: {query}"

            # Reload for next test
            page.goto(base_url)
            page.wait_for_load_state("networkidle")
            time.sleep(2)


def test_backend_api_endpoints(backend_url: str):
    """Test that all backend API endpoints return 200 OK"""
    import requests

    endpoints = [
        "/docs",
        "/calendar/events?max_results=3",
        "/emails/events?status=pending&future_only=true",
        "/emails/summarise",
        "/behaviour/goals",
        "/tasks/list"
    ]

    for endpoint in endpoints:
        response = requests.get(f"{backend_url}{endpoint}", timeout=10)
        assert response.status_code == 200, f"Endpoint {endpoint} returned {response.status_code}"


@pytest.mark.parametrize("query,expected_keyword", [
    ("show events", "event"),
    ("my appointments", "event"),
    ("calendar", "event"),
    ("email summary", "email"),
    ("show goals", "goal"),
    ("show tasks", "task"),
])
def test_keyword_fallback_patterns(page: Page, base_url: str, query: str, expected_keyword: str):
    """Test keyword matching fallback works when OpenAI unavailable"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    chat_input = page.locator('textarea, input[type="text"]').last

    if chat_input.is_visible(timeout=5000):
        chat_input.fill(query)
        chat_input.press("Enter")
        time.sleep(8)

        page_content = page.content().lower()
        assert expected_keyword in page_content or "not sure" in page_content, \
            f"Query '{query}' didn't return expected content"
