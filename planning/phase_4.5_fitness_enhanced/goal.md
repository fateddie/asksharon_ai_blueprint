# Phase 4.5 – Enhanced Fitness: Evidence-Based Programming & Personalization

## Overview

Transform the basic fitness tracker into an intelligent, personalized training system grounded in exercise science research.

## Core Goals

### 1. User Baseline & Assessment
- Record body metrics (height, weight, BMI, waist circumference)
- Conduct standardized fitness tests (push-up max, plank hold, etc.)
- Classify fitness level (beginner/intermediate/advanced)
- Track progress over time with periodic re-assessments

### 2. Equipment & Environment Awareness
- User specifies available equipment (kettlebells, pull-up bar, dumbbells, etc.)
- Workouts filtered to only use available equipment
- Home gym vs commercial gym profiles

### 3. Goal-Driven Training
- User sets specific fitness goals with deadlines
- Examples: "10 pull-ups by March", "Run 5K in 25 minutes", "Lose 5kg"
- Track progress toward goals with actionable recommendations
- Celebrate milestones and adjust plans as needed

### 4. Focus Area Prioritization
- User selects areas to prioritize (upper body, core, cardio, etc.)
- Workouts weighted toward focus areas while maintaining balance
- Address weaknesses identified in baseline assessment

### 5. Evidence-Based Programming
- Movement pattern balance (Push/Pull/Hinge/Squat/Carry/Core)
- Volume guidelines based on research (10-20 sets/muscle/week for hypertrophy)
- Progressive overload (systematic increases based on performance)
- Recovery consideration (48-72hrs between same muscle groups)
- RPE-based intensity management (train at appropriate difficulty)
- Periodization (mesocycles, deload weeks)

### 6. Smart Recommendations
- "You're 3 pull-ups away from your goal"
- "Consider adding pull work - you've done 12 push sets this week"
- "Your squat RPE has been <6, try adding 5 reps next session"
- "It's been 5 weeks - consider a deload week"

## Key Principles

### Exercise Science Foundation
- ACSM (American College of Sports Medicine) guidelines
- NSCA (National Strength & Conditioning Association) principles
- Research-backed volume and frequency recommendations
- Evidence-based progressive overload protocols

### Data Privacy
- All health data stored locally in SQLite
- User controls what information to share
- No cloud sync of sensitive body metrics
- Optional fields - user decides level of detail

### Suitability & Safety
- Respect injury limitations and health notes
- Scale difficulty to fitness level
- Include proper warm-up and cool-down
- Flag exercises that may be contraindicated

## Success Metrics

- User completes baseline assessment within first session
- Workouts use only user's available equipment
- Progressive overload applied correctly (performance trending up)
- Movement patterns balanced across training week
- User progressing toward stated goals
- Re-assessment every 4-8 weeks shows improvement

---

## Phase 4.5+ Extension: Intelligent Training System

### Overview
Extend the fitness module from "workout tracker" to "adaptive training coach" that generates personalized, scientifically-backed training plans based on user goals, calendar activities, and recovery status.

### New Capabilities

#### 1. Dynamic Goal Intelligence
- **Any goal accepted** - vertical jump, 5K time, general fitness, mobility, etc.
- **System understands training requirements** per goal type:
  - Vertical jump → plyometrics, posterior chain, rate of force development
  - 5K time → aerobic base, tempo runs, interval training
  - Mobility → flexibility work, yoga, joint health
- **Sub-milestones** - progressive targets toward main goal
- **Goal-to-exercise mapping** - which exercises serve which goals

#### 2. Calendar-Aware Load Management
- **Reads external activities** from calendar:
  - 5-a-side games (counts as cardio load)
  - Jiu-jitsu sessions
  - Other physical activities
- **Adjusts training intensity**:
  - Day before game → lighter session or mobility
  - Day after intense activity → recovery focus
  - No external load → full training volume
- **Considers weekly total load** across all activities

#### 3. Workout Justification & Education
- **Brief justification** shown by default:
  - "Plyometrics today: building explosive power for your vertical goal"
  - "Reduced volume: 5-a-side game tomorrow"
  - "Mobility focus: recovery after yesterday's intensity"
- **Detailed "learn more"** expandable:
  - Training science explanation
  - How this fits your periodization cycle
  - Expected adaptations and timeline
- **Exercise coaching** - form cues, common mistakes, video links (already built)

#### 4. Smart Logging & Reminders
- **Voice input** during workout (if available)
- **Quick tap interface** post-workout
- **Reminder integration**:
  - Evening routine: "Workout completed but not logged. Log now?"
  - Morning routine: "Yesterday's workout needs logging"
- **Calendar sync** - marks workout as complete

#### 5. Periodization Engine
- **Mesocycle planning** - strength → power → peaking phases
- **Deload week detection** - suggests recovery periods
- **Auto-progression** based on RPE and performance trends
- **Multi-goal balancing** - conflicting goals (e.g., vertical + 5K) programmed intelligently

### New Components

#### Training Intelligence Engine
`assistant/modules/fitness/training_intelligence.py`
- Goal type definitions with training requirements
- Exercise-to-goal mapping
- Periodization logic
- Load balancing algorithms

#### Workout Generator
`assistant/modules/fitness/workout_generator.py`
- Calendar integration for activity awareness
- Generates workouts based on goals, equipment, fitness level
- Applies periodization and load management
- Outputs justifications for each decision

#### Justification System
`assistant/modules/fitness/workout_justification.py`
- Brief explanations per workout
- Detailed training science content
- Links decisions to user goals

### UI Structure (5 Tabs)

1. **Dashboard** - Weekly plan, goal progress, calendar preview
2. **Today's Workout** - Generated workout with justification, pause/resume, quick logging
3. **Goals** - Add/edit goals, sub-milestones, progress tracking
4. **Assessment** - Monthly fitness tests, progress vs targets
5. **Setup** - Profile, equipment, focus areas, calendar sync

### Data Schema Additions

```sql
-- Goal training requirements mapping
CREATE TABLE goal_training_types (
    id INTEGER PRIMARY KEY,
    goal_category TEXT NOT NULL,  -- 'vertical_jump', '5k_time', etc.
    training_method TEXT NOT NULL,  -- 'plyometrics', 'tempo_runs', etc.
    priority INTEGER DEFAULT 1,
    notes TEXT
);

-- Weekly generated training plans
CREATE TABLE weekly_training_plans (
    id INTEGER PRIMARY KEY,
    week_start DATE NOT NULL,
    plan_json TEXT NOT NULL,  -- Generated workout schedule
    justification_json TEXT,  -- Why this plan was created
    calendar_activities_json TEXT,  -- External activities considered
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual workout justifications
CREATE TABLE workout_justifications (
    id INTEGER PRIMARY KEY,
    session_id INTEGER REFERENCES workout_sessions(id),
    brief_text TEXT NOT NULL,
    detailed_text TEXT,
    goals_addressed TEXT,  -- JSON array of goal IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Integration Points

- **Calendar module** - Read activities, write workout events
- **Voice module** - Voice logging during workouts
- **BIL routines** - Evening/morning reminder hooks
- **Existing fitness data layer** - Goals, equipment, assessments (already built)

### Example User Flow

1. User adds goal: "Increase vertical jump to dunk by June"
2. System: Creates training plan with plyometrics, posterior chain work
3. User's calendar shows: 5-a-side Thursday
4. System generates Monday workout: "Full plyometrics + strength"
5. System generates Wednesday workout: "Lighter session - game tomorrow"
6. System generates Friday workout: "Recovery mobility - post-game"
7. Each workout shows: Brief justification + expandable detail
8. User completes workout, quick-tap logs performance
9. Monthly assessment tracks vertical progress vs target
