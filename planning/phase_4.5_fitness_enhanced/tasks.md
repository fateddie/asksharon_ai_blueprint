# Phase 4.5 Implementation Tasks

## Week 1: User Profile & Baseline Assessment

### Database & Schema (2 days)

**Task 1.1: Create user profile table**
- [ ] Create `user_profile` table in `workout_db.py`
  - height_cm (INTEGER)
  - weight_kg (REAL)
  - age (INTEGER, optional)
  - gender (TEXT, optional)
  - waist_cm (REAL, optional)
  - body_fat_pct (REAL, optional)
  - bmi (REAL, calculated)
  - bmi_category (TEXT, calculated: underweight/normal/overweight/obese)
  - created_at, updated_at
- [ ] Add BMI calculation helper function
- [ ] Test table creation

**Acceptance:**
```bash
sqlite3 assistant/data/memory.db ".schema user_profile"
# Should show all columns
```

**Task 1.2: Create fitness assessments table**
- [ ] Create `fitness_assessments` table
  - assessment_date (DATE)
  - push_up_max (INTEGER) - max reps with good form
  - plank_seconds (INTEGER) - max hold time
  - wall_sit_seconds (INTEGER) - max hold time
  - squat_60s_count (INTEGER) - reps in 60 seconds
  - resting_heart_rate (INTEGER, optional)
  - flexibility_score (INTEGER 1-5, optional)
  - balance_score (INTEGER 1-5, optional)
  - overall_fitness_level (TEXT: beginner/intermediate/advanced)
  - notes (TEXT)
- [ ] Add fitness level classification logic

**Acceptance:**
```python
from assistant.modules.fitness.assessment import classify_fitness_level
level = classify_fitness_level(push_ups=25, plank_sec=60)
# Should return "intermediate"
```

**Task 1.3: Create health notes table**
- [ ] Create `health_notes` table
  - injuries (TEXT) - free text for injury history
  - medical_conditions (TEXT, optional)
  - areas_to_avoid (TEXT) - exercises/movements to skip
  - notes (TEXT)
  - active (BOOLEAN)
- [ ] Implement injury-aware exercise filtering

### Baseline Assessment Backend (2 days)

**Task 1.4: User profile CRUD**
- [ ] Create `assistant/modules/fitness/user_profile.py`
- [ ] Implement `save_user_profile()` function
- [ ] Implement `get_user_profile()` function
- [ ] Implement `update_user_profile()` function
- [ ] Add BMI calculation: `weight_kg / (height_m ** 2)`
- [ ] Add BMI category classification

**Acceptance:**
```python
save_user_profile(height_cm=175, weight_kg=75, age=35)
profile = get_user_profile()
assert profile["bmi"] == 24.5
assert profile["bmi_category"] == "normal"
```

**Task 1.5: Fitness assessment logic**
- [ ] Create `assistant/modules/fitness/assessment.py`
- [ ] Implement `save_assessment()` function
- [ ] Implement `get_latest_assessment()` function
- [ ] Implement `get_assessment_history()` function
- [ ] Implement fitness level classification based on test results
- [ ] Add age/gender-adjusted scoring (optional enhancement)

**Fitness Level Classification Logic:**
```python
def classify_fitness_level(push_ups, plank_sec, squat_60s):
    score = 0
    # Push-ups: <10=beginner, 10-25=intermediate, >25=advanced
    if push_ups >= 25: score += 2
    elif push_ups >= 10: score += 1

    # Plank: <30s=beginner, 30-60s=intermediate, >60s=advanced
    if plank_sec >= 60: score += 2
    elif plank_sec >= 30: score += 1

    # Squats in 60s: <20=beginner, 20-35=intermediate, >35=advanced
    if squat_60s >= 35: score += 2
    elif squat_60s >= 20: score += 1

    if score >= 5: return "advanced"
    elif score >= 3: return "intermediate"
    return "beginner"
```

### Baseline Assessment UI (3 days)

**Task 1.6: Profile setup wizard UI**
- [ ] Create `assistant/modules/voice/fitness_setup_ui.py`
- [ ] Step 1: Basic info (height, weight, age optional)
- [ ] Show calculated BMI immediately
- [ ] Step 2: Health notes (injuries, limitations)
- [ ] Step 3: Training history questions
- [ ] Save to database on completion

**Playwright Test:**
```python
def test_profile_setup_wizard(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Setup Profile").click()
    page.fill("input[aria-label='Height (cm)']", "175")
    page.fill("input[aria-label='Weight (kg)']", "75")
    page.get_by_role("button", name="Calculate BMI").click()
    assert "BMI: 24.5" in page.content()
    assert "Normal weight" in page.content()
```

**Task 1.7: Fitness assessment wizard UI**
- [ ] Create guided assessment flow in `fitness_setup_ui.py`
- [ ] Test 1: Push-up test with instructions and form cues
- [ ] Test 2: Plank hold with timer
- [ ] Test 3: Wall sit with timer
- [ ] Test 4: 60-second squat test with countdown
- [ ] Test 5: Resting heart rate (optional, with guide)
- [ ] Show results summary with fitness level classification
- [ ] Compare to previous assessment (if exists)

**Playwright Test:**
```python
def test_fitness_assessment_flow(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Take Fitness Test").click()
    page.fill("input[aria-label='Push-up max']", "20")
    page.get_by_role("button", name="Next").click()
    # ... continue through tests
    assert "Your fitness level: Intermediate" in page.content()
```

---

## Week 2: Equipment & Goals

### Equipment System (2 days)

**Task 2.1: Create equipment tables**
- [ ] Create `user_equipment` table
  - equipment_type (TEXT: kettlebell, pull_up_bar, dumbbells, etc.)
  - details (TEXT: e.g., "16kg, 24kg" for kettlebells)
  - active (BOOLEAN)
- [ ] Create `equipment_types` reference table with standard equipment list
- [ ] Seed common equipment types

**Equipment Types to Seed:**
```python
equipment_types = [
    ("bodyweight", "No equipment needed"),
    ("kettlebell", "Cast iron weight with handle"),
    ("pull_up_bar", "Overhead bar for pull-ups"),
    ("dumbbells", "Free weights"),
    ("resistance_bands", "Elastic bands"),
    ("barbell", "Olympic or standard barbell"),
    ("bench", "Flat or adjustable bench"),
    ("trx", "Suspension trainer"),
    ("jump_rope", "Skipping rope"),
    ("foam_roller", "For mobility work"),
]
```

**Task 2.2: Enhanced exercise library with coaching**
- [ ] Update `exercises` table schema to include:
  - `instructions` (TEXT) - Step-by-step how to perform
  - `form_cues` (TEXT) - Key form points to remember
  - `common_mistakes` (TEXT) - What to avoid
  - `muscles_primary` (TEXT) - Main muscles worked
  - `muscles_secondary` (TEXT) - Supporting muscles
  - `difficulty_level` (INTEGER 1-5) - Skill requirement
  - `video_url` (TEXT, optional) - YouTube tutorial link
  - `movement_pattern` (TEXT) - Push/Pull/Hinge/Squat/Core/Carry
- [ ] Add kettlebell exercises to `exercises` table:
  - Kettlebell Swings (hinge, full_body)
  - Goblet Squats (squat, legs)
  - Turkish Get-Up (full_body)
  - Kettlebell Clean (pull, full_body)
  - Kettlebell Press (push, shoulders)
  - Kettlebell Row (pull, back)
- [ ] Add pull-up bar exercises:
  - Pull-ups (pull, back)
  - Chin-ups (pull, biceps)
  - Hanging Leg Raises (core, abs)
  - Dead Hangs (grip, shoulders)
  - Negative Pull-ups (pull, back)
- [ ] Add dumbbell exercises (common ones)
- [ ] Add resistance band exercises

**Task 2.2b: Seed exercise coaching content**
- [ ] For each exercise, add detailed coaching data:

**Example - Push-up:**
```python
{
    "name": "Push-ups",
    "instructions": """
1. Start in a high plank position, hands slightly wider than shoulders
2. Keep your body in a straight line from head to heels
3. Lower your chest toward the floor by bending elbows
4. Go down until chest is about 2 inches from floor
5. Push back up to starting position
6. Keep core engaged throughout
    """,
    "form_cues": "Elbows at 45 degrees, not flared out. Squeeze glutes. Look slightly ahead, not down.",
    "common_mistakes": "Sagging hips, flared elbows, incomplete range of motion, holding breath",
    "muscles_primary": "chest, triceps",
    "muscles_secondary": "shoulders, core",
    "difficulty_level": 2,
    "video_url": "https://www.youtube.com/watch?v=IODxDxX7oi4",  # Example
    "movement_pattern": "push_horizontal"
}
```

**Example - Kettlebell Swing:**
```python
{
    "name": "Kettlebell Swing",
    "instructions": """
1. Stand with feet shoulder-width apart, kettlebell on floor in front
2. Hinge at hips, grip kettlebell with both hands
3. Hike the kettlebell back between your legs
4. Drive hips forward explosively, swinging kettlebell to chest height
5. Let kettlebell fall back, hinging hips to absorb
6. Keep arms relaxed - power comes from hips, not arms
    """,
    "form_cues": "Hip hinge not squat. Snap hips forward. Arms are just hooks. Squeeze glutes at top.",
    "common_mistakes": "Squatting instead of hinging, using arms to lift, rounding back, going too heavy too soon",
    "muscles_primary": "glutes, hamstrings",
    "muscles_secondary": "core, back, shoulders",
    "difficulty_level": 3,
    "video_url": "https://www.youtube.com/watch?v=YSxHifyI6s8",  # Example
    "movement_pattern": "hinge"
}
```

- [ ] Add coaching content for all 15+ bodyweight exercises
- [ ] Add coaching content for kettlebell exercises
- [ ] Add coaching content for pull-up bar exercises
- [ ] Source reputable YouTube videos (optional but recommended)

**Task 2.2c: Exercise detail view UI**
- [ ] Create exercise detail modal/page showing:
  - Exercise name and difficulty badge
  - Step-by-step instructions
  - Form cues (highlighted)
  - Common mistakes to avoid
  - Muscles worked (primary + secondary)
  - Embedded YouTube video (if available)
  - "Mark as learned" checkbox
- [ ] Add "How to do this?" link next to each exercise in workout

**Playwright Test:**
```python
def test_exercise_coaching_view(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Exercises").click()
    page.get_by_text("Push-ups").click()
    page.get_by_text("How to do this").click()

    content = page.content()
    assert "Step-by-step" in content or "Instructions" in content
    assert "Form cues" in content
    assert "Common mistakes" in content
    assert "chest" in content.lower()  # Primary muscle
```

**Task 2.3: Equipment selection UI**
- [ ] Add equipment setup section to `fitness_setup_ui.py`
- [ ] Checkbox list of common equipment
- [ ] "Add custom equipment" option
- [ ] Details field (e.g., weight range for kettlebells)
- [ ] Save selections to database

**Acceptance:**
```python
save_user_equipment(["kettlebell", "pull_up_bar"])
exercises = get_exercises_for_equipment(["bodyweight", "kettlebell", "pull_up_bar"])
assert "Kettlebell Swings" in [e["name"] for e in exercises]
assert "Pull-ups" in [e["name"] for e in exercises]
```

### Goal System (3 days)

**Task 2.4: Create fitness goals table**
- [ ] Create `fitness_goals` table
  - goal_type (TEXT: strength, endurance, weight_loss, skill, etc.)
  - description (TEXT: "Do 10 pull-ups")
  - target_value (REAL: 10)
  - target_unit (TEXT: reps, kg, minutes, etc.)
  - current_value (REAL: 3)
  - deadline (DATE)
  - status (TEXT: active, achieved, abandoned)
  - created_at, achieved_at
- [ ] Implement goal CRUD functions

**Goal Types:**
```python
goal_types = [
    "strength",      # e.g., "Bench press 100kg"
    "endurance",     # e.g., "Run 5K in 25 minutes"
    "skill",         # e.g., "Do 10 pull-ups"
    "body_comp",     # e.g., "Reach 15% body fat"
    "consistency",   # e.g., "Work out 4x per week for 3 months"
    "flexibility",   # e.g., "Touch toes"
]
```

**Task 2.5: Goal progress tracking**
- [ ] Create `goal_progress` table (for logging progress over time)
  - goal_id, date, value, notes
- [ ] Implement `log_goal_progress()` function
- [ ] Implement `get_goal_progress()` function
- [ ] Calculate progress percentage: `(current - start) / (target - start) * 100`

**Task 2.6: Focus areas system**
- [ ] Create `user_focus_areas` table
  - focus_type (TEXT: muscle_group or fitness_aspect)
  - focus_value (TEXT: "upper_body", "core", "cardio", etc.)
  - priority (INTEGER: 1=high, 2=medium, 3=low)
  - active (BOOLEAN)
- [ ] Implement focus area weighting in workout generation

**Focus Options:**
```python
muscle_groups = ["upper_body", "lower_body", "core", "back", "chest", "arms", "shoulders"]
fitness_aspects = ["strength", "cardio", "flexibility", "endurance", "power"]
```

**Task 2.7: Goals & focus UI**
- [ ] Add goals section to fitness UI
- [ ] "Add New Goal" form with type, description, target, deadline
- [ ] Progress display with visual indicator (progress bar)
- [ ] Focus area selection (multi-select with priority)
- [ ] Goal achievement celebration

**Playwright Test:**
```python
def test_create_fitness_goal(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Goals").click()
    page.get_by_text("Add Goal").click()
    page.select_option("select[aria-label='Goal Type']", "skill")
    page.fill("input[aria-label='Description']", "Do 10 pull-ups")
    page.fill("input[aria-label='Target']", "10")
    page.fill("input[aria-label='Current']", "3")
    page.get_by_role("button", name="Save Goal").click()
    assert "Goal saved!" in page.content()
    assert "30% progress" in page.content()  # (3-0)/(10-0) = 30%
```

---

## Week 3: Evidence-Based Programming

### Training Science Module (3 days)

**Task 3.1: Create movement pattern system**
- [ ] Create `assistant/modules/fitness/training_science.py`
- [ ] Define movement pattern categories:
  - PUSH_HORIZONTAL (push-ups, bench press)
  - PUSH_VERTICAL (overhead press, pike push-ups)
  - PULL_HORIZONTAL (rows)
  - PULL_VERTICAL (pull-ups, lat pulldown)
  - SQUAT (squats, lunges)
  - HINGE (deadlift, kettlebell swing, glute bridge)
  - CARRY (farmer walks, suitcase carry)
  - CORE (planks, crunches, leg raises)
  - LOCOMOTION (burpees, mountain climbers, jumping)
- [ ] Add `movement_pattern` column to exercises table
- [ ] Classify all existing exercises

**Task 3.2: Volume tracking system**
- [ ] Create `weekly_volume` table
  - week_start (DATE)
  - muscle_group (TEXT)
  - movement_pattern (TEXT)
  - total_sets (INTEGER)
  - total_reps (INTEGER)
- [ ] Implement `calculate_weekly_volume()` from exercise_logs
- [ ] Add volume guidelines:
  - Maintenance: 6-10 sets/muscle/week
  - Hypertrophy: 10-20 sets/muscle/week
  - Max recoverable: ~25 sets/muscle/week

**Task 3.3: Progressive overload logic**
- [ ] Create `assistant/modules/fitness/progression.py`
- [ ] Analyze last 3 sessions for each exercise
- [ ] If avg RPE < 7: Suggest +1-2 reps or +2.5kg
- [ ] If avg RPE > 8: Suggest maintaining or slight decrease
- [ ] Track progression recommendations per exercise

**Progression Logic:**
```python
def suggest_progression(exercise_id, recent_logs):
    """
    Based on last 3 sessions, suggest next workout parameters.
    """
    avg_rpe = sum(log["rpe"] for log in recent_logs) / len(recent_logs)
    last_reps = recent_logs[-1]["reps"]
    last_weight = recent_logs[-1]["weight_kg"]

    if avg_rpe < 6:
        # Too easy - increase significantly
        return {"reps": last_reps + 2, "weight_kg": last_weight, "note": "Add 2 reps - RPE was low"}
    elif avg_rpe < 7.5:
        # Good zone - small increase
        return {"reps": last_reps + 1, "weight_kg": last_weight, "note": "Add 1 rep - progressing well"}
    elif avg_rpe < 8.5:
        # Challenging - maintain
        return {"reps": last_reps, "weight_kg": last_weight, "note": "Maintain - good intensity"}
    else:
        # Very hard - consider reducing
        return {"reps": last_reps - 1, "weight_kg": last_weight, "note": "Consider reducing - high RPE"}
```

### Workout Generator (4 days)

**Task 3.4: Create workout generator**
- [ ] Create `assistant/modules/fitness/workout_generator.py`
- [ ] Input parameters:
  - available_equipment (list)
  - focus_areas (list with priorities)
  - fitness_level (beginner/intermediate/advanced)
  - available_time (minutes)
  - last_workout_patterns (to avoid same muscles)
- [ ] Generate balanced workout with proper movement pattern distribution

**Workout Generation Logic:**
```python
def generate_workout(equipment, focus_areas, fitness_level, time_minutes, recent_patterns):
    """
    Generate evidence-based workout.

    Rules:
    1. Include at least one push, one pull, one lower body
    2. Weight focus areas but maintain balance
    3. Scale volume to fitness level
    4. Respect recovery (avoid recently worked patterns)
    5. Include warm-up and cool-down
    """
    workout = {
        "warm_up": generate_warmup(5),  # 5 minutes
        "main_work": [],
        "cool_down": generate_cooldown(5),  # 5 minutes
    }

    main_time = time_minutes - 10  # Subtract warm-up/cool-down

    # Ensure balance
    required_patterns = ["push", "pull", "squat_or_hinge"]

    # Add focus area exercises
    # Add supporting exercises
    # Scale sets/reps to fitness level

    return workout
```

**Task 3.5: Recovery-aware scheduling**
- [ ] Track last workout date per movement pattern
- [ ] Implement 48-72hr rest rule for same patterns
- [ ] Warn if user tries to do heavy push day after recent push
- [ ] Suggest alternative patterns if recent overlap

**Task 3.6: Warm-up and cool-down protocols**
- [ ] Create standard warm-up sequence:
  - Joint rotations (2 min)
  - Light cardio (2 min)
  - Dynamic stretches for target muscles (1 min)
- [ ] Create cool-down sequence:
  - Light movement (2 min)
  - Static stretches (3 min)
- [ ] Match warm-up to workout type (upper/lower/full)

**Task 3.7: Workout generator UI integration**
- [ ] Add "Generate Workout" button to fitness UI
- [ ] Show generated workout with:
  - Movement pattern tags
  - Suggested sets/reps/weight
  - Rest times
  - Total estimated time
- [ ] Allow user to modify before starting
- [ ] One-click "Start This Workout"

**Playwright Test:**
```python
def test_workout_generation(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Generate Workout").click()
    page.select_option("select[aria-label='Time']", "30")
    page.get_by_role("button", name="Generate").click()

    content = page.content()
    # Should have balanced patterns
    assert "Push" in content or "Pull" in content
    assert "Warm-up" in content
    assert "Cool-down" in content
```

---

## Week 4: Smart Recommendations & Polish

### Intelligent Recommendations (3 days)

**Task 4.1: Goal-linked recommendations**
- [ ] Create `assistant/modules/fitness/recommendations.py`
- [ ] Analyze gap between current and target for each goal
- [ ] Generate specific recommendations:
  - "You're 3 pull-ups away from your goal - here's a progression plan"
  - "At current rate, you'll reach your goal by [date]"
  - "Consider adding [exercise] to accelerate progress"

**Task 4.2: Volume balance alerts**
- [ ] Calculate weekly volume per movement pattern
- [ ] Alert if imbalanced:
  - "You've done 14 push sets but only 6 pull sets this week"
  - "Consider adding more leg work - only 4 sets this week"
- [ ] Display volume summary in dashboard

**Task 4.3: Deload recommendations**
- [ ] Track consecutive training weeks
- [ ] After 4-6 weeks, suggest deload:
  - "It's been 5 weeks of training - consider a lighter week"
  - "Reduce volume by 40-50% this week for recovery"
- [ ] Provide deload workout template

### API Endpoints (2 days)

**Task 4.4: Create fitness enhanced API endpoints**
- [ ] Update `assistant_api/app/routers/fitness.py`
- [ ] `GET /fitness/profile` - Get user profile
- [ ] `PUT /fitness/profile` - Update user profile
- [ ] `POST /fitness/assessment` - Save assessment results
- [ ] `GET /fitness/assessment/latest` - Get latest assessment
- [ ] `GET /fitness/equipment` - Get user's equipment
- [ ] `PUT /fitness/equipment` - Update equipment list
- [ ] `POST /fitness/goals` - Create goal
- [ ] `GET /fitness/goals` - List goals with progress
- [ ] `PUT /fitness/goals/{id}/progress` - Log progress
- [ ] `POST /fitness/generate-workout` - Generate personalized workout
- [ ] `GET /fitness/recommendations` - Get smart recommendations
- [ ] `GET /fitness/volume/weekly` - Get weekly volume stats

### Testing & Documentation (2 days)

**Task 4.5: Playwright E2E tests**
- [ ] Test profile setup flow
- [ ] Test fitness assessment flow
- [ ] Test equipment selection
- [ ] Test goal creation and tracking
- [ ] Test workout generation
- [ ] Test recommendations display

**Task 4.6: Unit tests**
- [ ] Test BMI calculation
- [ ] Test fitness level classification
- [ ] Test progressive overload logic
- [ ] Test workout generation balance
- [ ] Test volume calculations

**Task 4.7: Documentation**
- [ ] Update `docs/PROGRESS.md` with Phase 4.5
- [ ] Create `docs/FITNESS_GUIDE.md` - User guide
- [ ] Document all new API endpoints
- [ ] Add inline code documentation

---

## Database Schema Summary

```sql
-- Enhanced Exercises Table (update existing)
ALTER TABLE exercises ADD COLUMN instructions TEXT;
ALTER TABLE exercises ADD COLUMN form_cues TEXT;
ALTER TABLE exercises ADD COLUMN common_mistakes TEXT;
ALTER TABLE exercises ADD COLUMN muscles_primary TEXT;
ALTER TABLE exercises ADD COLUMN muscles_secondary TEXT;
ALTER TABLE exercises ADD COLUMN difficulty_level INTEGER DEFAULT 2;
ALTER TABLE exercises ADD COLUMN movement_pattern TEXT;
-- video_url column already exists

-- User Profile
CREATE TABLE user_profile (
    id INTEGER PRIMARY KEY,
    height_cm INTEGER,
    weight_kg REAL,
    age INTEGER,
    gender TEXT,
    waist_cm REAL,
    body_fat_pct REAL,
    bmi REAL,
    bmi_category TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Fitness Assessments
CREATE TABLE fitness_assessments (
    id INTEGER PRIMARY KEY,
    assessment_date DATE,
    push_up_max INTEGER,
    plank_seconds INTEGER,
    wall_sit_seconds INTEGER,
    squat_60s_count INTEGER,
    resting_heart_rate INTEGER,
    flexibility_score INTEGER,
    balance_score INTEGER,
    overall_fitness_level TEXT,
    notes TEXT,
    created_at TIMESTAMP
);

-- Health Notes
CREATE TABLE health_notes (
    id INTEGER PRIMARY KEY,
    injuries TEXT,
    medical_conditions TEXT,
    areas_to_avoid TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP
);

-- User Equipment
CREATE TABLE user_equipment (
    id INTEGER PRIMARY KEY,
    equipment_type TEXT,
    details TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP
);

-- Fitness Goals
CREATE TABLE fitness_goals (
    id INTEGER PRIMARY KEY,
    goal_type TEXT,
    description TEXT,
    target_value REAL,
    target_unit TEXT,
    start_value REAL,
    current_value REAL,
    deadline DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP,
    achieved_at TIMESTAMP
);

-- Goal Progress Log
CREATE TABLE goal_progress (
    id INTEGER PRIMARY KEY,
    goal_id INTEGER,
    date DATE,
    value REAL,
    notes TEXT,
    FOREIGN KEY (goal_id) REFERENCES fitness_goals(id)
);

-- User Focus Areas
CREATE TABLE user_focus_areas (
    id INTEGER PRIMARY KEY,
    focus_type TEXT,
    focus_value TEXT,
    priority INTEGER DEFAULT 2,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP
);

-- Weekly Volume Tracking
CREATE TABLE weekly_volume (
    id INTEGER PRIMARY KEY,
    week_start DATE,
    muscle_group TEXT,
    movement_pattern TEXT,
    total_sets INTEGER,
    total_reps INTEGER,
    created_at TIMESTAMP
);
```

---

## Estimated Effort

**Week 1:** 7 days - User profile, baseline assessment, health notes
**Week 2:** 7 days - Equipment system, goals, focus areas
**Week 3:** 7 days - Training science, workout generator, progression
**Week 4:** 7 days - Recommendations, API, testing, documentation

**Total:** ~28 days (4 weeks)

---

## Success Criteria

Phase 4.5 is **COMPLETE** when:

- [ ] User can record height/weight and see BMI calculated
- [ ] User can complete baseline fitness assessment
- [ ] Fitness level correctly classified (beginner/intermediate/advanced)
- [ ] User can specify available equipment
- [ ] Exercises filtered by user's equipment
- [ ] User can set fitness goals with deadlines
- [ ] Goal progress tracked and displayed
- [ ] User can set focus areas with priorities
- [ ] Generated workouts are balanced (push/pull/legs)
- [ ] Progressive overload suggested based on RPE history
- [ ] Recovery considered (48-72hr rule)
- [ ] Warm-up and cool-down included
- [ ] Volume tracking per muscle group/pattern
- [ ] Smart recommendations displayed
- [ ] All Playwright E2E tests pass
- [ ] All unit tests pass
- [ ] API endpoints documented
- [ ] User guide complete
