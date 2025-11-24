"""
Workout Generator (Phase 4.5+)
==============================
Generates personalized, scientifically-backed workouts based on:
- User goals and their training requirements
- Available equipment
- Fitness level
- External activities (calendar awareness)
- Periodization phase
"""

import json
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text

from assistant.modules.fitness.training_intelligence import (
    get_training_requirements,
    get_training_adjustment_for_day,
    get_periodization_state,
    get_phase_adjustments,
    PERIODIZATION_PHASES,
)
from assistant.modules.fitness.equipment import get_user_equipment
from assistant.modules.fitness.user_profile import get_user_profile
from assistant.modules.fitness.goals import get_active_goals
from assistant.modules.fitness.exercise_seeds import (
    get_exercises_by_equipment,
    get_exercises_by_movement_pattern,
)

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


# =============================================================================
# WORKOUT TEMPLATES
# =============================================================================

# Base volume per fitness level (sets per workout)
BASE_VOLUME = {
    "beginner": {"min": 8, "max": 12, "exercises": 4},
    "intermediate": {"min": 12, "max": 18, "exercises": 5},
    "advanced": {"min": 16, "max": 24, "exercises": 6},
}

# Rep ranges per training focus
REP_RANGES = {
    "strength": {"min": 3, "max": 6, "rest_sec": 180},
    "power": {"min": 3, "max": 5, "rest_sec": 120},
    "hypertrophy": {"min": 8, "max": 12, "rest_sec": 90},
    "endurance": {"min": 15, "max": 20, "rest_sec": 60},
    "mobility": {"min": 1, "max": 3, "rest_sec": 30},  # For holds/flows
}

# Movement pattern distribution for balanced training
PATTERN_DISTRIBUTION = {
    "balanced": {
        "push": 0.2,
        "pull": 0.2,
        "squat": 0.15,
        "hinge": 0.15,
        "core": 0.15,
        "carry": 0.05,
        "mobility": 0.1,
    },
    "upper_focus": {
        "push": 0.3,
        "pull": 0.3,
        "squat": 0.1,
        "hinge": 0.1,
        "core": 0.1,
        "carry": 0.05,
        "mobility": 0.05,
    },
    "lower_focus": {
        "push": 0.1,
        "pull": 0.1,
        "squat": 0.25,
        "hinge": 0.25,
        "core": 0.15,
        "carry": 0.1,
        "mobility": 0.05,
    },
    "power_focus": {
        "push": 0.15,
        "pull": 0.15,
        "squat": 0.2,
        "hinge": 0.2,
        "core": 0.1,
        "explosive": 0.15,
        "mobility": 0.05,
    },
}


# =============================================================================
# WORKOUT GENERATION
# =============================================================================


def generate_workout(
    target_date: Optional[date] = None,
    workout_type_override: Optional[str] = None,
    focus_patterns: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Generate a personalized workout for a given date.

    Args:
        target_date: Date for the workout (default: today)
        workout_type_override: Override auto-detected type (normal, mobility, recovery_focus)
        focus_patterns: Specific movement patterns to focus on

    Returns:
        Complete workout with exercises, sets, reps, and justification
    """
    if target_date is None:
        target_date = date.today()

    # Gather context
    profile = get_user_profile() or {}
    equipment = get_user_equipment()
    equipment_types = [e["equipment_type"] for e in equipment]
    goals = get_active_goals()
    fitness_level = profile.get("experience_level", "intermediate")

    # Get calendar-based adjustments
    calendar_adj = get_training_adjustment_for_day(target_date)

    # Get periodization state
    period_state = get_periodization_state()
    if period_state:
        phase = period_state["current_phase"]
        phase_adj = get_phase_adjustments(phase)
    else:
        phase = "accumulation"
        phase_adj = PERIODIZATION_PHASES["accumulation"]

    # Determine workout type
    workout_type = workout_type_override or calendar_adj["workout_type"]

    # Handle special workout types
    if workout_type == "rest":
        return _generate_rest_day(target_date, calendar_adj)
    elif workout_type == "mobility":
        return _generate_mobility_workout(target_date, equipment_types, calendar_adj)

    # Determine training focus from goals
    training_focus = _determine_training_focus(goals)

    # Calculate volume adjustments
    base_vol = BASE_VOLUME.get(fitness_level, BASE_VOLUME["intermediate"])
    volume_mult = calendar_adj["volume_multiplier"] * phase_adj.get("sets_multiplier", 1.0)
    target_sets = int(base_vol["max"] * volume_mult)
    target_exercises = max(3, int(base_vol["exercises"] * volume_mult))

    # Select exercises based on goals and equipment
    exercises = _select_exercises(
        goals=goals,
        equipment_types=equipment_types,
        fitness_level=fitness_level,
        focus_patterns=focus_patterns,
        target_count=target_exercises,
    )

    # Assign sets and reps
    workout_exercises = _assign_sets_reps(
        exercises=exercises,
        training_focus=training_focus,
        total_sets=target_sets,
        phase=phase,
    )

    # Generate brief justification
    brief_justification = _generate_brief_justification(
        goals=goals,
        calendar_adj=calendar_adj,
        phase=phase,
        workout_type=workout_type,
    )

    # Calculate estimated duration
    total_work_time = sum(e["estimated_time_sec"] for e in workout_exercises)
    estimated_duration_min = int(total_work_time / 60) + 5  # +5 for transitions

    workout = {
        "date": target_date.isoformat(),
        "workout_type": workout_type,
        "fitness_level": fitness_level,
        "phase": phase,
        "exercises": workout_exercises,
        "total_sets": sum(e["sets"] for e in workout_exercises),
        "estimated_duration_min": estimated_duration_min,
        "brief_justification": brief_justification,
        "goals_addressed": [g["id"] for g in goals[:3]],  # Top 3 goals
        "equipment_used": list(set(e["equipment"] for e in workout_exercises)),
        "volume_adjustments": {
            "calendar_factor": calendar_adj["volume_multiplier"],
            "phase_factor": phase_adj.get("sets_multiplier", 1.0),
            "final_factor": volume_mult,
        },
        "generated_at": datetime.now().isoformat(),
    }

    # Save to database
    _save_workout_plan(workout)

    return workout


def _generate_rest_day(target_date: date, calendar_adj: Dict) -> Dict[str, Any]:
    """Generate a rest day recommendation."""
    return {
        "date": target_date.isoformat(),
        "workout_type": "rest",
        "exercises": [],
        "total_sets": 0,
        "estimated_duration_min": 0,
        "brief_justification": "Rest day - "
        + (
            calendar_adj["recommendations"][0]
            if calendar_adj["recommendations"]
            else "recovery focus"
        ),
        "goals_addressed": [],
        "equipment_used": [],
        "recommendations": [
            "Focus on sleep and nutrition",
            "Light walking is fine",
            "Foam rolling or stretching optional",
        ],
        "generated_at": datetime.now().isoformat(),
    }


def _generate_mobility_workout(
    target_date: date, equipment_types: List[str], calendar_adj: Dict
) -> Dict[str, Any]:
    """Generate a mobility-focused workout."""
    # Get mobility exercises
    mobility_exercises = get_exercises_by_movement_pattern("mobility")
    available = [
        e for e in mobility_exercises if e.get("equipment", "bodyweight") in equipment_types
    ]

    if not available:
        # Default bodyweight mobility
        available = [
            {"name": "Cat-Cow Stretch", "movement_pattern": "mobility", "equipment": "bodyweight"},
            {"name": "Hip Circles", "movement_pattern": "mobility", "equipment": "bodyweight"},
            {"name": "Arm Circles", "movement_pattern": "mobility", "equipment": "bodyweight"},
            {"name": "Deep Squat Hold", "movement_pattern": "mobility", "equipment": "bodyweight"},
        ]

    exercises = []
    for ex in available[:5]:
        exercises.append(
            {
                "name": ex.get("name", "Mobility Exercise"),
                "sets": 2,
                "reps": "30 sec hold",
                "rest_sec": 30,
                "movement_pattern": "mobility",
                "equipment": ex.get("equipment", "bodyweight"),
                "estimated_time_sec": 90,  # 2 sets x 30s + rest
            }
        )

    reason = (
        calendar_adj["recommendations"][0] if calendar_adj["recommendations"] else "active recovery"
    )

    return {
        "date": target_date.isoformat(),
        "workout_type": "mobility",
        "exercises": exercises,
        "total_sets": sum(e["sets"] for e in exercises),
        "estimated_duration_min": 15,
        "brief_justification": f"Mobility focus - {reason}",
        "goals_addressed": [],
        "equipment_used": ["bodyweight"],
        "generated_at": datetime.now().isoformat(),
    }


def _determine_training_focus(goals: List[Dict]) -> str:
    """Determine primary training focus from active goals."""
    if not goals:
        return "balanced"

    # Check goal categories
    categories = [g.get("goal_category") for g in goals if g.get("goal_category")]

    if "vertical_jump" in categories or "sport_performance" in categories:
        return "power"
    elif "strength" in categories:
        return "strength"
    elif "muscle_building" in categories:
        return "hypertrophy"
    elif "5k_time" in categories or "weight_loss" in categories:
        return "endurance"
    else:
        return "balanced"


def _select_exercises(
    goals: List[Dict],
    equipment_types: List[str],
    fitness_level: str,
    focus_patterns: Optional[List[str]],
    target_count: int,
) -> List[Dict]:
    """Select exercises based on goals, equipment, and patterns."""
    # Get all available exercises for user's equipment
    available = get_exercises_by_equipment(equipment_types)

    if not available:
        return []

    # Gather required movement patterns from goals
    required_patterns = set()
    for goal in goals:
        category = goal.get("goal_category")
        if category:
            reqs = get_training_requirements(category)
            required_patterns.update(reqs.get("movement_patterns", []))

    # Add focus patterns if specified
    if focus_patterns:
        required_patterns.update(focus_patterns)

    # Default to balanced patterns if none specified
    if not required_patterns:
        required_patterns = {"push", "pull", "squat", "hinge", "core"}

    # Select exercises covering required patterns
    selected = []
    patterns_covered = set()

    # First pass: one exercise per required pattern
    for pattern in required_patterns:
        matching = [e for e in available if e.get("movement_pattern") == pattern]
        if matching and len(selected) < target_count:
            # Filter by difficulty
            appropriate = _filter_by_difficulty(matching, fitness_level)
            if appropriate:
                selected.append(appropriate[0])
                patterns_covered.add(pattern)

    # Second pass: fill remaining slots
    remaining = target_count - len(selected)
    if remaining > 0:
        unused = [e for e in available if e not in selected]
        appropriate = _filter_by_difficulty(unused, fitness_level)
        selected.extend(appropriate[:remaining])

    return selected


def _filter_by_difficulty(exercises: List[Dict], fitness_level: str) -> List[Dict]:
    """Filter exercises appropriate for fitness level."""
    level_map = {"beginner": 1, "intermediate": 2, "advanced": 3}
    user_level = level_map.get(fitness_level, 2)

    # Map exercise difficulty strings to numbers
    def get_difficulty(ex):
        diff = ex.get("difficulty_level", "intermediate")
        return level_map.get(diff, 2)

    # Include exercises at or below user level, with preference for matching level
    appropriate = [e for e in exercises if get_difficulty(e) <= user_level]
    if not appropriate:
        appropriate = exercises

    # Sort by relevance to user level
    appropriate.sort(key=lambda e: abs(get_difficulty(e) - user_level))

    return appropriate


def _assign_sets_reps(
    exercises: List[Dict],
    training_focus: str,
    total_sets: int,
    phase: str,
) -> List[Dict]:
    """Assign sets, reps, and rest times to exercises."""
    if not exercises:
        return []

    # Get rep range for training focus
    rep_config = REP_RANGES.get(training_focus, REP_RANGES["hypertrophy"])

    # Distribute sets across exercises
    sets_per_exercise = max(2, total_sets // len(exercises))
    extra_sets = total_sets % len(exercises)

    workout_exercises = []
    for i, ex in enumerate(exercises):
        sets = sets_per_exercise + (1 if i < extra_sets else 0)
        sets = min(sets, 5)  # Cap at 5 sets per exercise

        # Vary reps within range
        reps = f"{rep_config['min']}-{rep_config['max']}"

        # Calculate estimated time
        avg_reps = (rep_config["min"] + rep_config["max"]) / 2
        time_per_set = avg_reps * 3 + rep_config["rest_sec"]  # ~3 sec per rep
        estimated_time = int(sets * time_per_set)

        workout_exercises.append(
            {
                "name": ex.get("name", "Exercise"),
                "id": ex.get("id"),
                "sets": sets,
                "reps": reps,
                "rest_sec": rep_config["rest_sec"],
                "movement_pattern": ex.get("movement_pattern", "compound"),
                "equipment": ex.get("equipment_type", "bodyweight"),
                "instructions": ex.get("instructions"),
                "form_cues": ex.get("form_cues"),
                "estimated_time_sec": estimated_time,
            }
        )

    return workout_exercises


def _generate_brief_justification(
    goals: List[Dict],
    calendar_adj: Dict,
    phase: str,
    workout_type: str,
) -> str:
    """Generate brief justification for the workout."""
    parts = []

    # Phase context
    phase_desc = PERIODIZATION_PHASES.get(phase, {}).get("description", "")
    if phase_desc:
        parts.append(f"{phase.title()} phase: {phase_desc.split(',')[0]}")

    # Goal context
    if goals:
        goal_names = [g["title"] for g in goals[:2]]
        parts.append(f"Training for: {', '.join(goal_names)}")

    # Calendar context
    if calendar_adj["recommendations"]:
        parts.append(calendar_adj["recommendations"][0])

    return " | ".join(parts) if parts else "Balanced training session"


def _save_workout_plan(workout: Dict) -> int:
    """Save generated workout to database."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT OR REPLACE INTO weekly_training_plans (
                    week_start, plan_json, goals_considered,
                    external_activities_json, periodization_phase,
                    justification_summary, status, created_at, updated_at
                ) VALUES (
                    :week_start, :plan_json, :goals,
                    :activities, :phase, :justification, 'draft', :created_at, :created_at
                )
            """
            ),
            {
                "week_start": workout["date"],
                "plan_json": json.dumps(workout),
                "goals": json.dumps(workout.get("goals_addressed", [])),
                "activities": json.dumps(workout.get("volume_adjustments", {})),
                "phase": workout.get("phase"),
                "justification": workout.get("brief_justification"),
                "created_at": datetime.now().isoformat(),
            },
        )
        row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
        return row[0]


# =============================================================================
# WEEKLY PLAN GENERATION
# =============================================================================


def generate_weekly_plan(
    week_start: Optional[date] = None,
    training_days: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Generate a complete weekly training plan.

    Args:
        week_start: Monday of the week (default: current week)
        training_days: Days to train (0=Mon, 6=Sun), default [0,2,4] (MWF)

    Returns:
        Weekly plan with daily workouts and justifications
    """
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    if training_days is None:
        training_days = [0, 2, 4]  # Monday, Wednesday, Friday

    daily_workouts = {}
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for i in range(7):
        day_date = week_start + timedelta(days=i)
        day_name = day_names[i]

        if i in training_days:
            workout = generate_workout(target_date=day_date)
            daily_workouts[day_name] = workout
        else:
            daily_workouts[day_name] = {
                "date": day_date.isoformat(),
                "workout_type": "rest",
                "brief_justification": "Scheduled rest day",
            }

    # Calculate weekly totals
    total_sets = sum(w.get("total_sets", 0) for w in daily_workouts.values())
    total_duration = sum(w.get("estimated_duration_min", 0) for w in daily_workouts.values())
    training_sessions = len(
        [w for w in daily_workouts.values() if w.get("workout_type") not in ["rest", "mobility"]]
    )

    return {
        "week_start": week_start.isoformat(),
        "daily_workouts": daily_workouts,
        "summary": {
            "training_sessions": training_sessions,
            "total_sets": total_sets,
            "total_duration_min": total_duration,
            "mobility_sessions": len(
                [w for w in daily_workouts.values() if w.get("workout_type") == "mobility"]
            ),
        },
        "generated_at": datetime.now().isoformat(),
    }


def get_todays_workout() -> Optional[Dict[str, Any]]:
    """Get or generate today's workout."""
    today = date.today()

    # Check if we already have a plan for today
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT plan_json FROM weekly_training_plans
                WHERE week_start = :date
                ORDER BY created_at DESC LIMIT 1
            """
            ),
            {"date": today.isoformat()},
        ).fetchone()

    if row:
        return json.loads(row[0])

    # Generate new workout
    return generate_workout(target_date=today)
