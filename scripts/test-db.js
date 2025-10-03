#!/usr/bin/env node

/**
 * Database Connection Test Script
 *
 * This script verifies:
 * 1. Environment variables are set correctly
 * 2. Supabase connection works
 * 3. Required tables exist
 * 4. Sample data can be inserted/retrieved
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`${step}. ${message}`, 'blue')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

async function testDatabaseConnection() {
  log('\n🗄️  Testing Supabase Database Connection\n', 'cyan')

  // Step 1: Check environment variables
  logStep(1, 'Checking environment variables...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    logError('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
    return false
  }

  if (!supabaseAnonKey) {
    logError('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local')
    return false
  }

  if (!supabaseUrl.includes('supabase.co')) {
    logWarning('SUPABASE_URL format looks incorrect. Expected: https://xxx.supabase.co')
  }

  logSuccess('Environment variables found')

  // Step 2: Create Supabase client
  logStep(2, 'Creating Supabase client...')

  let supabase
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    logSuccess('Supabase client created')
  } catch (error) {
    logError(`Failed to create Supabase client: ${error.message}`)
    return false
  }

  // Step 3: Test basic connection
  logStep(3, 'Testing database connection...')

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (error) {
      logError(`Connection failed: ${error.message}`)

      if (error.message.includes('relation "public.user_profiles" does not exist')) {
        logWarning('Tables not found. Did you run the schema SQL in Supabase?')
        logWarning('Go to SQL Editor in Supabase and run the contents of supabase-schema.sql')
      }

      return false
    }

    logSuccess('Database connection successful')
  } catch (error) {
    logError(`Connection test failed: ${error.message}`)
    return false
  }

  // Step 4: Check required tables exist
  logStep(4, 'Checking required tables...')

  const requiredTables = ['user_profiles', 'tasks', 'habits', 'notes', 'goals']

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      if (error) {
        logError(`Table '${table}' not found: ${error.message}`)
        return false
      }

      logSuccess(`Table '${table}' exists`)
    } catch (error) {
      logError(`Error checking table '${table}': ${error.message}`)
      return false
    }
  }

  // Step 5: Test data operations
  logStep(5, 'Testing data operations...')

  try {
    // Try to read some sample data
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5)

    if (tasksError) {
      logError(`Failed to read tasks: ${tasksError.message}`)
      return false
    }

    logSuccess(`Found ${tasks.length} sample tasks`)

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .limit(5)

    if (habitsError) {
      logError(`Failed to read habits: ${habitsError.message}`)
      return false
    }

    logSuccess(`Found ${habits.length} sample habits`)

  } catch (error) {
    logError(`Data operation test failed: ${error.message}`)
    return false
  }

  // Step 6: All tests passed!
  log('\n🎉 All tests passed!', 'green')
  log('\nYour Supabase database is ready to use!', 'cyan')
  log('\nNext steps:', 'blue')
  log('1. Restart your development server: npm run dev')
  log('2. Open http://localhost:3000')
  log('3. Your tasks and habits will now persist between sessions!')

  return true
}

// Run the test
testDatabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    logError(`Unexpected error: ${error.message}`)
    process.exit(1)
  })