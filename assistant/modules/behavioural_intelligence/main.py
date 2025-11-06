"""
Behavioural Intelligence Layer (BIL) - Phase 2
==============================================
Goal-reinforcement and conversational data elicitation.

Features:
- Goals CRUD (Create, Read, Update, Delete)
- Session adherence tracking
- Missed session detection
- Adaptive rescheduling suggestions
- Weekly review generator
- Conversational prompt library
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, text
import os
import random

router = APIRouter()

# Database connection
DB_PATH = os.getenv("DATABASE_URL", "sqlite:///assistant/data/memory.db")
engine = create_engine(DB_PATH.replace("sqlite:///", "sqlite:///"))


# ========================================
# Data Models
# ========================================


class Goal(BaseModel):
    name: str
    target_per_week: int
    description: Optional[str] = None


class SessionLog(BaseModel):
    goal_name: str
    completed: bool
    notes: Optional[str] = None


# ========================================
# Conversational Prompt Library
# ========================================

MORNING_PROMPTS = [
    "🌅 Good morning! What are your top 3 priorities today?",
    "🌄 Rise and shine! What's the one thing that would make today great?",
    "☀️ Hey there! What are you looking forward to accomplishing today?",
    "🌞 Morning! Let's plan your day - what's most important?",
]

EVENING_PROMPTS = [
    "🌙 Evening check-in: What went well today? What got in your way?",
    "🌃 Time to reflect - what's one thing you learned today?",
    "🌆 End of day! What are you proud of from today?",
    "🌇 Let's wrap up: What would you do differently tomorrow?",
]

MISSED_SESSION_PROMPTS = [
    "I noticed you haven't done {goal} yet this week. Would tomorrow morning work?",
    "Hey, {goal} is still on the list. Want to squeeze it in this afternoon?",
    "You're usually consistent with {goal} - everything okay? Can I help reschedule?",
    "No {goal} session yet - shall we block some time for it?",
]

ENCOURAGEMENT_PROMPTS = [
    "🎉 You're {percent}% of the way to your {goal} goal! Keep it up!",
    "💪 {sessions} sessions done for {goal} - you're crushing it!",
    "🔥 On track with {goal}! That's what I like to see!",
    "✨ Your consistency with {goal} is inspiring!",
]


# ========================================
# API Endpoints
# ========================================


def register(app, publish, subscribe):
    """Register behavioral intelligence module with orchestrator"""
    app.include_router(router, prefix="/behaviour")

    # Subscribe to scheduled events
    subscribe("morning_checkin", handle_morning_checkin)
    subscribe("evening_reflection", handle_evening_reflection)


# Goals CRUD


@router.post("/goals")
def create_goal(goal: Goal):
    """Create a new behavioral goal"""
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
            INSERT INTO goals (name, target_per_week, last_update)
            VALUES (:name, :target, :now)
        """
            ),
            {"name": goal.name, "target": goal.target_per_week, "now": datetime.now()},
        )
        goal_id = result.lastrowid

    return {
        "status": "created",
        "goal_id": goal_id,
        "message": f"✅ Goal '{goal.name}' created - targeting {goal.target_per_week}x/week",
    }


@router.get("/goals")
def list_goals():
    """List all active goals"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM goals ORDER BY id"))
        goals = [
            {
                "id": row[0],
                "name": row[1],
                "target_per_week": row[2],
                "completed": row[3],
                "last_update": row[4],
            }
            for row in result
        ]

    return {"goals": goals}


@router.get("/goals/{goal_id}")
def get_goal(goal_id: int):
    """Get a specific goal"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM goals WHERE id = :id"), {"id": goal_id})
        row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Goal not found")

    return {
        "id": row[0],
        "name": row[1],
        "target_per_week": row[2],
        "completed": row[3],
        "last_update": row[4],
    }


@router.put("/goals/{goal_id}")
def update_goal(goal_id: int, goal: Goal):
    """Update a goal"""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
            UPDATE goals
            SET name = :name, target_per_week = :target, last_update = :now
            WHERE id = :id
        """
            ),
            {
                "id": goal_id,
                "name": goal.name,
                "target": goal.target_per_week,
                "now": datetime.now(),
            },
        )

    return {"status": "updated", "goal_id": goal_id}


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int):
    """Delete a goal"""
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM goals WHERE id = :id"), {"id": goal_id})

    return {"status": "deleted", "goal_id": goal_id}


# Session Tracking


@router.post("/session")
def log_session(session: SessionLog):
    """Log a completed (or missed) session"""
    # Store in behaviour_metrics
    with engine.begin() as conn:
        conn.execute(
            text(
                """
            INSERT INTO behaviour_metrics (date, domain, question, response, sentiment)
            VALUES (:date, :goal, :question, :response, :sentiment)
        """
            ),
            {
                "date": datetime.now(),
                "goal": session.goal_name,
                "question": f"Did you complete {session.goal_name}?",
                "response": "Yes" if session.completed else "No",
                "sentiment": 1.0 if session.completed else 0.0,
            },
        )

        # Update goal completion count if completed
        if session.completed:
            conn.execute(
                text(
                    """
                UPDATE goals
                SET completed = completed + 1, last_update = :now
                WHERE name = :name
            """
                ),
                {"name": session.goal_name, "now": datetime.now()},
            )

    return {
        "status": "logged",
        "message": f"{'✅ Session completed' if session.completed else '⏭️ Session skipped'}: {session.goal_name}",
    }


# Adherence & Analytics


@router.get("/adherence")
def get_adherence_report():
    """Get weekly adherence report for all goals"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM goals"))
        goals = result.fetchall()

    report = []
    for goal in goals:
        goal_id, name, target, completed, last_update = goal
        adherence_pct = (completed / max(1, target)) * 100
        status = "✅ On track" if completed >= target else "⚠️ Behind schedule"

        report.append(
            {
                "goal": name,
                "target": target,
                "completed": completed,
                "adherence_pct": round(adherence_pct, 1),
                "status": status,
                "remaining": max(0, target - completed),
            }
        )

    return {"week_of": datetime.now().strftime("%Y-%m-%d"), "adherence": report}


@router.get("/missed-sessions")
def get_missed_sessions():
    """Detect goals that are behind schedule"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM goals"))
        goals = result.fetchall()

    missed = []
    current_day = datetime.now().weekday()  # 0=Monday, 6=Sunday

    for goal in goals:
        goal_id, name, target, completed, last_update = goal

        # If it's Thursday (3) or later and we're less than 50% complete
        if current_day >= 3 and completed < (target * 0.5):
            remaining = target - completed
            prompt = random.choice(MISSED_SESSION_PROMPTS).format(goal=name)

            missed.append(
                {
                    "goal": name,
                    "target": target,
                    "completed": completed,
                    "remaining": remaining,
                    "suggestion": prompt,
                    "urgency": "HIGH" if current_day >= 5 else "MEDIUM",
                }
            )

    return {"missed_sessions": missed, "count": len(missed)}


@router.get("/weekly-review")
def generate_weekly_review():
    """Generate comprehensive weekly review with insights"""
    with engine.connect() as conn:
        # Get all goals
        goals_result = conn.execute(text("SELECT * FROM goals"))
        goals = goals_result.fetchall()

        # Get this week's behavior metrics
        week_ago = datetime.now() - timedelta(days=7)
        metrics_result = conn.execute(
            text(
                """
            SELECT domain, COUNT(*) as sessions, AVG(sentiment) as avg_sentiment
            FROM behaviour_metrics
            WHERE date >= :week_ago
            GROUP BY domain
        """
            ),
            {"week_ago": week_ago},
        )
        metrics = metrics_result.fetchall()

    # Build review
    review = {
        "week_of": datetime.now().strftime("%Y-%m-%d"),
        "summary": {"total_goals": len(goals), "goals_on_track": 0, "goals_behind": 0},
        "goals_detail": [],
        "hypotheses": [],
    }

    # Analyze each goal
    for goal in goals:
        goal_id, name, target, completed, last_update = goal
        adherence_pct = (completed / max(1, target)) * 100
        on_track = completed >= target

        if on_track:
            review["summary"]["goals_on_track"] += 1
        else:
            review["summary"]["goals_behind"] += 1

        review["goals_detail"].append(
            {
                "goal": name,
                "target": target,
                "completed": completed,
                "adherence_pct": round(adherence_pct, 1),
                "status": "✅ Achieved" if on_track else "⚠️ Needs attention",
            }
        )

    # Generate 2-3 hypotheses based on data
    hypotheses = []

    # Hypothesis 1: Overall performance
    overall_adherence = (review["summary"]["goals_on_track"] / max(1, len(goals))) * 100
    if overall_adherence >= 75:
        hypotheses.append(
            "🎯 Strong week overall - you're building solid habits. Consider adding a new goal?"
        )
    elif overall_adherence >= 50:
        hypotheses.append(
            "📊 Mixed results this week. What's blocking you from full consistency?"
        )
    else:
        hypotheses.append(
            "🔍 This was a challenging week. Would breaking goals into smaller steps help?"
        )

    # Hypothesis 2: Specific goal insights
    if review["summary"]["goals_behind"] > 0:
        behind_goals = [
            g["goal"] for g in review["goals_detail"] if g["status"] == "⚠️ Needs attention"
        ]
        hypotheses.append(
            f"💡 You struggled with {', '.join(behind_goals[:2])}. "
            "Are these still aligned with your priorities?"
        )

    # Hypothesis 3: Encouragement or adjustment
    if review["summary"]["goals_on_track"] > 0:
        on_track_goals = [
            g["goal"] for g in review["goals_detail"] if g["status"] == "✅ Achieved"
        ]
        hypotheses.append(
            f"🌟 Your consistency with {', '.join(on_track_goals[:2])} is excellent! "
            "That's the momentum we want."
        )

    review["hypotheses"] = hypotheses[:3]  # Limit to 3

    return review


# ========================================
# Event Handlers (Scheduler Integration)
# ========================================


def handle_morning_checkin(data):
    """Morning check-in handler"""
    prompt = random.choice(MORNING_PROMPTS)
    print(f"\n{prompt}")
    print(f"Time: {data.get('time')}\n")


def handle_evening_reflection(data):
    """Evening reflection handler"""
    prompt = random.choice(EVENING_PROMPTS)
    print(f"\n{prompt}")

    # Check for missed sessions
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM goals"))
        goals = result.fetchall()

    for goal in goals:
        goal_id, name, target, completed, last_update = goal
        adherence = completed / max(1, target)

        if adherence >= 0.75:
            encouragement = random.choice(ENCOURAGEMENT_PROMPTS).format(
                percent=int(adherence * 100), sessions=completed, goal=name
            )
            print(f"  {encouragement}")
        elif adherence < 0.5:
            suggestion = random.choice(MISSED_SESSION_PROMPTS).format(goal=name)
            print(f"  🔔 {suggestion}")

    print("")
