#!/bin/bash

# ============================================================================
# Pre-Commit Quality Gate Script
# ============================================================================
# This script runs before each git commit to ensure code quality
# Based on .claude/quality-gates.yaml configuration
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Running pre-commit quality gates..."
echo ""

# Track if any checks fail
FAILED=0

# ============================================================================
# 1. TypeScript Compilation
# ============================================================================
echo "📝 Checking TypeScript compilation..."
if npm run type-check > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} TypeScript compilation passed"
else
  echo -e "${RED}✗${NC} TypeScript compilation failed"
  echo "   Run 'npm run type-check' to see errors"
  FAILED=1
fi

# ============================================================================
# 2. ESLint
# ============================================================================
echo "🔎 Running ESLint..."
if npm run lint > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} ESLint passed"
else
  echo -e "${RED}✗${NC} ESLint found errors"
  echo "   Run 'npm run lint' to see errors"
  FAILED=1
fi

# ============================================================================
# 3. Check for console.log statements (Warning only)
# ============================================================================
echo "🔍 Checking for console.log statements..."
if grep -r "console\.log" src --exclude-dir=node_modules --exclude="logger.ts" -q 2>/dev/null; then
  echo -e "${YELLOW}⚠${NC}  Found console.log statements (should use logger instead)"
  echo "   This is a warning, not blocking commit"
else
  echo -e "${GREEN}✓${NC} No console.log statements found"
fi

# ============================================================================
# 4. Check for hardcoded secrets
# ============================================================================
echo "🔒 Checking for hardcoded secrets..."
if grep -rE "(sk-|pk_live_|ghp_|gho_|AIza)" src --exclude-dir=node_modules -q 2>/dev/null; then
  echo -e "${RED}✗${NC} Potential hardcoded secrets detected!"
  echo "   NEVER commit API keys or secrets"
  FAILED=1
else
  echo -e "${GREEN}✓${NC} No hardcoded secrets found"
fi

# ============================================================================
# 5. Check for TODO/FIXME comments (Warning only)
# ============================================================================
echo "📝 Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME" src --exclude-dir=node_modules 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠${NC}  Found $TODO_COUNT TODO/FIXME comments"
  echo "   Consider addressing these before committing"
else
  echo -e "${GREEN}✓${NC} No TODO/FIXME comments found"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=================================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All pre-commit checks passed!${NC}"
  echo "=================================="
  exit 0
else
  echo -e "${RED}❌ Some pre-commit checks failed${NC}"
  echo "=================================="
  echo ""
  echo "Please fix the errors above before committing."
  echo "To bypass these checks (not recommended):"
  echo "  git commit --no-verify"
  echo ""
  exit 1
fi
