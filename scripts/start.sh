#!/bin/bash
# AskSharon.ai - Start All Services
# Central startup script for backend + frontend

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Project root
cd "$(dirname "$0")/.."

echo -e "${BLUE}🚀 Starting AskSharon.ai${NC}"
echo -e "${BLUE}================================${NC}"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${RED}✗ Virtual environment not found${NC}"
    echo -e "${YELLOW}  Run: ./scripts/setup.sh first${NC}"
    exit 1
fi

# Check if processes are already running
BACKEND_PID=$(lsof -ti :8000 || echo "")
FRONTEND_PID=$(lsof -ti :8501 || echo "")

if [ -n "$BACKEND_PID" ]; then
    echo -e "${YELLOW}⚠ Backend already running on port 8000 (PID: $BACKEND_PID)${NC}"
    echo -e "${YELLOW}  Run: ./scripts/stop.sh to stop existing services${NC}"
    exit 1
fi

if [ -n "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}⚠ Frontend already running on port 8501 (PID: $FRONTEND_PID)${NC}"
    echo -e "${YELLOW}  Run: ./scripts/stop.sh to stop existing services${NC}"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Activate virtual environment and start backend
echo -e "\n${YELLOW}[1/2] Starting FastAPI backend on port 8000...${NC}"
source .venv/bin/activate
nohup uvicorn assistant.core.orchestrator:app --host 0.0.0.0 --port 8000 > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > logs/backend.pid
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
sleep 2
if ! lsof -ti :8000 > /dev/null; then
    echo -e "${RED}✗ Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# Start frontend
echo -e "\n${YELLOW}[2/2] Starting Streamlit frontend on port 8501...${NC}"
nohup streamlit run assistant/modules/voice/main.py --server.port 8501 --server.headless true > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to be ready
sleep 3
if ! lsof -ti :8501 > /dev/null; then
    echo -e "${RED}✗ Frontend failed to start. Check logs/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Success summary
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ All services running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📡 Access Points:${NC}"
echo -e "  • Backend API:  ${GREEN}http://localhost:8000${NC}"
echo -e "  • API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  • Frontend UI:  ${GREEN}http://localhost:8501${NC}"
echo ""
echo -e "${BLUE}📊 Process IDs:${NC}"
echo -e "  • Backend:  $BACKEND_PID"
echo -e "  • Frontend: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "  • Backend:  logs/backend.log"
echo -e "  • Frontend: logs/frontend.log"
echo ""
echo -e "${YELLOW}To stop services: ./scripts/stop.sh${NC}"
echo -e "${YELLOW}To view logs: tail -f logs/backend.log${NC}"
echo ""
