#!/bin/bash
# AskSharon.ai - Stop All Services
# Cleanly shut down all 3 services

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

# Stop orchestrator (port 8000)
ORCHESTRATOR_PID=$(lsof -ti :8000 || echo "")
if [ -n "$ORCHESTRATOR_PID" ]; then
    echo -e "\n${YELLOW}Stopping orchestrator (PID: $ORCHESTRATOR_PID)...${NC}"
    kill $ORCHESTRATOR_PID 2>/dev/null
    sleep 1
    if lsof -ti :8000 > /dev/null 2>&1; then
        kill -9 $ORCHESTRATOR_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ Orchestrator stopped${NC}"
    STOPPED=1
else
    echo -e "\n${YELLOW}⚠ Orchestrator not running on port 8000${NC}"
fi

# Stop Assistant API (port 8002)
API_PID=$(lsof -ti :8002 || echo "")
if [ -n "$API_PID" ]; then
    echo -e "\n${YELLOW}Stopping Assistant API (PID: $API_PID)...${NC}"
    kill $API_PID 2>/dev/null
    sleep 1
    if lsof -ti :8002 > /dev/null 2>&1; then
        kill -9 $API_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ Assistant API stopped${NC}"
    STOPPED=1
else
    echo -e "\n${YELLOW}⚠ Assistant API not running on port 8002${NC}"
fi

# Stop frontend (port 8501)
FRONTEND_PID=$(lsof -ti :8501 || echo "")
if [ -n "$FRONTEND_PID" ]; then
    echo -e "\n${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID 2>/dev/null
    sleep 1
    if lsof -ti :8501 > /dev/null 2>&1; then
        kill -9 $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ Frontend stopped${NC}"
    STOPPED=1
else
    echo -e "\n${YELLOW}⚠ Frontend not running on port 8501${NC}"
fi

# Clean up PID files
rm -f logs/orchestrator.pid logs/assistant_api.pid logs/frontend.pid logs/backend.pid 2>/dev/null

echo -e "\n${BLUE}================================${NC}"
if [ $STOPPED -eq 1 ]; then
    echo -e "${GREEN}✓ All services stopped${NC}"
else
    echo -e "${YELLOW}⚠ No services were running${NC}"
fi
echo -e "${BLUE}================================${NC}"
echo ""
