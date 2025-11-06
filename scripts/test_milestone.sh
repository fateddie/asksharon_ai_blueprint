#!/bin/bash
# AskSharon.ai - Milestone Testing Script
# Comprehensive verification before marking a phase complete

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Project root
cd "$(dirname "$0")/.."

echo -e "${BLUE}🎯 AskSharon.ai Milestone Testing${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""
echo -e "${YELLOW}This script runs comprehensive tests before milestone completion.${NC}"
echo ""

# Track overall status
TOTAL_CHECKS=0
PASSED_CHECKS=0

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 1. System Health Check
log_section "📊 1/5: System Health Check"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if python scripts/health_check.py; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗ Health check failed${NC}"
fi

# 2. Code Quality Tests
log_section "🧪 2/5: Code Quality & Tests"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if ./scripts/test_all.sh; then
    echo -e "${GREEN}✓ All tests passed${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

# 3. API Endpoint Verification
log_section "📡 3/5: API Endpoint Verification"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check if backend is running
if ! lsof -ti :8000 > /dev/null 2>&1; then
    echo -e "${RED}✗ Backend not running - start with: ./scripts/start.sh${NC}"
else
    API_PASSED=0
    API_TOTAL=0

    # Test memory endpoint
    API_TOTAL=$((API_TOTAL + 1))
    if curl -s -X POST http://localhost:8000/memory/add \
        -H "Content-Type: application/json" \
        -d '{"content":"Milestone test"}' | grep -q "stored"; then
        echo -e "${GREEN}✓ POST /memory/add${NC}"
        API_PASSED=$((API_PASSED + 1))
    else
        echo -e "${RED}✗ POST /memory/add${NC}"
    fi

    # Test tasks endpoint
    API_TOTAL=$((API_TOTAL + 1))
    if curl -s -X POST http://localhost:8000/tasks/add \
        -H "Content-Type: application/json" \
        -d '{"title":"Test","urgency":5,"importance":5,"effort":1}' | grep -q "added"; then
        echo -e "${GREEN}✓ POST /tasks/add${NC}"
        API_PASSED=$((API_PASSED + 1))
    else
        echo -e "${RED}✗ POST /tasks/add${NC}"
    fi

    # Test tasks list
    API_TOTAL=$((API_TOTAL + 1))
    if curl -s http://localhost:8000/tasks/list | grep -q "prioritised_tasks"; then
        echo -e "${GREEN}✓ GET /tasks/list${NC}"
        API_PASSED=$((API_PASSED + 1))
    else
        echo -e "${RED}✗ GET /tasks/list${NC}"
    fi

    # Test email stub
    API_TOTAL=$((API_TOTAL + 1))
    if curl -s http://localhost:8000/emails/summarise | grep -q "summary"; then
        echo -e "${GREEN}✓ GET /emails/summarise${NC}"
        API_PASSED=$((API_PASSED + 1))
    else
        echo -e "${RED}✗ GET /emails/summarise${NC}"
    fi

    if [ $API_PASSED -eq $API_TOTAL ]; then
        echo -e "${GREEN}✓ API endpoints verified ($API_PASSED/$API_TOTAL)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ API endpoints failed ($API_PASSED/$API_TOTAL)${NC}"
    fi
fi

# 4. Frontend Verification
log_section "🌐 4/5: Frontend Verification"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if lsof -ti :8501 > /dev/null 2>&1; then
    if python scripts/test_frontend.py; then
        echo -e "${GREEN}✓ Frontend tests passed${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ Frontend tests failed${NC}"
    fi
else
    echo -e "${RED}✗ Frontend not running - start with: ./scripts/start.sh${NC}"
fi

# 5. Documentation Check
log_section "📚 5/5: Documentation Check"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

DOC_PASSED=0
DOC_TOTAL=0

DOC_FILES=(
    "README.md"
    "DEVELOPER_ONBOARDING.md"
    "docs/system_design_blueprint.md"
    "docs/IMPLEMENTATION_CONTROL_PLAN.md"
    "planning/progress.yaml"
    "scripts/README.md"
)

for doc in "${DOC_FILES[@]}"; do
    DOC_TOTAL=$((DOC_TOTAL + 1))
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓ $doc${NC}"
        DOC_PASSED=$((DOC_PASSED + 1))
    else
        echo -e "${RED}✗ $doc (missing)${NC}"
    fi
done

if [ $DOC_PASSED -eq $DOC_TOTAL ]; then
    echo -e "${GREEN}✓ Documentation complete ($DOC_PASSED/$DOC_TOTAL)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠ Documentation incomplete ($DOC_PASSED/$DOC_TOTAL)${NC}"
fi

# Final Summary
log_section "📋 Milestone Test Summary"

echo ""
echo -e "${BLUE}Results: $PASSED_CHECKS/$TOTAL_CHECKS sections passed${NC}"
echo ""

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ MILESTONE READY FOR COMPLETION${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Review acceptance tests in planning/phase_*/acceptance_tests.md"
    echo -e "  2. Update planning/progress.yaml phase status to 'completed'"
    echo -e "  3. Document any decisions in docs/DECISIONS.md"
    echo -e "  4. Commit changes: git add . && git commit -m 'Complete Phase X'"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ MILESTONE NOT READY${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Failed checks: $((TOTAL_CHECKS - PASSED_CHECKS))${NC}"
    echo -e "${YELLOW}Please fix issues above before marking milestone complete.${NC}"
    echo ""
    exit 1
fi
