#!/usr/bin/env node

/**
 * Simple Database Test - Bypasses schema cache issues
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function simpleTest() {
  console.log('🔍 Simple Database Test\n')

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

  // Test 1: Try to insert a sample task
  console.log('1. Testing task insertion...')
  try {
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Task from Script',
        description: 'This confirms the database is working!',
        user_id: '123e4567-e89b-12d3-a456-426614174000', // Sample user ID from schema
        priority: 'medium'
      })
      .select()

    if (taskError) {
      console.log(`❌ Task insert failed: ${taskError.message}`)

      if (taskError.message.includes('relation') && taskError.message.includes('does not exist')) {
        console.log('\n📋 Manual Setup Needed:')
        console.log('The automated script may not have worked. Please:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Open SQL Editor')
        console.log('3. Copy/paste the contents of supabase-schema.sql')
        console.log('4. Click Run')
        return false
      }
    } else {
      console.log('✅ Task inserted successfully!')
    }
  } catch (err) {
    console.log(`⚠️ Task test: ${err.message}`)
  }

  // Test 2: Try to insert a sample habit
  console.log('\n2. Testing habit insertion...')
  try {
    const { data: habitData, error: habitError } = await supabase
      .from('habits')
      .insert({
        name: 'Test Habit from Script',
        description: 'This confirms habits table works!',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        frequency: 'daily'
      })
      .select()

    if (habitError) {
      console.log(`❌ Habit insert failed: ${habitError.message}`)
    } else {
      console.log('✅ Habit inserted successfully!')
    }
  } catch (err) {
    console.log(`⚠️ Habit test: ${err.message}`)
  }

  // Test 3: Read existing data
  console.log('\n3. Testing data retrieval...')
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(5)

    if (error) {
      console.log(`❌ Data retrieval failed: ${error.message}`)
      return false
    } else {
      console.log(`✅ Found ${tasks.length} tasks in database`)
      if (tasks.length > 0) {
        console.log(`   Example: "${tasks[0].title}"`)
      }
    }
  } catch (err) {
    console.log(`⚠️ Data retrieval: ${err.message}`)
  }

  console.log('\n🎉 Database tests completed!')
  console.log('\nIf you see ✅ marks above, your database is working!')
  console.log('You can now restart your app and see persistent data.')

  return true
}

simpleTest().catch(console.error)