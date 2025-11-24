"""
User Profile Module (Phase 4.5)
===============================
Manage user physical metrics, BMI calculation, and profile data.

All data stored locally for privacy.
"""

from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy import create_engine, text

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")


def calculate_bmi(weight_kg: float, height_cm: int) -> Tuple[float, str]:
    """
    Calculate BMI and determine category.

    Args:
        weight_kg: Weight in kilograms
        height_cm: Height in centimeters

    Returns:
        Tuple of (bmi_value, bmi_category)

    BMI Categories (WHO):
        < 18.5: underweight
        18.5-24.9: normal
        25-29.9: overweight
        30-34.9: obese_1 (Class I)
        35-39.9: obese_2 (Class II)
        >= 40: obese_3 (Class III)
    """
    if height_cm <= 0 or weight_kg <= 0:
        raise ValueError("Height and weight must be positive")

    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m**2), 1)

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


def calculate_waist_to_height_ratio(waist_cm: float, height_cm: int) -> float:
    """
    Calculate waist-to-height ratio.

    Health risk thresholds:
        < 0.4: May indicate underweight
        0.4-0.5: Healthy range
        0.5-0.6: Increased risk
        > 0.6: High risk

    Args:
        waist_cm: Waist circumference in cm
        height_cm: Height in cm

    Returns:
        Waist-to-height ratio
    """
    if height_cm <= 0:
        raise ValueError("Height must be positive")

    return round(waist_cm / height_cm, 3)


def save_user_profile(
    height_cm: int,
    weight_kg: float,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    waist_cm: Optional[float] = None,
    hip_cm: Optional[float] = None,
    neck_cm: Optional[float] = None,
    body_fat_pct: Optional[float] = None,
    activity_level: str = "moderate",
    experience_level: str = "beginner",
) -> int:
    """
    Save or update user profile.

    Only one profile per user (singleton pattern).
    Automatically calculates BMI and waist-to-height ratio.

    Args:
        height_cm: Height in centimeters (100-250)
        weight_kg: Weight in kilograms (20-300)
        age: Age in years (optional, 10-120)
        gender: Gender (male/female/other/prefer_not_to_say)
        waist_cm: Waist circumference (optional)
        hip_cm: Hip circumference (optional)
        neck_cm: Neck circumference (optional)
        body_fat_pct: Body fat percentage (optional)
        activity_level: sedentary/light/moderate/active/very_active
        experience_level: beginner/intermediate/advanced

    Returns:
        Profile ID
    """
    # Calculate derived values
    bmi, bmi_category = calculate_bmi(weight_kg, height_cm)

    waist_to_height = None
    if waist_cm:
        waist_to_height = calculate_waist_to_height_ratio(waist_cm, height_cm)

    now = datetime.now().isoformat()

    with engine.begin() as conn:
        # Check if profile exists
        existing = conn.execute(text("SELECT id FROM user_profile LIMIT 1")).fetchone()

        if existing:
            # Update existing profile
            conn.execute(
                text(
                    """
                    UPDATE user_profile SET
                        height_cm = :height_cm,
                        weight_kg = :weight_kg,
                        age = :age,
                        gender = :gender,
                        waist_cm = :waist_cm,
                        hip_cm = :hip_cm,
                        neck_cm = :neck_cm,
                        body_fat_pct = :body_fat_pct,
                        bmi = :bmi,
                        bmi_category = :bmi_category,
                        waist_to_height_ratio = :waist_to_height,
                        activity_level = :activity_level,
                        experience_level = :experience_level,
                        updated_at = :updated_at
                    WHERE id = :id
                """
                ),
                {
                    "id": existing[0],
                    "height_cm": height_cm,
                    "weight_kg": weight_kg,
                    "age": age,
                    "gender": gender,
                    "waist_cm": waist_cm,
                    "hip_cm": hip_cm,
                    "neck_cm": neck_cm,
                    "body_fat_pct": body_fat_pct,
                    "bmi": bmi,
                    "bmi_category": bmi_category,
                    "waist_to_height": waist_to_height,
                    "activity_level": activity_level,
                    "experience_level": experience_level,
                    "updated_at": now,
                },
            )
            return existing[0]
        else:
            # Insert new profile
            conn.execute(
                text(
                    """
                    INSERT INTO user_profile (
                        height_cm, weight_kg, age, gender, waist_cm, hip_cm, neck_cm,
                        body_fat_pct, bmi, bmi_category, waist_to_height_ratio,
                        activity_level, experience_level, created_at, updated_at
                    ) VALUES (
                        :height_cm, :weight_kg, :age, :gender, :waist_cm, :hip_cm, :neck_cm,
                        :body_fat_pct, :bmi, :bmi_category, :waist_to_height,
                        :activity_level, :experience_level, :created_at, :updated_at
                    )
                """
                ),
                {
                    "height_cm": height_cm,
                    "weight_kg": weight_kg,
                    "age": age,
                    "gender": gender,
                    "waist_cm": waist_cm,
                    "hip_cm": hip_cm,
                    "neck_cm": neck_cm,
                    "body_fat_pct": body_fat_pct,
                    "bmi": bmi,
                    "bmi_category": bmi_category,
                    "waist_to_height": waist_to_height,
                    "activity_level": activity_level,
                    "experience_level": experience_level,
                    "created_at": now,
                    "updated_at": now,
                },
            )
            row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
            return row[0]


def get_user_profile() -> Optional[Dict[str, Any]]:
    """
    Get the user's profile.

    Returns:
        Profile dictionary or None if not set up
    """
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, height_cm, weight_kg, age, gender, waist_cm, hip_cm, neck_cm,
                       body_fat_pct, bmi, bmi_category, waist_to_height_ratio,
                       activity_level, experience_level, created_at, updated_at
                FROM user_profile LIMIT 1
            """
            )
        ).fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "height_cm": row[1],
        "weight_kg": row[2],
        "age": row[3],
        "gender": row[4],
        "waist_cm": row[5],
        "hip_cm": row[6],
        "neck_cm": row[7],
        "body_fat_pct": row[8],
        "bmi": row[9],
        "bmi_category": row[10],
        "waist_to_height_ratio": row[11],
        "activity_level": row[12],
        "experience_level": row[13],
        "created_at": row[14],
        "updated_at": row[15],
    }


def update_weight(weight_kg: float) -> bool:
    """
    Quick update for weight only (recalculates BMI).

    Args:
        weight_kg: New weight in kilograms

    Returns:
        True if updated successfully
    """
    profile = get_user_profile()
    if not profile:
        return False

    bmi, bmi_category = calculate_bmi(weight_kg, profile["height_cm"])
    now = datetime.now().isoformat()

    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE user_profile SET
                    weight_kg = :weight_kg,
                    bmi = :bmi,
                    bmi_category = :bmi_category,
                    updated_at = :updated_at
                WHERE id = :id
            """
            ),
            {
                "id": profile["id"],
                "weight_kg": weight_kg,
                "bmi": bmi,
                "bmi_category": bmi_category,
                "updated_at": now,
            },
        )
        return result.rowcount > 0


def delete_user_profile() -> bool:
    """
    Delete user profile (for privacy/reset).

    Returns:
        True if deleted
    """
    with engine.begin() as conn:
        result = conn.execute(text("DELETE FROM user_profile"))
        return result.rowcount > 0


def get_bmi_interpretation(bmi: float, bmi_category: str) -> str:
    """
    Get human-readable BMI interpretation.

    Args:
        bmi: BMI value
        bmi_category: BMI category

    Returns:
        Interpretation string
    """
    interpretations = {
        "underweight": f"BMI {bmi} indicates underweight. Consider consulting a healthcare provider.",
        "normal": f"BMI {bmi} is in the healthy range. Maintain your current habits!",
        "overweight": f"BMI {bmi} indicates overweight. Regular exercise and balanced diet can help.",
        "obese_1": f"BMI {bmi} indicates Class I obesity. Consider working with a healthcare provider.",
        "obese_2": f"BMI {bmi} indicates Class II obesity. Medical guidance is recommended.",
        "obese_3": f"BMI {bmi} indicates Class III obesity. Please consult a healthcare provider.",
    }
    return interpretations.get(bmi_category, f"BMI: {bmi}")
