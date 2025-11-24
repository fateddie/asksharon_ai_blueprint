# Acceptance Tests – Phase 4.5 Enhanced Fitness

## User Profile & Baseline

### AT-1: User Profile Setup
**Given** a new user accessing the fitness module
**When** they complete the profile setup wizard
**Then** the system should:
- [ ] Store height in cm
- [ ] Store weight in kg
- [ ] Calculate BMI automatically (weight / height_m²)
- [ ] Display BMI category (underweight/normal/overweight/obese)
- [ ] Allow optional fields (age, gender, waist circumference)

**Acceptance Criteria:**
```bash
# After saving profile with height=175cm, weight=75kg
sqlite3 assistant/data/memory.db "SELECT bmi, bmi_category FROM user_profile"
# Should return: 24.49|normal
```

### AT-2: Fitness Assessment
**Given** a user with a saved profile
**When** they complete the fitness assessment
**Then** the system should:
- [ ] Record push-up max (integer)
- [ ] Record plank hold time (seconds)
- [ ] Record wall sit time (seconds)
- [ ] Record 60-second squat count
- [ ] Calculate overall fitness level
- [ ] Store assessment with date for historical tracking

**Fitness Level Classification:**
| Level | Push-ups | Plank | Squats/60s |
|-------|----------|-------|------------|
| Beginner | <10 | <30s | <20 |
| Intermediate | 10-25 | 30-60s | 20-35 |
| Advanced | >25 | >60s | >35 |

### AT-3: Health Notes
**Given** a user with injuries or limitations
**When** they save health notes
**Then** the system should:
- [ ] Store injury history (free text)
- [ ] Store areas to avoid
- [ ] Filter out contraindicated exercises in workout generation

---

## Equipment & Exercise Library

### AT-4: Equipment Selection
**Given** a user setting up their home gym profile
**When** they select available equipment
**Then** the system should:
- [ ] Allow multiple equipment selections (checkbox)
- [ ] Store equipment with optional details (e.g., "16kg, 24kg" for kettlebells)
- [ ] Filter exercises to only show those matching available equipment

**Acceptance Criteria:**
```bash
# After selecting kettlebell and pull_up_bar
curl -X GET http://localhost:8002/fitness/exercises?equipment=kettlebell,pull_up_bar,bodyweight
# Should include: Push-ups, Kettlebell Swings, Pull-ups
# Should NOT include: Barbell Squats, Cable Rows
```

### AT-5: Exercise Coaching Content
**Given** a user viewing an exercise
**When** they click "How to do this"
**Then** the system should display:
- [ ] Step-by-step instructions
- [ ] Form cues (key points to remember)
- [ ] Common mistakes to avoid
- [ ] Primary and secondary muscles worked
- [ ] Difficulty level (1-5)
- [ ] YouTube video link (if available)

**Acceptance Criteria:**
```python
exercise = get_exercise("Push-ups")
assert exercise["instructions"] is not None
assert len(exercise["instructions"]) > 100  # Detailed instructions
assert "form_cues" in exercise
assert "common_mistakes" in exercise
assert exercise["muscles_primary"] == "chest, triceps"
```

### AT-6: Exercise Video Links
**Given** an exercise with a video_url
**When** displayed in the UI
**Then** the system should:
- [ ] Show embedded YouTube video or clickable link
- [ ] Handle exercises without videos gracefully (show placeholder)

---

## Goals & Focus Areas

### AT-7: Fitness Goal Creation
**Given** a user wanting to set a fitness goal
**When** they create a new goal
**Then** the system should:
- [ ] Accept goal type (strength/endurance/skill/body_comp/consistency)
- [ ] Accept description ("Do 10 pull-ups")
- [ ] Accept target value and unit (10, reps)
- [ ] Accept current value (3)
- [ ] Accept deadline (date)
- [ ] Calculate progress percentage

**Acceptance Criteria:**
```bash
# Goal: 10 pull-ups, currently at 3
# Progress = (3 - 0) / (10 - 0) * 100 = 30%
curl -X GET http://localhost:8002/fitness/goals
# Should return: {"progress_pct": 30, ...}
```

### AT-8: Goal Progress Tracking
**Given** a user with an active goal
**When** they log progress
**Then** the system should:
- [ ] Update current value
- [ ] Recalculate progress percentage
- [ ] Store progress history with date
- [ ] Detect when goal is achieved (current >= target)

### AT-9: Focus Area Selection
**Given** a user wanting to prioritize certain training
**When** they set focus areas
**Then** the system should:
- [ ] Allow selection of muscle groups or fitness aspects
- [ ] Allow priority assignment (high/medium/low)
- [ ] Weight workout generation toward focus areas

---

## Evidence-Based Programming

### AT-10: Movement Pattern Balance
**Given** a generated workout
**Then** the workout should include:
- [ ] At least one pushing movement
- [ ] At least one pulling movement
- [ ] At least one lower body movement (squat or hinge)
- [ ] Core work if time permits
- [ ] Proper warm-up sequence
- [ ] Cool-down/stretching

**Acceptance Criteria:**
```python
workout = generate_workout(equipment=["bodyweight"], time_minutes=30)
patterns = [ex["movement_pattern"] for ex in workout["main_work"]]
assert any(p.startswith("push") for p in patterns)
assert any(p.startswith("pull") for p in patterns)
assert any(p in ["squat", "hinge"] for p in patterns)
assert workout["warm_up"] is not None
assert workout["cool_down"] is not None
```

### AT-11: Progressive Overload Suggestions
**Given** a user with exercise history (RPE logged)
**When** they start a new workout
**Then** the system should suggest:
- [ ] Increased reps if avg RPE < 7
- [ ] Maintain if avg RPE 7-8
- [ ] Decrease if avg RPE > 8.5

**Acceptance Criteria:**
```python
# User did push-ups: 3x10 @ RPE 6, 3x10 @ RPE 6, 3x10 @ RPE 5
suggestion = suggest_progression(exercise_id=1)
assert suggestion["reps"] >= 11  # Should suggest increase
assert "RPE was low" in suggestion["note"]
```

### AT-12: Recovery Consideration
**Given** a user who trained chest/push yesterday
**When** generating today's workout
**Then** the system should:
- [ ] Warn if heavy push is scheduled
- [ ] Suggest alternative patterns (pull, legs)
- [ ] Respect 48-72hr rest rule for same muscle groups

### AT-13: Weekly Volume Tracking
**Given** a user with logged workouts
**When** viewing volume summary
**Then** the system should display:
- [ ] Total sets per muscle group this week
- [ ] Total sets per movement pattern
- [ ] Comparison to recommended ranges
- [ ] Imbalance alerts ("More pull work needed")

**Acceptance Criteria:**
```bash
curl -X GET http://localhost:8002/fitness/volume/weekly
# Should return:
# {
#   "push": {"sets": 12, "recommended": "10-20", "status": "good"},
#   "pull": {"sets": 6, "recommended": "10-20", "status": "low"},
#   "legs": {"sets": 8, "recommended": "10-20", "status": "low"}
# }
```

---

## Smart Recommendations

### AT-14: Goal-Linked Recommendations
**Given** a user with active fitness goals
**When** viewing recommendations
**Then** the system should show:
- [ ] Progress toward each goal
- [ ] Estimated completion date at current rate
- [ ] Specific exercises to accelerate progress
- [ ] Celebration when goal achieved

**Acceptance Criteria:**
```bash
curl -X GET http://localhost:8002/fitness/recommendations
# Should return:
# {
#   "goal_recommendations": [
#     {"goal": "10 pull-ups", "current": 7, "message": "You're 3 away! Add negative pull-ups to accelerate."}
#   ]
# }
```

### AT-15: Deload Recommendations
**Given** a user who has trained consistently for 5+ weeks
**When** viewing recommendations
**Then** the system should:
- [ ] Suggest a deload week
- [ ] Provide deload workout template (40-50% reduced volume)

---

## Data Privacy

### AT-16: Local Storage Only
**Given** all user health data
**Then** the system should:
- [ ] Store all data in local SQLite database
- [ ] NOT sync body metrics to cloud services
- [ ] Allow user to delete all personal data

### AT-17: Optional Fields
**Given** the profile setup wizard
**Then** the system should:
- [ ] Only require height and weight
- [ ] Allow skipping age, gender, waist, body fat
- [ ] Function fully with minimal data

---

## API Endpoints

### AT-18: Profile API
- [ ] `GET /fitness/profile` returns user profile with BMI
- [ ] `PUT /fitness/profile` updates profile and recalculates BMI

### AT-19: Assessment API
- [ ] `POST /fitness/assessment` saves new assessment
- [ ] `GET /fitness/assessment/latest` returns most recent
- [ ] `GET /fitness/assessment/history` returns all assessments

### AT-20: Equipment API
- [ ] `GET /fitness/equipment` returns user's equipment
- [ ] `PUT /fitness/equipment` updates equipment list
- [ ] `GET /fitness/exercises?equipment=X,Y` filters by equipment

### AT-21: Goals API
- [ ] `POST /fitness/goals` creates new goal
- [ ] `GET /fitness/goals` lists all goals with progress
- [ ] `PUT /fitness/goals/{id}` updates goal
- [ ] `POST /fitness/goals/{id}/progress` logs progress

### AT-22: Workout Generation API
- [ ] `POST /fitness/generate-workout` returns balanced workout
- [ ] Request includes: equipment, focus_areas, time_minutes, fitness_level
- [ ] Response includes: warm_up, main_work, cool_down, total_time

### AT-23: Recommendations API
- [ ] `GET /fitness/recommendations` returns smart suggestions
- [ ] Includes: goal_progress, volume_balance, deload_suggestion, progression_tips

---

## Playwright E2E Tests

### AT-24: Profile Setup Flow
```python
def test_profile_setup_complete_flow(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Setup Profile").click()

    # Enter basic info
    page.fill("input[aria-label='Height (cm)']", "175")
    page.fill("input[aria-label='Weight (kg)']", "75")
    page.get_by_role("button", name="Next").click()

    # Should show BMI
    assert "BMI: 24.5" in page.content()
    assert "Normal" in page.content()

    # Complete setup
    page.get_by_role("button", name="Save Profile").click()
    assert "Profile saved" in page.content()
```

### AT-25: Fitness Assessment Flow
```python
def test_fitness_assessment_flow(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Take Fitness Test").click()

    # Push-up test
    page.fill("input[aria-label='Push-up max']", "20")
    page.get_by_role("button", name="Next").click()

    # Plank test
    page.fill("input[aria-label='Plank hold (seconds)']", "45")
    page.get_by_role("button", name="Next").click()

    # Should classify as intermediate
    assert "Intermediate" in page.content()
```

### AT-26: Equipment Selection
```python
def test_equipment_selection(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("My Equipment").click()

    page.get_by_label("Kettlebell").check()
    page.get_by_label("Pull-up Bar").check()
    page.get_by_role("button", name="Save").click()

    # Verify exercises filtered
    page.get_by_text("Exercises").click()
    assert "Kettlebell Swings" in page.content()
    assert "Pull-ups" in page.content()
```

### AT-27: Goal Creation and Progress
```python
def test_goal_creation_and_progress(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Goals").click()
    page.get_by_text("Add Goal").click()

    page.select_option("select[aria-label='Type']", "skill")
    page.fill("input[aria-label='Description']", "Do 10 pull-ups")
    page.fill("input[aria-label='Target']", "10")
    page.fill("input[aria-label='Current']", "3")
    page.get_by_role("button", name="Save").click()

    assert "30%" in page.content()  # Progress indicator
```

### AT-28: Exercise Coaching View
```python
def test_exercise_coaching_details(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Exercises").click()
    page.get_by_text("Push-ups").click()

    content = page.content()
    assert "Instructions" in content or "How to" in content
    assert "Form" in content
    assert "Mistakes" in content
    assert "chest" in content.lower()
```

### AT-29: Workout Generation
```python
def test_workout_generation_balanced(page):
    page.goto("http://localhost:8501")
    page.get_by_text("Fitness").click()
    page.get_by_text("Generate Workout").click()

    page.select_option("select[aria-label='Duration']", "30")
    page.get_by_role("button", name="Generate").click()

    content = page.content()
    assert "Warm-up" in content
    assert "Cool-down" in content
    # Should have variety of movements
```

---

## Success Criteria Summary

Phase 4.5 is **COMPLETE** when all acceptance tests pass:

| Category | Tests | Status |
|----------|-------|--------|
| User Profile | AT-1 to AT-3 | [ ] |
| Equipment & Library | AT-4 to AT-6 | [ ] |
| Goals & Focus | AT-7 to AT-9 | [ ] |
| Evidence-Based | AT-10 to AT-13 | [ ] |
| Recommendations | AT-14 to AT-15 | [ ] |
| Privacy | AT-16 to AT-17 | [ ] |
| API Endpoints | AT-18 to AT-23 | [ ] |
| Playwright E2E | AT-24 to AT-29 | [ ] |

**Total: 29 acceptance tests**
