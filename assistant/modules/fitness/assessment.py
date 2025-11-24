"""
Fitness Assessment Module (Phase 4.5)
=====================================
Standardized fitness tests and classification.

Based on research-backed benchmarks for general adult population.
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


def classify_fitness_level(
    push_ups: Optional[int] = None,
    plank_sec: Optional[int] = None,
    squat_60s: Optional[int] = None,
    wall_sit_sec: Optional[int] = None,
    resting_hr: Optional[int] = None,
) -> tuple[str, int]:
    """
    Classify overall fitness level based on test results.

    Uses score-based system with research-backed benchmarks.

    Benchmarks (general adult):
        Push-ups: <10 beginner, 10-25 intermediate, >25 advanced
        Plank: <30s beginner, 30-60s intermediate, >60s advanced
        Squats/60s: <20 beginner, 20-35 intermediate, >35 advanced
        Wall sit: <30s beginner, 30-60s intermediate, >60s advanced
        Resting HR: >80 poor, 60-80 average, <60 good

    Args:
        push_ups: Maximum push-ups with good form
        plank_sec: Maximum plank hold in seconds
        squat_60s: Squats completed in 60 seconds
        wall_sit_sec: Maximum wall sit hold in seconds
        resting_hr: Resting heart rate in BPM

    Returns:
        Tuple of (fitness_level, score out of 100)
    """
    score = 0
    tests_taken = 0

    # Push-ups scoring (max 20 points)
    if push_ups is not None:
        tests_taken += 1
        if push_ups >= 30:
            score += 20
        elif push_ups >= 25:
            score += 17
        elif push_ups >= 20:
            score += 14
        elif push_ups >= 15:
            score += 11
        elif push_ups >= 10:
            score += 8
        elif push_ups >= 5:
            score += 5
        else:
            score += 2

    # Plank scoring (max 20 points)
    if plank_sec is not None:
        tests_taken += 1
        if plank_sec >= 90:
            score += 20
        elif plank_sec >= 60:
            score += 17
        elif plank_sec >= 45:
            score += 14
        elif plank_sec >= 30:
            score += 11
        elif plank_sec >= 20:
            score += 8
        elif plank_sec >= 10:
            score += 5
        else:
            score += 2

    # Squat 60s scoring (max 20 points)
    if squat_60s is not None:
        tests_taken += 1
        if squat_60s >= 40:
            score += 20
        elif squat_60s >= 35:
            score += 17
        elif squat_60s >= 30:
            score += 14
        elif squat_60s >= 25:
            score += 11
        elif squat_60s >= 20:
            score += 8
        elif squat_60s >= 15:
            score += 5
        else:
            score += 2

    # Wall sit scoring (max 20 points)
    if wall_sit_sec is not None:
        tests_taken += 1
        if wall_sit_sec >= 90:
            score += 20
        elif wall_sit_sec >= 60:
            score += 17
        elif wall_sit_sec >= 45:
            score += 14
        elif wall_sit_sec >= 30:
            score += 11
        elif wall_sit_sec >= 20:
            score += 8
        elif wall_sit_sec >= 10:
            score += 5
        else:
            score += 2

    # Resting HR scoring (max 20 points) - lower is better
    if resting_hr is not None:
        tests_taken += 1
        if resting_hr <= 50:
            score += 20
        elif resting_hr <= 55:
            score += 17
        elif resting_hr <= 60:
            score += 14
        elif resting_hr <= 70:
            score += 11
        elif resting_hr <= 80:
            score += 8
        elif resting_hr <= 90:
            score += 5
        else:
            score += 2

    # Normalize score to 100 if not all tests taken
    if tests_taken > 0:
        max_possible = tests_taken * 20
        normalized_score = int((score / max_possible) * 100)
    else:
        normalized_score = 0

    # Classify level
    if normalized_score >= 70:
        level = "advanced"
    elif normalized_score >= 40:
        level = "intermediate"
    else:
        level = "beginner"

    return level, normalized_score


def save_assessment(
    push_up_max: Optional[int] = None,
    plank_hold_seconds: Optional[int] = None,
    squat_60s_count: Optional[int] = None,
    wall_sit_seconds: Optional[int] = None,
    resting_heart_rate: Optional[int] = None,
    sit_reach_score: Optional[int] = None,
    single_leg_balance_left: Optional[int] = None,
    single_leg_balance_right: Optional[int] = None,
    notes: Optional[str] = None,
    assessment_date: Optional[date] = None,
) -> int:
    """
    Save fitness assessment results.

    Automatically calculates fitness level and score.
    One assessment per day (updates if same day).

    Args:
        push_up_max: Maximum push-ups completed
        plank_hold_seconds: Maximum plank hold time
        squat_60s_count: Squats completed in 60 seconds
        wall_sit_seconds: Maximum wall sit hold time
        resting_heart_rate: Resting heart rate (BPM)
        sit_reach_score: Flexibility score (1-5)
        single_leg_balance_left: Left leg balance (seconds)
        single_leg_balance_right: Right leg balance (seconds)
        notes: Optional notes
        assessment_date: Date of assessment (defaults to today)

    Returns:
        Assessment ID
    """
    if assessment_date is None:
        assessment_date = date.today()

    # Calculate fitness level
    fitness_level, fitness_score = classify_fitness_level(
        push_ups=push_up_max,
        plank_sec=plank_hold_seconds,
        squat_60s=squat_60s_count,
        wall_sit_sec=wall_sit_seconds,
        resting_hr=resting_heart_rate,
    )

    with engine.begin() as conn:
        # Check if assessment exists for this date
        existing = conn.execute(
            text("SELECT id FROM fitness_assessments WHERE assessment_date = :date"),
            {"date": assessment_date.isoformat()},
        ).fetchone()

        if existing:
            # Update existing assessment
            conn.execute(
                text(
                    """
                    UPDATE fitness_assessments SET
                        push_up_max = :push_up_max,
                        plank_hold_seconds = :plank_hold_seconds,
                        squat_60s_count = :squat_60s_count,
                        wall_sit_seconds = :wall_sit_seconds,
                        resting_heart_rate = :resting_heart_rate,
                        sit_reach_score = :sit_reach_score,
                        single_leg_balance_left = :single_leg_balance_left,
                        single_leg_balance_right = :single_leg_balance_right,
                        overall_fitness_level = :fitness_level,
                        fitness_score = :fitness_score,
                        notes = :notes
                    WHERE id = :id
                """
                ),
                {
                    "id": existing[0],
                    "push_up_max": push_up_max,
                    "plank_hold_seconds": plank_hold_seconds,
                    "squat_60s_count": squat_60s_count,
                    "wall_sit_seconds": wall_sit_seconds,
                    "resting_heart_rate": resting_heart_rate,
                    "sit_reach_score": sit_reach_score,
                    "single_leg_balance_left": single_leg_balance_left,
                    "single_leg_balance_right": single_leg_balance_right,
                    "fitness_level": fitness_level,
                    "fitness_score": fitness_score,
                    "notes": notes,
                },
            )
            return int(existing[0])
        else:
            # Insert new assessment
            conn.execute(
                text(
                    """
                    INSERT INTO fitness_assessments (
                        assessment_date, push_up_max, plank_hold_seconds, squat_60s_count,
                        wall_sit_seconds, resting_heart_rate, sit_reach_score,
                        single_leg_balance_left, single_leg_balance_right,
                        overall_fitness_level, fitness_score, notes
                    ) VALUES (
                        :assessment_date, :push_up_max, :plank_hold_seconds, :squat_60s_count,
                        :wall_sit_seconds, :resting_heart_rate, :sit_reach_score,
                        :single_leg_balance_left, :single_leg_balance_right,
                        :fitness_level, :fitness_score, :notes
                    )
                """
                ),
                {
                    "assessment_date": assessment_date.isoformat(),
                    "push_up_max": push_up_max,
                    "plank_hold_seconds": plank_hold_seconds,
                    "squat_60s_count": squat_60s_count,
                    "wall_sit_seconds": wall_sit_seconds,
                    "resting_heart_rate": resting_heart_rate,
                    "sit_reach_score": sit_reach_score,
                    "single_leg_balance_left": single_leg_balance_left,
                    "single_leg_balance_right": single_leg_balance_right,
                    "fitness_level": fitness_level,
                    "fitness_score": fitness_score,
                    "notes": notes,
                },
            )
            row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
            if row is None:
                raise RuntimeError("Failed to get last insert rowid")
            return int(row[0])


def get_latest_assessment() -> Optional[Dict[str, Any]]:
    """
    Get the most recent fitness assessment.

    Returns:
        Assessment dictionary or None
    """
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, assessment_date, push_up_max, plank_hold_seconds, squat_60s_count,
                       wall_sit_seconds, resting_heart_rate, sit_reach_score,
                       single_leg_balance_left, single_leg_balance_right,
                       overall_fitness_level, fitness_score, notes, created_at
                FROM fitness_assessments
                ORDER BY assessment_date DESC
                LIMIT 1
            """
            )
        ).fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "assessment_date": row[1],
        "push_up_max": row[2],
        "plank_hold_seconds": row[3],
        "squat_60s_count": row[4],
        "wall_sit_seconds": row[5],
        "resting_heart_rate": row[6],
        "sit_reach_score": row[7],
        "single_leg_balance_left": row[8],
        "single_leg_balance_right": row[9],
        "overall_fitness_level": row[10],
        "fitness_score": row[11],
        "notes": row[12],
        "created_at": row[13],
    }


def get_assessment_history(limit: int = 12) -> List[Dict[str, Any]]:
    """
    Get assessment history for progress tracking.

    Args:
        limit: Maximum number of assessments to return

    Returns:
        List of assessments, newest first
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, assessment_date, push_up_max, plank_hold_seconds, squat_60s_count,
                       wall_sit_seconds, resting_heart_rate, overall_fitness_level,
                       fitness_score
                FROM fitness_assessments
                ORDER BY assessment_date DESC
                LIMIT :limit
            """
            ),
            {"limit": limit},
        ).fetchall()

    return [
        {
            "id": row[0],
            "assessment_date": row[1],
            "push_up_max": row[2],
            "plank_hold_seconds": row[3],
            "squat_60s_count": row[4],
            "wall_sit_seconds": row[5],
            "resting_heart_rate": row[6],
            "overall_fitness_level": row[7],
            "fitness_score": row[8],
        }
        for row in rows
    ]


def compare_assessments(current: Dict[str, Any], previous: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare two assessments to show progress.

    Args:
        current: Current assessment
        previous: Previous assessment

    Returns:
        Dictionary with changes for each metric
    """
    metrics = [
        "push_up_max",
        "plank_hold_seconds",
        "squat_60s_count",
        "wall_sit_seconds",
        "fitness_score",
    ]

    comparison = {}
    for metric in metrics:
        curr_val = current.get(metric)
        prev_val = previous.get(metric)

        if curr_val is not None and prev_val is not None:
            change = curr_val - prev_val
            if prev_val > 0:
                pct_change = round((change / prev_val) * 100, 1)
            else:
                pct_change = 0

            comparison[metric] = {
                "current": curr_val,
                "previous": prev_val,
                "change": change,
                "pct_change": pct_change,
                "improved": change > 0,
            }

    # Resting HR - lower is better
    curr_hr = current.get("resting_heart_rate")
    prev_hr = previous.get("resting_heart_rate")
    if curr_hr is not None and prev_hr is not None:
        change = curr_hr - prev_hr
        comparison["resting_heart_rate"] = {
            "current": curr_hr,
            "previous": prev_hr,
            "change": change,
            "improved": change < 0,  # Lower is better
        }

    return comparison


def get_test_instructions(test_name: str) -> Dict[str, str]:
    """
    Get standardized instructions for each fitness test.

    Args:
        test_name: Name of the test

    Returns:
        Dictionary with instructions, tips, and what it measures
    """
    instructions = {
        "push_up_max": {
            "name": "Push-up Test",
            "measures": "Upper body strength and endurance",
            "instructions": """
1. Start in a high plank position, hands shoulder-width apart
2. Lower your chest until it nearly touches the floor
3. Push back up to starting position
4. Count only full repetitions with good form
5. Stop when you can no longer maintain proper form
6. Record your maximum number
            """,
            "tips": "Keep your core tight and body in a straight line. Breathe out on the push up.",
        },
        "plank_hold": {
            "name": "Plank Hold Test",
            "measures": "Core strength and stability",
            "instructions": """
1. Start in a forearm plank position
2. Elbows directly under shoulders
3. Body in a straight line from head to heels
4. Start the timer when you're in position
5. Stop when your form breaks (hips drop or rise)
6. Record time in seconds
            """,
            "tips": "Squeeze your glutes and engage your abs. Look at the floor to keep neck neutral.",
        },
        "squat_60s": {
            "name": "60-Second Squat Test",
            "measures": "Lower body endurance",
            "instructions": """
1. Stand with feet shoulder-width apart
2. Set a 60-second timer
3. Squat down until thighs are parallel to floor
4. Stand back up fully
5. Count each complete squat
6. Maintain good form throughout
            """,
            "tips": "Keep your weight in your heels and chest up. Pace yourself for the full 60 seconds.",
        },
        "wall_sit": {
            "name": "Wall Sit Test",
            "measures": "Lower body isometric strength",
            "instructions": """
1. Stand with back against a wall
2. Slide down until thighs are parallel to floor
3. Knees should be at 90 degrees
4. Start timer when in position
5. Stop when you can no longer hold
6. Record time in seconds
            """,
            "tips": "Press your back flat against the wall. Don't rest hands on thighs.",
        },
        "resting_heart_rate": {
            "name": "Resting Heart Rate",
            "measures": "Cardiovascular fitness",
            "instructions": """
1. Sit quietly for 5 minutes before measuring
2. Best done first thing in the morning
3. Find pulse on wrist or neck
4. Count beats for 60 seconds (or 15 seconds × 4)
5. Record the number
            """,
            "tips": "Avoid caffeine and exercise before measuring. Lower resting HR generally indicates better cardiovascular fitness.",
        },
    }

    return instructions.get(test_name, {"error": "Test not found"})
