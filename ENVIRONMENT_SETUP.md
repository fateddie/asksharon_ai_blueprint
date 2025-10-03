# Centralized Environment Variables Setup

## Overview

This guide shows you how to centralize all your API keys and environment variables so they're accessible to all applications without duplication.

## Method 1: Shell Profile (Recommended for CLI tools)

### 1. Add to your ~/.zshrc file:

```bash
# Source centralized environment variables
source ~/Documents/ClaudeCode/PersonalAssistant/env-setup.sh
```

### 2. Reload your shell:

```bash
source ~/.zshrc
```

### 3. Test it works:

```bash
echo $ANTHROPIC_API_KEY
claude auth status
```

## Method 2: Project .env files (For web apps)

### 1. Create `.env.local` in your Next.js project:

```bash
cp .env.example .env.local
```

### 2. Edit `.env.local` with your actual values:

```bash
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# ... etc
```

## Method 3: Global .env file (Cross-platform)

### 1. Create ~/.env file:

```bash
# Create global env file
touch ~/.env
```

### 2. Add to ~/.zshrc:

```bash
# Load global environment variables
if [ -f ~/.env ]; then
    export $(cat ~/.env | grep -v '^#' | xargs)
fi
```

## Access Patterns

### From CLI tools:

- Variables are automatically available: `$ANTHROPIC_API_KEY`

### From Next.js:

- Use `.env.local` file (automatically loaded)
- Access with `process.env.ANTHROPIC_API_KEY`

### From Node.js scripts:

```javascript
// Load environment variables
require("dotenv").config({ path: ".env.local" });
const apiKey = process.env.ANTHROPIC_API_KEY;
```

### From Python scripts:

```python
import os
from dotenv import load_dotenv

load_dotenv('.env.local')
api_key = os.getenv('ANTHROPIC_API_KEY')
```

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore:

```
.env
.env.local
.env.production
```

2. **Use different files for different environments**:

- `.env.local` - Development
- `.env.production` - Production
- `.env.example` - Template (safe to commit)

3. **Rotate keys regularly** and update in one central location

## Quick Setup Commands

Run these commands to set everything up:

```bash
# 1. Make the setup script executable
chmod +x ~/Documents/ClaudeCode/PersonalAssistant/env-setup.sh

# 2. Add to your shell profile
echo 'source ~/Documents/ClaudeCode/PersonalAssistant/env-setup.sh' >> ~/.zshrc

# 3. Reload shell
source ~/.zshrc

# 4. Test
check_apis  # Function from env-setup.sh
claude auth status
```

## Benefits

✅ **Single source of truth** - All keys in one place  
✅ **No duplication** - Reuse across projects  
✅ **Easy updates** - Change once, affects everywhere  
✅ **Consistent access** - Same variables everywhere  
✅ **Secure** - Centralized security management
