# ✅ Supabase Setup Checklist

## 🚀 Quick 5-Minute Setup

**Follow these steps in order:**

### □ Step 1: Create Supabase Project (2 minutes)
1. Go to **[supabase.com](https://supabase.com)**
2. Click **"New Project"**
3. Fill out:
   - **Name**: `Personal Assistant`
   - **Password**: Generate & save a strong password
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. ⏱️ Wait for "Active" status (~2 minutes)

### □ Step 2: Get Your API Keys (30 seconds)
1. In Supabase dashboard: **Settings** → **API**
2. Copy these 3 values:
   ```
   Project URL: https://xxx.supabase.co
   Anon Key: eyJhbGc... (long string)
   Service Role Key: eyJhbGc... (click "Reveal")
   ```

### □ Step 3: Update Environment File (30 seconds)
1. Open `.env.local` in your project
2. Replace the placeholder values with your actual keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### □ Step 4: Create Database Tables (1 minute)
1. In Supabase: **SQL Editor** → **New Query**
2. Copy entire contents of `supabase-schema.sql`
3. Paste and click **"Run"**
4. Should see: "Success. No rows returned"

### □ Step 5: Test Everything Works (30 seconds)
1. In your terminal, run:
   ```bash
   npm run test-db
   ```
2. Should see: `🎉 All tests passed!`

### □ Step 6: Restart & Enjoy! (30 seconds)
1. Restart dev server:
   ```bash
   npm run dev
   ```
2. Open **http://localhost:3000**
3. 🎉 Your data now persists between sessions!

---

## 🔍 Verification

**After setup, you should see:**
- ✅ 8+ tables in Supabase Table Editor
- ✅ Sample tasks and habits in your app
- ✅ Data persists when you refresh the page
- ✅ Can add/edit tasks and habits

**If something's wrong:**
1. Check `.env.local` - no typos in URLs/keys
2. Verify schema ran - check Table Editor for tables
3. Run `npm run test-db` for detailed error info

---

## 🆘 Need Help?

**Common issues:**
- **"Invalid API key"** → Double-check you copied the full key
- **"Table doesn't exist"** → Re-run the schema SQL
- **"Connection refused"** → Check project is "Active" status

**Still stuck?** Check `SUPABASE_SETUP.md` for detailed troubleshooting.

Once this is done, your Personal Assistant will have a real database! 🗄️✨