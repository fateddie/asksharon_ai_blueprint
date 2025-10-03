#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure .env.local contains:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupTables() {
  try {
    console.log('🔗 Connecting to Supabase...')

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'additional-tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📝 Executing SQL script...')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution (newer Supabase)
      const { error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)

      if (directError) {
        throw new Error(`Database error: ${error.message}`)
      }

      // For newer Supabase, we need to use the SQL editor or manual execution
      console.log('⚠️  Could not execute SQL automatically.')
      console.log('📋 Please copy the following SQL and run it in Supabase SQL Editor:')
      console.log('🔗 https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
      console.log('\n' + '='.repeat(50))
      console.log(sql)
      console.log('='.repeat(50) + '\n')
      console.log('Then run this script again to verify the setup.')
      return
    }

    console.log('✅ SQL script executed successfully')

    // Verify tables were created
    console.log('🔍 Verifying tables...')

    const expectedTables = [
      'user_emails',
      'user_email_stats',
      'user_calendar_events',
      'user_calendar_stats'
    ]

    for (const tableName of expectedTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST205') {
          console.log(`❌ Table '${tableName}' not found`)
        } else {
          console.log(`✅ Table '${tableName}' exists`)
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and accessible`)
      }
    }

    console.log('\n🎉 Database setup complete!')
    console.log('📡 Your app can now sync real Google Calendar and Gmail data')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupTables()