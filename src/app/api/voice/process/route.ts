import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { processVoiceCommand, generateVoiceResponse } from '@/lib/openai'
import { TasksService, HabitsService } from '@/lib/database'
import { generateUserUUID } from '@/lib/uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript } = await request.json()
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript required' }, { status: 400 })
    }

    // Process voice command with OpenAI
    const command = await processVoiceCommand(transcript)
    const userId = generateUserUUID(session.user.email)

    let result: any = { success: false }

    // Execute command based on intent
    switch (command.intent) {
      case 'create_task':
        if (command.entities.taskTitle) {
          const task = await TasksService.create({
            user_id: userId,
            title: command.entities.taskTitle,
            status: 'pending',
            priority: command.entities.priority || 'medium',
            due_date: command.entities.dueDate || undefined
          })

          result = {
            success: !!task,
            task,
            message: task ? `Task "${command.entities.taskTitle}" created` : 'Failed to create task'
          }
        }
        break

      case 'create_habit':
        if (command.entities.habitName) {
          const habit = await HabitsService.create({
            user_id: userId,
            name: command.entities.habitName,
            frequency: command.entities.frequency || 'daily',
            target_count: 1,
            is_active: true
          })

          result = {
            success: !!habit,
            habit,
            message: habit ? `Habit "${command.entities.habitName}" added` : 'Failed to create habit'
          }
        }
        break

      case 'query_status':
        // Get user's current status
        const tasks = await TasksService.getAll()
        const habits = await HabitsService.getAll()

        result = {
          success: true,
          data: {
            tasks: {
              total: tasks.length,
              pending: tasks.filter(t => t.status === 'pending').length,
              completed: tasks.filter(t => t.status === 'completed').length
            },
            habits: {
              total: habits.length,
              active: habits.filter(h => h.is_active).length
            }
          },
          message: `You have ${tasks.filter(t => t.status === 'pending').length} pending tasks and ${habits.filter(h => h.is_active).length} active habits`
        }
        break

      case 'set_reminder':
        // For now, treat reminders as tasks with due dates
        if (command.entities.taskTitle) {
          const task = await TasksService.create({
            user_id: userId,
            title: command.entities.taskTitle,
            status: 'pending',
            priority: 'medium',
            due_date: command.entities.dueDate || undefined
          })

          result = {
            success: !!task,
            task,
            message: task ? `Reminder set for "${command.entities.taskTitle}"` : 'Failed to set reminder'
          }
        }
        break

      default:
        result = {
          success: false,
          message: 'Sorry, I didn\'t understand that command'
        }
    }

    // Generate natural language response
    const response = await generateVoiceResponse(command, result)

    return NextResponse.json({
      success: true,
      command,
      result,
      response
    })

  } catch (error) {
    console.error('Voice processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice command', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
