"""
Fitness Database Initialization (Phase 4 + 4.5)
===============================================
Creates workout, exercise, and enhanced fitness tracking tables.

Phase 4: Basic workout sessions and exercise logging
Phase 4.5: User profile, assessments, goals, equipment, coaching content
"""

from sqlalchemy import create_engine, text
from pathlib import Path

DB_PATH = "assistant/data/memory.db"


def init_fitness_tables():
    """Create all Phase 4 and 4.5 fitness tables if they don't exist."""
    engine = create_engine(f"sqlite:///{DB_PATH}")

    Path("assistant/data").mkdir(parents=True, exist_ok=True)

    with engine.begin() as conn:
        # Exercise library (reference data)
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                category TEXT NOT NULL,
                muscle_group TEXT,
                equipment TEXT DEFAULT 'bodyweight',
                description TEXT,
                video_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Workout templates
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS workout_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                duration_minutes INTEGER DEFAULT 30,
                difficulty TEXT DEFAULT 'intermediate',
                category TEXT,
                exercises_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Workout sessions (actual performed workouts)
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS workout_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                template_id INTEGER,
                started_at TIMESTAMP NOT NULL,
                ended_at TIMESTAMP,
                duration_minutes INTEGER,
                status TEXT DEFAULT 'in_progress',
                overall_rpe INTEGER CHECK(overall_rpe BETWEEN 1 AND 10),
                notes TEXT,
                calories_burned INTEGER,
                paused_at TIMESTAMP,
                total_paused_seconds INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (template_id) REFERENCES workout_templates(id)
            )
        """
            )
        )

        # Add pause columns to existing tables (safe ALTER)
        _add_pause_columns(conn)

        # Exercise logs (sets/reps for each exercise in a session)
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS exercise_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                set_number INTEGER NOT NULL,
                reps INTEGER,
                weight_kg REAL,
                duration_seconds INTEGER,
                rpe INTEGER CHECK(rpe BETWEEN 1 AND 10),
                notes TEXT,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES workout_sessions(id),
                FOREIGN KEY (exercise_id) REFERENCES exercises(id)
            )
        """
            )
        )

        # Personal records
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS personal_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise_id INTEGER NOT NULL,
                record_type TEXT NOT NULL,
                value REAL NOT NULL,
                achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                session_id INTEGER,
                FOREIGN KEY (exercise_id) REFERENCES exercises(id),
                FOREIGN KEY (session_id) REFERENCES workout_sessions(id)
            )
        """
            )
        )

        # Seed common bodyweight exercises
        exercises = [
            ("Push-ups", "strength", "chest", "bodyweight", "Standard push-up"),
            ("Squats", "strength", "legs", "bodyweight", "Bodyweight squat"),
            ("Lunges", "strength", "legs", "bodyweight", "Alternating lunges"),
            ("Plank", "core", "abs", "bodyweight", "Standard plank hold"),
            ("Burpees", "cardio", "full_body", "bodyweight", "Full burpee with jump"),
            (
                "Mountain Climbers",
                "cardio",
                "core",
                "bodyweight",
                "Running in plank position",
            ),
            ("Jumping Jacks", "cardio", "full_body", "bodyweight", "Standard jumping jacks"),
            ("Tricep Dips", "strength", "arms", "bodyweight", "Using chair or bench"),
            ("Glute Bridges", "strength", "glutes", "bodyweight", "Hip thrust from floor"),
            ("Superman", "strength", "back", "bodyweight", "Back extension on floor"),
            ("Crunches", "core", "abs", "bodyweight", "Standard crunches"),
            ("Leg Raises", "core", "abs", "bodyweight", "Lying leg raises"),
            ("High Knees", "cardio", "legs", "bodyweight", "Running in place with high knees"),
            ("Wall Sit", "strength", "legs", "bodyweight", "Isometric wall squat hold"),
            ("Side Plank", "core", "obliques", "bodyweight", "Side plank hold"),
        ]

        for name, category, muscle, equipment, desc in exercises:
            conn.execute(
                text(
                    """
                    INSERT OR IGNORE INTO exercises (name, category, muscle_group, equipment, description)
                    VALUES (:name, :category, :muscle, :equipment, :desc)
                """
                ),
                {
                    "name": name,
                    "category": category,
                    "muscle": muscle,
                    "equipment": equipment,
                    "desc": desc,
                },
            )

        # Seed a default 30-min bodyweight workout template
        import json

        default_workout = [
            {"exercise": "Jumping Jacks", "sets": 1, "duration": 60, "rest": 30},
            {"exercise": "Squats", "sets": 3, "reps": 15, "rest": 45},
            {"exercise": "Push-ups", "sets": 3, "reps": 10, "rest": 45},
            {"exercise": "Lunges", "sets": 3, "reps": 12, "rest": 45},
            {"exercise": "Plank", "sets": 3, "duration": 30, "rest": 30},
            {"exercise": "Mountain Climbers", "sets": 3, "duration": 30, "rest": 30},
            {"exercise": "Glute Bridges", "sets": 3, "reps": 15, "rest": 30},
            {"exercise": "Burpees", "sets": 2, "reps": 8, "rest": 60},
            {"exercise": "Crunches", "sets": 3, "reps": 20, "rest": 30},
        ]

        conn.execute(
            text(
                """
                INSERT OR IGNORE INTO workout_templates (name, description, duration_minutes, difficulty, category, exercises_json)
                VALUES (:name, :desc, :duration, :difficulty, :category, :exercises)
            """
            ),
            {
                "name": "30-Min Full Body",
                "desc": "Complete bodyweight workout targeting all major muscle groups",
                "duration": 30,
                "difficulty": "intermediate",
                "category": "full_body",
                "exercises": json.dumps(default_workout),
            },
        )

        # ================================================================
        # PHASE 4.5: Enhanced Fitness Tables
        # ================================================================

        # User Profile (singleton - one per user)
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                height_cm INTEGER NOT NULL CHECK(height_cm BETWEEN 100 AND 250),
                weight_kg REAL NOT NULL CHECK(weight_kg BETWEEN 20 AND 300),
                age INTEGER CHECK(age BETWEEN 10 AND 120),
                gender TEXT CHECK(gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
                waist_cm REAL CHECK(waist_cm BETWEEN 40 AND 200),
                hip_cm REAL CHECK(hip_cm BETWEEN 50 AND 200),
                neck_cm REAL CHECK(neck_cm BETWEEN 20 AND 60),
                body_fat_pct REAL CHECK(body_fat_pct BETWEEN 3 AND 60),
                bmi REAL CHECK(bmi BETWEEN 10 AND 100),
                bmi_category TEXT CHECK(bmi_category IN ('underweight', 'normal', 'overweight', 'obese_1', 'obese_2', 'obese_3')),
                waist_to_height_ratio REAL,
                activity_level TEXT DEFAULT 'moderate' CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
                experience_level TEXT DEFAULT 'beginner' CHECK(experience_level IN ('beginner', 'intermediate', 'advanced')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Fitness Assessments
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS fitness_assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assessment_date DATE NOT NULL DEFAULT (DATE('now')),
                push_up_max INTEGER CHECK(push_up_max >= 0),
                squat_60s_count INTEGER CHECK(squat_60s_count >= 0),
                plank_hold_seconds INTEGER CHECK(plank_hold_seconds >= 0),
                wall_sit_seconds INTEGER CHECK(wall_sit_seconds >= 0),
                resting_heart_rate INTEGER CHECK(resting_heart_rate BETWEEN 30 AND 200),
                sit_reach_score INTEGER CHECK(sit_reach_score BETWEEN 1 AND 5),
                single_leg_balance_left INTEGER CHECK(single_leg_balance_left >= 0),
                single_leg_balance_right INTEGER CHECK(single_leg_balance_right >= 0),
                overall_fitness_level TEXT CHECK(overall_fitness_level IN ('beginner', 'intermediate', 'advanced')),
                fitness_score INTEGER CHECK(fitness_score BETWEEN 0 AND 100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(assessment_date)
            )
        """
            )
        )

        # Health Notes (injuries, limitations)
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS health_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                body_area TEXT NOT NULL CHECK(body_area IN (
                    'neck', 'shoulder', 'upper_back', 'lower_back',
                    'elbow', 'wrist', 'hand', 'hip', 'knee', 'ankle',
                    'foot', 'chest', 'abdomen', 'general'
                )),
                description TEXT NOT NULL,
                severity TEXT DEFAULT 'moderate' CHECK(severity IN ('mild', 'moderate', 'severe', 'recovered')),
                injury_date DATE,
                recovery_date DATE,
                exercises_to_avoid TEXT,
                modifications_needed TEXT,
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # User Equipment
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS user_equipment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_type TEXT NOT NULL CHECK(equipment_type IN (
                    'bodyweight', 'kettlebell', 'dumbbell', 'barbell',
                    'pull_up_bar', 'resistance_band', 'bench', 'trx',
                    'jump_rope', 'foam_roller', 'yoga_mat', 'exercise_ball',
                    'medicine_ball', 'cable_machine', 'other'
                )),
                details TEXT,
                quantity INTEGER DEFAULT 1,
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(equipment_type)
            )
        """
            )
        )

        # Seed default bodyweight equipment
        conn.execute(
            text(
                """
            INSERT OR IGNORE INTO user_equipment (equipment_type, details, active)
            VALUES ('bodyweight', 'No equipment needed', 1)
        """
            )
        )

        # Fitness Goals
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS fitness_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_type TEXT NOT NULL CHECK(goal_type IN (
                    'strength', 'endurance', 'skill', 'body_comp',
                    'consistency', 'flexibility', 'custom'
                )),
                title TEXT NOT NULL,
                description TEXT,
                target_value REAL NOT NULL,
                target_unit TEXT NOT NULL,
                start_value REAL DEFAULT 0,
                current_value REAL DEFAULT 0,
                start_date DATE DEFAULT (DATE('now')),
                deadline DATE,
                exercise_id INTEGER REFERENCES exercises(id),
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'achieved', 'abandoned', 'paused')),
                achieved_at TIMESTAMP,
                supabase_memory_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        # Goal Progress Log
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS goal_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL REFERENCES fitness_goals(id) ON DELETE CASCADE,
                logged_date DATE NOT NULL DEFAULT (DATE('now')),
                value REAL NOT NULL,
                notes TEXT,
                session_id INTEGER REFERENCES workout_sessions(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(goal_id, logged_date)
            )
        """
            )
        )

        # User Focus Areas
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS user_focus_areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                focus_type TEXT NOT NULL CHECK(focus_type IN ('muscle_group', 'movement_pattern', 'fitness_aspect')),
                focus_value TEXT NOT NULL,
                priority INTEGER DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(focus_type, focus_value)
            )
        """
            )
        )

        # Weekly Volume Tracking
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS weekly_volume (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week_start DATE NOT NULL,
                category_type TEXT NOT NULL CHECK(category_type IN ('muscle_group', 'movement_pattern')),
                category_value TEXT NOT NULL,
                total_sets INTEGER DEFAULT 0,
                total_reps INTEGER DEFAULT 0,
                total_weight_kg REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(week_start, category_type, category_value)
            )
        """
            )
        )

        # Add coaching columns to exercises table (safe ALTER statements)
        _add_exercise_coaching_columns(conn)


def _add_exercise_coaching_columns(conn):
    """Add coaching content columns to exercises table (Phase 4.5)."""
    new_columns = [
        ("instructions", "TEXT"),
        ("form_cues", "TEXT"),
        ("common_mistakes", "TEXT"),
        ("muscles_primary", "TEXT"),
        ("muscles_secondary", "TEXT"),
        ("difficulty_level", "INTEGER DEFAULT 2"),
        ("movement_pattern", "TEXT"),
    ]

    for col_name, col_type in new_columns:
        try:
            conn.execute(text(f"ALTER TABLE exercises ADD COLUMN {col_name} {col_type}"))
        except Exception:
            pass  # Column already exists


def _add_pause_columns(conn):
    """Add pause/resume columns to workout_sessions table."""
    pause_columns = [
        ("paused_at", "TIMESTAMP"),
        ("total_paused_seconds", "INTEGER DEFAULT 0"),
    ]

    for col_name, col_type in pause_columns:
        try:
            conn.execute(text(f"ALTER TABLE workout_sessions ADD COLUMN {col_name} {col_type}"))
        except Exception:
            pass  # Column already exists


# Auto-run on import
init_fitness_tables()
