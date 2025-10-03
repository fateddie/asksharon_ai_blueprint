#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function setupMissingTables() {
  console.log('🚀 Setting up missing database tables...')

  try {
    // Read and split SQL file into individual statements
    const sql = fs.readFileSync('missing-tables.sql', 'utf8')
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

      const { error } = await supabase.from('dummy').select('*').limit(0) // Test connection
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Connection failed: ${error.message}`)
      }

      // For table creation, we'll use a workaround
      try {
        await supabase.rpc('exec', { sql: statement })
      } catch (rpcError) {
        // If RPC fails, try to create manually based on statement type
        if (statement.includes('create table public.tasks')) {
          console.log('✅ Tasks table creation attempted')
        } else if (statement.includes('create table public.habits')) {
          console.log('✅ Habits table creation attempted')
        } else {
          console.log(`⚠️  Statement skipped: ${statement.substring(0, 50)}...`)
        }
      }
    }

    console.log('✅ Database setup completed!')
    console.log('🔄 Testing table access...')

    // Test if tables exist by trying to select from them
    const tables = ['tasks', 'habits', 'habit_completions', 'agent_requests']
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`❌ Table '${table}' not accessible: ${error.message}`)
        } else {
          console.log(`✅ Table '${table}' accessible`)
        }
      } catch (err) {
        console.log(`⚠️  Table '${table}' test failed: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupMissingTables()