#!/bin/bash
# ==============================================
# Complete Project Setup Script
# ==============================================
# Runs all setup steps for a new development environment
#
# Usage:
#   ./scripts/setup.sh

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Complete Project Setup             ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if we're in project root
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Virtual Environment
echo -e "${BLUE}[1/5] 🐍 Setting up virtual environment...${NC}"
if [ -f "scripts/setup_venv.sh" ]; then
    ./scripts/setup_venv.sh
else
    echo -e "${YELLOW}⚠️  setup_venv.sh not found, creating venv manually...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip -q
    pip install -r requirements.txt
    [ -f "requirements-dev.txt" ] && pip install -r requirements-dev.txt
fi

# Activate venv for remaining steps
source venv/bin/activate

# Step 2: Environment Configuration
echo ""
echo -e "${BLUE}[2/5] 🔐 Setting up environment configuration...${NC}"
if [ ! -f "config/.env" ]; then
    if [ -f "config/.env.example" ]; then
        cp config/.env.example config/.env
        echo -e "${GREEN}✅ Created config/.env from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit config/.env with your credentials${NC}"
    else
        echo -e "${YELLOW}⚠️  config/.env.example not found, skipping${NC}"
    fi
else
    echo -e "${GREEN}✅ config/.env already exists${NC}"
fi

# Step 3: Pre-commit Hooks
echo ""
echo -e "${BLUE}[3/5] 🔗 Installing pre-commit hooks...${NC}"
if command -v pre-commit &> /dev/null; then
    if [ -f ".pre-commit-config.yaml" ]; then
        pre-commit install
        echo -e "${GREEN}✅ Pre-commit hooks installed${NC}"
    else
        echo -e "${YELLOW}⚠️  .pre-commit-config.yaml not found, skipping${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  pre-commit not installed, skipping${NC}"
    echo "   Install with: pip install pre-commit"
fi

# Step 4: Create necessary directories
echo ""
echo -e "${BLUE}[4/5] 📁 Creating project directories...${NC}"
mkdir -p logs data/{raw,processed,cache} outputs
echo -e "${GREEN}✅ Directories created${NC}"

# Step 5: Validate setup
echo ""
echo -e "${BLUE}[5/5] ✅ Validating setup...${NC}"
if [ -f "scripts/validate_env.py" ]; then
    python scripts/validate_env.py
else
    echo -e "${YELLOW}⚠️  validate_env.py not found, skipping validation${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Setup Complete!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "======================================"
echo "📋 Next steps:"
echo "======================================"
echo "1. Activate environment:"
echo "   ${YELLOW}source venv/bin/activate${NC}"
echo ""
echo "2. Configure credentials (if not done):"
echo "   ${YELLOW}nano config/.env${NC}"
echo ""
echo "3. Run your application:"
echo "   ${YELLOW}python src/main.py${NC}"
echo ""
echo "4. Run tests:"
echo "   ${YELLOW}pytest${NC}"
echo ""
echo "5. Format code:"
echo "   ${YELLOW}black .${NC}"
echo "   ${YELLOW}ruff check --fix .${NC}"
echo ""
echo "======================================"
