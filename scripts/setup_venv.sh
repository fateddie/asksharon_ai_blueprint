#!/bin/bash
# ==============================================
# Virtual Environment Setup Script
# ==============================================
# Automates Python virtual environment creation and dependency installation
#
# Usage:
#   ./scripts/setup_venv.sh

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🐍 Python Virtual Environment Setup${NC}"
echo "======================================"
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: python3 not found${NC}"
    echo "Please install Python 3.11+ first"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}✅ Found Python $PYTHON_VERSION${NC}"

# Check if we're in project root
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Create virtual environment
if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠️  venv/ already exists${NC}"
    read -p "Remove and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf venv
    else
        echo "Keeping existing venv/"
        exit 0
    fi
fi

echo -e "${BLUE}📦 Creating virtual environment...${NC}"
python3 -m venv venv

# Activate venv
source venv/bin/activate

# Upgrade pip
echo -e "${BLUE}⬆️  Upgrading pip...${NC}"
pip install --upgrade pip setuptools wheel -q

# Install production dependencies
echo -e "${BLUE}📦 Installing production dependencies...${NC}"
pip install -r requirements.txt

# Install development dependencies if available
if [ -f "requirements-dev.txt" ]; then
    echo -e "${BLUE}🛠️  Installing development dependencies...${NC}"
    pip install -r requirements-dev.txt
fi

# Install optional dependencies if available
if [ -f "requirements-optional.txt" ]; then
    echo -e "${BLUE}✨ Installing optional dependencies...${NC}"
    pip install -r requirements-optional.txt || echo -e "${YELLOW}⚠️  Some optional dependencies failed (OK)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Virtual environment setup complete!${NC}"
echo ""
echo "======================================"
echo "📋 Next steps:"
echo "======================================"
echo "1. Activate the environment:"
echo "   ${YELLOW}source venv/bin/activate${NC}"
echo ""
echo "2. Configure credentials:"
echo "   ${YELLOW}cp config/.env.example config/.env${NC}"
echo "   ${YELLOW}nano config/.env${NC}"
echo ""
echo "3. Run validation:"
echo "   ${YELLOW}python scripts/validate_env.py${NC}"
echo ""
echo "4. Install pre-commit hooks (optional):"
echo "   ${YELLOW}pre-commit install${NC}"
echo ""
echo "======================================"
