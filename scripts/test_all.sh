#!/bin/bash
# AskSharon.ai Test Suite
# Runs all tests and code quality checks

set -e  # Exit on error

echo "🧪 AskSharon.ai Test Suite"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Activate virtual environment if not already active
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}Activating virtual environment...${NC}"
    source .venv/bin/activate
fi

# Track failures
FAILURES=0

# 1. Code Formatting Check (Black)
echo -e "\n${YELLOW}[1/7] Running Black formatter check...${NC}"
if black --check assistant/ 2>/dev/null; then
    echo -e "${GREEN}✓ Code formatting OK${NC}"
else
    echo -e "${RED}✗ Code formatting issues found${NC}"
    echo -e "${YELLOW}  Run: black assistant/ to fix${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 2. Type Checking (Mypy)
echo -e "\n${YELLOW}[2/7] Running mypy type checks...${NC}"
if mypy assistant/ --ignore-missing-imports 2>/dev/null; then
    echo -e "${GREEN}✓ Type checks passed${NC}"
else
    echo -e "${RED}✗ Type errors found${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 3. Import Verification
echo -e "\n${YELLOW}[3/7] Verifying module imports...${NC}"
if python3 -c "
from assistant.core.orchestrator import app, publish, subscribe, load_modules
from assistant.core.scheduler import start_scheduler
from assistant.core.context_manager import store, recall
print('✓ Core imports OK')
" 2>/dev/null; then
    echo -e "${GREEN}✓ All core modules import successfully${NC}"
else
    echo -e "${RED}✗ Import errors detected${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 4. Database Schema Validation
echo -e "\n${YELLOW}[4/7] Validating database schema...${NC}"
if [ -f "assistant/data/schema.sql" ]; then
    # Count expected tables
    EXPECTED_TABLES=5
    TABLE_COUNT=$(grep -c "CREATE TABLE" assistant/data/schema.sql || echo 0)

    if [ "$TABLE_COUNT" -eq "$EXPECTED_TABLES" ]; then
        echo -e "${GREEN}✓ Schema has $TABLE_COUNT tables (expected $EXPECTED_TABLES)${NC}"
    else
        echo -e "${RED}✗ Schema has $TABLE_COUNT tables (expected $EXPECTED_TABLES)${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${RED}✗ schema.sql not found${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 5. Module Registry Validation
echo -e "\n${YELLOW}[5/7] Validating module registry...${NC}"
if python3 -c "
import yaml
with open('assistant/configs/module_registry.yaml') as f:
    registry = yaml.safe_load(f)
    modules = registry.get('modules', [])
    print(f'✓ Registry valid: {len(modules)} modules found')
    for mod in modules:
        print(f\"  - {mod['name']}: {'enabled' if mod.get('enabled') else 'disabled'}\")
" 2>/dev/null; then
    echo -e "${GREEN}✓ Module registry valid${NC}"
else
    echo -e "${RED}✗ Module registry invalid${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 6. Frontend Tests (Playwright)
echo -e "\n${YELLOW}[6/7] Running Playwright frontend tests...${NC}"
if lsof -ti :8501 > /dev/null 2>&1; then
    if python3 scripts/test_frontend.py 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend tests passed${NC}"
    else
        echo -e "${RED}✗ Frontend tests failed${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}⚠ Frontend not running - skipping (start with: ./scripts/start.sh)${NC}"
fi

# 7. Run pytest (if tests exist)
echo -e "\n${YELLOW}[7/7] Running pytest...${NC}"
if [ -d "tests" ] && [ "$(ls -A tests/*.py 2>/dev/null)" ]; then
    if pytest tests/ -v; then
        echo -e "${GREEN}✓ All tests passed${NC}"
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}⚠ No tests found (tests/ directory empty)${NC}"
fi

# Summary
echo -e "\n${GREEN}================================${NC}"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILURES check(s) failed${NC}"
    exit 1
fi
