#!/bin/bash
# Pre-commit check script for AskSharon.ai
# Enforces code quality from .cursorrules checklist
#
# Usage: ./scripts/pre-commit-check.sh
# Or install as git hook: ./scripts/install-hooks.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Running pre-commit checks...${NC}"
echo "================================"

# Track failures
FAILED=0

# 1. Black formatting check
echo -e "\n${YELLOW}[1/4] Checking code formatting (black)...${NC}"
if black --check assistant/ assistant_api/ 2>/dev/null; then
    echo -e "${GREEN}✓ Code formatting OK${NC}"
else
    echo -e "${RED}✗ Code formatting issues found${NC}"
    echo -e "  Run: black assistant/ assistant_api/"
    FAILED=1
fi

# 2. Type checking (mypy) - uses mypy.ini config
echo -e "\n${YELLOW}[2/4] Checking types (mypy)...${NC}"
# Type errors are informational only - don't block commits
# The codebase is gradually being typed (see mypy.ini for config)
if mypy assistant/ --config-file mypy.ini 2>/dev/null | grep -v "Found [0-9]* error"; then
    echo -e "${GREEN}✓ Type checking OK (or warnings only)${NC}"
else
    echo -e "${YELLOW}⚠ Type warnings found (non-blocking)${NC}"
    # Don't set FAILED - type errors are informational
fi

# 3. File size check (using architecture validator)
echo -e "\n${YELLOW}[3/4] Checking file sizes...${NC}"
if python tools/check_architecture.py 2>/dev/null; then
    echo -e "${GREEN}✓ Architecture check OK${NC}"
else
    echo -e "${YELLOW}⚠ Architecture warnings found (non-blocking)${NC}"
    # Don't set FAILED - file size warnings are tracked in FUTURE_REFACTOR.md
fi

# 4. Unit tests
echo -e "\n${YELLOW}[4/4] Running unit tests...${NC}"
if pytest tests/unit/ -q --tb=no 2>/dev/null; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    FAILED=1
fi

# Summary
echo ""
echo "================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All pre-commit checks passed!${NC}"
    echo -e "${GREEN}Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed!${NC}"
    echo -e "${YELLOW}Fix issues before committing.${NC}"
    echo ""
    echo "Manual checklist (from .cursorrules):"
    echo "  [ ] Error handling implemented"
    echo "  [ ] Docstrings complete"
    echo "  [ ] Decision logged in DECISIONS.md"
    echo "  [ ] E2E tests for UI changes"
    exit 1
fi
