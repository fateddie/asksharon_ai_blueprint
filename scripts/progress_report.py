#!/usr/bin/env python3
"""
AskSharon.ai Progress Report Generator
=======================================
Shows what you worked on yesterday, last week, or since last login.

Features:
- Daily summary (yesterday's activity)
- Weekly progress report (last 7 days)
- Last session summary (since last login)
- Cross-system activity (ManagementTeam + AskSharon)

Usage:
    python scripts/progress_report.py yesterday
    python scripts/progress_report.py week
    python scripts/progress_report.py last-session
    python scripts/progress_report.py --since "2025-11-10"

Author: AskSharon.ai
Last Updated: 2025-11-12
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional
import argparse
from dotenv import load_dotenv

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Load environment variables
load_dotenv(PROJECT_ROOT / "config" / ".env")

try:
    from assistant.core.supabase_memory import (
        _get_supabase_client,
        DEPENDENCIES_AVAILABLE
    )
    SUPABASE_AVAILABLE = DEPENDENCIES_AVAILABLE
except ImportError:
    SUPABASE_AVAILABLE = False
    print("❌ Supabase memory not available")
    print("   Install with: pip install supabase openai")
    sys.exit(1)


# ============================================
# Session Tracking
# ============================================

SESSION_FILE = PROJECT_ROOT / "data" / "last_session.txt"


def get_last_session_time() -> Optional[datetime]:
    """Get timestamp of last session."""
    if SESSION_FILE.exists():
        try:
            timestamp_str = SESSION_FILE.read_text().strip()
            return datetime.fromisoformat(timestamp_str)
        except Exception:
            return None
    return None


def update_session_time():
    """Update last session timestamp to now."""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    SESSION_FILE.write_text(datetime.now().isoformat())


# ============================================
# Progress Report Queries
# ============================================

def get_managementteam_activity(since_date: datetime) -> Dict[str, Any]:
    """
    Get ManagementTeam project activity since date.

    Returns:
        {
            "projects_updated": [...],
            "decisions_made": [...],
            "total_projects": int
        }
    """
    supabase = _get_supabase_client()

    # Query project decisions since date
    result = supabase.table("project_decisions")\
        .select("*")\
        .gte("created_at", since_date.isoformat())\
        .order("created_at", desc=True)\
        .execute()

    projects = result.data if result.data else []

    # Group by project
    projects_by_name = {}
    for p in projects:
        name = p['project_name']
        if name not in projects_by_name:
            projects_by_name[name] = []
        projects_by_name[name].append(p)

    return {
        "projects_updated": list(projects_by_name.keys()),
        "decisions_made": projects,
        "total_projects": len(projects_by_name)
    }


def get_asksharon_activity(since_date: datetime) -> Dict[str, Any]:
    """
    Get AskSharon task activity since date.

    Returns:
        {
            "tasks_created": [...],
            "tasks_completed": [...],
            "total_created": int,
            "total_completed": int
        }
    """
    supabase = _get_supabase_client()

    # Query tasks created since date
    created_result = supabase.table("user_tasks")\
        .select("*")\
        .gte("created_at", since_date.isoformat())\
        .order("created_at", desc=True)\
        .execute()

    # Query tasks completed since date
    completed_result = supabase.table("user_tasks")\
        .select("*")\
        .eq("completed", True)\
        .gte("completed_at", since_date.isoformat())\
        .order("completed_at", desc=True)\
        .execute()

    tasks_created = created_result.data if created_result.data else []
    tasks_completed = completed_result.data if completed_result.data else []

    return {
        "tasks_created": tasks_created,
        "tasks_completed": tasks_completed,
        "total_created": len(tasks_created),
        "total_completed": len(tasks_completed)
    }


def get_cross_system_activity(since_date: datetime) -> Dict[str, Any]:
    """
    Get activity across both systems with connections.

    Returns:
        {
            "project_task_links": [...],  # Projects with linked tasks
            "timeline": [...]  # Chronological activity
        }
    """
    supabase = _get_supabase_client()

    # Query all memories since date
    result = supabase.table("long_term_memory")\
        .select("*")\
        .gte("created_at", since_date.isoformat())\
        .order("created_at", desc=True)\
        .execute()

    memories = result.data if result.data else []

    # Build timeline
    timeline = []
    for memory in memories:
        timeline.append({
            "timestamp": memory['created_at'],
            "system": memory['source_system'],
            "type": memory['entity_type'],
            "content_preview": memory['content'][:100] + "..." if len(memory['content']) > 100 else memory['content']
        })

    # Find projects with linked tasks
    project_task_links = []
    for memory in memories:
        if memory['source_system'] == 'management_team' and memory['entity_type'] == 'project_decision':
            project_name = memory['metadata'].get('project') if memory.get('metadata') else None
            if project_name:
                # Get tasks for this project
                task_result = supabase.table("user_tasks")\
                    .select("*")\
                    .eq("project_reference", project_name)\
                    .execute()

                if task_result.data and len(task_result.data) > 0:
                    project_task_links.append({
                        "project": project_name,
                        "tasks": task_result.data
                    })

    return {
        "project_task_links": project_task_links,
        "timeline": timeline
    }


# ============================================
# Report Generators
# ============================================

def generate_daily_report(target_date: date = None) -> str:
    """
    Generate daily progress report.

    Args:
        target_date: Date to report on (default: yesterday)

    Returns:
        Formatted report string
    """
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    # Convert to datetime for queries
    since_datetime = datetime.combine(target_date, datetime.min.time())
    until_datetime = since_datetime + timedelta(days=1)

    # Get activity
    mt_activity = get_managementteam_activity(since_datetime)
    as_activity = get_asksharon_activity(since_datetime)
    cross_activity = get_cross_system_activity(since_datetime)

    # Build report
    report = []
    report.append("=" * 70)
    report.append(f"📅 Daily Progress Report - {target_date.strftime('%A, %B %d, %Y')}")
    report.append("=" * 70)
    report.append("")

    # ManagementTeam section
    report.append("🏢 ManagementTeam Activity")
    report.append("-" * 70)
    if mt_activity['total_projects'] > 0:
        report.append(f"  Projects worked on: {mt_activity['total_projects']}")
        report.append("")
        for decision in mt_activity['decisions_made'][:5]:  # Show top 5
            project = decision['project_name']
            dec = decision['decision']
            agent = decision['agent_name']
            time = datetime.fromisoformat(decision['created_at']).strftime('%H:%M')
            report.append(f"  • {time} - {project}")
            report.append(f"    Status: {dec.upper()} (by {agent})")
            if decision.get('notes'):
                notes = decision['notes'][:80] + "..." if len(decision['notes']) > 80 else decision['notes']
                report.append(f"    Notes: {notes}")
            report.append("")
    else:
        report.append("  No ManagementTeam activity")
        report.append("")

    # AskSharon section
    report.append("👤 Personal Activity (AskSharon)")
    report.append("-" * 70)
    report.append(f"  Tasks created: {as_activity['total_created']}")
    report.append(f"  Tasks completed: {as_activity['total_completed']}")
    report.append("")

    if as_activity['total_completed'] > 0:
        report.append("  ✅ Completed Tasks:")
        for task in as_activity['tasks_completed'][:10]:
            time = datetime.fromisoformat(task['completed_at']).strftime('%H:%M')
            title = task['title']
            project = task.get('project_reference', '')
            if project:
                report.append(f"    • {time} - {title} (Project: {project})")
            else:
                report.append(f"    • {time} - {title}")
        report.append("")

    if as_activity['total_created'] > 0:
        report.append("  📝 New Tasks:")
        for task in as_activity['tasks_created'][:10]:
            time = datetime.fromisoformat(task['created_at']).strftime('%H:%M')
            title = task['title']
            urgency = task.get('urgency', 3)
            importance = task.get('importance', 3)
            report.append(f"    • {time} - {title} (U:{urgency} I:{importance})")
        report.append("")

    # Cross-system insights
    if len(cross_activity['project_task_links']) > 0:
        report.append("🔗 Project-Task Connections")
        report.append("-" * 70)
        for link in cross_activity['project_task_links']:
            project = link['project']
            task_count = len(link['tasks'])
            completed = len([t for t in link['tasks'] if t.get('completed', False)])
            report.append(f"  • {project}: {completed}/{task_count} tasks completed")
        report.append("")

    # Summary
    report.append("=" * 70)
    report.append("📊 Summary")
    report.append("-" * 70)
    total_activity = mt_activity['total_projects'] + as_activity['total_created'] + as_activity['total_completed']
    if total_activity > 0:
        report.append(f"  Total activities: {total_activity}")
        report.append(f"  Business projects: {mt_activity['total_projects']}")
        report.append(f"  Personal tasks: {as_activity['total_created']} created, {as_activity['total_completed']} completed")
    else:
        report.append("  No activity recorded for this date")
        report.append("  💡 This could mean:")
        report.append("     - Rest day")
        report.append("     - Activity not tracked in shared memory")
        report.append("     - Working offline")
    report.append("=" * 70)

    return "\n".join(report)


def generate_weekly_report(weeks: int = 1) -> str:
    """Generate weekly progress report."""
    since_date = datetime.now() - timedelta(days=7 * weeks)

    mt_activity = get_managementteam_activity(since_date)
    as_activity = get_asksharon_activity(since_date)
    cross_activity = get_cross_system_activity(since_date)

    report = []
    report.append("=" * 70)
    report.append(f"📅 Weekly Progress Report - Last {weeks} Week(s)")
    report.append(f"   {since_date.strftime('%B %d')} - {datetime.now().strftime('%B %d, %Y')}")
    report.append("=" * 70)
    report.append("")

    # High-level stats
    report.append("📊 Overview")
    report.append("-" * 70)
    report.append(f"  Business Projects: {mt_activity['total_projects']} worked on")
    report.append(f"  Personal Tasks: {as_activity['total_created']} created, {as_activity['total_completed']} completed")
    report.append(f"  Completion Rate: {as_activity['total_completed']}/{as_activity['total_created']} ({(as_activity['total_completed'] / max(1, as_activity['total_created']) * 100):.0f}%)")
    report.append("")

    # Projects breakdown
    if mt_activity['total_projects'] > 0:
        report.append("🏢 Business Projects (ManagementTeam)")
        report.append("-" * 70)
        for project_name in mt_activity['projects_updated']:
            decisions = [d for d in mt_activity['decisions_made'] if d['project_name'] == project_name]
            latest = decisions[0]
            report.append(f"  • {project_name}")
            report.append(f"    Latest: {latest['decision'].upper()} (by {latest['agent_name']})")
            report.append(f"    Updates: {len(decisions)}")
            report.append("")

    # Tasks breakdown
    if as_activity['total_completed'] > 0:
        report.append("✅ Top Completed Tasks")
        report.append("-" * 70)
        for task in as_activity['tasks_completed'][:10]:
            title = task['title']
            project = task.get('project_reference', 'Personal')
            completed_at = datetime.fromisoformat(task['completed_at']).strftime('%b %d')
            report.append(f"  • {title}")
            report.append(f"    Project: {project} | Completed: {completed_at}")
            report.append("")

    # Project-task connections
    if len(cross_activity['project_task_links']) > 0:
        report.append("🔗 Project Progress")
        report.append("-" * 70)
        for link in cross_activity['project_task_links']:
            project = link['project']
            tasks = link['tasks']
            completed = len([t for t in tasks if t.get('completed', False)])
            total = len(tasks)
            pct = (completed / total * 100) if total > 0 else 0
            report.append(f"  • {project}: {completed}/{total} tasks ({pct:.0f}%)")
        report.append("")

    report.append("=" * 70)
    return "\n".join(report)


def generate_last_session_report() -> str:
    """Generate report since last login."""
    last_session = get_last_session_time()

    report = []
    report.append("=" * 70)

    if last_session:
        report.append(f"📅 Activity Since Last Session")
        report.append(f"   Last login: {last_session.strftime('%B %d, %Y at %H:%M')}")
        hours_since = (datetime.now() - last_session).total_seconds() / 3600
        report.append(f"   Time elapsed: {hours_since:.1f} hours")
    else:
        report.append(f"📅 Activity Since Last Session")
        report.append(f"   No previous session found (using last 24 hours)")
        last_session = datetime.now() - timedelta(days=1)

    report.append("=" * 70)
    report.append("")

    mt_activity = get_managementteam_activity(last_session)
    as_activity = get_asksharon_activity(last_session)

    # Quick summary
    total_activity = mt_activity['total_projects'] + as_activity['total_created'] + as_activity['total_completed']

    if total_activity == 0:
        report.append("ℹ️  No new activity since last session")
        report.append("")
        report.append("   You're all caught up! 🎉")
    else:
        report.append(f"📊 Quick Summary")
        report.append("-" * 70)
        report.append(f"  • {mt_activity['total_projects']} business project updates")
        report.append(f"  • {as_activity['total_created']} new tasks created")
        report.append(f"  • {as_activity['total_completed']} tasks completed")
        report.append("")

        # Show recent items
        if mt_activity['total_projects'] > 0:
            report.append("🏢 Business Projects Updated:")
            for project in mt_activity['projects_updated'][:5]:
                report.append(f"  • {project}")
            report.append("")

        if as_activity['total_completed'] > 0:
            report.append("✅ Tasks Completed:")
            for task in as_activity['tasks_completed'][:5]:
                report.append(f"  • {task['title']}")
            report.append("")

    report.append("=" * 70)

    # Update session time
    update_session_time()

    return "\n".join(report)


# ============================================
# CLI Interface
# ============================================

def main():
    parser = argparse.ArgumentParser(
        description="AskSharon.ai Progress Report Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/progress_report.py yesterday
  python scripts/progress_report.py week
  python scripts/progress_report.py last-session
  python scripts/progress_report.py --since "2025-11-10"
        """
    )

    parser.add_argument(
        "report_type",
        nargs="?",
        default="yesterday",
        choices=["yesterday", "today", "week", "last-session"],
        help="Type of report to generate"
    )

    parser.add_argument(
        "--since",
        help="Custom start date (YYYY-MM-DD)"
    )

    parser.add_argument(
        "--weeks",
        type=int,
        default=1,
        help="Number of weeks for weekly report (default: 1)"
    )

    args = parser.parse_args()

    if not SUPABASE_AVAILABLE:
        print("❌ Supabase not configured")
        print("   See: /asksharon_ai_blueprint/docs/MEMORY_QUICKSTART.md")
        sys.exit(1)

    try:
        if args.report_type == "yesterday":
            report = generate_daily_report(date.today() - timedelta(days=1))
        elif args.report_type == "today":
            report = generate_daily_report(date.today())
        elif args.report_type == "week":
            report = generate_weekly_report(args.weeks)
        elif args.report_type == "last-session":
            report = generate_last_session_report()
        elif args.since:
            target_date = datetime.strptime(args.since, "%Y-%m-%d").date()
            report = generate_daily_report(target_date)
        else:
            report = generate_daily_report()

        print(report)

    except Exception as e:
        print(f"❌ Error generating report: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
