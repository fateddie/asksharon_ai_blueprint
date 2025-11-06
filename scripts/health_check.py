#!/usr/bin/env python3
"""
AskSharon.ai Health Check Script
=================================
Verifies system health and module status
"""

import sys
import os
from pathlib import Path
import importlib
import yaml
import sqlite3

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Colors for terminal output
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'  # No Color

def print_status(check_name: str, passed: bool, message: str = ""):
    """Print check status with colors"""
    status = f"{GREEN}✓{NC}" if passed else f"{RED}✗{NC}"
    print(f"{status} {check_name}", end="")
    if message:
        print(f" - {message}", end="")
    print()
    return passed

def check_python_version():
    """Verify Python version >= 3.8"""
    version = sys.version_info
    passed = version >= (3, 8)
    msg = f"Python {version.major}.{version.minor}.{version.micro}"
    return print_status("Python Version", passed, msg)

def check_dependencies():
    """Check if all required packages are installed"""
    required = [
        'fastapi',
        'uvicorn',
        'streamlit',
        'sqlalchemy',
        'faiss',
        'numpy',
        'openai',
        'schedule',
        'pydantic',
        'yaml'
    ]

    missing = []
    for package in required:
        try:
            importlib.import_module(package)
        except ImportError:
            missing.append(package)

    passed = len(missing) == 0
    msg = f"{len(required) - len(missing)}/{len(required)} packages installed"
    if missing:
        msg += f" (missing: {', '.join(missing)})"

    return print_status("Dependencies", passed, msg)

def check_core_modules():
    """Verify core modules can be imported"""
    try:
        from assistant.core.orchestrator import app, publish, subscribe
        from assistant.core.scheduler import start_scheduler
        from assistant.core.context_manager import store, recall
        return print_status("Core Modules", True, "All imports successful")
    except Exception as e:
        return print_status("Core Modules", False, f"Import error: {e}")

def check_module_registry():
    """Validate module registry YAML"""
    try:
        with open('assistant/configs/module_registry.yaml') as f:
            registry = yaml.safe_load(f)
            modules = registry.get('modules', [])
            enabled_count = sum(1 for m in modules if m.get('enabled'))
            msg = f"{enabled_count}/{len(modules)} modules enabled"
            return print_status("Module Registry", True, msg)
    except Exception as e:
        return print_status("Module Registry", False, f"Error: {e}")

def check_database():
    """Verify database exists and has correct schema"""
    db_path = 'assistant/data/memory.db'

    if not os.path.exists(db_path):
        return print_status("Database", False, f"{db_path} not found")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get table list
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]

        expected_tables = ['memory', 'tasks', 'emails', 'goals', 'behaviour_metrics']
        missing_tables = [t for t in expected_tables if t not in tables]

        conn.close()

        if missing_tables:
            msg = f"Missing tables: {', '.join(missing_tables)}"
            return print_status("Database", False, msg)
        else:
            msg = f"{len(tables)} tables found"
            return print_status("Database", True, msg)

    except Exception as e:
        return print_status("Database", False, f"Error: {e}")

def check_file_structure():
    """Verify key files exist"""
    required_files = [
        'README.md',
        'requirements.txt',
        '.cursorrules',
        'claude.md',
        'assistant/core/orchestrator.py',
        'assistant/core/scheduler.py',
        'assistant/core/context_manager.py',
        'assistant/configs/module_registry.yaml',
        'assistant/data/schema.sql',
        'planning/progress.yaml',
        'docs/system_design_blueprint.md'
    ]

    missing = [f for f in required_files if not os.path.exists(f)]

    passed = len(missing) == 0
    msg = f"{len(required_files) - len(missing)}/{len(required_files)} files present"

    if missing:
        msg += f"\n  Missing: {', '.join(missing[:3])}"
        if len(missing) > 3:
            msg += f" and {len(missing) - 3} more"

    return print_status("File Structure", passed, msg)

def check_phase_status():
    """Check current phase status"""
    try:
        with open('planning/progress.yaml') as f:
            progress = yaml.safe_load(f)

            phases = {
                'phase_1_mvp': progress.get('phase_1_mvp', {}).get('status', 'unknown'),
                'phase_2_behaviour': progress.get('phase_2_behaviour', {}).get('status', 'unknown'),
                'phase_3_planner': progress.get('phase_3_planner', {}).get('status', 'unknown'),
                'phase_4_fitness': progress.get('phase_4_fitness', {}).get('status', 'unknown'),
                'phase_5_expansion': progress.get('phase_5_expansion', {}).get('status', 'unknown')
            }

            current_phase = next((k for k, v in phases.items() if v == 'not_started'), 'phase_1_mvp')
            msg = f"Current: {current_phase.replace('_', ' ').title()}"
            return print_status("Phase Status", True, msg)

    except Exception as e:
        return print_status("Phase Status", False, f"Error: {e}")

def main():
    """Run all health checks"""
    print("🏥 AskSharon.ai Health Check")
    print("=" * 40)
    print()

    # Change to project root
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)

    checks_passed = 0
    total_checks = 7

    # Run all checks
    checks_passed += check_python_version()
    checks_passed += check_dependencies()
    checks_passed += check_core_modules()
    checks_passed += check_module_registry()
    checks_passed += check_database()
    checks_passed += check_file_structure()
    checks_passed += check_phase_status()

    # Summary
    print()
    print("=" * 40)

    if checks_passed == total_checks:
        print(f"{GREEN}✓ All checks passed ({checks_passed}/{total_checks}){NC}")
        print(f"\n{GREEN}System is healthy! 🎉{NC}")
        return 0
    else:
        print(f"{RED}✗ {total_checks - checks_passed} check(s) failed ({checks_passed}/{total_checks}){NC}")
        print(f"\n{YELLOW}Please fix the issues above before proceeding.{NC}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
