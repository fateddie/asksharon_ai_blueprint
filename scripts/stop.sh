#!/bin/bash
# AskSharon.ai - Stop All Services
# Cleanly shut down backend + frontend

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Project root
cd "$(dirname "$0")/.."

echo -e "${BLUE}🛑 Stopping AskSharon.ai Services${NC}"
echo -e "${BLUE}================================${NC}"

STOPPED=0

# Stop backend (port 8000)
BACKEND_PID=$(lsof -ti :8000 || echo "")
if [ -n "$BACKEND_PID" ]; then
    echo -e "\n${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID 2>/dev/null
    sleep 1

    # Force kill if still running
    if lsof -ti :8000 > /dev/null 2>&1; then
        echo -e "${YELLOW}Force killing backend...${NC}"
        kill -9 $BACKEND_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ Backend stopped${NC}"
    STOPPED=1
else
    echo -e "\n${YELLOW}⚠ Backend not running on port 8000${NC}"
fi

# Stop frontend (port 8501)
FRONTEND_PID=$(lsof -ti :8501 || echo "")
if [ -n "$FRONTEND_PID" ]; then
    echo -e "\n${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID 2>/dev/null
    sleep 1

    # Force kill if still running
    if lsof -ti :8501 > /dev/null 2>&1; then
        echo -e "${YELLOW}Force killing frontend...${NC}"
        kill -9 $FRONTEND_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ Frontend stopped${NC}"
    STOPPED=1
else
    echo -e "\n${YELLOW}⚠ Frontend not running on port 8501${NC}"
fi

# Clean up PID files
rm -f logs/backend.pid logs/frontend.pid 2>/dev/null

echo -e "\n${BLUE}================================${NC}"
if [ $STOPPED -eq 1 ]; then
    echo -e "${GREEN}✓ All services stopped${NC}"
else
    echo -e "${YELLOW}⚠ No services were running${NC}"
fi
echo -e "${BLUE}================================${NC}"
echo ""
