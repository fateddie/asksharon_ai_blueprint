#!/bin/bash

# Personal Assistant Startup Script
# Simple wrapper for the comprehensive Node.js startup script

echo "🚀 Personal Assistant - Smart Startup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the PersonalAssistant directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js v18+ from https://nodejs.org"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "npm should come with Node.js installation"
    exit 1
fi

# Run the comprehensive startup script
echo "🔄 Running comprehensive startup checks..."
echo ""

npm run startup