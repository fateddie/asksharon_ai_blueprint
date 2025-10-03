#!/bin/bash
# =============================================================================
# CENTRALIZED ENVIRONMENT VARIABLES SETUP
# =============================================================================
# This script sets up all your API keys and environment variables
# Source this file from your shell profile: source ~/path/to/env-setup.sh

echo "🔑 Loading centralized environment variables..."

# =============================================================================
# AI/ML APIs
# =============================================================================
# export ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY_HERE"
# ↑ Commented out - Claude CLI will use claude.ai subscription instead
export OPENAI_API_KEY=""  # Add your OpenAI key here if needed
export CLAUDE_API_KEY="$ANTHROPIC_API_KEY"  # Alias for compatibility

# =============================================================================
# Database & Backend Services  
# =============================================================================
export NEXT_PUBLIC_SUPABASE_URL=""
export NEXT_PUBLIC_SUPABASE_ANON_KEY=""
export SUPABASE_SERVICE_ROLE_KEY=""

# =============================================================================
# Payment & Services
# =============================================================================
export STRIPE_SECRET_KEY=""
export STRIPE_PUBLISHABLE_KEY=""
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"

# =============================================================================
# Development & Deployment
# =============================================================================
export VERCEL_TOKEN=""
export NODE_ENV="development"

# =============================================================================
# Application Specific
# =============================================================================
# Personal Assistant App
export PERSONAL_ASSISTANT_ENV="development"
export PERSONAL_ASSISTANT_DEBUG="true"

# =============================================================================
# Claude Code Specific
# =============================================================================
export CLAUDE_CONFIG_DIR="$HOME/.config/claude-code"
export CLAUDE_BASH_NO_LOGIN="true"

echo "✅ Environment variables loaded successfully!"

# Function to show current API key status
check_apis() {
    echo "🔍 API Key Status:"
    echo "  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:20}..."
    echo "  OPENAI_API_KEY: ${OPENAI_API_KEY:-'Not set'}"
    echo "  SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-'Not set'}"
    echo "  STRIPE: ${STRIPE_SECRET_KEY:-'Not set'}"
}
