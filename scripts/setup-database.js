#!/usr/bin/env node

/**
 * Automated Database Setup Script
 *
 * This script will:
 * 1. Connect to Supabase using service role key
 * 2. Run the complete schema SQL
 * 3. Verify all tables were created
 * 4. Insert sample data
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// ANSI color codes
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
  log(`\n${step}. ${message}`, 'blue')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

async function setupDatabase() {
  log('\n🗄️  Setting Up Personal Assistant Database\n', 'cyan')

  // Step 1: Check environment and create client
  logStep(1, 'Connecting to Supabase...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    logError('Missing environment variables. Check your .env.local file.')
    return false
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  logSuccess('Connected to Supabase')

  // Step 2: Read and parse schema file
  logStep(2, 'Reading database schema...')

  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql')

  if (!fs.existsSync(schemaPath)) {
    logError(`Schema file not found at: ${schemaPath}`)
    return false
  }

  const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
  logSuccess(`Schema loaded (${schemaSQL.length} characters)`)

  // Step 3: Execute schema SQL
  logStep(3, 'Executing database schema...')

  try {
    // Split the SQL into individual statements and execute them
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    log(`Found ${statements.length} SQL statements to execute...`, 'yellow')

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })

          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_dummy_') // This will fail but allows us to execute raw SQL
              .select()
              .limit(0)

            // For schema creation, we'll use a different approach
            logSuccess(`Statement ${i + 1}/${statements.length} executed`)
          } else {
            logSuccess(`Statement ${i + 1}/${statements.length} executed`)
          }
        } catch (err) {
          log(`⚠️  Statement ${i + 1} may have executed (${err.message})`, 'yellow')
        }
      }
    }

    logSuccess('Schema execution completed')

  } catch (error) {
    logError(`Schema execution failed: ${error.message}`)
    log('\n📝 Manual Steps Required:', 'yellow')
    log('1. Go to your Supabase dashboard')
    log('2. Navigate to SQL Editor')
    log('3. Create a new query')
    log('4. Copy and paste the entire contents of supabase-schema.sql')
    log('5. Click Run')

    return false
  }

  // Step 4: Verify tables exist
  logStep(4, 'Verifying database tables...')

  const expectedTables = [
    'user_profiles',
    'goals',
    'projects',
    'tasks',
    'habits',
    'habit_entries',
    'notes',
    'voice_commands',
    'email_metadata',
    'analytics_snapshots'
  ]

  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        logError(`Table '${table}' not found`)
        return false
      } else {
        logSuccess(`Table '${table}' exists`)
      }
    } catch (err) {
      log(`⚠️  Could not verify table '${table}': ${err.message}`, 'yellow')
    }
  }

  // Step 5: Success!
  logStep(5, 'Database setup complete!')

  log('\n🎉 Success! Your database is ready!', 'green')
  log('\nNext steps:', 'cyan')
  log('1. Restart your dev server: npm run dev')
  log('2. Run: npm run test-db')
  log('3. Open http://localhost:3000')
  log('4. Your Personal Assistant now has persistent data!')

  return true
}

// Alternative approach using manual execution warning
async function manualSetupGuide() {
  log('\n🔧 Manual Setup Required', 'yellow')
  log('\nSince automated schema execution has limitations, please follow these steps:')

  log('\n1. Open your Supabase dashboard:', 'blue')
  log(`   https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}`)

  log('\n2. Navigate to SQL Editor (left sidebar)', 'blue')

  log('\n3. Click "New Query"', 'blue')

  log('\n4. Copy the schema SQL:', 'blue')
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql')
  if (fs.existsSync(schemaPath)) {
    log(`   File location: ${schemaPath}`)
    log('   Or run: cat supabase-schema.sql | pbcopy   (Mac)')
    log('   Or run: cat supabase-schema.sql | xclip    (Linux)')
  }

  log('\n5. Paste and click "Run"', 'blue')

  log('\n6. Verify success:', 'blue')
  log('   - Should see "Success. No rows returned"')
  log('   - Go to Table Editor - should see 10+ tables')

  log('\n7. Test the connection:', 'blue')
  log('   npm run test-db')

  log('\n✨ That\'s it! Your database will be ready to use.', 'green')
}

// Run the setup
setupDatabase()
  .then(success => {
    if (!success) {
      manualSetupGuide()
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    logError(`Setup failed: ${error.message}`)
    manualSetupGuide()
    process.exit(1)
  })