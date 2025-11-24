"""
Training Intelligence Engine (Phase 4.5+)
=========================================
Maps goals to training requirements and generates intelligent workout plans.

This module understands:
- What training is needed for different goal types
- How to balance multiple goals
- How external activities affect training load
- Periodization phases and progression
"""

import json
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


# =============================================================================
# GOAL TRAINING TYPE DEFINITIONS
# =============================================================================

GOAL_TRAINING_TYPES = [
    {
        "goal_category": "vertical_jump",
        "display_name": "Vertical Jump",
        "training_methods": ["plyometrics", "posterior_chain", "rate_of_force_development"],
        "recommended_exercises": [
            "box_jumps",
            "depth_jumps",
            "kettlebell_swing",
            "squats",
            "jump_squats",
            "glute_bridges",
        ],
        "movement_patterns": ["squat", "hinge", "explosive"],
        "periodization_style": "power_focus",
        "description": "Developing explosive power for jumping requires plyometric training, "
        "strong posterior chain, and rate of force development work.",
    },
    {
        "goal_category": "5k_time",
        "display_name": "5K Running Time",
        "training_methods": ["aerobic_base", "tempo_runs", "interval_training", "threshold_work"],
        "recommended_exercises": ["running", "cycling", "rowing", "stair_climbing", "burpees"],
        "movement_patterns": ["locomotion", "cardio"],
        "periodization_style": "endurance_focus",
        "description": "Improving 5K time requires building aerobic base, tempo runs for "
        "lactate threshold, and interval training for speed.",
    },
    {
        "goal_category": "general_fitness",
        "display_name": "General Fitness",
        "training_methods": ["balanced", "circuit_training", "compound_movements"],
        "recommended_exercises": ["all_available"],
        "movement_patterns": ["push", "pull", "squat", "hinge", "core", "carry"],
        "periodization_style": "balanced",
        "description": "General fitness uses balanced training across all movement patterns "
        "with moderate volume and intensity.",
    },
    {
        "goal_category": "mobility",
        "display_name": "Mobility & Flexibility",
        "training_methods": ["flexibility", "joint_health", "yoga", "dynamic_stretching"],
        "recommended_exercises": [
            "yoga_flows",
            "dynamic_stretches",
            "foam_rolling",
            "mobility_drills",
        ],
        "movement_patterns": ["mobility", "flexibility"],
        "periodization_style": "maintenance",
        "description": "Mobility work focuses on joint health, range of motion, and flexibility "
        "through targeted stretching and movement.",
    },
    {
        "goal_category": "strength",
        "display_name": "Maximum Strength",
        "training_methods": ["progressive_overload", "compound_lifts", "low_rep_high_intensity"],
        "recommended_exercises": [
            "squats",
            "deadlifts",
            "kettlebell_deadlift",
            "pull_ups",
            "push_ups",
            "kettlebell_press",
        ],
        "movement_patterns": ["squat", "hinge", "push", "pull"],
        "periodization_style": "strength_focus",
        "description": "Building maximum strength requires progressive overload with compound "
        "movements at high intensity and lower rep ranges.",
    },
    {
        "goal_category": "muscle_building",
        "display_name": "Muscle Building (Hypertrophy)",
        "training_methods": ["hypertrophy", "moderate_rep_ranges", "time_under_tension"],
        "recommended_exercises": ["compound_and_isolation"],
        "movement_patterns": ["push", "pull", "squat", "hinge"],
        "periodization_style": "balanced",
        "description": "Muscle building requires moderate rep ranges (8-12), adequate volume, "
        "and progressive overload with focus on time under tension.",
    },
    {
        "goal_category": "weight_loss",
        "display_name": "Weight Loss / Fat Loss",
        "training_methods": ["circuit_training", "hiit", "metabolic_conditioning"],
        "recommended_exercises": [
            "burpees",
            "mountain_climbers",
            "kettlebell_swing",
            "jumping_jacks",
            "high_knees",
        ],
        "movement_patterns": ["full_body", "cardio"],
        "periodization_style": "balanced",
        "description": "Fat loss combines resistance training to preserve muscle with "
        "metabolic conditioning for calorie burn.",
    },
    {
        "goal_category": "sport_performance",
        "display_name": "Sport Performance",
        "training_methods": ["sport_specific", "power", "agility", "conditioning"],
        "recommended_exercises": ["plyometrics", "agility_drills", "kettlebell_swing", "burpees"],
        "movement_patterns": ["explosive", "lateral", "rotational"],
        "periodization_style": "power_focus",
        "description": "Sport performance training develops sport-specific power, agility, "
        "and conditioning patterns.",
    },
    {
        "goal_category": "skill_acquisition",
        "display_name": "Skill Acquisition",
        "training_methods": ["progressive_skill_work", "technique_focus", "frequency"],
        "recommended_exercises": ["skill_specific"],
        "movement_patterns": ["skill_specific"],
        "periodization_style": "balanced",
        "description": "Skill goals (pull-ups, handstands, etc.) require frequent practice "
        "with progressive difficulty and technique focus.",
    },
    {
        "goal_category": "custom",
        "display_name": "Custom Goal",
        "training_methods": ["user_defined"],
        "recommended_exercises": ["user_selected"],
        "movement_patterns": ["user_defined"],
        "periodization_style": "balanced",
        "description": "Custom goals allow manual selection of training methods and exercises.",
    },
]

# Keywords for auto-detecting goal category from description
CATEGORY_KEYWORDS = {
    "vertical_jump": ["vertical", "jump", "dunk", "leap", "explosive", "plyometric"],
    "5k_time": ["5k ", "5k time", "5k run", "running", "marathon", "pace", "cardio", "endurance"],
    "general_fitness": ["fitness", "overall", "general", "health", "fit"],
    "mobility": ["mobility", "flexibility", "stretch", "yoga", "range of motion"],
    "strength": ["strength", "strong", "lift", "max", "1rm"],
    "muscle_building": ["muscle", "hypertrophy", "size", "bulk", "mass", "bodybuilding"],
    "weight_loss": [
        "weight loss",
        "fat loss",
        "lose weight",
        "lean",
        "cut",
        "shred",
        "lose kg",
        "lose lbs",
        "body fat",
    ],
    "sport_performance": ["sport", "athletic", "performance", "agility", "speed"],
    "skill_acquisition": ["pull-up", "pullup", "handstand", "muscle-up", "skill", "learn"],
}

# Milestone templates for auto-generation
MILESTONE_TEMPLATES = {
    "vertical_jump": [
        {"pct": 25, "desc": "Touch rim"},
        {"pct": 50, "desc": "Grab rim with fingertips"},
        {"pct": 75, "desc": "Grab rim solidly"},
        {"pct": 100, "desc": "Achieve target"},
    ],
    "5k_time": [
        {"pct": 25, "desc": "25% time improvement"},
        {"pct": 50, "desc": "Halfway to target time"},
        {"pct": 75, "desc": "75% time improvement"},
        {"pct": 100, "desc": "Target time achieved"},
    ],
    "skill_acquisition": [
        {"pct": 20, "desc": "First successful rep"},
        {"pct": 40, "desc": "3 consecutive reps"},
        {"pct": 60, "desc": "5 consecutive reps"},
        {"pct": 80, "desc": "8 consecutive reps"},
        {"pct": 100, "desc": "Target achieved"},
    ],
    "strength": [
        {"pct": 25, "desc": "25% strength gain"},
        {"pct": 50, "desc": "Halfway to target"},
        {"pct": 75, "desc": "75% strength gain"},
        {"pct": 100, "desc": "Target achieved"},
    ],
    "default": [
        {"pct": 25, "desc": "25% progress"},
        {"pct": 50, "desc": "Halfway there"},
        {"pct": 75, "desc": "75% progress"},
        {"pct": 100, "desc": "Goal achieved"},
    ],
}

# Periodization phase definitions
PERIODIZATION_PHASES = {
    "accumulation": {
        "weeks": 3,
        "volume": "high",
        "intensity": "moderate",
        "description": "Building work capacity and volume tolerance",
        "rpe_target": "6-7",
        "sets_multiplier": 1.2,
    },
    "transmutation": {
        "weeks": 2,
        "volume": "moderate",
        "intensity": "high",
        "description": "Converting volume gains into strength/power",
        "rpe_target": "7-8",
        "sets_multiplier": 1.0,
    },
    "realization": {
        "weeks": 1,
        "volume": "low",
        "intensity": "peak",
        "description": "Peaking for performance testing or events",
        "rpe_target": "8-9",
        "sets_multiplier": 0.6,
    },
    "deload": {
        "weeks": 1,
        "volume": "very_low",
        "intensity": "low",
        "description": "Recovery and adaptation consolidation",
        "rpe_target": "5-6",
        "sets_multiplier": 0.5,
    },
}


# =============================================================================
# DATABASE INITIALIZATION
# =============================================================================


def init_training_intelligence_tables():
    """Create Phase 4.5+ tables for training intelligence."""
    with engine.begin() as conn:
        # Goal training types (reference data)
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS goal_training_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_category TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                training_methods TEXT NOT NULL,
                recommended_exercises TEXT,
                movement_patterns TEXT,
                periodization_style TEXT CHECK(periodization_style IN (
                    'power_focus', 'endurance_focus', 'strength_focus', 'balanced', 'maintenance'
                )),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Goal milestones
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS goal_milestones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL REFERENCES fitness_goals(id) ON DELETE CASCADE,
                milestone_order INTEGER NOT NULL,
                milestone_value REAL NOT NULL,
                description TEXT,
                target_date DATE,
                achieved_date DATE,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'achieved', 'skipped')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(goal_id, milestone_order)
            )
        """
            )
        )

        # External activities
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS external_activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activity_date DATE NOT NULL,
                activity_type TEXT NOT NULL,
                activity_name TEXT,
                intensity TEXT DEFAULT 'medium' CHECK(intensity IN ('low', 'medium', 'high')),
                duration_minutes INTEGER,
                load_score INTEGER CHECK(load_score BETWEEN 1 AND 10),
                calendar_event_id TEXT,
                is_recurring INTEGER DEFAULT 0,
                day_of_week INTEGER CHECK(day_of_week BETWEEN 0 AND 6),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Weekly training plans
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS weekly_training_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week_start DATE NOT NULL UNIQUE,
                plan_json TEXT NOT NULL,
                goals_considered TEXT,
                external_activities_json TEXT,
                equipment_available TEXT,
                fitness_level TEXT,
                periodization_phase TEXT CHECK(periodization_phase IN (
                    'accumulation', 'transmutation', 'realization', 'deload'
                )),
                week_in_phase INTEGER,
                weekly_load_target INTEGER,
                weekly_load_actual INTEGER,
                justification_summary TEXT,
                status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'abandoned')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Workout justifications
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS workout_justifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER REFERENCES workout_sessions(id),
                plan_id INTEGER REFERENCES weekly_training_plans(id),
                workout_date DATE NOT NULL,
                brief_text TEXT NOT NULL,
                detailed_text TEXT,
                goals_addressed TEXT,
                calendar_context TEXT,
                periodization_context TEXT,
                training_science_notes TEXT,
                expected_adaptations TEXT,
                timeline_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Periodization state (singleton)
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS periodization_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cycle_start_date DATE NOT NULL,
                current_phase TEXT NOT NULL CHECK(current_phase IN (
                    'accumulation', 'transmutation', 'realization', 'deload'
                )),
                current_week INTEGER NOT NULL,
                total_weeks_in_phase INTEGER NOT NULL,
                next_deload_date DATE,
                last_deload_date DATE,
                consecutive_training_weeks INTEGER DEFAULT 0,
                notes TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Workout logging queue
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS workout_logging_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL REFERENCES workout_sessions(id),
                workout_date DATE NOT NULL,
                reminder_count INTEGER DEFAULT 0,
                last_reminder_at TIMESTAMP,
                reminder_channel TEXT,
                logged_at TIMESTAMP,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'logged', 'skipped')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Add new columns to fitness_goals (safe ALTERs)
        _add_goal_columns(conn)

        # Add new columns to workout_sessions (safe ALTERs)
        _add_session_columns(conn)

        # Create indexes
        _create_indexes(conn)

        # Seed goal training types
        _seed_goal_training_types(conn)


def _add_goal_columns(conn):
    """Add new columns to fitness_goals table."""
    columns = [
        ("goal_category", "TEXT"),
        ("training_methods_override", "TEXT"),
        ("has_milestones", "INTEGER DEFAULT 0"),
        ("calendar_aware", "INTEGER DEFAULT 1"),
    ]
    for col_name, col_type in columns:
        try:
            conn.execute(text(f"ALTER TABLE fitness_goals ADD COLUMN {col_name} {col_type}"))
        except Exception:
            pass  # Column exists


def _add_session_columns(conn):
    """Add new columns to workout_sessions table."""
    columns = [
        ("justification_id", "INTEGER"),
        ("plan_id", "INTEGER"),
        ("was_generated", "INTEGER DEFAULT 0"),
        ("load_score", "INTEGER"),
    ]
    for col_name, col_type in columns:
        try:
            conn.execute(text(f"ALTER TABLE workout_sessions ADD COLUMN {col_name} {col_type}"))
        except Exception:
            pass  # Column exists


def _create_indexes(conn):
    """Create indexes for Phase 4.5+ tables."""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_goal_training_category ON goal_training_types(goal_category)",
        "CREATE INDEX IF NOT EXISTS idx_milestones_goal ON goal_milestones(goal_id)",
        "CREATE INDEX IF NOT EXISTS idx_external_activities_date ON external_activities(activity_date)",
        "CREATE INDEX IF NOT EXISTS idx_weekly_plans_week ON weekly_training_plans(week_start DESC)",
        "CREATE INDEX IF NOT EXISTS idx_justifications_session ON workout_justifications(session_id)",
        "CREATE INDEX IF NOT EXISTS idx_logging_queue_status ON workout_logging_queue(status)",
    ]
    for idx_sql in indexes:
        try:
            conn.execute(text(idx_sql))
        except Exception:
            pass


def _seed_goal_training_types(conn):
    """Seed goal training types reference data."""
    for gtt in GOAL_TRAINING_TYPES:
        conn.execute(
            text(
                """
                INSERT OR IGNORE INTO goal_training_types (
                    goal_category, display_name, training_methods,
                    recommended_exercises, movement_patterns,
                    periodization_style, description
                ) VALUES (
                    :goal_category, :display_name, :training_methods,
                    :recommended_exercises, :movement_patterns,
                    :periodization_style, :description
                )
            """
            ),
            {
                "goal_category": gtt["goal_category"],
                "display_name": gtt["display_name"],
                "training_methods": json.dumps(gtt["training_methods"]),
                "recommended_exercises": json.dumps(gtt["recommended_exercises"]),
                "movement_patterns": json.dumps(gtt["movement_patterns"]),
                "periodization_style": gtt["periodization_style"],
                "description": gtt["description"],
            },
        )


# =============================================================================
# GOAL INTELLIGENCE FUNCTIONS
# =============================================================================


def detect_goal_category(title: str, description: Optional[str] = None) -> str:
    """
    Auto-detect goal category from title and description.

    Args:
        title: Goal title
        description: Optional description

    Returns:
        Detected goal category or 'custom' if unclear
    """
    text_to_check = f"{title} {description or ''}".lower()

    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_to_check)
        if score > 0:
            scores[category] = score

    if scores:
        return max(scores, key=scores.get)
    return "custom"


def get_training_requirements(goal_category: str) -> Dict[str, Any]:
    """
    Get training requirements for a goal category.

    Args:
        goal_category: The goal category

    Returns:
        Dictionary with training methods, exercises, patterns, etc.
    """
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT goal_category, display_name, training_methods,
                       recommended_exercises, movement_patterns,
                       periodization_style, description
                FROM goal_training_types
                WHERE goal_category = :category
            """
            ),
            {"category": goal_category},
        ).fetchone()

    if not row:
        # Return default for unknown categories
        return {
            "goal_category": goal_category,
            "display_name": goal_category.replace("_", " ").title(),
            "training_methods": ["balanced"],
            "recommended_exercises": ["all_available"],
            "movement_patterns": ["push", "pull", "squat", "hinge", "core"],
            "periodization_style": "balanced",
            "description": "Custom goal with balanced training approach.",
        }

    return {
        "goal_category": row[0],
        "display_name": row[1],
        "training_methods": json.loads(row[2]) if row[2] else [],
        "recommended_exercises": json.loads(row[3]) if row[3] else [],
        "movement_patterns": json.loads(row[4]) if row[4] else [],
        "periodization_style": row[5],
        "description": row[6],
    }


def get_all_goal_categories() -> List[Dict[str, Any]]:
    """Get all available goal categories with their details."""
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT goal_category, display_name, description, periodization_style
                FROM goal_training_types
                ORDER BY display_name
            """
            )
        ).fetchall()

    return [
        {
            "goal_category": row[0],
            "display_name": row[1],
            "description": row[2],
            "periodization_style": row[3],
        }
        for row in rows
    ]


def create_goal_with_intelligence(
    goal_type: str,
    title: str,
    target_value: float,
    target_unit: str,
    start_value: float = 0,
    description: Optional[str] = None,
    deadline: Optional[date] = None,
    auto_milestones: bool = True,
) -> Dict[str, Any]:
    """
    Create a goal with intelligent category detection and milestone generation.

    Args:
        goal_type: Basic goal type (strength, endurance, etc.)
        title: Goal title
        target_value: Target value to achieve
        target_unit: Unit of measurement
        start_value: Starting value
        description: Optional description
        deadline: Optional deadline
        auto_milestones: Whether to auto-generate milestones

    Returns:
        Dictionary with goal_id, detected_category, milestones
    """
    # Detect intelligent category
    detected_category = detect_goal_category(title, description)
    training_req = get_training_requirements(detected_category)

    now = datetime.now().isoformat()
    start_date = date.today().isoformat()

    with engine.begin() as conn:
        # Create the goal
        conn.execute(
            text(
                """
                INSERT INTO fitness_goals (
                    goal_type, title, description, target_value, target_unit,
                    start_value, current_value, start_date, deadline,
                    goal_category, has_milestones, calendar_aware,
                    status, created_at, updated_at
                ) VALUES (
                    :goal_type, :title, :description, :target_value, :target_unit,
                    :start_value, :start_value, :start_date, :deadline,
                    :goal_category, :has_milestones, 1,
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
                "start_date": start_date,
                "deadline": deadline.isoformat() if deadline else None,
                "goal_category": detected_category,
                "has_milestones": 1 if auto_milestones else 0,
                "created_at": now,
                "updated_at": now,
            },
        )

        row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
        goal_id = row[0]

        # Generate milestones if requested
        milestones = []
        if auto_milestones:
            milestones = _generate_milestones(
                conn, goal_id, detected_category, start_value, target_value, deadline
            )

    return {
        "goal_id": goal_id,
        "detected_category": detected_category,
        "training_requirements": training_req,
        "milestones": milestones,
    }


def _generate_milestones(
    conn,
    goal_id: int,
    category: str,
    start_value: float,
    target_value: float,
    deadline: Optional[date],
) -> List[Dict[str, Any]]:
    """Generate milestones for a goal."""
    template = MILESTONE_TEMPLATES.get(category, MILESTONE_TEMPLATES["default"])

    milestones = []
    total_progress = target_value - start_value

    for i, m in enumerate(template):
        milestone_value = start_value + (total_progress * m["pct"] / 100)

        # Calculate target date if deadline provided
        target_date = None
        if deadline:
            days_total = (deadline - date.today()).days
            target_date = date.today() + timedelta(days=int(days_total * m["pct"] / 100))

        conn.execute(
            text(
                """
                INSERT INTO goal_milestones (
                    goal_id, milestone_order, milestone_value, description,
                    target_date, status, created_at
                ) VALUES (
                    :goal_id, :order, :value, :desc, :target_date, 'pending', :created_at
                )
            """
            ),
            {
                "goal_id": goal_id,
                "order": i + 1,
                "value": milestone_value,
                "desc": m["desc"],
                "target_date": target_date.isoformat() if target_date else None,
                "created_at": datetime.now().isoformat(),
            },
        )

        milestones.append(
            {
                "order": i + 1,
                "value": milestone_value,
                "description": m["desc"],
                "target_date": target_date.isoformat() if target_date else None,
            }
        )

    return milestones


def get_goal_milestones(goal_id: int) -> List[Dict[str, Any]]:
    """Get all milestones for a goal."""
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, milestone_order, milestone_value, description,
                       target_date, achieved_date, status
                FROM goal_milestones
                WHERE goal_id = :goal_id
                ORDER BY milestone_order
            """
            ),
            {"goal_id": goal_id},
        ).fetchall()

    return [
        {
            "id": row[0],
            "order": row[1],
            "value": row[2],
            "description": row[3],
            "target_date": row[4],
            "achieved_date": row[5],
            "status": row[6],
        }
        for row in rows
    ]


def update_milestone_status(
    milestone_id: int, status: str, achieved_date: Optional[date] = None
) -> bool:
    """Update a milestone's status."""
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE goal_milestones
                SET status = :status, achieved_date = :achieved_date
                WHERE id = :id
            """
            ),
            {
                "id": milestone_id,
                "status": status,
                "achieved_date": achieved_date.isoformat() if achieved_date else None,
            },
        )
        return result.rowcount > 0


def check_milestone_achievements(goal_id: int, current_value: float) -> List[Dict[str, Any]]:
    """
    Check if any milestones should be marked as achieved.

    Args:
        goal_id: The goal ID
        current_value: Current progress value

    Returns:
        List of newly achieved milestones
    """
    milestones = get_goal_milestones(goal_id)
    newly_achieved = []

    with engine.begin() as conn:
        for m in milestones:
            if m["status"] == "pending" and current_value >= m["value"]:
                conn.execute(
                    text(
                        """
                        UPDATE goal_milestones
                        SET status = 'achieved', achieved_date = :date
                        WHERE id = :id
                    """
                    ),
                    {"id": m["id"], "date": date.today().isoformat()},
                )
                m["status"] = "achieved"
                m["achieved_date"] = date.today().isoformat()
                newly_achieved.append(m)

    return newly_achieved


# =============================================================================
# PERIODIZATION FUNCTIONS
# =============================================================================


def get_periodization_state() -> Optional[Dict[str, Any]]:
    """Get current periodization state."""
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, cycle_start_date, current_phase, current_week,
                       total_weeks_in_phase, next_deload_date, last_deload_date,
                       consecutive_training_weeks, notes, updated_at
                FROM periodization_state
                ORDER BY id DESC LIMIT 1
            """
            )
        ).fetchone()

    if not row:
        return None

    phase_info = PERIODIZATION_PHASES.get(row[2], {})

    return {
        "id": row[0],
        "cycle_start_date": row[1],
        "current_phase": row[2],
        "current_week": row[3],
        "total_weeks_in_phase": row[4],
        "next_deload_date": row[5],
        "last_deload_date": row[6],
        "consecutive_training_weeks": row[7],
        "notes": row[8],
        "updated_at": row[9],
        "phase_info": phase_info,
    }


def initialize_periodization(start_phase: str = "accumulation") -> Dict[str, Any]:
    """
    Initialize or reset periodization tracking.

    Args:
        start_phase: Phase to start with

    Returns:
        New periodization state
    """
    phase_info = PERIODIZATION_PHASES.get(start_phase, PERIODIZATION_PHASES["accumulation"])
    today = date.today()
    next_deload = today + timedelta(weeks=6)  # Deload after ~6 weeks

    with engine.begin() as conn:
        # Delete any existing state
        conn.execute(text("DELETE FROM periodization_state"))

        # Insert new state
        conn.execute(
            text(
                """
                INSERT INTO periodization_state (
                    cycle_start_date, current_phase, current_week,
                    total_weeks_in_phase, next_deload_date, consecutive_training_weeks,
                    updated_at
                ) VALUES (
                    :start_date, :phase, 1, :total_weeks,
                    :next_deload, 0, :updated_at
                )
            """
            ),
            {
                "start_date": today.isoformat(),
                "phase": start_phase,
                "total_weeks": phase_info["weeks"],
                "next_deload": next_deload.isoformat(),
                "updated_at": datetime.now().isoformat(),
            },
        )

    return get_periodization_state()


def advance_periodization_week() -> Dict[str, Any]:
    """
    Advance periodization by one week, transitioning phases if needed.

    Returns:
        Updated periodization state
    """
    state = get_periodization_state()
    if not state:
        return initialize_periodization()

    current_phase = state["current_phase"]
    current_week = state["current_week"]
    total_weeks = state["total_weeks_in_phase"]

    # Determine next phase
    if current_week >= total_weeks:
        # Time to transition
        phase_order = ["accumulation", "transmutation", "realization", "deload"]
        current_idx = phase_order.index(current_phase)
        next_phase = phase_order[(current_idx + 1) % len(phase_order)]
        next_week = 1
        next_total = PERIODIZATION_PHASES[next_phase]["weeks"]
    else:
        next_phase = current_phase
        next_week = current_week + 1
        next_total = total_weeks

    # Update deload tracking
    consecutive = state["consecutive_training_weeks"]
    if next_phase == "deload":
        consecutive = 0
        last_deload = date.today()
        next_deload = date.today() + timedelta(weeks=7)
    else:
        consecutive += 1
        last_deload = state["last_deload_date"]
        next_deload = state["next_deload_date"]

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE periodization_state SET
                    current_phase = :phase,
                    current_week = :week,
                    total_weeks_in_phase = :total,
                    consecutive_training_weeks = :consecutive,
                    last_deload_date = :last_deload,
                    next_deload_date = :next_deload,
                    updated_at = :updated_at
                WHERE id = :id
            """
            ),
            {
                "id": state["id"],
                "phase": next_phase,
                "week": next_week,
                "total": next_total,
                "consecutive": consecutive,
                "last_deload": last_deload,
                "next_deload": next_deload,
                "updated_at": datetime.now().isoformat(),
            },
        )

    return get_periodization_state()


def get_phase_adjustments(phase: str) -> Dict[str, Any]:
    """
    Get training adjustments for a periodization phase.

    Args:
        phase: Current phase name

    Returns:
        Dictionary with volume/intensity adjustments
    """
    return PERIODIZATION_PHASES.get(phase, PERIODIZATION_PHASES["accumulation"])


# =============================================================================
# EXTERNAL ACTIVITIES / CALENDAR INTEGRATION
# =============================================================================

# Load scores for common activity types (1-10 scale)
ACTIVITY_LOAD_SCORES = {
    "5_a_side": {"low": 4, "medium": 6, "high": 8},
    "jiu_jitsu": {"low": 5, "medium": 7, "high": 9},
    "soccer": {"low": 4, "medium": 6, "high": 8},
    "basketball": {"low": 4, "medium": 6, "high": 8},
    "running": {"low": 3, "medium": 5, "high": 7},
    "cycling": {"low": 2, "medium": 4, "high": 6},
    "swimming": {"low": 3, "medium": 5, "high": 7},
    "hiking": {"low": 2, "medium": 4, "high": 6},
    "yoga": {"low": 1, "medium": 2, "high": 3},
    "martial_arts": {"low": 5, "medium": 7, "high": 9},
    "tennis": {"low": 3, "medium": 5, "high": 7},
    "climbing": {"low": 4, "medium": 6, "high": 8},
    "other": {"low": 3, "medium": 5, "high": 7},
}


def add_external_activity(
    activity_date: date,
    activity_type: str,
    activity_name: Optional[str] = None,
    intensity: str = "medium",
    duration_minutes: Optional[int] = None,
    calendar_event_id: Optional[str] = None,
    is_recurring: bool = False,
    day_of_week: Optional[int] = None,
    notes: Optional[str] = None,
) -> int:
    """
    Add an external activity that affects training load.

    Args:
        activity_date: Date of activity
        activity_type: Type (5_a_side, jiu_jitsu, soccer, etc.)
        activity_name: Optional display name
        intensity: low, medium, or high
        duration_minutes: Optional duration
        calendar_event_id: Optional calendar sync ID
        is_recurring: Whether this repeats weekly
        day_of_week: Day (0=Monday) for recurring activities
        notes: Optional notes

    Returns:
        Activity ID
    """
    # Calculate load score
    load_lookup = ACTIVITY_LOAD_SCORES.get(activity_type, ACTIVITY_LOAD_SCORES["other"])
    load_score = load_lookup.get(intensity, load_lookup["medium"])

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO external_activities (
                    activity_date, activity_type, activity_name, intensity,
                    duration_minutes, load_score, calendar_event_id,
                    is_recurring, day_of_week, notes, created_at
                ) VALUES (
                    :date, :type, :name, :intensity, :duration, :load,
                    :calendar_id, :recurring, :dow, :notes, :created_at
                )
            """
            ),
            {
                "date": activity_date.isoformat(),
                "type": activity_type,
                "name": activity_name or activity_type.replace("_", " ").title(),
                "intensity": intensity,
                "duration": duration_minutes,
                "load": load_score,
                "calendar_id": calendar_event_id,
                "recurring": 1 if is_recurring else 0,
                "dow": day_of_week,
                "notes": notes,
                "created_at": datetime.now().isoformat(),
            },
        )

        row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
        return row[0]


def get_activities_for_week(week_start: date) -> List[Dict[str, Any]]:
    """
    Get all external activities for a week.

    Args:
        week_start: Monday of the week

    Returns:
        List of activities with load scores
    """
    week_end = week_start + timedelta(days=6)

    with engine.connect() as conn:
        # Get one-off activities
        rows = conn.execute(
            text(
                """
                SELECT id, activity_date, activity_type, activity_name,
                       intensity, duration_minutes, load_score, notes
                FROM external_activities
                WHERE activity_date BETWEEN :start AND :end
                   OR (is_recurring = 1 AND day_of_week BETWEEN 0 AND 6)
                ORDER BY activity_date
            """
            ),
            {"start": week_start.isoformat(), "end": week_end.isoformat()},
        ).fetchall()

    activities = []
    for row in rows:
        activities.append(
            {
                "id": row[0],
                "date": row[1],
                "type": row[2],
                "name": row[3],
                "intensity": row[4],
                "duration_minutes": row[5],
                "load_score": row[6],
                "notes": row[7],
            }
        )

    return activities


def get_daily_load(target_date: date) -> Dict[str, Any]:
    """
    Get total external load for a specific date.

    Args:
        target_date: Date to check

    Returns:
        Dictionary with activities and total load
    """
    dow = target_date.weekday()

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT activity_type, activity_name, intensity, load_score
                FROM external_activities
                WHERE activity_date = :date
                   OR (is_recurring = 1 AND day_of_week = :dow)
            """
            ),
            {"date": target_date.isoformat(), "dow": dow},
        ).fetchall()

    activities = [{"type": r[0], "name": r[1], "intensity": r[2], "load": r[3]} for r in rows]
    total_load = sum(a["load"] for a in activities)

    return {
        "date": target_date.isoformat(),
        "activities": activities,
        "total_load": total_load,
        "has_activity": len(activities) > 0,
    }


def get_week_load_distribution(week_start: date) -> Dict[str, Any]:
    """
    Get load distribution across the week for planning.

    Args:
        week_start: Monday of the week

    Returns:
        Dictionary with daily loads and recommended training adjustments
    """
    daily_loads = {}
    for i in range(7):
        day = week_start + timedelta(days=i)
        daily_loads[day.strftime("%A")] = get_daily_load(day)

    # Calculate total external load
    total_external = sum(d["total_load"] for d in daily_loads.values())

    # Determine training recommendations based on load
    recommendations = []
    for day_name, load_info in daily_loads.items():
        if load_info["total_load"] >= 7:
            recommendations.append(f"{day_name}: Rest or mobility only (high external load)")
        elif load_info["total_load"] >= 5:
            recommendations.append(f"{day_name}: Light training (moderate external load)")
        elif load_info["total_load"] >= 3:
            recommendations.append(f"{day_name}: Normal training, consider timing")

    return {
        "week_start": week_start.isoformat(),
        "daily_loads": daily_loads,
        "total_external_load": total_external,
        "recommendations": recommendations,
    }


def get_training_adjustment_for_day(target_date: date) -> Dict[str, Any]:
    """
    Get recommended training adjustments based on external activities.

    Considers:
    - Activities on target day
    - Activities day before (recovery needed?)
    - Activities day after (save energy?)

    Args:
        target_date: Date to get adjustments for

    Returns:
        Dictionary with volume_multiplier, intensity_cap, recommendations
    """
    today_load = get_daily_load(target_date)
    yesterday_load = get_daily_load(target_date - timedelta(days=1))
    tomorrow_load = get_daily_load(target_date + timedelta(days=1))

    # Base adjustments
    volume_multiplier = 1.0
    intensity_cap = "high"
    recommendations = []
    workout_type = "normal"

    # Adjust for today's load
    if today_load["total_load"] >= 7:
        volume_multiplier = 0.0
        intensity_cap = "none"
        workout_type = "rest"
        recommendations.append("Rest day recommended - high external activity")
    elif today_load["total_load"] >= 5:
        volume_multiplier = 0.3
        intensity_cap = "low"
        workout_type = "mobility"
        recommendations.append("Mobility/light work only - external activity today")
    elif today_load["total_load"] >= 3:
        volume_multiplier = 0.6
        intensity_cap = "moderate"
        recommendations.append("Reduced volume - some external activity today")

    # Adjust for tomorrow (save energy if big day tomorrow)
    if tomorrow_load["total_load"] >= 7:
        volume_multiplier = min(volume_multiplier, 0.5)
        intensity_cap = "moderate" if intensity_cap == "high" else intensity_cap
        recommendations.append(
            f"Lighter session - {tomorrow_load['activities'][0]['name']} tomorrow"
        )
    elif tomorrow_load["total_load"] >= 5:
        volume_multiplier = min(volume_multiplier, 0.7)
        recommendations.append("Consider reduced volume - activity tomorrow")

    # Adjust for yesterday (recovery focus?)
    if yesterday_load["total_load"] >= 7:
        if workout_type == "normal":
            workout_type = "recovery_focus"
            recommendations.append(
                f"Recovery focus - {yesterday_load['activities'][0]['name']} yesterday"
            )
    elif yesterday_load["total_load"] >= 5:
        recommendations.append("Include extra mobility work - recovery from yesterday")

    return {
        "date": target_date.isoformat(),
        "volume_multiplier": volume_multiplier,
        "intensity_cap": intensity_cap,
        "workout_type": workout_type,
        "recommendations": recommendations,
        "context": {
            "today": today_load,
            "yesterday": yesterday_load,
            "tomorrow": tomorrow_load,
        },
    }


def delete_external_activity(activity_id: int) -> bool:
    """Delete an external activity."""
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM external_activities WHERE id = :id"),
            {"id": activity_id},
        )
        return result.rowcount > 0


def get_recurring_activities() -> List[Dict[str, Any]]:
    """Get all recurring activities."""
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, activity_type, activity_name, intensity, day_of_week, load_score
                FROM external_activities
                WHERE is_recurring = 1
                ORDER BY day_of_week
            """
            )
        ).fetchall()

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return [
        {
            "id": r[0],
            "type": r[1],
            "name": r[2],
            "intensity": r[3],
            "day_of_week": r[4],
            "day_name": days[r[4]] if r[4] is not None else "Unknown",
            "load_score": r[5],
        }
        for r in rows
    ]


def add_recurring_activity(
    activity_type: str,
    day_of_week: int,
    activity_name: Optional[str] = None,
    intensity: str = "medium",
    duration_minutes: Optional[int] = None,
) -> int:
    """
    Add a recurring weekly activity.

    Args:
        activity_type: Type of activity
        day_of_week: 0=Monday, 6=Sunday
        activity_name: Display name
        intensity: low, medium, high
        duration_minutes: Optional duration

    Returns:
        Activity ID
    """
    return add_external_activity(
        activity_date=date.today(),  # Placeholder, day_of_week matters
        activity_type=activity_type,
        activity_name=activity_name,
        intensity=intensity,
        duration_minutes=duration_minutes,
        is_recurring=True,
        day_of_week=day_of_week,
    )


# Auto-initialize on import
init_training_intelligence_tables()
