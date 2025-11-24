"""
Fitness Goals Module (Phase 4.5)
================================
Track fitness goals with progress monitoring.
"""

from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")

# Goal type definitions
GOAL_TYPES = {
    "strength": {
        "name": "Strength",
        "description": "Increase strength (e.g., lift heavier)",
        "example": "Bench press 100kg",
        "units": ["kg", "lbs", "reps"],
    },
    "endurance": {
        "name": "Endurance",
        "description": "Improve cardiovascular or muscular endurance",
        "example": "Run 5K in 25 minutes",
        "units": ["minutes", "km", "miles"],
    },
    "skill": {
        "name": "Skill",
        "description": "Master a specific movement",
        "example": "Do 10 pull-ups",
        "units": ["reps", "seconds"],
    },
    "body_comp": {
        "name": "Body Composition",
        "description": "Change body composition",
        "example": "Reach 15% body fat",
        "units": ["kg", "lbs", "percent"],
    },
    "consistency": {
        "name": "Consistency",
        "description": "Build consistent habits",
        "example": "Work out 4x/week for 3 months",
        "units": ["days", "weeks", "workouts"],
    },
    "flexibility": {
        "name": "Flexibility",
        "description": "Improve mobility and flexibility",
        "example": "Touch toes comfortably",
        "units": ["cm", "score"],
    },
    "custom": {
        "name": "Custom",
        "description": "Custom fitness goal",
        "example": "Any measurable target",
        "units": ["custom"],
    },
}


def calculate_progress(start_value: float, current_value: float, target_value: float) -> float:
    """
    Calculate progress percentage toward goal.

    Args:
        start_value: Starting point
        current_value: Current value
        target_value: Target to reach

    Returns:
        Progress percentage (0-100)
    """
    if target_value == start_value:
        return 100.0 if current_value >= target_value else 0.0

    progress = (current_value - start_value) / (target_value - start_value) * 100
    return max(0.0, min(100.0, round(progress, 1)))


def estimate_completion_date(
    start_date: date,
    start_value: float,
    current_value: float,
    target_value: float,
) -> Optional[date]:
    """
    Estimate when goal will be achieved at current rate.

    Args:
        start_date: When goal was started
        start_value: Starting value
        current_value: Current value
        target_value: Target value

    Returns:
        Estimated completion date or None if no progress
    """
    days_elapsed = (date.today() - start_date).days
    if days_elapsed <= 0:
        return None

    progress_made = current_value - start_value
    if progress_made <= 0:
        return None

    remaining = target_value - current_value
    if remaining <= 0:
        return date.today()

    rate_per_day = progress_made / days_elapsed
    days_remaining = int(remaining / rate_per_day)

    return date.today() + timedelta(days=days_remaining)


def create_goal(
    goal_type: str,
    title: str,
    target_value: float,
    target_unit: str,
    start_value: float = 0,
    current_value: Optional[float] = None,
    description: Optional[str] = None,
    deadline: Optional[date] = None,
    exercise_id: Optional[int] = None,
) -> int:
    """
    Create a new fitness goal.

    Args:
        goal_type: Type of goal (strength/endurance/skill/etc.)
        title: Goal title (e.g., "Do 10 pull-ups")
        target_value: Target to reach
        target_unit: Unit of measurement
        start_value: Starting point (default 0)
        current_value: Current value (defaults to start_value)
        description: Optional description
        deadline: Optional deadline date
        exercise_id: Optional linked exercise

    Returns:
        Goal ID
    """
    if goal_type not in GOAL_TYPES:
        raise ValueError(f"Invalid goal type: {goal_type}")

    if current_value is None:
        current_value = start_value

    now = datetime.now().isoformat()
    start_date = date.today().isoformat()

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO fitness_goals (
                    goal_type, title, description, target_value, target_unit,
                    start_value, current_value, start_date, deadline, exercise_id,
                    status, created_at, updated_at
                ) VALUES (
                    :goal_type, :title, :description, :target_value, :target_unit,
                    :start_value, :current_value, :start_date, :deadline, :exercise_id,
                    'active', :created_at, :updated_at
                )
            """
            ),
            {
                "goal_type": goal_type,
                "title": title,
                "description": description,
                "target_value": target_value,
                "target_unit": target_unit,
                "start_value": start_value,
                "current_value": current_value,
                "start_date": start_date,
                "deadline": deadline.isoformat() if deadline else None,
                "exercise_id": exercise_id,
                "created_at": now,
                "updated_at": now,
            },
        )
        row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
        if row is None:
            raise RuntimeError("Failed to get last insert rowid")
        return int(row[0])


def update_goal_progress(goal_id: int, new_value: float, notes: Optional[str] = None) -> bool:
    """
    Update current value of a goal and log progress.

    Args:
        goal_id: Goal ID
        new_value: New current value
        notes: Optional notes

    Returns:
        True if updated
    """
    now = datetime.now().isoformat()
    today = date.today().isoformat()

    with engine.begin() as conn:
        # Get goal details
        goal = conn.execute(
            text("SELECT target_value, status FROM fitness_goals WHERE id = :id"),
            {"id": goal_id},
        ).fetchone()

        if not goal:
            return False

        target_value = goal[0]
        status = goal[1]

        # Check if goal achieved
        new_status = status
        achieved_at = None
        if new_value >= target_value and status == "active":
            new_status = "achieved"
            achieved_at = now

        # Update goal
        conn.execute(
            text(
                """
                UPDATE fitness_goals SET
                    current_value = :current_value,
                    status = :status,
                    achieved_at = :achieved_at,
                    updated_at = :updated_at
                WHERE id = :id
            """
            ),
            {
                "id": goal_id,
                "current_value": new_value,
                "status": new_status,
                "achieved_at": achieved_at,
                "updated_at": now,
            },
        )

        # Log progress entry
        conn.execute(
            text(
                """
                INSERT OR REPLACE INTO goal_progress (goal_id, logged_date, value, notes, created_at)
                VALUES (:goal_id, :logged_date, :value, :notes, :created_at)
            """
            ),
            {
                "goal_id": goal_id,
                "logged_date": today,
                "value": new_value,
                "notes": notes,
                "created_at": now,
            },
        )

        return True


def get_goal(goal_id: int) -> Optional[Dict[str, Any]]:
    """
    Get a specific goal with calculated fields.

    Args:
        goal_id: Goal ID

    Returns:
        Goal dictionary or None
    """
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, goal_type, title, description, target_value, target_unit,
                       start_value, current_value, start_date, deadline, exercise_id,
                       status, achieved_at, created_at, updated_at
                FROM fitness_goals WHERE id = :id
            """
            ),
            {"id": goal_id},
        ).fetchone()

    if not row:
        return None

    goal = {
        "id": row[0],
        "goal_type": row[1],
        "title": row[2],
        "description": row[3],
        "target_value": row[4],
        "target_unit": row[5],
        "start_value": row[6],
        "current_value": row[7],
        "start_date": row[8],
        "deadline": row[9],
        "exercise_id": row[10],
        "status": row[11],
        "achieved_at": row[12],
        "created_at": row[13],
        "updated_at": row[14],
    }

    # Add calculated fields
    goal["progress_pct"] = calculate_progress(
        goal["start_value"], goal["current_value"], goal["target_value"]
    )

    if goal["start_date"] and goal["status"] == "active":
        start_dt = date.fromisoformat(goal["start_date"])
        goal["estimated_completion"] = estimate_completion_date(
            start_dt, goal["start_value"], goal["current_value"], goal["target_value"]
        )
    else:
        goal["estimated_completion"] = None

    return goal


def get_active_goals() -> List[Dict[str, Any]]:
    """
    Get all active goals.

    Returns:
        List of active goals with progress
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, goal_type, title, target_value, target_unit,
                       start_value, current_value, start_date, deadline, status
                FROM fitness_goals
                WHERE status = 'active'
                ORDER BY deadline ASC NULLS LAST, created_at DESC
            """
            )
        ).fetchall()

    goals = []
    for row in rows:
        goal = {
            "id": row[0],
            "goal_type": row[1],
            "title": row[2],
            "target_value": row[3],
            "target_unit": row[4],
            "start_value": row[5],
            "current_value": row[6],
            "start_date": row[7],
            "deadline": row[8],
            "status": row[9],
        }
        goal["progress_pct"] = calculate_progress(
            goal["start_value"], goal["current_value"], goal["target_value"]
        )
        goals.append(goal)

    return goals


def get_all_goals(include_completed: bool = True) -> List[Dict[str, Any]]:
    """
    Get all goals.

    Args:
        include_completed: Include achieved/abandoned goals

    Returns:
        List of goals
    """
    query = """
        SELECT id, goal_type, title, target_value, target_unit,
               start_value, current_value, start_date, deadline, status, achieved_at
        FROM fitness_goals
    """
    if not include_completed:
        query += " WHERE status = 'active'"
    query += " ORDER BY status ASC, deadline ASC NULLS LAST"

    with engine.connect() as conn:
        rows = conn.execute(text(query)).fetchall()

    goals = []
    for row in rows:
        goal = {
            "id": row[0],
            "goal_type": row[1],
            "title": row[2],
            "target_value": row[3],
            "target_unit": row[4],
            "start_value": row[5],
            "current_value": row[6],
            "start_date": row[7],
            "deadline": row[8],
            "status": row[9],
            "achieved_at": row[10],
        }
        goal["progress_pct"] = calculate_progress(
            goal["start_value"], goal["current_value"], goal["target_value"]
        )
        goals.append(goal)

    return goals


def get_goal_progress_history(goal_id: int) -> List[Dict[str, Any]]:
    """
    Get progress history for a goal.

    Args:
        goal_id: Goal ID

    Returns:
        List of progress entries
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, logged_date, value, notes, created_at
                FROM goal_progress
                WHERE goal_id = :goal_id
                ORDER BY logged_date DESC
            """
            ),
            {"goal_id": goal_id},
        ).fetchall()

    return [
        {
            "id": row[0],
            "logged_date": row[1],
            "value": row[2],
            "notes": row[3],
            "created_at": row[4],
        }
        for row in rows
    ]


def abandon_goal(goal_id: int) -> bool:
    """
    Mark goal as abandoned.

    Args:
        goal_id: Goal ID

    Returns:
        True if updated
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE fitness_goals SET status = 'abandoned', updated_at = :updated_at
                WHERE id = :id AND status = 'active'
            """
            ),
            {"id": goal_id, "updated_at": datetime.now().isoformat()},
        )
        return result.rowcount > 0


def pause_goal(goal_id: int) -> bool:
    """
    Pause a goal.

    Args:
        goal_id: Goal ID

    Returns:
        True if updated
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE fitness_goals SET status = 'paused', updated_at = :updated_at
                WHERE id = :id AND status = 'active'
            """
            ),
            {"id": goal_id, "updated_at": datetime.now().isoformat()},
        )
        return result.rowcount > 0


def resume_goal(goal_id: int) -> bool:
    """
    Resume a paused goal.

    Args:
        goal_id: Goal ID

    Returns:
        True if updated
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE fitness_goals SET status = 'active', updated_at = :updated_at
                WHERE id = :id AND status = 'paused'
            """
            ),
            {"id": goal_id, "updated_at": datetime.now().isoformat()},
        )
        return result.rowcount > 0


def get_goal_recommendations(goal_id: int) -> Dict[str, Any]:
    """
    Get recommendations for achieving a goal.

    Args:
        goal_id: Goal ID

    Returns:
        Dictionary with recommendations
    """
    goal = get_goal(goal_id)
    if not goal:
        return {"error": "Goal not found"}

    recommendations = {
        "goal": goal["title"],
        "current_progress": f"{goal['progress_pct']}%",
        "remaining": goal["target_value"] - goal["current_value"],
        "remaining_unit": goal["target_unit"],
        "tips": [],
    }

    # Add specific tips based on progress
    if goal["progress_pct"] < 25:
        recommendations["tips"].append(
            "Focus on building consistency. Small daily progress adds up."
        )
    elif goal["progress_pct"] < 50:
        recommendations["tips"].append(
            "You're making progress! Consider slightly increasing intensity."
        )
    elif goal["progress_pct"] < 75:
        recommendations["tips"].append("Over halfway there! Stay consistent and trust the process.")
    else:
        recommendations["tips"].append("Almost there! Final push - you've got this!")

    # Deadline-based recommendations
    if goal["deadline"]:
        deadline = date.fromisoformat(goal["deadline"])
        days_left = (deadline - date.today()).days
        if days_left < 0:
            recommendations["warning"] = "Deadline has passed. Consider setting a new target date."
        elif days_left < 7:
            recommendations["tips"].append(f"Only {days_left} days left. Prioritize this goal!")
        elif goal["estimated_completion"] and goal["estimated_completion"] > deadline:
            recommendations["warning"] = (
                "At current rate, you may not hit your deadline. Consider increasing effort."
            )

    return recommendations
