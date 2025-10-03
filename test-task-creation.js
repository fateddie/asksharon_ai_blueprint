#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Generate the same UUID as the frontend will generate
function generateUUID(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hashStr.slice(0,8)}-${hashStr.slice(8,12)}-4${hashStr.slice(12,15)}-8${hashStr.slice(15,18)}-${hashStr.slice(18,30)}`;
}

async function testTaskCreation() {
  console.log('🧪 Testing Task Creation with Fixed UUID...\n')

  try {
    const userEmail = 'robertfreyne@gmail.com'
    const userId = generateUUID(userEmail)

    console.log(`📧 User Email: ${userEmail}`)
    console.log(`🆔 Generated UUID: ${userId}`)

    // Test creating a task
    const testTask = {
      title: 'Test Task - Should Work Now',
      status: 'pending',
      priority: 'medium',
      user_id: userId
    }

    console.log('\n📝 Creating test task...')
    const { data: task, error: createError } = await supabase
      .from('tasks')
      .insert(testTask)
      .select()
      .single()

    if (createError) {
      console.error('❌ Create error:', createError)
      return
    }

    console.log('✅ Task created successfully!')
    console.log(`   Title: ${task.title}`)
    console.log(`   ID: ${task.id}`)
    console.log(`   Status: ${task.status}`)

    // Test creating a habit
    const testHabit = {
      name: 'Test Habit - Should Work Now',
      frequency: 'daily',
      target_count: 1,
      user_id: userId,
      is_active: true
    }

    console.log('\n💪 Creating test habit...')
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .insert(testHabit)
      .select()
      .single()

    if (habitError) {
      console.error('❌ Habit create error:', habitError)
      return
    }

    console.log('✅ Habit created successfully!')
    console.log(`   Name: ${habit.name}`)
    console.log(`   ID: ${habit.id}`)
    console.log(`   Frequency: ${habit.frequency}`)

    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    await supabase.from('tasks').delete().eq('id', task.id)
    await supabase.from('habits').delete().eq('id', habit.id)
    console.log('✅ Cleanup completed')

    console.log('\n🎉 All tests passed! The add buttons should now work!')
    console.log('✅ Tasks can be created with proper UUID format')
    console.log('✅ Habits can be created with proper UUID format')
    console.log('\n🔄 Try refreshing the page and adding tasks/habits now!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testTaskCreation()