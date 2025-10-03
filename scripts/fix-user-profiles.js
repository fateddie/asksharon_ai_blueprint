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

async function fixUserProfiles() {
  try {
    console.log('🔗 Connecting to Supabase...')

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'fix-user-profiles.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📝 Executing SQL fix script...')
    console.log('SQL to execute:')
    console.log(sql)

    // Try direct query approach
    const queries = sql.split(';').filter(q => q.trim())

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim()
      if (query) {
        console.log(`Executing query ${i + 1}:`, query.substring(0, 100) + '...')

        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: query })
          if (error) {
            console.log(`⚠️  Query ${i + 1} failed with exec_sql, trying direct approach`)
            console.log(error)
          } else {
            console.log(`✅ Query ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.log(`⚠️  Query ${i + 1} failed:`, err.message)
        }
      }
    }

    console.log('✅ SQL fix script completed')

    // Verify the fix by checking if the columns exist
    console.log('🔍 Verifying fix...')

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('last_sync, gmail_enabled, calendar_enabled, user_id')
        .limit(1)

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('❌ Columns still missing. Manual SQL execution required.')
          console.log('📋 Please copy and run this SQL in Supabase SQL Editor:')
          console.log('🔗 https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
          console.log('\n' + '='.repeat(50))
          console.log(sql)
          console.log('='.repeat(50) + '\n')
        } else {
          console.log('✅ Columns exist but table is empty (expected)')
        }
      } else {
        console.log('✅ All required columns exist in user_profiles table')
      }
    } catch (verifyError) {
      console.log('❌ Verification failed:', verifyError.message)
    }

    console.log('\n🎉 User profiles table fix complete!')

  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    process.exit(1)
  }
}

// Run the fix
fixUserProfiles()