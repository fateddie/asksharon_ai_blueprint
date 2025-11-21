#!/usr/bin/env python3
"""
Database Migration: Goal Calendar Integration (Separate Tables)

Creates separate tables for goal calendar configuration:
- goal_calendar_config: one config per goal (recurring_days, time range, etc.)
- goal_calendar_events: tracks individual calendar events created

Also rolls back previous migration that added columns to goals table.

Run: python scripts/migrate_goal_calendar_separate_tables.py
"""

import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent.parent / "assistant" / "data" / "memory.db"


def migrate():
    """Create goal calendar tables and rollback previous migration"""

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # ========================================
        # Step 1: Rollback previous migration (remove columns from goals table)
        # ========================================
        print("🔄 Rolling back previous migration...")

        cursor.execute("PRAGMA table_info(goals)")
        existing_columns = [row[1] for row in cursor.fetchall()]

        columns_to_remove = [
            "recurring_days",
            "calendar_event_template_id",
            "session_time_start",
            "session_time_end"
        ]

        columns_found = [col for col in columns_to_remove if col in existing_columns]

        if columns_found:
            # SQLite doesn't support DROP COLUMN directly, so we recreate the table
            print(f"   Found columns to remove: {', '.join(columns_found)}")

            # Get current goals data
            cursor.execute("SELECT id, name, target_per_week, completed, last_update, status FROM goals")
            goals_data = cursor.fetchall()

            # Drop and recreate goals table
            cursor.execute("DROP TABLE IF EXISTS goals_backup")
            cursor.execute("ALTER TABLE goals RENAME TO goals_backup")

            cursor.execute("""
                CREATE TABLE goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    target_per_week INTEGER NOT NULL,
                    completed INTEGER DEFAULT 0,
                    last_update DATETIME,
                    status TEXT DEFAULT 'active'
                )
            """)

            # Restore data
            for row in goals_data:
                cursor.execute(
                    "INSERT INTO goals (id, name, target_per_week, completed, last_update, status) VALUES (?, ?, ?, ?, ?, ?)",
                    row
                )

            cursor.execute("DROP TABLE goals_backup")
            print("   ✅ Removed columns from goals table")
        else:
            print("   ℹ️  No columns to remove from goals table")

        # ========================================
        # Step 2: Create goal_calendar_config table
        # ========================================
        print("\n🔄 Creating goal_calendar_config table...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS goal_calendar_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL,
                recurring_days TEXT NOT NULL,
                session_time_start TEXT NOT NULL,
                session_time_end TEXT NOT NULL,
                weeks_ahead INTEGER DEFAULT 4,
                timezone TEXT DEFAULT NULL,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )
        """)
        print("   ✅ Created goal_calendar_config table")

        # ========================================
        # Step 3: Create goal_calendar_events table
        # ========================================
        print("\n🔄 Creating goal_calendar_events table...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS goal_calendar_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL,
                calendar_event_id TEXT NOT NULL,
                event_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
            )
        """)
        print("   ✅ Created goal_calendar_events table")

        # ========================================
        # Step 4: Create indexes for performance
        # ========================================
        print("\n🔄 Creating indexes...")

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_goal_calendar_config_goal_id
            ON goal_calendar_config(goal_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_goal_calendar_events_goal_id
            ON goal_calendar_events(goal_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_goal_calendar_events_date
            ON goal_calendar_events(event_date)
        """)

        print("   ✅ Created indexes")

        conn.commit()
        print("\n✅ Successfully created goal calendar tables")

        # ========================================
        # Step 5: Verify schema
        # ========================================
        print("\n📋 Verification:")

        cursor.execute("PRAGMA table_info(goals)")
        goals_columns = cursor.fetchall()
        print("\n   goals table:")
        for col in goals_columns:
            print(f"      - {col[1]} ({col[2]})")

        cursor.execute("PRAGMA table_info(goal_calendar_config)")
        config_columns = cursor.fetchall()
        print("\n   goal_calendar_config table:")
        for col in config_columns:
            print(f"      - {col[1]} ({col[2]})")

        cursor.execute("PRAGMA table_info(goal_calendar_events)")
        events_columns = cursor.fetchall()
        print("\n   goal_calendar_events table:")
        for col in events_columns:
            print(f"      - {col[1]} ({col[2]})")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    print("🔄 Starting goal calendar migration (separate tables)...\n")
    migrate()
    print("\n✅ Migration complete!")
