# Phase 4.5 Data Design Specification

## Overview

This document specifies the data architecture for the Enhanced Fitness module, following existing AskSharon patterns and database standards.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│  user_profile   │       │ fitness_assessments │
│  (1 per user)   │──────<│  (many over time)   │
└─────────────────┘       └─────────────────────┘
        │
        │ (implicit user)
        │
┌───────┴─────────┐       ┌─────────────────────┐
│  user_equipment │       │   fitness_goals     │
│  (many items)   │       │   (many goals)      │
└─────────────────┘       └─────────────────────┘
                                   │
                                   │ FK
                                   ▼
                          ┌─────────────────────┐
                          │   goal_progress     │
                          │   (log entries)     │
                          └─────────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│    exercises    │──────<│   exercise_logs     │
│ (reference data)│       │  (existing table)   │
└─────────────────┘       └─────────────────────┘
        │
        │ FK
        ▼
┌─────────────────┐
│  user_focus_    │
│     areas       │
└─────────────────┘
```

---

## Table Specifications

### 1. user_profile

**Purpose:** Store user's physical metrics and calculated values.

**Privacy:** LOCAL ONLY - Never sync to cloud.

```sql
CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Physical Measurements
    height_cm INTEGER NOT NULL CHECK(height_cm BETWEEN 100 AND 250),
    weight_kg REAL NOT NULL CHECK(weight_kg BETWEEN 20 AND 300),
    age INTEGER CHECK(age BETWEEN 10 AND 120),
    gender TEXT CHECK(gender IN ('male', 'female', 'other', 'prefer_not_to_say')),

    -- Optional Body Composition
    waist_cm REAL CHECK(waist_cm BETWEEN 40 AND 200),
    hip_cm REAL CHECK(hip_cm BETWEEN 50 AND 200),
    neck_cm REAL CHECK(neck_cm BETWEEN 20 AND 60),
    body_fat_pct REAL CHECK(body_fat_pct BETWEEN 3 AND 60),

    -- Calculated Fields (updated on save)
    bmi REAL CHECK(bmi BETWEEN 10 AND 100),
    bmi_category TEXT CHECK(bmi_category IN ('underweight', 'normal', 'overweight', 'obese_1', 'obese_2', 'obese_3')),
    waist_to_height_ratio REAL,

    -- Activity Level
    activity_level TEXT DEFAULT 'moderate' CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    experience_level TEXT DEFAULT 'beginner' CHECK(experience_level IN ('beginner', 'intermediate', 'advanced')),

    -- Timestamps (following existing pattern)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only one profile per system (single user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profile_singleton ON user_profile(id);
```

**Calculated Field Formulas:**
- `bmi = weight_kg / (height_cm / 100)²`
- `bmi_category`:
  - < 18.5: underweight
  - 18.5-24.9: normal
  - 25-29.9: overweight
  - 30-34.9: obese_1
  - 35-39.9: obese_2
  - >= 40: obese_3
- `waist_to_height_ratio = waist_cm / height_cm` (if waist provided)

---

### 2. fitness_assessments

**Purpose:** Track fitness test results over time for progress monitoring.

**Privacy:** LOCAL ONLY

```sql
CREATE TABLE IF NOT EXISTS fitness_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Assessment Date
    assessment_date DATE NOT NULL DEFAULT (DATE('now')),

    -- Strength Tests
    push_up_max INTEGER CHECK(push_up_max >= 0),
    squat_60s_count INTEGER CHECK(squat_60s_count >= 0),

    -- Endurance Tests (seconds)
    plank_hold_seconds INTEGER CHECK(plank_hold_seconds >= 0),
    wall_sit_seconds INTEGER CHECK(wall_sit_seconds >= 0),

    -- Cardiovascular
    resting_heart_rate INTEGER CHECK(resting_heart_rate BETWEEN 30 AND 200),
    step_test_heart_rate INTEGER CHECK(step_test_heart_rate BETWEEN 60 AND 220),

    -- Flexibility (1-5 scale)
    sit_reach_score INTEGER CHECK(sit_reach_score BETWEEN 1 AND 5),
    shoulder_flexibility_score INTEGER CHECK(shoulder_flexibility_score BETWEEN 1 AND 5),

    -- Balance (seconds)
    single_leg_balance_left INTEGER CHECK(single_leg_balance_left >= 0),
    single_leg_balance_right INTEGER CHECK(single_leg_balance_right >= 0),

    -- Calculated Classification
    overall_fitness_level TEXT CHECK(overall_fitness_level IN ('beginner', 'intermediate', 'advanced')),
    fitness_score INTEGER CHECK(fitness_score BETWEEN 0 AND 100),

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One assessment per day
    UNIQUE(assessment_date)
);

CREATE INDEX IF NOT EXISTS idx_assessments_date ON fitness_assessments(assessment_date DESC);
```

**Fitness Level Classification Algorithm:**
```python
def classify_fitness_level(push_ups, plank_sec, squat_60s):
    """
    Score-based classification using research-backed benchmarks.

    Benchmarks (general adult):
    - Push-ups: <10 beginner, 10-25 intermediate, >25 advanced
    - Plank: <30s beginner, 30-60s intermediate, >60s advanced
    - Squats/60s: <20 beginner, 20-35 intermediate, >35 advanced
    """
    score = 0

    # Push-ups scoring
    if push_ups is not None:
        if push_ups >= 25: score += 3
        elif push_ups >= 15: score += 2
        elif push_ups >= 10: score += 1

    # Plank scoring
    if plank_sec is not None:
        if plank_sec >= 60: score += 3
        elif plank_sec >= 45: score += 2
        elif plank_sec >= 30: score += 1

    # Squat scoring
    if squat_60s is not None:
        if squat_60s >= 35: score += 3
        elif squat_60s >= 25: score += 2
        elif squat_60s >= 20: score += 1

    # Classification (max score = 9)
    if score >= 7: return "advanced"
    elif score >= 4: return "intermediate"
    return "beginner"
```

---

### 3. health_notes

**Purpose:** Store injury history and exercise limitations.

**Privacy:** LOCAL ONLY - Sensitive medical data.

```sql
CREATE TABLE IF NOT EXISTS health_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Injury/Condition Details
    body_area TEXT NOT NULL CHECK(body_area IN (
        'neck', 'shoulder', 'upper_back', 'lower_back',
        'elbow', 'wrist', 'hand', 'hip', 'knee', 'ankle',
        'foot', 'chest', 'abdomen', 'general'
    )),
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'moderate' CHECK(severity IN ('mild', 'moderate', 'severe', 'recovered')),

    -- Date Information
    injury_date DATE,
    recovery_date DATE,

    -- Exercise Impact
    exercises_to_avoid TEXT,  -- JSON array or comma-separated
    modifications_needed TEXT,

    -- Status
    active INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_notes_active ON health_notes(active) WHERE active = 1;
CREATE INDEX IF NOT EXISTS idx_health_notes_area ON health_notes(body_area);
```

---

### 4. user_equipment

**Purpose:** Track available fitness equipment for workout filtering.

**Privacy:** LOCAL - Can optionally sync summary to cloud.

```sql
CREATE TABLE IF NOT EXISTS user_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Equipment Identification
    equipment_type TEXT NOT NULL CHECK(equipment_type IN (
        'bodyweight',
        'kettlebell',
        'dumbbell',
        'barbell',
        'pull_up_bar',
        'resistance_band',
        'bench',
        'trx',
        'jump_rope',
        'foam_roller',
        'yoga_mat',
        'exercise_ball',
        'medicine_ball',
        'cable_machine',
        'other'
    )),

    -- Details
    details TEXT,  -- e.g., "16kg, 24kg" for kettlebells
    quantity INTEGER DEFAULT 1,

    -- Status
    active INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicates
    UNIQUE(equipment_type)
);
```

---

### 5. fitness_goals

**Purpose:** Track specific fitness goals with targets and deadlines.

**Privacy:** LOCAL - Optionally sync to Supabase for cross-system intelligence.

```sql
CREATE TABLE IF NOT EXISTS fitness_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Goal Definition
    goal_type TEXT NOT NULL CHECK(goal_type IN (
        'strength',     -- e.g., "Bench 100kg"
        'endurance',    -- e.g., "Run 5K in 25 min"
        'skill',        -- e.g., "Do 10 pull-ups"
        'body_comp',    -- e.g., "Reach 15% body fat"
        'consistency',  -- e.g., "Work out 4x/week for 3 months"
        'flexibility',  -- e.g., "Touch toes"
        'custom'
    )),
    title TEXT NOT NULL,
    description TEXT,

    -- Measurable Targets
    target_value REAL NOT NULL,
    target_unit TEXT NOT NULL,  -- 'reps', 'kg', 'minutes', 'percent', 'days', etc.
    start_value REAL DEFAULT 0,
    current_value REAL DEFAULT 0,

    -- Timeline
    start_date DATE DEFAULT (DATE('now')),
    deadline DATE,

    -- Related Exercise (optional)
    exercise_id INTEGER REFERENCES exercises(id),

    -- Status
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'achieved', 'abandoned', 'paused')),
    achieved_at TIMESTAMP,

    -- Supabase Sync (for cross-system)
    supabase_memory_id INTEGER,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goals_status ON fitness_goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON fitness_goals(deadline) WHERE status = 'active';
```

---

### 6. goal_progress

**Purpose:** Log progress entries toward goals for tracking over time.

**Privacy:** LOCAL

```sql
CREATE TABLE IF NOT EXISTS goal_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Reference
    goal_id INTEGER NOT NULL REFERENCES fitness_goals(id) ON DELETE CASCADE,

    -- Progress Entry
    logged_date DATE NOT NULL DEFAULT (DATE('now')),
    value REAL NOT NULL,

    -- Context
    notes TEXT,
    session_id INTEGER REFERENCES workout_sessions(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One entry per goal per day
    UNIQUE(goal_id, logged_date)
);

CREATE INDEX IF NOT EXISTS idx_goal_progress_goal ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(logged_date DESC);
```

---

### 7. user_focus_areas

**Purpose:** Store training priorities for workout generation weighting.

**Privacy:** LOCAL

```sql
CREATE TABLE IF NOT EXISTS user_focus_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Focus Definition
    focus_type TEXT NOT NULL CHECK(focus_type IN ('muscle_group', 'movement_pattern', 'fitness_aspect')),
    focus_value TEXT NOT NULL,

    -- Priority (1=highest)
    priority INTEGER DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),

    -- Status
    active INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- No duplicate focus areas
    UNIQUE(focus_type, focus_value)
);

-- Valid focus_value by focus_type:
-- muscle_group: chest, back, shoulders, arms, core, legs, glutes
-- movement_pattern: push, pull, squat, hinge, carry, core
-- fitness_aspect: strength, hypertrophy, endurance, power, flexibility
```

---

### 8. exercises (Enhancement to Existing Table)

**Purpose:** Add coaching content to existing exercises reference table.

**Migration:** ALTER TABLE to add new columns.

```sql
-- New columns to add to existing exercises table
ALTER TABLE exercises ADD COLUMN instructions TEXT;
ALTER TABLE exercises ADD COLUMN form_cues TEXT;
ALTER TABLE exercises ADD COLUMN common_mistakes TEXT;
ALTER TABLE exercises ADD COLUMN muscles_primary TEXT;
ALTER TABLE exercises ADD COLUMN muscles_secondary TEXT;
ALTER TABLE exercises ADD COLUMN difficulty_level INTEGER DEFAULT 2 CHECK(difficulty_level BETWEEN 1 AND 5);
ALTER TABLE exercises ADD COLUMN movement_pattern TEXT CHECK(movement_pattern IN (
    'push_horizontal', 'push_vertical',
    'pull_horizontal', 'pull_vertical',
    'squat', 'hinge', 'lunge',
    'carry', 'core', 'rotation',
    'locomotion', 'flexibility'
));

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_pattern ON exercises(movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty_level);
```

---

### 9. weekly_volume

**Purpose:** Track training volume per muscle group/pattern per week.

**Privacy:** LOCAL

```sql
CREATE TABLE IF NOT EXISTS weekly_volume (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Week Identification
    week_start DATE NOT NULL,  -- Monday of the week

    -- Volume Tracking
    category_type TEXT NOT NULL CHECK(category_type IN ('muscle_group', 'movement_pattern')),
    category_value TEXT NOT NULL,

    -- Metrics
    total_sets INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    total_weight_kg REAL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One entry per category per week
    UNIQUE(week_start, category_type, category_value)
);

CREATE INDEX IF NOT EXISTS idx_weekly_volume_week ON weekly_volume(week_start DESC);
```

---

## Data Validation Rules

### BMI Calculation
```python
def calculate_bmi(weight_kg: float, height_cm: int) -> tuple[float, str]:
    """Calculate BMI and category."""
    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m ** 2), 1)

    if bmi < 18.5:
        category = "underweight"
    elif bmi < 25:
        category = "normal"
    elif bmi < 30:
        category = "overweight"
    elif bmi < 35:
        category = "obese_1"
    elif bmi < 40:
        category = "obese_2"
    else:
        category = "obese_3"

    return bmi, category
```

### Goal Progress Calculation
```python
def calculate_goal_progress(start_value: float, current_value: float, target_value: float) -> float:
    """Calculate progress percentage toward goal."""
    if target_value == start_value:
        return 100.0 if current_value >= target_value else 0.0

    progress = (current_value - start_value) / (target_value - start_value) * 100
    return max(0, min(100, round(progress, 1)))
```

---

## Supabase Integration

### Goals to Sync
Only sync goals when user explicitly chooses to link with ManagementTeam:

```python
def sync_goal_to_supabase(goal: dict) -> int:
    """
    Sync fitness goal to long-term memory for cross-system queries.

    Returns: supabase memory_id
    """
    content = f"Fitness Goal: {goal['title']}\n"
    content += f"Target: {goal['target_value']} {goal['target_unit']}\n"
    content += f"Deadline: {goal['deadline']}"

    # Store with semantic embedding
    memory_id = store_to_supabase(
        content=content,
        source_system="asksharon",
        entity_type="fitness_goal",
        entity_id=str(goal['id']),
        metadata={
            "goal_type": goal['goal_type'],
            "target_value": goal['target_value'],
            "deadline": goal['deadline']
        }
    )

    return memory_id
```

### What NOT to Sync
- `user_profile` - Body metrics are private
- `health_notes` - Medical data is private
- `fitness_assessments` - Personal performance data
- `weekly_volume` - Derived data, not needed in semantic memory

---

## Migration Strategy

### Order of Execution
1. Create new tables (no dependencies)
2. Alter existing `exercises` table (backward compatible)
3. Seed reference data (equipment types, exercises with coaching)
4. Create indexes

### Safe Migration Script
```sql
-- migrations/phase_4.5_fitness_enhanced.sql
-- Run: sqlite3 assistant/data/memory.db < migrations/phase_4.5_fitness_enhanced.sql

-- 1. User Profile (idempotent)
CREATE TABLE IF NOT EXISTS user_profile (...);

-- 2. Fitness Assessments (idempotent)
CREATE TABLE IF NOT EXISTS fitness_assessments (...);

-- 3. Health Notes (idempotent)
CREATE TABLE IF NOT EXISTS health_notes (...);

-- 4. User Equipment (idempotent)
CREATE TABLE IF NOT EXISTS user_equipment (...);

-- 5. Fitness Goals (idempotent)
CREATE TABLE IF NOT EXISTS fitness_goals (...);

-- 6. Goal Progress (idempotent)
CREATE TABLE IF NOT EXISTS goal_progress (...);

-- 7. User Focus Areas (idempotent)
CREATE TABLE IF NOT EXISTS user_focus_areas (...);

-- 8. Weekly Volume (idempotent)
CREATE TABLE IF NOT EXISTS weekly_volume (...);

-- 9. Exercises Enhancement (safe ALTERs)
-- Each ALTER wrapped in try/catch via Python
```

---

## Testing Strategy

### Unit Tests for Data Layer
```python
def test_bmi_calculation():
    bmi, category = calculate_bmi(75, 175)
    assert bmi == 24.5
    assert category == "normal"

def test_fitness_classification():
    level = classify_fitness_level(push_ups=20, plank_sec=45, squat_60s=25)
    assert level == "intermediate"

def test_goal_progress():
    progress = calculate_goal_progress(start=3, current=7, target=10)
    assert progress == 57.1  # (7-3)/(10-3) * 100

def test_user_profile_constraints():
    # Should reject invalid height
    with pytest.raises(IntegrityError):
        save_user_profile(height_cm=50, weight_kg=75)  # Too short
```

---

## Summary

| Table | Records | Sync | Privacy |
|-------|---------|------|---------|
| user_profile | 1 | Never | High |
| fitness_assessments | ~12/year | Never | High |
| health_notes | ~5 | Never | Critical |
| user_equipment | ~10 | Never | Low |
| fitness_goals | ~10 active | Optional | Medium |
| goal_progress | ~365/year | Never | Medium |
| user_focus_areas | ~5 | Never | Low |
| weekly_volume | ~52/year | Never | Low |
| exercises (enhanced) | ~50+ | N/A (ref) | N/A |

**Total new tables:** 8
**Total new columns (exercises):** 7
**Indexes:** 12

---

## Phase 4.5+ Extension: Intelligent Training System Data Design

### Overview

This section extends the Phase 4.5 data model to support:
- Dynamic goal intelligence (any goal → training requirements)
- Calendar-aware load management
- Workout justifications and education
- Periodization tracking
- Smart logging reminders

---

### New Entity Relationship Diagram

```
goal_training_types (reference)
         │
         │ category
         ▼
   fitness_goals ──────────┬──────────────────┐
         │                 │                  │
         │ FK              │ FK               │ FK
         ▼                 ▼                  ▼
  goal_milestones    goal_progress    weekly_training_plans
                                              │
                                              │ FK
                                              ▼
                                    workout_justifications
                                              │
                                              │ FK
                                              ▼
                                      workout_sessions

external_activities ───────────────► weekly_training_plans
                                          (influences)

periodization_state ───────────────► weekly_training_plans
                                          (informs)

workout_sessions ──────────────────► workout_logging_queue
                                          (tracks)
```

---

### 10. goal_training_types (Reference Data)

**Purpose:** Maps goal categories to their training requirements. Enables system to understand what training is needed for any goal type.

**Privacy:** N/A - Reference data, no personal info.

```sql
CREATE TABLE IF NOT EXISTS goal_training_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Category Identification
    goal_category TEXT NOT NULL UNIQUE,  -- 'vertical_jump', '5k_time', etc.
    display_name TEXT NOT NULL,          -- 'Vertical Jump', '5K Time', etc.

    -- Training Requirements (JSON arrays)
    training_methods TEXT NOT NULL,       -- ["plyometrics", "posterior_chain"]
    recommended_exercises TEXT,           -- ["box_jumps", "kb_swings", "squats"]
    movement_patterns TEXT,               -- ["squat", "hinge", "explosive"]

    -- Programming Style
    periodization_style TEXT CHECK(periodization_style IN (
        'power_focus',      -- For explosive goals
        'endurance_focus',  -- For cardio goals
        'strength_focus',   -- For max strength
        'balanced',         -- General fitness
        'maintenance'       -- Mobility/flexibility
    )),

    -- Education
    description TEXT,                     -- Explanation for user education

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goal_training_category ON goal_training_types(goal_category);
```

**Seed Data:**
```python
GOAL_TRAINING_TYPES = [
    {
        "goal_category": "vertical_jump",
        "display_name": "Vertical Jump",
        "training_methods": ["plyometrics", "posterior_chain", "rate_of_force_development"],
        "recommended_exercises": ["box_jumps", "depth_jumps", "kb_swings", "squats", "jump_squats"],
        "movement_patterns": ["squat", "hinge", "explosive"],
        "periodization_style": "power_focus",
        "description": "Developing explosive power for jumping requires plyometric training, strong posterior chain, and rate of force development work."
    },
    {
        "goal_category": "5k_time",
        "display_name": "5K Running Time",
        "training_methods": ["aerobic_base", "tempo_runs", "interval_training", "threshold_work"],
        "recommended_exercises": ["running", "cycling", "rowing", "stair_climbing"],
        "movement_patterns": ["locomotion", "cardio"],
        "periodization_style": "endurance_focus",
        "description": "Improving 5K time requires building aerobic base, tempo runs for lactate threshold, and interval training for speed."
    },
    {
        "goal_category": "general_fitness",
        "display_name": "General Fitness",
        "training_methods": ["balanced", "circuit_training", "compound_movements"],
        "recommended_exercises": ["all_equipment_available"],
        "movement_patterns": ["push", "pull", "squat", "hinge", "core", "carry"],
        "periodization_style": "balanced",
        "description": "General fitness uses balanced training across all movement patterns with moderate volume and intensity."
    },
    {
        "goal_category": "mobility",
        "display_name": "Mobility & Flexibility",
        "training_methods": ["flexibility", "joint_health", "yoga", "dynamic_stretching"],
        "recommended_exercises": ["yoga_flows", "dynamic_stretches", "foam_rolling", "mobility_drills"],
        "movement_patterns": ["mobility", "flexibility"],
        "periodization_style": "maintenance",
        "description": "Mobility work focuses on joint health, range of motion, and flexibility through targeted stretching and movement."
    },
    {
        "goal_category": "strength",
        "display_name": "Maximum Strength",
        "training_methods": ["progressive_overload", "compound_lifts", "low_rep_high_intensity"],
        "recommended_exercises": ["squats", "deadlifts", "bench_press", "rows", "overhead_press"],
        "movement_patterns": ["squat", "hinge", "push", "pull"],
        "periodization_style": "strength_focus",
        "description": "Building maximum strength requires progressive overload with compound movements at high intensity and lower rep ranges."
    },
    {
        "goal_category": "muscle_building",
        "display_name": "Muscle Building (Hypertrophy)",
        "training_methods": ["hypertrophy", "moderate_rep_ranges", "time_under_tension"],
        "recommended_exercises": ["compound_and_isolation"],
        "movement_patterns": ["push", "pull", "squat", "hinge"],
        "periodization_style": "balanced",
        "description": "Muscle building requires moderate rep ranges (8-12), adequate volume, and progressive overload with focus on time under tension."
    },
    {
        "goal_category": "weight_loss",
        "display_name": "Weight Loss / Fat Loss",
        "training_methods": ["circuit_training", "hiit", "metabolic_conditioning"],
        "recommended_exercises": ["compound_movements", "cardio", "circuits"],
        "movement_patterns": ["full_body", "cardio"],
        "periodization_style": "balanced",
        "description": "Fat loss combines resistance training to preserve muscle with metabolic conditioning for calorie burn."
    },
    {
        "goal_category": "sport_performance",
        "display_name": "Sport Performance",
        "training_methods": ["sport_specific", "power", "agility", "conditioning"],
        "recommended_exercises": ["plyometrics", "agility_drills", "sport_specific"],
        "movement_patterns": ["explosive", "lateral", "rotational"],
        "periodization_style": "power_focus",
        "description": "Sport performance training develops sport-specific power, agility, and conditioning patterns."
    },
    {
        "goal_category": "skill_acquisition",
        "display_name": "Skill Acquisition",
        "training_methods": ["progressive_skill_work", "technique_focus", "frequency"],
        "recommended_exercises": ["skill_specific"],
        "movement_patterns": ["skill_specific"],
        "periodization_style": "balanced",
        "description": "Skill goals (pull-ups, handstands, etc.) require frequent practice with progressive difficulty and technique focus."
    },
    {
        "goal_category": "custom",
        "display_name": "Custom Goal",
        "training_methods": ["user_defined"],
        "recommended_exercises": ["user_selected"],
        "movement_patterns": ["user_defined"],
        "periodization_style": "balanced",
        "description": "Custom goals allow manual selection of training methods and exercises."
    }
]
```

---

### 11. goal_milestones

**Purpose:** Track progressive sub-targets for goals. Provides incremental achievement and motivation.

**Privacy:** Medium - Can optionally sync with parent goal.

```sql
CREATE TABLE IF NOT EXISTS goal_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Parent Goal Reference
    goal_id INTEGER NOT NULL REFERENCES fitness_goals(id) ON DELETE CASCADE,

    -- Milestone Definition
    milestone_order INTEGER NOT NULL,      -- Sequence: 1, 2, 3...
    milestone_value REAL NOT NULL,         -- Target value for this milestone
    description TEXT,                      -- e.g., "Touch rim", "Grab rim", "Dunk"

    -- Timeline
    target_date DATE,                      -- Expected achievement date
    achieved_date DATE,                    -- Actual achievement date

    -- Status
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'achieved', 'skipped')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure ordering within goal
    UNIQUE(goal_id, milestone_order)
);

CREATE INDEX IF NOT EXISTS idx_milestones_goal ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON goal_milestones(status) WHERE status = 'pending';
```

**Auto-Generation Examples:**
```python
MILESTONE_TEMPLATES = {
    "vertical_jump": [
        {"pct": 25, "desc": "Touch rim"},
        {"pct": 50, "desc": "Grab rim with fingertips"},
        {"pct": 75, "desc": "Grab rim solidly"},
        {"pct": 100, "desc": "Achieve dunk"}
    ],
    "5k_time": [
        {"pct": 25, "desc": "25% improvement"},
        {"pct": 50, "desc": "Halfway to target"},
        {"pct": 75, "desc": "75% improvement"},
        {"pct": 100, "desc": "Target time achieved"}
    ],
    "skill_acquisition": [
        {"pct": 20, "desc": "First successful rep"},
        {"pct": 40, "desc": "3 consecutive reps"},
        {"pct": 60, "desc": "5 consecutive reps"},
        {"pct": 80, "desc": "8 consecutive reps"},
        {"pct": 100, "desc": "Target achieved"}
    ]
}
```

---

### 12. external_activities

**Purpose:** Track physical activities from calendar for training load management.

**Privacy:** Low - Activity data only, no personal metrics.

```sql
CREATE TABLE IF NOT EXISTS external_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Activity Identification
    activity_date DATE NOT NULL,
    activity_type TEXT NOT NULL CHECK(activity_type IN (
        '5_a_side', 'football', 'soccer',
        'jiu_jitsu', 'bjj', 'martial_arts',
        'running', 'cycling', 'swimming',
        'basketball', 'tennis', 'squash',
        'hiking', 'climbing',
        'yoga', 'pilates',
        'gym_session',
        'other_sport', 'other_activity'
    )),
    activity_name TEXT,                    -- Specific name from calendar

    -- Intensity & Duration
    intensity TEXT DEFAULT 'medium' CHECK(intensity IN ('low', 'medium', 'high')),
    duration_minutes INTEGER,

    -- Load Impact
    load_score INTEGER CHECK(load_score BETWEEN 1 AND 10),

    -- Calendar Integration
    calendar_event_id TEXT,                -- Reference to calendar module

    -- Recurrence
    is_recurring INTEGER DEFAULT 0,
    day_of_week INTEGER CHECK(day_of_week BETWEEN 0 AND 6),  -- 0=Monday

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Index for date lookups
    UNIQUE(activity_date, activity_type, activity_name)
);

CREATE INDEX IF NOT EXISTS idx_external_activities_date ON external_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_external_activities_recurring ON external_activities(is_recurring, day_of_week)
    WHERE is_recurring = 1;
```

**Load Score Calculation:**
```python
ACTIVITY_BASE_LOAD = {
    "5_a_side": 7,
    "football": 7,
    "soccer": 7,
    "jiu_jitsu": 8,
    "bjj": 8,
    "martial_arts": 7,
    "running": 5,
    "cycling": 4,
    "swimming": 5,
    "basketball": 7,
    "tennis": 6,
    "squash": 7,
    "hiking": 4,
    "climbing": 6,
    "yoga": 2,
    "pilates": 3,
    "gym_session": 6,
    "other_sport": 5,
    "other_activity": 4
}

INTENSITY_MULTIPLIER = {
    "low": 0.7,
    "medium": 1.0,
    "high": 1.3
}

def calculate_load_score(activity_type: str, duration_minutes: int, intensity: str) -> int:
    """Calculate training load score (1-10) for external activity."""
    base = ACTIVITY_BASE_LOAD.get(activity_type, 5)
    intensity_mult = INTENSITY_MULTIPLIER.get(intensity, 1.0)
    duration_mult = min(duration_minutes / 60, 2.0)  # Cap at 2 hours effect

    score = int(base * intensity_mult * duration_mult)
    return max(1, min(10, score))
```

---

### 13. weekly_training_plans

**Purpose:** Store generated weekly workout plans with full context and justifications.

**Privacy:** Low - Training data only.

```sql
CREATE TABLE IF NOT EXISTS weekly_training_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Week Identification
    week_start DATE NOT NULL,              -- Monday of the week

    -- Generated Plan (JSON structure)
    plan_json TEXT NOT NULL,               -- Full workout schedule

    -- Context Considered
    goals_considered TEXT,                 -- JSON array of goal IDs
    external_activities_json TEXT,         -- Calendar activities that week
    equipment_available TEXT,              -- JSON array of equipment
    fitness_level TEXT,                    -- User's level when generated

    -- Periodization
    periodization_phase TEXT CHECK(periodization_phase IN (
        'accumulation',   -- High volume, moderate intensity
        'transmutation',  -- Moderate volume, high intensity
        'realization',    -- Low volume, peak intensity
        'deload'          -- Recovery week
    )),
    week_in_phase INTEGER,                 -- Week number within phase

    -- Load Management
    weekly_load_target INTEGER,            -- Target total load
    weekly_load_actual INTEGER,            -- Actual achieved load

    -- Justification
    justification_summary TEXT,            -- Brief plan rationale

    -- Status
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'abandoned')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One plan per week
    UNIQUE(week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_week ON weekly_training_plans(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_status ON weekly_training_plans(status);
```

**Plan JSON Structure:**
```python
{
    "monday": {
        "workout_type": "plyometrics_strength",
        "focus": "vertical_jump",
        "exercises": [
            {"name": "Box Jumps", "sets": 4, "reps": 6, "rest_sec": 120},
            {"name": "Depth Jumps", "sets": 3, "reps": 5, "rest_sec": 120},
            {"name": "Goblet Squats", "sets": 3, "reps": 10, "rest_sec": 90}
        ],
        "estimated_duration": 45,
        "load_score": 7
    },
    "tuesday": {
        "workout_type": "rest",
        "reason": "Recovery from plyometrics"
    },
    "wednesday": {
        "workout_type": "mobility",
        "reason": "5-a-side game tomorrow",
        "exercises": [...]
    },
    "thursday": {
        "workout_type": "external_activity",
        "activity": "5-a-side",
        "load_score": 7
    },
    "friday": {
        "workout_type": "recovery",
        "reason": "Post-game recovery",
        "exercises": [...]
    },
    "saturday": {
        "workout_type": "strength",
        "focus": "posterior_chain",
        "exercises": [...]
    },
    "sunday": {
        "workout_type": "rest"
    }
}
```

---

### 14. workout_justifications

**Purpose:** Store educational explanations for each workout. Provides brief + detailed views.

**Privacy:** Low - Educational content.

```sql
CREATE TABLE IF NOT EXISTS workout_justifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Links
    session_id INTEGER REFERENCES workout_sessions(id),
    plan_id INTEGER REFERENCES weekly_training_plans(id),
    workout_date DATE NOT NULL,

    -- Brief Justification (always shown)
    brief_text TEXT NOT NULL,              -- "Plyometrics focus: Building explosive power for vertical goal"

    -- Detailed Justification (expandable)
    detailed_text TEXT,                    -- Full explanation with training science

    -- Context References
    goals_addressed TEXT,                  -- JSON array of goal IDs
    calendar_context TEXT,                 -- How calendar affected this workout
    periodization_context TEXT,            -- Current phase explanation

    -- Educational Content
    training_science_notes TEXT,           -- "Why" of the training approach
    expected_adaptations TEXT,             -- What user will gain
    timeline_notes TEXT,                   -- When to expect results

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_justifications_session ON workout_justifications(session_id);
CREATE INDEX IF NOT EXISTS idx_justifications_date ON workout_justifications(workout_date DESC);
```

**Example Justification:**
```python
{
    "brief_text": "Plyometrics focus: Building explosive power for your vertical jump goal",

    "detailed_text": """Today's workout focuses on plyometric training because:

1. **Your Primary Goal**: Increasing vertical jump to dunk
2. **Training Science**: Plyometrics develop rate of force production - the speed at which your muscles generate power
3. **Calendar Context**: You have 3 days until your 5-a-side game, allowing full recovery
4. **Recovery Status**: Your legs have had 72+ hours since last lower body session

**Why These Exercises:**
- Box Jumps: Develop explosive hip extension and landing mechanics
- Depth Jumps: Train the stretch-shortening cycle for reactive power
- Goblet Squats: Build strength foundation that transfers to jumping

**Expected Adaptations:**
- Improved reactive strength (4-6 weeks)
- Better jump timing and coordination (2-4 weeks)
- Increased rate of force development (6-8 weeks)""",

    "calendar_context": "No high-intensity activities within 48 hours. Full training load appropriate.",

    "periodization_context": "Week 3 of Accumulation phase. Building volume base before power phase.",

    "expected_adaptations": "Improved explosive power, better landing mechanics",

    "timeline_notes": "Expect noticeable improvement in 4-8 weeks with consistent training"
}
```

---

### 15. periodization_state

**Purpose:** Track current position in training mesocycle for intelligent planning.

**Privacy:** Low - Training state only.

```sql
CREATE TABLE IF NOT EXISTS periodization_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Current Cycle
    cycle_start_date DATE NOT NULL,        -- When current mesocycle began

    -- Phase Information
    current_phase TEXT NOT NULL CHECK(current_phase IN (
        'accumulation',   -- Weeks 1-3: High volume, moderate intensity
        'transmutation',  -- Weeks 4-5: Moderate volume, high intensity
        'realization',    -- Week 6: Low volume, peak intensity
        'deload'          -- Week 7: Recovery week (50% volume)
    )),
    current_week INTEGER NOT NULL,         -- Week number within phase (1-based)
    total_weeks_in_phase INTEGER NOT NULL, -- Total weeks in current phase

    -- Deload Tracking
    next_deload_date DATE,                 -- Scheduled deload
    last_deload_date DATE,                 -- Previous deload
    consecutive_training_weeks INTEGER DEFAULT 0,  -- Weeks since last deload

    -- Notes
    notes TEXT,

    -- Timestamps
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only one state record (singleton)
CREATE UNIQUE INDEX IF NOT EXISTS idx_periodization_singleton ON periodization_state(id);
```

**Phase Descriptions:**
```python
PERIODIZATION_PHASES = {
    "accumulation": {
        "weeks": 3,
        "volume": "high",
        "intensity": "moderate",
        "description": "Building work capacity and volume tolerance",
        "rpe_target": "6-7",
        "sets_multiplier": 1.2
    },
    "transmutation": {
        "weeks": 2,
        "volume": "moderate",
        "intensity": "high",
        "description": "Converting volume gains into strength/power",
        "rpe_target": "7-8",
        "sets_multiplier": 1.0
    },
    "realization": {
        "weeks": 1,
        "volume": "low",
        "intensity": "peak",
        "description": "Peaking for performance testing or events",
        "rpe_target": "8-9",
        "sets_multiplier": 0.6
    },
    "deload": {
        "weeks": 1,
        "volume": "very_low",
        "intensity": "low",
        "description": "Recovery and adaptation consolidation",
        "rpe_target": "5-6",
        "sets_multiplier": 0.5
    }
}
```

---

### 16. workout_logging_queue

**Purpose:** Track unlogged workouts for reminder system integration.

**Privacy:** Low - Session tracking only.

```sql
CREATE TABLE IF NOT EXISTS workout_logging_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Workout Reference
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id),
    workout_date DATE NOT NULL,

    -- Reminder Tracking
    reminder_count INTEGER DEFAULT 0,      -- Times reminded
    last_reminder_at TIMESTAMP,            -- Last reminder time
    reminder_channel TEXT,                 -- 'evening_routine', 'morning_routine', 'notification'

    -- Resolution
    logged_at TIMESTAMP,                   -- When finally logged
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'logged', 'skipped')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logging_queue_status ON workout_logging_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_logging_queue_date ON workout_logging_queue(workout_date DESC);
```

---

### Modifications to Existing Tables

#### fitness_goals - New Columns

```sql
-- Add to existing fitness_goals table
ALTER TABLE fitness_goals ADD COLUMN goal_category TEXT
    REFERENCES goal_training_types(goal_category);
ALTER TABLE fitness_goals ADD COLUMN training_methods_override TEXT;  -- JSON, if user wants to customize
ALTER TABLE fitness_goals ADD COLUMN has_milestones INTEGER DEFAULT 0;
ALTER TABLE fitness_goals ADD COLUMN calendar_aware INTEGER DEFAULT 1;  -- Consider external activities
```

#### workout_sessions - New Columns

```sql
-- Add to existing workout_sessions table
ALTER TABLE workout_sessions ADD COLUMN justification_id INTEGER
    REFERENCES workout_justifications(id);
ALTER TABLE workout_sessions ADD COLUMN plan_id INTEGER
    REFERENCES weekly_training_plans(id);
ALTER TABLE workout_sessions ADD COLUMN was_generated INTEGER DEFAULT 0;  -- vs manually created
ALTER TABLE workout_sessions ADD COLUMN load_score INTEGER CHECK(load_score BETWEEN 1 AND 10);
```

---

### Privacy Classification Summary

| Table | Privacy Level | Sync to Supabase | Notes |
|-------|---------------|------------------|-------|
| goal_training_types | N/A | No | Static reference data |
| goal_milestones | Medium | Optional (with goal) | Part of goal tracking |
| external_activities | Low | No | Calendar data stays local |
| weekly_training_plans | Low | No | Generated plans |
| workout_justifications | Low | No | Educational content |
| periodization_state | Low | No | Training state |
| workout_logging_queue | Low | No | Reminder system |

---

### Migration Summary for Phase 4.5+

**New Tables:** 7
- goal_training_types
- goal_milestones
- external_activities
- weekly_training_plans
- workout_justifications
- periodization_state
- workout_logging_queue

**Modified Tables:** 2
- fitness_goals (+4 columns)
- workout_sessions (+4 columns)

**Total New Columns:** 8
**New Indexes:** 12
