const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabase() {
  console.log('🔧 Fixing database constraints for voice commands...');

  try {
    // Drop foreign key constraint and make user_id nullable
    // We'll do this by altering the table schema directly

    // First, let's try a simpler approach - check current constraints
    console.log('📊 Testing current task creation...');

    // Try creating task with a synthetic UUID that doesn't reference auth.users
    const testUserId = '00000000-1111-4000-8000-123456789abc';

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: 'Test constraint fix',
        description: 'Testing if constraints are fixed',
        status: 'pending',
        priority: 'medium',
        user_id: testUserId,
        tags: []
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Constraint still exists:', error.message);
      console.log('📝 Error code:', error.code);

      if (error.code === '23503') {
        console.log('🔧 Foreign key constraint detected - need manual fix in Supabase dashboard');
        console.log('👉 Solution: Go to Supabase dashboard and remove the foreign key constraint');
        console.log('   Table: tasks, Column: user_id, Remove reference to auth.users');
      }
    } else {
      console.log('✅ Task created successfully! Constraints are fixed.');
      console.log('📝 Task ID:', data.id);

      // Clean up test task
      await supabase.from('tasks').delete().eq('id', data.id);
      console.log('🧹 Test task cleaned up');
    }

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
}

fixDatabase();