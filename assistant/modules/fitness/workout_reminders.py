"""
Workout Logging Reminders (Phase 4.5+)
======================================
Reminder system for logging workouts that integrates with BIL routines.

Reminders are triggered during evening/morning routines if:
- A workout was completed but not logged
- User hasn't logged for X days despite active goals
"""

import json
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


def check_unlogged_workouts() -> Dict[str, Any]:
    """
    Check if there are unlogged workouts in the queue.

    Returns:
        {
            "has_unlogged": bool,
            "count": int,
            "workouts": list of {session_id, date, reminder_count}
        }
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT session_id, workout_date, reminder_count
                FROM workout_logging_queue
                WHERE status = 'pending'
                ORDER BY workout_date DESC
            """
            )
        ).fetchall()

    workouts = [{"session_id": r[0], "date": r[1], "reminder_count": r[2]} for r in rows]

    return {
        "has_unlogged": len(workouts) > 0,
        "count": len(workouts),
        "workouts": workouts,
    }


def get_workout_logging_reminder() -> Optional[Dict[str, Any]]:
    """
    Get reminder message for workout logging if needed.

    Called during evening/morning routines.

    Returns:
        Reminder dict or None if no reminder needed
    """
    unlogged = check_unlogged_workouts()

    if not unlogged["has_unlogged"]:
        return None

    count = unlogged["count"]
    latest = unlogged["workouts"][0] if unlogged["workouts"] else None

    if count == 1 and latest:
        return {
            "type": "workout_logging",
            "urgency": "normal",
            "message": f"📝 You completed a workout on {latest['date']} but haven't logged it yet.",
            "action": "Log your workout performance to track progress.",
            "session_id": latest["session_id"],
        }
    elif count > 1:
        return {
            "type": "workout_logging",
            "urgency": "high" if count >= 3 else "normal",
            "message": f"📝 You have {count} unlogged workouts!",
            "action": "Take a moment to log your workout performance.",
            "count": count,
        }

    return None


def add_to_logging_queue(session_id: int, workout_date: Optional[date] = None) -> int:
    """
    Add a completed workout to the logging queue.

    Called when a workout session ends.

    Args:
        session_id: The workout session ID
        workout_date: Date of the workout (default: today)

    Returns:
        Queue entry ID
    """
    if workout_date is None:
        workout_date = date.today()

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT OR IGNORE INTO workout_logging_queue (
                    session_id, workout_date, reminder_count, status, created_at
                ) VALUES (
                    :session_id, :date, 0, 'pending', :created_at
                )
            """
            ),
            {
                "session_id": session_id,
                "date": workout_date.isoformat(),
                "created_at": datetime.now().isoformat(),
            },
        )
        row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
        if row is None:
            raise RuntimeError("Failed to get last insert rowid")
        return int(row[0])


def mark_workout_logged(session_id: int) -> bool:
    """
    Mark a workout as logged in the queue.

    Args:
        session_id: The workout session ID

    Returns:
        True if successful
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE workout_logging_queue
                SET status = 'logged', logged_at = :logged_at
                WHERE session_id = :session_id
            """
            ),
            {"session_id": session_id, "logged_at": datetime.now().isoformat()},
        )
        return result.rowcount > 0


def increment_reminder_count(session_id: int, channel: str = "routine") -> int:
    """
    Increment reminder count when a reminder is shown.

    Args:
        session_id: The workout session ID
        channel: Where the reminder was shown (routine, notification, etc.)

    Returns:
        New reminder count
    """
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE workout_logging_queue
                SET reminder_count = reminder_count + 1,
                    last_reminder_at = :now,
                    reminder_channel = :channel
                WHERE session_id = :session_id
            """
            ),
            {
                "session_id": session_id,
                "now": datetime.now().isoformat(),
                "channel": channel,
            },
        )

        row = conn.execute(
            text("SELECT reminder_count FROM workout_logging_queue WHERE session_id = :session_id"),
            {"session_id": session_id},
        ).fetchone()

        return row[0] if row else 0


def skip_logging(session_id: int) -> bool:
    """
    Mark a workout as skipped (user chose not to log).

    Args:
        session_id: The workout session ID

    Returns:
        True if successful
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE workout_logging_queue
                SET status = 'skipped'
                WHERE session_id = :session_id
            """
            ),
            {"session_id": session_id},
        )
        return result.rowcount > 0


def get_days_since_last_workout() -> int:
    """
    Get the number of days since the last logged workout.

    Returns:
        Number of days (0 if today, -1 if never)
    """
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT MAX(date(started_at))
                FROM workout_sessions
                WHERE status = 'completed'
            """
            )
        ).fetchone()

    if not row or not row[0]:
        return -1

    last_date = datetime.fromisoformat(row[0]).date()
    return (date.today() - last_date).days


def check_needs_workout_reminder() -> Optional[Dict[str, Any]]:
    """
    Check if user needs a reminder to work out.

    Based on:
    - Days since last workout
    - Active goals
    - Weekly workout targets

    Returns:
        Reminder dict or None
    """
    days_since = get_days_since_last_workout()

    if days_since < 0:
        return {
            "type": "workout_motivation",
            "message": "💪 You haven't logged any workouts yet. Start your first one!",
            "action": "Go to Fitness tab to begin.",
        }

    # Check if user has active goals
    with engine.connect() as conn:
        goals_row = conn.execute(
            text("SELECT COUNT(*) FROM fitness_goals WHERE status = 'active'")
        ).fetchone()
        has_goals = goals_row[0] > 0 if goals_row else False

    if days_since >= 3 and has_goals:
        return {
            "type": "workout_motivation",
            "urgency": "high" if days_since >= 5 else "normal",
            "message": f"💪 It's been {days_since} days since your last workout.",
            "action": "Get back on track with today's workout!",
            "days_since": days_since,
        }

    return None


def get_evening_routine_fitness_items() -> List[Dict[str, Any]]:
    """
    Get fitness-related items for evening routine.

    Returns list of items to display:
    - Unlogged workouts
    - Tomorrow's workout preview
    - Goal progress updates
    """
    items = []

    # Check unlogged workouts
    logging_reminder = get_workout_logging_reminder()
    if logging_reminder:
        items.append(logging_reminder)

    # Check if workout needed
    workout_reminder = check_needs_workout_reminder()
    if workout_reminder:
        items.append(workout_reminder)

    return items


def get_morning_routine_fitness_items() -> List[Dict[str, Any]]:
    """
    Get fitness-related items for morning routine.

    Returns list of items to display:
    - Today's workout preview
    - Unlogged workouts from yesterday
    - Goal progress
    """
    items = []

    # Check unlogged workouts
    logging_reminder = get_workout_logging_reminder()
    if logging_reminder:
        items.append(logging_reminder)

    # Get today's workout preview
    from assistant.modules.fitness.training_intelligence import get_training_adjustment_for_day

    adjustment = get_training_adjustment_for_day(date.today())
    workout_type = adjustment["workout_type"]

    if workout_type == "rest":
        items.append(
            {
                "type": "workout_preview",
                "message": "🛋️ Rest day recommended today.",
                "workout_type": "rest",
            }
        )
    else:
        items.append(
            {
                "type": "workout_preview",
                "message": f"💪 Today's focus: {workout_type.replace('_', ' ').title()}",
                "workout_type": workout_type,
                "recommendations": adjustment.get("recommendations", []),
            }
        )

    return items
