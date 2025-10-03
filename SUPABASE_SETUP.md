# 🗄️ Supabase Database Setup Guide

## Quick Start (5 minutes)

### 1. Create Supabase Project

1. **Open [supabase.com](https://supabase.com)** in a new tab
2. **Sign up/Sign in** (GitHub login is fastest)
3. **Click "New Project"**
4. **Fill out:**
   ```
   Organization: [Create new or select existing]
   Name: ¸
   Database Password: [Generate strong password - SAVE THIS!]
   Region: [Choose closest to you]
   ```
5. **Click "Create new project"** ⏱️ (~2 minutes)

### 2. Get Your Credentials

Once project is ready (green "Active" status):

1. **Go to Settings** → **API** (in left sidebar)
2. **Copy these 3 values:**
   - **Project URL**: `https://coxnsvusaxfniqivhlar.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveG5zdnVzYXhmbmlxaXZobGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzc1ODAsImV4cCI6MjA3NDY1MzU4MH0.FbkvfR2e8UqS_oluVAERSrgC79NGJDtqXTESoeotWW8` (public, safe to expose)
   - **Service Role Key**: `eyJhbGc...` (click "Reveal" - keep secret!)

### 3. Update Environment File

**Replace the placeholder values in `.env.local`:**

```env
# Replace with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional - for future AI features
OPENAI_API_KEY=your_openai_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Schema

1. **In Supabase Dashboard:**

   - Go to **SQL Editor** (left sidebar)
   - Click **"New Query"**

2. **Copy & paste the entire contents of `supabase-schema.sql`**

   - File is in your project root
   - Contains all tables, functions, and sample data

3. **Click "Run"** button

   - Should see "Success. No rows returned" message
   - This creates ~10 tables including tasks, habits, notes, etc.

4. **Verify in Table Editor:**
   - Go to **Table Editor** (left sidebar)
   - Should see: `user_profiles`, `tasks`, `habits`, `notes`, `goals`, etc.

### 5. Test Connection

Run this command to verify everything works:

```bash
npm run test-db
```

**Expected output:**

```
✅ Supabase connection successful
✅ Database tables created
✅ Sample data inserted
🎉 Setup complete!
```

---

## Troubleshooting

### Common Issues

**❌ "Invalid API key"**

- Double-check you copied the full key (very long string)
- Make sure no extra spaces or characters
- Verify you're using anon key for NEXT_PUBLIC_SUPABASE_ANON_KEY

**❌ "Connection refused"**

- Check Project URL format: `https://xxx.supabase.co` (no trailing slash)
- Ensure project status is "Active" (not "Paused")

**❌ "Permission denied for table"**

- Make sure you ran the full schema SQL
- Check that RLS policies were created properly

**❌ ".env.local not working"**

- Restart development server: `npm run dev`
- Check file is in project root (same level as package.json)
- Verify no typos in variable names

### Getting Help

1. **Check Supabase Dashboard logs:**

   - Go to **Logs** → **API** to see request errors

2. **Verify schema applied:**

   - Go to **Table Editor** - should see 8+ tables
   - Go to **Authentication** → **Policies** - should see RLS policies

3. **Still stuck?**
   - Check the browser console for error messages
   - Verify all environment variables are set correctly

---

## What the Schema Creates

### Core Tables

- **`user_profiles`** - Extended user info beyond Supabase auth
- **`tasks`** - Todo items with priorities, due dates, projects
- **`habits`** - Daily/weekly habits with streak tracking
- **`notes`** - Quick capture with categories and tags
- **`goals`** - High-level objectives linked to tasks
- **`projects`** - Optional grouping for tasks

### Advanced Features

- **`habit_entries`** - Daily habit completion tracking
- **`voice_commands`** - Log of voice interactions for analytics
- **`email_metadata`** - Future email integration support
- **`analytics_snapshots`** - Productivity metrics over time

### Security & Functions

- **Row Level Security (RLS)** - Users can only see their own data
- **Automatic timestamps** - created_at/updated_at on all tables
- **Streak calculation** - Automated habit streak updates
- **Sample data** - Pre-populated habits and tasks for testing

---

## Next Steps After Setup

Once your database is connected:

1. **Test the app** - Tasks and habits will persist between sessions
2. **Customize sample data** - Edit the default tasks/habits in the UI
3. **Add your first real data** - Create tasks and habits specific to you
4. **Optional: Import existing data** - We can create migration scripts

The app will automatically switch from mock data to real Supabase data once environment variables are configured! 🎉
