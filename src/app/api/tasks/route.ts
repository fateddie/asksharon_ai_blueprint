import { NextRequest, NextResponse } from 'next/server'
import { TasksService } from '@/lib/database'
import { logError, createErrorResponse, validateUUID, logOperation, debugLog } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    debugLog('Fetching tasks', { userId }, '/api/tasks')

    const tasks = await TasksService.getAll(userId || undefined)

    logOperation('Fetch tasks', '/api/tasks', Date.now() - startTime)
    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    logError(error, { endpoint: '/api/tasks', operation: 'fetch_tasks', userId: request.nextUrl.searchParams.get('userId') || undefined })

    return NextResponse.json(
      createErrorResponse(error, '/api/tasks'),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { title, description, status, priority, user_id } = body

    debugLog('Creating task', { title, user_id }, '/api/tasks')

    if (!title || !user_id) {
      return NextResponse.json(
        { error: 'Title and user_id are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    // Validate UUID format
    if (!validateUUID(user_id)) {
      logError(new Error(`Invalid UUID format: ${user_id}`), {
        endpoint: '/api/tasks',
        operation: 'create_task',
        userId: user_id
      })

      return NextResponse.json(
        { error: 'Invalid user_id format', code: 'INVALID_UUID', details: 'user_id must be a valid UUID' },
        { status: 400 }
      )
    }

    const taskData = {
      title,
      description: description || '',
      status: status || 'pending',
      priority: priority || 'medium',
      user_id,
      due_date: undefined,
      estimated_time: undefined,
      tags: []
    }

    debugLog('Creating task with validated data', taskData, '/api/tasks')

    const newTask = await TasksService.create(taskData)

    if (newTask) {
      logOperation('Create task', '/api/tasks', Date.now() - startTime)
      debugLog('Task created successfully', { id: newTask.id }, '/api/tasks')
      return NextResponse.json({ success: true, data: newTask })
    } else {
      throw new Error('TasksService.create returned null/undefined')
    }
  } catch (error) {
    logError(error, {
      endpoint: '/api/tasks',
      operation: 'create_task'
    })

    return NextResponse.json(
      createErrorResponse(error, '/api/tasks'),
      { status: 500 }
    )
  }
}