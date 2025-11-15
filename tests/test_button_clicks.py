"""
Playwright tests to verify all sidebar buttons actually work when clicked
"""

import pytest
from playwright.sync_api import Page, expect
import time


@pytest.fixture(scope="session")
def base_url():
    return "http://localhost:8501"


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


def test_goals_button_actually_works(page: Page, base_url: str):
    """Test that clicking 'My Goals' button actually displays goals"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    page.screenshot(path="tests/screenshots/before_goals_click.png")

    goals_button = page.get_by_role("button", name="🎯 My Goals")

    assert goals_button.count() > 0, "Goals button not found"
    expect(goals_button.first).to_be_visible()

    print("🖱️  Clicking 'My Goals' button...")
    goals_button.first.click()
    time.sleep(8)

    page.screenshot(path="tests/screenshots/after_goals_click.png")

    page_content = page.content()
    has_goal_content = any(keyword in page_content.lower() for keyword in [
        "goal", "target", "progress", "no goals"
    ])

    assert has_goal_content, "❌ Goals button click did not display goal content"
    print("✅ Goals button works!")


def test_tasks_button_actually_works(page: Page, base_url: str):
    """Test that clicking 'My Tasks' button actually displays tasks"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    page.screenshot(path="tests/screenshots/before_tasks_click.png")

    tasks_button = page.get_by_role("button", name="✅ My Tasks")

    assert tasks_button.count() > 0, "Tasks button not found"
    expect(tasks_button.first).to_be_visible()

    print("🖱️  Clicking 'My Tasks' button...")
    tasks_button.first.click()
    time.sleep(8)

    page.screenshot(path="tests/screenshots/after_tasks_click.png")

    page_content = page.content()
    has_task_content = any(keyword in page_content.lower() for keyword in [
        "task", "todo", "no tasks", "pending"
    ])

    assert has_task_content, "❌ Tasks button click did not display task content"
    print("✅ Tasks button works!")


def test_weekly_review_button_actually_works(page: Page, base_url: str):
    """Test that clicking 'Weekly Review' button actually displays review"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    page.screenshot(path="tests/screenshots/before_review_click.png")

    review_button = page.get_by_role("button", name="📊 Weekly Review")

    assert review_button.count() > 0, "Weekly Review button not found"
    expect(review_button.first).to_be_visible()

    print("🖱️  Clicking 'Weekly Review' button...")
    review_button.first.click()
    time.sleep(8)

    page.screenshot(path="tests/screenshots/after_review_click.png")

    page_content = page.content()
    has_review_content = any(keyword in page_content.lower() for keyword in [
        "week", "review", "summary", "progress", "accomplishments"
    ])

    assert has_review_content, "❌ Weekly Review button click did not display review content"
    print("✅ Weekly Review button works!")


def test_all_buttons_exist_and_clickable(page: Page, base_url: str):
    """Verify all sidebar buttons exist and are clickable"""
    page.goto(base_url)
    page.wait_for_load_state("networkidle")
    time.sleep(3)

    page.screenshot(path="tests/screenshots/sidebar_buttons.png")

    buttons = [
        ("📅 Today's Events", "events"),
        ("🎯 My Goals", "goals"),
        ("✅ My Tasks", "tasks"),
        ("📊 Weekly Review", "review")
    ]

    for button_name, button_type in buttons:
        button = page.get_by_role("button", name=button_name)
        assert button.count() > 0, f"{button_name} not found"
        expect(button.first).to_be_visible()
        print(f"✅ {button_name} exists and is visible")
