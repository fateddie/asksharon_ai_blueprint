"""
BIL Configuration
=================
Database engine and feature flags for behavioral intelligence.
"""

import os
import sys
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
from datetime import datetime
from sqlalchemy import create_engine

# Database connection
DB_PATH = os.getenv("DATABASE_URL", "sqlite:///assistant/data/memory.db")
engine = create_engine(DB_PATH.replace("sqlite:///", "sqlite:///"))

# Type declarations for optional imports
_get_supabase_client: Optional[Callable[[], Any]]
get_tasks_for_project: Optional[Callable[[str, bool], List[Dict[Any, Any]]]]
get_managementteam_activity: Optional[Callable[[datetime], Dict[str, Any]]]
get_asksharon_activity: Optional[Callable[[datetime], Dict[str, Any]]]

# Import Supabase memory for ManagementTeam project integration
try:
    from assistant.core.supabase_memory import (
        _get_supabase_client as _supabase_client_func,
        get_tasks_for_project as get_tasks_func,
        DEPENDENCIES_AVAILABLE,
    )

    _get_supabase_client = _supabase_client_func
    get_tasks_for_project = get_tasks_func
    SUPABASE_AVAILABLE = DEPENDENCIES_AVAILABLE
except ImportError:
    SUPABASE_AVAILABLE = False
    _get_supabase_client = None
    get_tasks_for_project = None
    print(
        "⚠️  Supabase memory not available - ManagementTeam projects won't be shown in morning check-in"
    )

# Import progress report functions for daily summaries
try:
    # Add scripts directory to path
    PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
    sys.path.insert(0, str(PROJECT_ROOT))
    from scripts.progress_report import (
        get_managementteam_activity as get_mt_activity,
        get_asksharon_activity as get_as_activity,
    )

    get_managementteam_activity = get_mt_activity
    get_asksharon_activity = get_as_activity
    PROGRESS_REPORTS_AVAILABLE = True
except ImportError:
    PROGRESS_REPORTS_AVAILABLE = False
    get_managementteam_activity = None
    get_asksharon_activity = None
