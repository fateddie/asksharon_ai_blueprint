import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface DashboardData {
  user: {
    id: string
    name?: string
    email?: string
  }
  tasks: {
    total: number
    completed: number
    pending: number
    completedToday: number
    highPriority: number
  }
  habits: {
    total: number
    completedToday: number
    currentStreaks: Array<{
      name: string
      streak: number
    }>
    longestStreak: number
  }
  email: {
    unreadCount: number
    accounts: number
    recentEmails: Array<{
      subject: string
      sender: string
      receivedAt: string
      isRead: boolean
    }>
  }
  calendar: {
    upcomingEvents: Array<{
      title: string
      startTime: string
      location?: string
    }>
    todayEvents: number
    weekEvents: number
  }
  productivity: {
    score: number
    tasksCompletionRate: number
    habitsCompletionRate: number
    weeklyTrend: 'up' | 'down' | 'stable'
  }
}

export class DashboardService {
  private static getSupabaseClient() {
    const cookieStore = cookies()
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
  }

  static async getDashboardDataWithGoogle(userId: string, session: any): Promise<DashboardData> {
    console.log('🔍 Getting dashboard data with Google integration for:', session.user?.email)

    // Get basic data from database (tasks, habits)
    const basicData = await this.getDashboardData(userId)

    // If user has Google access token, fetch real calendar and email data
    if (session.accessToken) {
      try {
        console.log('🔑 Using Google access token for real data')

        // Fetch real Google Calendar data
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&timeMin=' + new Date().toISOString(), {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        })

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json()
          console.log('📅 Real calendar data fetched:', calendarData.items?.length || 0, 'events')

          // Process real calendar events
          const now = new Date()
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

          const todayEvents = calendarData.items?.filter((event: any) => {
            const eventStart = new Date(event.start?.dateTime || event.start?.date)
            return eventStart <= todayEnd && eventStart >= now
          }) || []

          const weekEvents = calendarData.items?.filter((event: any) => {
            const eventStart = new Date(event.start?.dateTime || event.start?.date)
            return eventStart <= weekEnd && eventStart >= now
          }) || []

          basicData.calendar = {
            upcomingEvents: calendarData.items?.slice(0, 3).map((event: any) => ({
              title: event.summary || 'Untitled Event',
              startTime: event.start?.dateTime || event.start?.date,
              location: event.location
            })) || [],
            todayEvents: todayEvents.length,
            weekEvents: weekEvents.length
          }
        }

        // Fetch real Gmail data
        const gmailResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:unread', {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        })

        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json()
          console.log('📧 Real Gmail data fetched:', gmailData.messages?.length || 0, 'unread messages')

          basicData.email = {
            unreadCount: gmailData.messages?.length || 0,
            accounts: 1, // Connected Google account
            recentEmails: [] // We'd need to fetch individual message details
          }
        }

      } catch (error) {
        console.error('❌ Error fetching Google data:', error)
        // Fall back to database data if Google API fails
      }
    } else {
      console.log('⚠️  No Google access token found, using database data only')
    }

    return basicData
  }

  static async getDashboardData(userId: string): Promise<DashboardData> {
    const supabase = this.getSupabaseClient()
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
      // Fetch user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Fetch tasks data
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)

      const { data: tasksToday } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', today)

      // Fetch habits data
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      const { data: habitEntries } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)

      // Fetch email data
      const { data: emailAccounts } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      const { data: emailMetadata } = await supabase
        .from('email_metadata')
        .select('*')
        .eq('user_id', userId)
        .order('received_at', { ascending: false })
        .limit(5)

      // Fetch calendar data
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10)

      // Process tasks data
      const taskStats = {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.completed).length || 0,
        pending: tasks?.filter(t => !t.completed).length || 0,
        completedToday: tasksToday?.filter(t => t.completed).length || 0,
        highPriority: tasks?.filter(t => t.priority === 'high' && !t.completed).length || 0
      }

      // Process habits data
      const habitStats = {
        total: habits?.length || 0,
        completedToday: habitEntries?.filter(e => e.completed).length || 0,
        currentStreaks: habits?.map(h => ({
          name: h.name,
          streak: h.current_streak
        })).filter(h => h.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 3) || [],
        longestStreak: Math.max(...(habits?.map(h => h.longest_streak) || [0]))
      }

      // Process email data
      const emailStats = {
        unreadCount: emailMetadata?.filter(e => !e.is_read).length || 0,
        accounts: emailAccounts?.length || 0,
        recentEmails: emailMetadata?.slice(0, 3).map(e => ({
          subject: e.subject || 'No Subject',
          sender: e.sender || 'Unknown',
          receivedAt: e.received_at || new Date().toISOString(),
          isRead: e.is_read || false
        })) || []
      }

      // Process calendar data
      const now = new Date()
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const calendarStats = {
        upcomingEvents: calendarEvents?.slice(0, 3).map(e => ({
          title: e.title,
          startTime: e.start_time,
          location: e.location
        })) || [],
        todayEvents: calendarEvents?.filter(e =>
          new Date(e.start_time) <= todayEnd && new Date(e.start_time) >= now
        ).length || 0,
        weekEvents: calendarEvents?.filter(e =>
          new Date(e.start_time) <= weekEnd && new Date(e.start_time) >= now
        ).length || 0
      }

      // Calculate productivity score
      const tasksCompletionRate = taskStats.total > 0 ? taskStats.completed / taskStats.total : 0
      const habitsCompletionRate = habitStats.total > 0 ? habitStats.completedToday / habitStats.total : 0
      const productivityScore = Math.round((tasksCompletionRate * 0.6 + habitsCompletionRate * 0.4) * 100)

      return {
        user: {
          id: userId,
          name: userProfile?.full_name,
          email: userProfile?.email
        },
        tasks: taskStats,
        habits: habitStats,
        email: emailStats,
        calendar: calendarStats,
        productivity: {
          score: productivityScore,
          tasksCompletionRate: tasksCompletionRate * 100,
          habitsCompletionRate: habitsCompletionRate * 100,
          weeklyTrend: productivityScore >= 75 ? 'up' : productivityScore >= 50 ? 'stable' : 'down'
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)

      // Return default data structure if there's an error
      return {
        user: { id: userId },
        tasks: { total: 0, completed: 0, pending: 0, completedToday: 0, highPriority: 0 },
        habits: { total: 0, completedToday: 0, currentStreaks: [], longestStreak: 0 },
        email: { unreadCount: 0, accounts: 0, recentEmails: [] },
        calendar: { upcomingEvents: [], todayEvents: 0, weekEvents: 0 },
        productivity: { score: 0, tasksCompletionRate: 0, habitsCompletionRate: 0, weeklyTrend: 'stable' }
      }
    }
  }

  static async getTasksPriorityBreakdown(userId: string) {
    const supabase = this.getSupabaseClient()

    const { data: tasks } = await supabase
      .from('tasks')
      .select('priority, completed')
      .eq('user_id', userId)

    const breakdown = {
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 }
    }

    tasks?.forEach(task => {
      const priority = task.priority as keyof typeof breakdown
      if (breakdown[priority]) {
        breakdown[priority].total++
        if (task.completed) {
          breakdown[priority].completed++
        }
      }
    })

    return breakdown
  }

  static async getHabitStreakAnalysis(userId: string) {
    const supabase = this.getSupabaseClient()

    const { data: habits } = await supabase
      .from('habits')
      .select('name, current_streak, longest_streak, frequency')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('current_streak', { ascending: false })

    return habits?.map(habit => ({
      name: habit.name,
      currentStreak: habit.current_streak,
      longestStreak: habit.longest_streak,
      frequency: habit.frequency,
      streakPercentage: habit.longest_streak > 0 ? (habit.current_streak / habit.longest_streak) * 100 : 0
    })) || []
  }

  static async getWeeklyProductivityTrend(userId: string) {
    const supabase = this.getSupabaseClient()
    const weekDays = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      weekDays.push(date.toISOString().split('T')[0])
    }

    const productivity = []

    for (const day of weekDays) {
      const { data: tasksCompleted } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .gte('completed_at', day)
        .lt('completed_at', day + 'T23:59:59')

      const { data: habitsCompleted } = await supabase
        .from('habit_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('date', day)
        .eq('completed', true)

      productivity.push({
        date: day,
        tasks: tasksCompleted?.length || 0,
        habits: habitsCompleted?.length || 0,
        score: ((tasksCompleted?.length || 0) * 10) + ((habitsCompleted?.length || 0) * 15)
      })
    }

    return productivity
  }
}