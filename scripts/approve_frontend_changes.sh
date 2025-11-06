#!/bin/bash
# AskSharon.ai - Approve Frontend Changes
# Updates baseline screenshot when UI is intentionally changed

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Project root
cd "$(dirname "$0")/.."

echo -e "${BLUE}📸 Frontend Baseline Approval${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if frontend is running
if ! lsof -ti :8501 > /dev/null 2>&1; then
    echo -e "${RED}✗ Frontend not running on port 8501${NC}"
    echo -e "${YELLOW}  Start services: ./scripts/start.sh${NC}"
    exit 1
fi

# Find most recent screenshot in failures/
LATEST_SCREENSHOT=$(ls -t tests/failures/frontend_*.png 2>/dev/null | head -1)

if [ -z "$LATEST_SCREENSHOT" ]; then
    echo -e "${YELLOW}⚠ No recent screenshots found in tests/failures/${NC}"
    echo -e "${YELLOW}  Run frontend tests first: python scripts/test_frontend.py${NC}"
    exit 1
fi

BASELINE="tests/baselines/frontend_baseline.png"
BACKUP="tests/baselines/frontend_baseline_backup_$(date +%Y%m%d_%H%M%S).png"

echo -e "${YELLOW}Current baseline: $BASELINE${NC}"
echo -e "${YELLOW}Latest screenshot: $LATEST_SCREENSHOT${NC}"
echo ""

# Show comparison info
if [ -f "$BASELINE" ]; then
    BASELINE_SIZE=$(du -h "$BASELINE" | cut -f1)
    NEW_SIZE=$(du -h "$LATEST_SCREENSHOT" | cut -f1)
    echo -e "${BLUE}Baseline size: ${BASELINE_SIZE}${NC}"
    echo -e "${BLUE}New size: ${NEW_SIZE}${NC}"
    echo ""
fi

# Confirmation
echo -e "${YELLOW}This will:${NC}"
if [ -f "$BASELINE" ]; then
    echo -e "  1. Backup current baseline to: $BACKUP"
    echo -e "  2. Replace baseline with latest screenshot"
else
    echo -e "  1. Create new baseline from latest screenshot"
fi
echo ""

read -p "Approve these changes? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}⚠ Approval cancelled${NC}"
    exit 0
fi

# Backup existing baseline
if [ -f "$BASELINE" ]; then
    echo -e "${YELLOW}Creating backup...${NC}"
    cp "$BASELINE" "$BACKUP"
    echo -e "${GREEN}✓ Backup created: $BACKUP${NC}"
fi

# Update baseline
echo -e "${YELLOW}Updating baseline...${NC}"
cp "$LATEST_SCREENSHOT" "$BASELINE"
echo -e "${GREEN}✓ Baseline updated: $BASELINE${NC}"

# Clean up failures directory
echo -e "${YELLOW}Cleaning up test failures...${NC}"
rm -f tests/failures/frontend_*.png
rm -f tests/diffs/frontend_diff_*.png
echo -e "${GREEN}✓ Cleaned up old screenshots${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Frontend baseline approved${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Run tests to verify: python scripts/test_frontend.py"
echo -e "  2. Commit baseline: git add tests/baselines/ && git commit -m 'Update frontend baseline'"
echo ""
