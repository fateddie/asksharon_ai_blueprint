"""
Workout Justification System (Phase 4.5+)
==========================================
Generates educational justifications for workouts explaining:
- Why this workout was generated
- How it serves user goals
- Training science behind the decisions
- Expected adaptations and timeline
"""

import json
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text

from assistant.modules.fitness.training_intelligence import (
    get_training_requirements,
    get_periodization_state,
    PERIODIZATION_PHASES,
)

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


# =============================================================================
# TRAINING SCIENCE EXPLANATIONS
# =============================================================================

TRAINING_SCIENCE = {
    "plyometrics": {
        "brief": "Explosive jumping drills to develop power",
        "detail": """Plyometric training develops the stretch-shortening cycle (SSC)
of your muscles, which is critical for explosive movements like jumping and sprinting.

When you land from a jump, your muscles stretch (eccentric phase) and store elastic
energy. The faster you can transition from landing to jumping again, the more of
this energy you can use - this is called the amortization phase.

Research shows that plyometric training can improve vertical jump by 5-10% over
8-12 weeks when combined with strength training (Markovic, 2007). Key adaptations include:
- Improved neural recruitment patterns
- Enhanced tendon stiffness (stores more elastic energy)
- Better intermuscular coordination

For best results, perform plyometrics when fresh (start of workout) and focus on
quality over quantity. Rest fully between sets.""",
        "expected_timeline": "4-6 weeks for initial improvements, 8-12 weeks for significant gains",
    },
    "posterior_chain": {
        "brief": "Strengthening glutes, hamstrings, and back",
        "detail": """The posterior chain (glutes, hamstrings, erector spinae) is the
primary driver of hip extension - essential for jumping, sprinting, and lifting.

Strong posterior chain muscles provide:
- Greater force production in hip extension
- Better athletic performance
- Reduced injury risk (especially hamstring and lower back)
- Improved posture

Key exercises like kettlebell swings, deadlifts, and hip thrusts target these muscles
through the hip hinge pattern. Research shows that hip thrust strength correlates
strongly with sprint speed and jump height (Contreras et al., 2017).""",
        "expected_timeline": "6-8 weeks for strength gains, 12+ weeks for significant hypertrophy",
    },
    "progressive_overload": {
        "brief": "Gradually increasing training demands over time",
        "detail": """Progressive overload is the fundamental principle of strength training.
Your body adapts to the stress you place on it - to continue improving, you must
gradually increase that stress.

Methods of progression:
1. Add weight (most common)
2. Add reps at same weight
3. Add sets
4. Decrease rest time
5. Increase range of motion
6. Slow down tempo

A good rule: When you can complete all prescribed reps with good form for 2 sessions
in a row, increase the weight by 2.5-5%. Track your workouts to ensure you're progressing.""",
        "expected_timeline": "Weekly micro-progressions, monthly strength PRs",
    },
    "aerobic_base": {
        "brief": "Building cardiovascular endurance foundation",
        "detail": """Aerobic base training develops your body's ability to use oxygen
efficiently. This forms the foundation for all endurance activities.

Training at lower intensities (Zone 2, conversational pace) improves:
- Mitochondrial density (more energy factories in cells)
- Capillary density (better oxygen delivery)
- Fat oxidation (using fat as fuel)
- Cardiac efficiency

For 5K improvement, spend 80% of training time at easy pace. This "polarized training"
approach is used by elite endurance athletes. The remaining 20% can be threshold and
interval work.""",
        "expected_timeline": "4-6 weeks for initial aerobic gains, 6-12 months for full base",
    },
    "tempo_runs": {
        "brief": "Running at threshold pace to improve lactate clearance",
        "detail": """Tempo runs are performed at your lactate threshold - the pace where
lactate production equals clearance. This is typically described as "comfortably hard" -
you can speak in short sentences but not hold a conversation.

Benefits:
- Raises lactate threshold (sustain faster paces longer)
- Improves running economy
- Mental preparation for race pace

For a 25-minute 5K goal, tempo runs would be around 5:30-6:00/km pace. Start with
15-20 minutes of tempo and gradually build to 30-40 minutes.""",
        "expected_timeline": "4-6 weeks for threshold improvements",
    },
    "deload": {
        "brief": "Planned recovery week to consolidate adaptations",
        "detail": """Deload weeks reduce training volume and/or intensity to allow your
body to fully recover and adapt. Think of it as "backing off to bounce back."

During high training loads, your body is in a state of accumulated fatigue. While
you're getting stronger, you're also getting tired. A deload allows:
- Soft tissue recovery (tendons, ligaments)
- Neural recovery
- Hormonal balance restoration
- Mental freshness

Typically done every 4-6 weeks. Volume is reduced 40-50% while maintaining some
intensity to avoid detraining. You may feel weaker during the deload but will come
back stronger the following week.""",
        "expected_timeline": "1 week deload, performance peak 1-2 weeks after",
    },
    "recovery_day": {
        "brief": "Active recovery to promote adaptation",
        "detail": """Recovery days are not wasted days - they're when adaptation actually
happens. While training provides the stimulus, rest provides the adaptation.

Light activity on recovery days (walking, mobility work, easy swimming) can:
- Increase blood flow to aid recovery
- Maintain movement patterns
- Support mental well-being

Key recovery factors:
1. Sleep (7-9 hours, when growth hormone peaks)
2. Nutrition (protein for muscle repair, carbs to replenish glycogen)
3. Stress management (cortisol impairs recovery)
4. Hydration""",
        "expected_timeline": "24-72 hours for muscle recovery depending on intensity",
    },
    "movement_balance": {
        "brief": "Training all movement patterns for balanced development",
        "detail": """The human body moves in fundamental patterns: push, pull, squat,
hinge, carry, and rotate. Training all patterns ensures:
- Balanced muscle development
- Reduced injury risk
- Better functional strength

A common imbalance is more pushing than pulling (bench press vs rows), leading to
rounded shoulders and potential injury. Aim for at least a 1:1 push-to-pull ratio,
or even 2:1 pull-to-push if you have desk-job posture.

Your workout includes exercises across patterns to maintain this balance while
prioritizing patterns relevant to your goals.""",
        "expected_timeline": "Ongoing principle for all training",
    },
}

PHASE_EXPLANATIONS = {
    "accumulation": {
        "brief": "Building work capacity with higher volume",
        "detail": """The accumulation phase focuses on building your work capacity -
the total amount of training you can handle and recover from.

Training characteristics:
- Higher volume (more sets and reps)
- Moderate intensity (RPE 6-7)
- Focus on technique and movement quality
- Building muscle and strength base

This phase prepares your body for the higher intensities coming in the next phase.
Think of it as laying the foundation.""",
    },
    "transmutation": {
        "brief": "Converting volume gains into strength/power",
        "detail": """The transmutation phase shifts focus from volume to intensity.
You'll reduce total sets but increase the challenge of each set.

Training characteristics:
- Moderate volume
- Higher intensity (RPE 7-8)
- More sport-specific or goal-specific exercises
- Testing limits more frequently

This phase converts the capacity built in accumulation into usable strength and power.""",
    },
    "realization": {
        "brief": "Peaking for performance testing",
        "detail": """The realization phase is about expressing your fitness - showing
what you can do. Volume is low to ensure you're fresh and recovered.

Training characteristics:
- Low volume
- Peak intensity (RPE 8-9)
- Focus on key movements only
- Testing personal records

This is when you'd attempt a max vertical jump, run a timed 5K, or test 1RM lifts.""",
    },
    "deload": {
        "brief": "Recovery week for adaptation consolidation",
        "detail": """The deload phase is a planned recovery period. You've pushed hard
for several weeks, and your body needs time to fully adapt.

Training characteristics:
- Very low volume (50% of normal)
- Low intensity (RPE 5-6)
- Focus on mobility and recovery
- Mental break from hard training

Don't skip deloads - they prevent overtraining and ensure long-term progress.""",
    },
}


# =============================================================================
# JUSTIFICATION GENERATION
# =============================================================================


def generate_workout_justification(
    workout: Dict[str, Any],
    goals: List[Dict],
    calendar_context: Dict,
) -> Dict[str, Any]:
    """
    Generate complete justification for a workout.

    Args:
        workout: The generated workout
        goals: User's active goals
        calendar_context: External activity context

    Returns:
        Dictionary with brief and detailed justifications
    """
    brief_parts = []
    detailed_parts = []

    # Get periodization context
    period_state = get_periodization_state()
    phase = period_state["current_phase"] if period_state else "accumulation"

    # Phase explanation
    phase_exp = PHASE_EXPLANATIONS.get(phase, {})
    brief_parts.append(phase_exp.get("brief", "Training session"))
    detailed_parts.append(
        {
            "section": "Current Phase",
            "title": f"{phase.title()} Phase",
            "content": phase_exp.get("detail", ""),
        }
    )

    # Goal-specific justification
    goal_justifications = []
    for goal in goals[:3]:  # Top 3 goals
        category = goal.get("goal_category")
        if category:
            reqs = get_training_requirements(category)
            training_methods = reqs.get("training_methods", [])

            # Add training science for each method
            for method in training_methods[:2]:  # Top 2 methods per goal
                if method in TRAINING_SCIENCE:
                    science = TRAINING_SCIENCE[method]
                    goal_justifications.append(
                        {
                            "goal": goal["title"],
                            "method": method.replace("_", " ").title(),
                            "brief": science["brief"],
                            "detail": science["detail"],
                            "timeline": science.get("expected_timeline", ""),
                        }
                    )

    if goal_justifications:
        brief_parts.append(
            f"Training for: {', '.join([g['goal'] for g in goal_justifications[:2]])}"
        )
        detailed_parts.append(
            {
                "section": "Goal Training",
                "goals": goal_justifications,
            }
        )

    # Calendar context justification
    if calendar_context.get("recommendations"):
        brief_parts.append(calendar_context["recommendations"][0])
        detailed_parts.append(
            {
                "section": "Calendar Adjustments",
                "content": _format_calendar_justification(calendar_context),
            }
        )

    # Movement balance explanation
    if workout.get("exercises"):
        patterns = [e.get("movement_pattern") for e in workout["exercises"]]
        pattern_counts = {}
        for p in patterns:
            pattern_counts[p] = pattern_counts.get(p, 0) + 1

        detailed_parts.append(
            {
                "section": "Movement Balance",
                "content": TRAINING_SCIENCE["movement_balance"]["detail"],
                "pattern_distribution": pattern_counts,
            }
        )

    # Build final justification
    brief = " | ".join(brief_parts)
    detailed = _format_detailed_justification(detailed_parts)

    justification = {
        "brief_text": brief,
        "detailed_text": detailed,
        "goals_addressed": [g["id"] for g in goals[:3]],
        "calendar_context": json.dumps(calendar_context),
        "periodization_context": phase,
        "training_science_notes": json.dumps([g.get("method") for g in goal_justifications]),
        "workout_date": workout.get("date", date.today().isoformat()),
    }

    # Save to database
    _save_justification(justification, workout.get("session_id"))

    return justification


def _format_calendar_justification(calendar_context: Dict) -> str:
    """Format calendar context into readable explanation."""
    parts = []

    if calendar_context.get("context", {}).get("today", {}).get("has_activity"):
        activities = calendar_context["context"]["today"]["activities"]
        names = [a["name"] for a in activities]
        parts.append(f"Today you have: {', '.join(names)}. Training adjusted accordingly.")

    if calendar_context.get("context", {}).get("tomorrow", {}).get("has_activity"):
        activities = calendar_context["context"]["tomorrow"]["activities"]
        names = [a["name"] for a in activities]
        parts.append(f"Tomorrow: {', '.join(names)}. Saving energy for that.")

    if calendar_context.get("context", {}).get("yesterday", {}).get("has_activity"):
        activities = calendar_context["context"]["yesterday"]["activities"]
        names = [a["name"] for a in activities]
        parts.append(f"Yesterday: {', '.join(names)}. Including recovery focus.")

    vol = calendar_context.get("volume_multiplier", 1.0)
    if vol < 1.0:
        parts.append(f"Volume reduced to {int(vol*100)}% due to external activities.")

    return "\n\n".join(parts) if parts else "No external activities affecting today's training."


def _format_detailed_justification(sections: List[Dict]) -> str:
    """Format detailed justification sections into readable text."""
    output = []

    for section in sections:
        sec_type = section.get("section", "")

        if sec_type == "Current Phase":
            output.append(f"## {section['title']}\n\n{section['content']}")

        elif sec_type == "Goal Training":
            output.append("## Training for Your Goals\n")
            for goal in section.get("goals", []):
                output.append(f"### {goal['goal']}: {goal['method']}\n")
                output.append(f"{goal['detail']}\n")
                if goal.get("timeline"):
                    output.append(f"**Expected Timeline:** {goal['timeline']}\n")

        elif sec_type == "Calendar Adjustments":
            output.append(f"## Schedule Adjustments\n\n{section['content']}")

        elif sec_type == "Movement Balance":
            output.append(f"## Movement Balance\n\n{section['content']}")
            if section.get("pattern_distribution"):
                output.append("\n**Today's Pattern Distribution:**")
                for pattern, count in section["pattern_distribution"].items():
                    output.append(f"- {pattern.title()}: {count} exercises")

    return "\n\n".join(output)


def _save_justification(justification: Dict, session_id: Optional[int] = None) -> int:
    """Save justification to database."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO workout_justifications (
                    session_id, workout_date, brief_text, detailed_text,
                    goals_addressed, calendar_context, periodization_context,
                    training_science_notes, created_at
                ) VALUES (
                    :session_id, :date, :brief, :detailed, :goals,
                    :calendar, :period, :science, :created_at
                )
            """
            ),
            {
                "session_id": session_id,
                "date": justification["workout_date"],
                "brief": justification["brief_text"],
                "detailed": justification["detailed_text"],
                "goals": json.dumps(justification.get("goals_addressed", [])),
                "calendar": justification.get("calendar_context", "{}"),
                "period": justification.get("periodization_context"),
                "science": justification.get("training_science_notes", "[]"),
                "created_at": datetime.now().isoformat(),
            },
        )
        row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
        return row[0]


def get_justification_for_date(target_date: date) -> Optional[Dict[str, Any]]:
    """Get saved justification for a specific date."""
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, brief_text, detailed_text, goals_addressed,
                       calendar_context, periodization_context
                FROM workout_justifications
                WHERE workout_date = :date
                ORDER BY created_at DESC LIMIT 1
            """
            ),
            {"date": target_date.isoformat()},
        ).fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "brief": row[1],
        "detailed": row[2],
        "goals_addressed": json.loads(row[3]) if row[3] else [],
        "calendar_context": json.loads(row[4]) if row[4] else {},
        "phase": row[5],
    }


def get_training_science_article(topic: str) -> Optional[Dict[str, str]]:
    """Get training science explanation for a topic."""
    if topic in TRAINING_SCIENCE:
        return TRAINING_SCIENCE[topic]
    elif topic in PHASE_EXPLANATIONS:
        return PHASE_EXPLANATIONS[topic]
    return None


def list_available_topics() -> List[str]:
    """List all available training science topics."""
    return list(TRAINING_SCIENCE.keys()) + list(PHASE_EXPLANATIONS.keys())
