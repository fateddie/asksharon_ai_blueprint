import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { HabitsService } from '@/lib/database'
import { generateUserUUID } from '@/lib/uuid'

const PREDEFINED_HABITS = [
  { name: 'Reading', icon: '📚', category: 'self-development' },
  { name: 'Thai Boxing', icon: '🥊', category: 'fitness' },
  { name: 'Running', icon: '🏃', category: 'fitness' },
  { name: 'Guitar', icon: '🎸', category: 'hobbies' },
  { name: 'Coach Kenny', icon: '💪', category: 'coaching' },
  { name: 'Better Me', icon: '✨', category: 'self-improvement' }
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = generateUserUUID(session.user.email)

    // Check if habits already exist
    const existingHabits = await HabitsService.getAll(userId)
    const existingNames = new Set(existingHabits.map(h => h.name))

    // Create only habits that don't exist
    const habitsToCreate = PREDEFINED_HABITS.filter(h => !existingNames.has(h.name))

    if (habitsToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All habits already exist',
        habits: existingHabits
      })
    }

    const createdHabits = await Promise.all(
      habitsToCreate.map(habit =>
        HabitsService.create({
          user_id: userId,
          name: habit.name,
          frequency: 'daily',
          target_count: 1,
          is_active: true,
          icon: habit.icon,
          category: habit.category
        })
      )
    )

    return NextResponse.json({
      success: true,
      created: createdHabits.filter(h => h !== null).length,
      habits: createdHabits
    })

  } catch (error) {
    console.error('Error initializing habits:', error)
    return NextResponse.json(
      { error: 'Failed to initialize habits' },
      { status: 500 }
    )
  }
}
