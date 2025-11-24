"""
User Equipment Module (Phase 4.5)
=================================
Manage user's available fitness equipment.
Filters exercises to match available gear.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, text

DB_PATH = "assistant/data/memory.db"
engine = create_engine(f"sqlite:///{DB_PATH}")

# Equipment type definitions
EQUIPMENT_TYPES = {
    "bodyweight": {
        "name": "Bodyweight",
        "description": "No equipment needed",
        "category": "none",
    },
    "kettlebell": {
        "name": "Kettlebell",
        "description": "Cast iron weight with handle",
        "category": "free_weights",
    },
    "dumbbell": {
        "name": "Dumbbells",
        "description": "Free weights (pair)",
        "category": "free_weights",
    },
    "barbell": {
        "name": "Barbell",
        "description": "Olympic or standard barbell with plates",
        "category": "free_weights",
    },
    "pull_up_bar": {
        "name": "Pull-up Bar",
        "description": "Overhead bar for pull-ups and hanging exercises",
        "category": "bars",
    },
    "resistance_band": {
        "name": "Resistance Bands",
        "description": "Elastic bands of various resistance levels",
        "category": "bands",
    },
    "bench": {
        "name": "Bench",
        "description": "Flat or adjustable weight bench",
        "category": "furniture",
    },
    "trx": {
        "name": "TRX / Suspension Trainer",
        "description": "Suspension training straps",
        "category": "suspension",
    },
    "jump_rope": {
        "name": "Jump Rope",
        "description": "Skipping rope for cardio",
        "category": "cardio",
    },
    "foam_roller": {
        "name": "Foam Roller",
        "description": "For mobility and recovery",
        "category": "recovery",
    },
    "yoga_mat": {
        "name": "Yoga Mat",
        "description": "Mat for floor exercises",
        "category": "accessories",
    },
    "exercise_ball": {
        "name": "Exercise Ball",
        "description": "Stability ball",
        "category": "accessories",
    },
    "medicine_ball": {
        "name": "Medicine Ball",
        "description": "Weighted ball for exercises",
        "category": "free_weights",
    },
    "cable_machine": {
        "name": "Cable Machine",
        "description": "Gym cable/pulley system",
        "category": "machines",
    },
    "other": {
        "name": "Other Equipment",
        "description": "Custom equipment",
        "category": "other",
    },
}


def get_equipment_types() -> Dict[str, Dict[str, str]]:
    """Get all available equipment types with descriptions."""
    return EQUIPMENT_TYPES


def add_equipment(equipment_type: str, details: Optional[str] = None, quantity: int = 1) -> int:
    """
    Add equipment to user's inventory.

    Args:
        equipment_type: Type of equipment (from EQUIPMENT_TYPES)
        details: Optional details (e.g., "16kg, 24kg" for kettlebells)
        quantity: Number of items

    Returns:
        Equipment ID
    """
    if equipment_type not in EQUIPMENT_TYPES:
        raise ValueError(f"Invalid equipment type: {equipment_type}")

    with engine.begin() as conn:
        # Use INSERT OR REPLACE to handle duplicates
        conn.execute(
            text(
                """
                INSERT OR REPLACE INTO user_equipment (equipment_type, details, quantity, active, created_at)
                VALUES (:equipment_type, :details, :quantity, 1, :created_at)
            """
            ),
            {
                "equipment_type": equipment_type,
                "details": details,
                "quantity": quantity,
                "created_at": datetime.now().isoformat(),
            },
        )
        row = conn.execute(text("SELECT last_insert_rowid()")).fetchone()
        if row is None:
            raise RuntimeError("Failed to get last insert rowid")
        return int(row[0])


def remove_equipment(equipment_type: str) -> bool:
    """
    Remove equipment from user's inventory.

    Args:
        equipment_type: Type of equipment to remove

    Returns:
        True if removed
    """
    with engine.begin() as conn:
        # Don't remove bodyweight - it's always available
        if equipment_type == "bodyweight":
            return False

        result = conn.execute(
            text("DELETE FROM user_equipment WHERE equipment_type = :equipment_type"),
            {"equipment_type": equipment_type},
        )
        return result.rowcount > 0


def get_user_equipment() -> List[Dict[str, Any]]:
    """
    Get all equipment the user has.

    Returns:
        List of equipment items
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, equipment_type, details, quantity, active, created_at
                FROM user_equipment
                WHERE active = 1
                ORDER BY equipment_type
            """
            )
        ).fetchall()

    equipment = []
    for row in rows:
        eq_type = row[1]
        eq_info = EQUIPMENT_TYPES.get(eq_type, {})
        equipment.append(
            {
                "id": row[0],
                "equipment_type": eq_type,
                "name": eq_info.get("name", eq_type),
                "category": eq_info.get("category", "other"),
                "details": row[2],
                "quantity": row[3],
                "active": row[4],
                "created_at": row[5],
            }
        )

    return equipment


def get_equipment_types_list() -> List[str]:
    """
    Get list of equipment types the user has.

    Returns:
        List of equipment type strings
    """
    equipment = get_user_equipment()
    return [eq["equipment_type"] for eq in equipment]


def set_equipment_list(equipment_types: List[str]) -> int:
    """
    Set the complete list of user equipment (replace all).

    Args:
        equipment_types: List of equipment type strings

    Returns:
        Number of equipment items set
    """
    # Always include bodyweight
    if "bodyweight" not in equipment_types:
        equipment_types.append("bodyweight")

    # Validate all types
    for eq_type in equipment_types:
        if eq_type not in EQUIPMENT_TYPES:
            raise ValueError(f"Invalid equipment type: {eq_type}")

    with engine.begin() as conn:
        # Deactivate all existing equipment
        conn.execute(text("UPDATE user_equipment SET active = 0"))

        # Add/activate each equipment type
        for eq_type in equipment_types:
            conn.execute(
                text(
                    """
                    INSERT OR REPLACE INTO user_equipment (equipment_type, active, created_at)
                    VALUES (:equipment_type, 1, :created_at)
                """
                ),
                {
                    "equipment_type": eq_type,
                    "created_at": datetime.now().isoformat(),
                },
            )

    return len(equipment_types)


def get_exercises_for_equipment(
    equipment_types: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Get exercises that can be done with the given equipment.

    Args:
        equipment_types: List of available equipment (defaults to user's equipment)

    Returns:
        List of exercises matching the equipment
    """
    if equipment_types is None:
        equipment_types = get_equipment_types_list()

    if not equipment_types:
        equipment_types = ["bodyweight"]

    # Build query with equipment filter
    placeholders = ", ".join([f":eq_{i}" for i in range(len(equipment_types))])
    params = {f"eq_{i}": eq for i, eq in enumerate(equipment_types)}

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                f"""
                SELECT id, name, category, muscle_group, equipment, description,
                       instructions, form_cues, common_mistakes, muscles_primary,
                       muscles_secondary, difficulty_level, movement_pattern, video_url
                FROM exercises
                WHERE equipment IN ({placeholders})
                ORDER BY category, name
            """
            ),
            params,
        ).fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "muscle_group": row[3],
            "equipment": row[4],
            "description": row[5],
            "instructions": row[6],
            "form_cues": row[7],
            "common_mistakes": row[8],
            "muscles_primary": row[9],
            "muscles_secondary": row[10],
            "difficulty_level": row[11],
            "movement_pattern": row[12],
            "video_url": row[13],
        }
        for row in rows
    ]


def update_equipment_details(equipment_type: str, details: str) -> bool:
    """
    Update details for an equipment type (e.g., weight range).

    Args:
        equipment_type: Type of equipment
        details: New details string

    Returns:
        True if updated
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE user_equipment
                SET details = :details
                WHERE equipment_type = :equipment_type AND active = 1
            """
            ),
            {"equipment_type": equipment_type, "details": details},
        )
        return result.rowcount > 0
