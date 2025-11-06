#!/usr/bin/env python3
"""
Email Schema Migration Script

Migrates the emails table to Phase 2 schema with additional fields.
Run this before using the enhanced email module.

Usage:
    python scripts/migrate_email_schema.py
"""

import sqlite3
import sys
from pathlib import Path

# Database path
DB_PATH = "assistant/data/memory.db"


def migrate_email_table():
    """Migrate emails table to new schema"""
    print("\n" + "="*60)
    print("Email Schema Migration")
    print("="*60 + "\n")

    # Check if database exists
    if not Path(DB_PATH).exists():
        print(f"❌ Database not found at {DB_PATH}")
        print("   Run: sqlite3 {DB_PATH} < assistant/data/schema.sql")
        return False

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(emails)")
        columns = [row[1] for row in cursor.fetchall()]

        print(f"📋 Current columns: {', '.join(columns)}")

        # Check if migration needed
        new_columns = [
            "email_id", "from_name", "from_email", "to_email",
            "body_text", "body_html", "attachments_count",
            "priority", "action_items", "is_read", "folder"
        ]

        missing_columns = [col for col in new_columns if col not in columns]

        if not missing_columns:
            print("✓ Schema is already up to date!")
            return True

        print(f"\n⚠️  Migration needed. Missing columns: {', '.join(missing_columns)}")
        print("\nMigrating...")

        # Backup existing data
        cursor.execute("SELECT * FROM emails")
        existing_emails = cursor.fetchall()
        print(f"✓ Backed up {len(existing_emails)} existing emails")

        # Drop old table
        cursor.execute("DROP TABLE emails")
        print("✓ Dropped old table")

        # Create new table with Phase 2 schema
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email_id TEXT UNIQUE,
                from_name TEXT,
                from_email TEXT,
                to_email TEXT,
                subject TEXT,
                date_received DATETIME,
                body_text TEXT,
                body_html TEXT,
                attachments_count INTEGER DEFAULT 0,
                priority TEXT DEFAULT 'MEDIUM',
                summary TEXT,
                action_items TEXT,
                is_read INTEGER DEFAULT 0,
                folder TEXT DEFAULT 'INBOX',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created new table with Phase 2 schema")

        # Migrate old data if any
        if existing_emails:
            for email in existing_emails:
                # Old schema: id, sender, subject, date_received, summary
                cursor.execute("""
                    INSERT INTO emails (
                        email_id, from_email, subject, date_received, summary
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    f"migrated-{email[0]}",  # Generate email_id from old id
                    email[1],  # sender -> from_email
                    email[2],  # subject
                    email[3],  # date_received
                    email[4]   # summary
                ))
            print(f"✓ Migrated {len(existing_emails)} existing emails")

        conn.commit()

        # Verify migration
        cursor.execute("PRAGMA table_info(emails)")
        new_columns_actual = [row[1] for row in cursor.fetchall()]
        print(f"\n✓ New columns: {', '.join(new_columns_actual)}")

        print("\n" + "="*60)
        print("✅ Migration complete!")
        print("="*60 + "\n")

        return True

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = migrate_email_table()
    sys.exit(0 if success else 1)
