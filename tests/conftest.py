"""
Test Configuration - Shared fixtures and path setup

This conftest.py ensures the project root is in PYTHONPATH
so tests can import from assistant/ and assistant_api/.
"""

import sys
from pathlib import Path

# Add project root to Python path
PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
