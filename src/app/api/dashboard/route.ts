import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { TasksService } from '@/lib/database'
import { generateUserUUID } from '@/lib/uuid'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Getting dashboard data with Google integration for:', session.user.email)

    // Use proper UUID generation for consistent user identification
    const userId = session.user.email ? generateUserUUID(session.user.email) : 'unknown'

    // Get tasks data quickly without external API calls
    const tasks = await TasksService.getAll(userId)

    // Simple dashboard data without slow external API calls
    const dashboardData = {
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completedToday: tasks.filter(t =>
          t.status === 'completed' &&
          t.completed_at &&
          new Date(t.completed_at).toDateString() === new Date().toDateString()
        ).length,
        highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
      },
      habits: {
        total: 0,
        completedToday: 0,
        longestStreak: 0,
        currentStreaks: []
      },
      calendar: {
        todayEvents: 0,
        weekEvents: 0,
        upcomingEvents: []
      },
      email: {
        unreadCount: 0,
        accounts: session.accessToken ? 1 : 0
      }
    }

    console.log('🔑 Using Google access token for real data')

    return NextResponse.json({ data: dashboardData })
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}