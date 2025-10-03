#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  'https://coxnsvusaxfniqivhlar.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveG5zdnVzYXhmbmlxaXZobGFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA3NzU4MCwiZXhwIjoyMDc0NjUzNTgwfQ.qyAMlwd171_YtNVoKevXpqLBTB5pBcwFQ6f-giAGBWo'
)

async function directFix() {
  try {
    console.log('🔧 Attempting direct table fix...')

    // Step 1: Check current table structure
    console.log('1. Checking current table structure...')
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public')

    if (columnError) {
      console.log('Error checking columns:', columnError)
    } else {
      console.log('Current columns:', columns.map(c => c.column_name))
    }

    // Step 2: Try to add columns using raw SQL via RPC
    console.log('2. Attempting to add missing columns...')

    try {
      // Check if user_profiles table exists and try to query it
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .limit(1)

      console.log('Table exists, test query result:', { testData, testError })

    } catch (error) {
      console.log('Error accessing user_profiles:', error)
    }

    // Step 3: The simplest approach - use Supabase client to create our own user_profiles record with required fields
    console.log('3. Testing column access...')
    try {
      const { data: testSync, error: syncError } = await supabase
        .from('user_profiles')
        .select('last_sync')
        .limit(1)

      if (syncError) {
        console.log('❌ Column last_sync missing:', syncError.message)
      } else {
        console.log('✅ Column last_sync exists')
      }
    } catch (e) {
      console.log('❌ Could not test last_sync column:', e.message)
    }

    console.log('\n📋 MANUAL SQL REQUIRED:')
    console.log('Please run this SQL in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/coxnsvusaxfniqivhlar/sql')
    console.log('\n' + '='.repeat(60))
    console.log(`
-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS user_id text,
ADD COLUMN IF NOT EXISTS last_sync timestamp with time zone,
ADD COLUMN IF NOT EXISTS gmail_enabled boolean default false,
ADD COLUMN IF NOT EXISTS calendar_enabled boolean default false;

-- Update user_id to match the id for existing records
UPDATE public.user_profiles
SET user_id = id::text
WHERE user_id IS NULL;

-- Make user_id unique (if needed)
-- ALTER TABLE public.user_profiles
-- ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
    `)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Direct fix failed:', error.message)
  }
}

directFix()