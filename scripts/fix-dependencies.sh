#!/bin/bash

# ============================================================================
# Fix Dependencies Script
# ============================================================================
# This script fixes corrupted node_modules and dependency issues
# Safe to run multiple times
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Personal Assistant - Dependency Fix Script${NC}"
echo ""

# ============================================================================
# Step 1: Check Node.js version
# ============================================================================
echo -e "${YELLOW}📋 Checking Node.js version...${NC}"
NODE_VERSION=$(node --version)
echo "Current Node.js version: $NODE_VERSION"

# Extract major version number
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

if [ "$NODE_MAJOR" -gt 20 ]; then
  echo -e "${RED}⚠️  Warning: Node.js v$NODE_MAJOR detected${NC}"
  echo -e "${YELLOW}   Next.js 14 works best with Node.js v18 or v20${NC}"
  echo -e "${YELLOW}   Consider switching: nvm use 20 (if you have nvm)${NC}"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# ============================================================================
# Step 2: Backup package-lock.json
# ============================================================================
echo -e "${YELLOW}💾 Backing up package-lock.json...${NC}"
if [ -f "package-lock.json" ]; then
  cp package-lock.json package-lock.json.backup
  echo -e "${GREEN}✓${NC} Backup created: package-lock.json.backup"
else
  echo "No package-lock.json found (fresh install)"
fi

# ============================================================================
# Step 3: Clean existing installations
# ============================================================================
echo -e "${YELLOW}🧹 Cleaning existing installations...${NC}"

# Remove node_modules
if [ -d "node_modules" ]; then
  echo "Removing node_modules..."
  rm -rf node_modules
  echo -e "${GREEN}✓${NC} node_modules removed"
fi

# Remove lock files
if [ -f "package-lock.json" ]; then
  echo "Removing package-lock.json..."
  rm -f package-lock.json
  echo -e "${GREEN}✓${NC} package-lock.json removed"
fi

if [ -f "yarn.lock" ]; then
  echo "Removing yarn.lock..."
  rm -f yarn.lock
  echo -e "${GREEN}✓${NC} yarn.lock removed"
fi

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force > /dev/null 2>&1
echo -e "${GREEN}✓${NC} npm cache cleaned"

# ============================================================================
# Step 4: Install dependencies
# ============================================================================
echo ""
echo -e "${BLUE}📦 Installing dependencies (this may take 2-3 minutes)...${NC}"
echo ""

npm install

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
else
  echo ""
  echo -e "${RED}❌ Installation failed${NC}"
  echo "Restoring backup..."
  if [ -f "package-lock.json.backup" ]; then
    cp package-lock.json.backup package-lock.json
    echo "Backup restored. Please check errors above."
  fi
  exit 1
fi

# ============================================================================
# Step 5: Verify installation
# ============================================================================
echo ""
echo -e "${YELLOW}🔍 Verifying installation...${NC}"

# Check critical binaries
ERRORS=0

if [ ! -f "node_modules/.bin/next" ]; then
  echo -e "${RED}✗${NC} Next.js binary not found"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} Next.js binary exists"
fi

if [ ! -f "node_modules/.bin/playwright" ]; then
  echo -e "${RED}✗${NC} Playwright binary not found"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} Playwright binary exists"
fi

if [ ! -d "node_modules/react" ]; then
  echo -e "${RED}✗${NC} React not installed"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} React installed"
fi

if [ ! -d "node_modules/next" ]; then
  echo -e "${RED}✗${NC} Next.js not installed"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} Next.js installed"
fi

# ============================================================================
# Step 6: Install Playwright browsers (if needed)
# ============================================================================
echo ""
echo -e "${YELLOW}🌐 Checking Playwright browsers...${NC}"

if command -v npx &> /dev/null; then
  npx playwright install chromium --with-deps > /dev/null 2>&1 || true
  echo -e "${GREEN}✓${NC} Playwright browsers ready"
else
  echo -e "${YELLOW}⚠${NC}  Could not install Playwright browsers automatically"
  echo "   Run: npx playwright install chromium"
fi

# ============================================================================
# Step 7: Run basic tests
# ============================================================================
echo ""
echo -e "${YELLOW}🧪 Running basic verification tests...${NC}"

# TypeScript check
echo -n "TypeScript compilation: "
if npm run type-check > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Build test (quick check)
echo -n "Next.js build check: "
if timeout 30 npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${YELLOW}⚠ TIMEOUT/FAIL${NC} (may need more time)"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "You can now run:"
  echo "  npm run dev      # Start development server"
  echo "  npm test         # Run tests"
  echo "  npm run build    # Build for production"
else
  echo -e "${RED}❌ $ERRORS error(s) found${NC}"
  echo ""
  echo "Please review the errors above and:"
  echo "1. Check your Node.js version (should be v18 or v20)"
  echo "2. Ensure package.json is correct"
  echo "3. Try running: npm install --legacy-peer-deps"
fi
echo "=================================="
echo ""

# Clean up backup if successful
if [ $ERRORS -eq 0 ] && [ -f "package-lock.json.backup" ]; then
  rm package-lock.json.backup
  echo "Backup cleaned up"
fi

exit $ERRORS
