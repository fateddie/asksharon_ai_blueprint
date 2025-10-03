import { google } from 'googleapis'
import { createClient } from './supabase'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  attendees: Array<{
    email: string
    name?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  organizer?: {
    email: string
    name?: string
  }
  status: 'confirmed' | 'tentative' | 'cancelled'
  visibility: 'default' | 'public' | 'private' | 'confidential'
  recurrence?: string[]
  calendarId?: string
  meetingLink?: string
}

export interface CalendarStats {
  totalEvents: number
  todayEvents: number
  weekEvents: number
  monthEvents: number
  upcomingEvents: number
  busyHours: number
  freeHours: number
  mostBusyDay: string
  averageEventsPerDay: number
}

export class CalendarService {
  private calendar
  private oauth2Client

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    )

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      if (credentials.access_token) {
        this.oauth2Client.setCredentials(credentials)
        return credentials.access_token
      }
      return null
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return null
    }
  }

  async getEvents(
    calendarId: string = 'primary',
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 50
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin?.toISOString() || new Date().toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })

      const events = response.data.items || []
      return events.map(this.transformEvent).filter(Boolean) as CalendarEvent[]
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      throw error
    }
  }

  async getEvent(eventId: string, calendarId: string = 'primary'): Promise<CalendarEvent | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId
      })

      return this.transformEvent(response.data)
    } catch (error) {
      console.error('Error fetching calendar event:', error)
      return null
    }
  }

  async createEvent(
    event: Omit<CalendarEvent, 'id'>,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> {
    try {
      const googleEvent = this.transformToGoogleEvent(event as CalendarEvent)

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: googleEvent
      })

      return this.transformEvent(response.data)
    } catch (error) {
      console.error('Error creating calendar event:', error)
      return null
    }
  }

  async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> {
    try {
      const googleEvent = this.transformToGoogleEvent(event as CalendarEvent)

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: googleEvent
      })

      return this.transformEvent(response.data)
    } catch (error) {
      console.error('Error updating calendar event:', error)
      return null
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      })
      return true
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      return false
    }
  }

  async listCalendars() {
    try {
      const response = await this.calendar.calendarList.list()
      return response.data.items || []
    } catch (error) {
      console.error('Error fetching calendars:', error)
      return []
    }
  }

  private transformEvent(googleEvent: any): CalendarEvent | null {
    if (!googleEvent || !googleEvent.id) {
      return null
    }

    const startTime = googleEvent.start?.dateTime
      ? new Date(googleEvent.start.dateTime)
      : new Date(googleEvent.start?.date || '')

    const endTime = googleEvent.end?.dateTime
      ? new Date(googleEvent.end.dateTime)
      : new Date(googleEvent.end?.date || '')

    const isAllDay = !googleEvent.start?.dateTime

    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'No Title',
      description: googleEvent.description,
      location: googleEvent.location,
      startTime,
      endTime,
      isAllDay,
      attendees: (googleEvent.attendees || []).map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName,
        responseStatus: attendee.responseStatus
      })),
      organizer: googleEvent.organizer ? {
        email: googleEvent.organizer.email,
        name: googleEvent.organizer.displayName
      } : undefined,
      status: googleEvent.status || 'confirmed',
      visibility: googleEvent.visibility || 'default',
      recurrence: googleEvent.recurrence
    }
  }

  private transformToGoogleEvent(event: CalendarEvent): any {
    const googleEvent: any = {
      summary: event.title,
      description: event.description,
      location: event.location,
      status: event.status,
      visibility: event.visibility
    }

    if (event.isAllDay) {
      googleEvent.start = {
        date: event.startTime.toISOString().split('T')[0]
      }
      googleEvent.end = {
        date: event.endTime.toISOString().split('T')[0]
      }
    } else {
      googleEvent.start = {
        dateTime: event.startTime.toISOString()
      }
      googleEvent.end = {
        dateTime: event.endTime.toISOString()
      }
    }

    if (event.attendees && event.attendees.length > 0) {
      googleEvent.attendees = event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name
      }))
    }

    if (event.recurrence) {
      googleEvent.recurrence = event.recurrence
    }

    return googleEvent
  }

  /**
   * Get events from all calendars within date range
   */
  async getAllEvents(
    startDate?: Date,
    endDate?: Date,
    maxResults: number = 100
  ): Promise<CalendarEvent[]> {
    try {
      const calendars = await this.listCalendars()
      const allEvents: CalendarEvent[] = []

      // Default to events from 30 days ago to 60 days in future
      const timeMin = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const timeMax = endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

      for (const calendar of calendars) {
        if (!calendar.id) continue

        try {
          const events = await this.getEvents(calendar.id, timeMin, timeMax, Math.floor(maxResults / calendars.length) + 10)

          // Add calendar ID and meeting links to events
          events.forEach(event => {
            event.calendarId = calendar.id
            // Try to extract meeting link from description or location
            if (event.description && event.description.includes('meet.google.com')) {
              const meetMatch = event.description.match(/https:\/\/meet\.google\.com\/[\w-]+/)
              if (meetMatch) event.meetingLink = meetMatch[0]
            }
          })

          allEvents.push(...events)
        } catch (calendarError) {
          console.error(`Error fetching events from calendar ${calendar.id}:`, calendarError)
          // Continue with other calendars
        }
      }

      // Sort all events by start time
      allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

      return allEvents.slice(0, maxResults)

    } catch (error) {
      console.error('Error fetching calendar events from all calendars:', error)
      throw error
    }
  }

  /**
   * Calculate calendar statistics from events
   */
  calculateCalendarStats(events: CalendarEvent[]): CalendarStats {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - now.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Filter events by time periods
    const todayEvents = events.filter(e =>
      e.startTime >= todayStart && e.startTime < todayEnd
    ).length

    const weekEvents = events.filter(e =>
      e.startTime >= weekStart && e.startTime < weekEnd
    ).length

    const monthEvents = events.filter(e =>
      e.startTime >= monthStart && e.startTime < monthEnd
    ).length

    const upcomingEvents = events.filter(e =>
      e.startTime > now && e.startTime < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    ).length

    // Calculate busy hours (total time in meetings today)
    let busyMilliseconds = 0
    events.forEach(event => {
      if (event.startTime >= todayStart && event.startTime < todayEnd && !event.isAllDay) {
        busyMilliseconds += event.endTime.getTime() - event.startTime.getTime()
      }
    })
    const busyHours = Math.round(busyMilliseconds / (1000 * 60 * 60) * 10) / 10

    // Calculate most busy day
    const dayCount = events.reduce((acc, event) => {
      const dayKey = event.startTime.toDateString()
      acc[dayKey] = (acc[dayKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostBusyDay = Object.entries(dayCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'No events'

    // Average events per day (over the month)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const averageEventsPerDay = Math.round((monthEvents / daysInMonth) * 10) / 10

    return {
      totalEvents: events.length,
      todayEvents,
      weekEvents,
      monthEvents,
      upcomingEvents,
      busyHours,
      freeHours: Math.max(0, 8 - busyHours), // Assuming 8-hour workday
      mostBusyDay,
      averageEventsPerDay,
    }
  }

  /**
   * Sync Calendar data to Supabase database
   */
  async syncToDatabase(userId: string): Promise<{ success: boolean; eventCount: number; error?: string }> {
    try {
      console.log(`Starting Calendar sync for user ${userId}`)

      // Fetch events from all calendars
      const events = await this.getAllEvents()

      if (events.length === 0) {
        return { success: true, eventCount: 0 }
      }

      // Calculate stats
      const stats = this.calculateCalendarStats(events)

      // Save events to database
      const eventInserts = events.map(event => ({
        user_id: userId,
        event_id: event.id,
        calendar_id: event.calendarId || 'primary',
        title: event.title,
        description: event.description,
        start_time: event.startTime.toISOString(),
        end_time: event.endTime.toISOString(),
        location: event.location,
        attendees: event.attendees,
        is_all_day: event.isAllDay,
        status: event.status,
        visibility: event.visibility,
        recurrence: event.recurrence,
        meeting_link: event.meetingLink,
        organizer: event.organizer,
        synced_at: new Date().toISOString(),
      }))

      // Upsert events (insert or update on conflict)
      const supabase = createClient()
      const { error: eventsError } = await supabase
        .from('user_calendar_events')
        .upsert(eventInserts, {
          onConflict: 'user_id,event_id',
          ignoreDuplicates: false
        })

      if (eventsError) {
        console.error('Error saving calendar events:', eventsError)
        throw eventsError
      }

      // Save calendar stats
      const { error: statsError } = await supabase
        .from('user_calendar_stats')
        .upsert({
          user_id: userId,
          total_events: stats.totalEvents,
          today_events: stats.todayEvents,
          week_events: stats.weekEvents,
          month_events: stats.monthEvents,
          upcoming_events: stats.upcomingEvents,
          busy_hours: stats.busyHours,
          free_hours: stats.freeHours,
          most_busy_day: stats.mostBusyDay,
          average_events_per_day: stats.averageEventsPerDay,
          last_sync: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (statsError) {
        console.error('Error saving calendar stats:', statsError)
        throw statsError
      }

      console.log(`Calendar sync completed: ${events.length} events synced`)

      return { success: true, eventCount: events.length }

    } catch (error) {
      console.error('Calendar sync failed:', error)
      return {
        success: false,
        eventCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Get user's Calendar data from database
 */
export async function getUserCalendarData(userId: string) {
  try {
    const supabase = createClient()
    // Get calendar stats
    const { data: stats, error: statsError } = await supabase
      .from('user_calendar_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError
    }

    // Get upcoming events
    const { data: events, error: eventsError } = await supabase
      .from('user_calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20)

    if (eventsError) {
      throw eventsError
    }

    return {
      stats: stats || null,
      events: events || [],
      lastSync: stats?.last_sync ? new Date(stats.last_sync) : null,
    }

  } catch (error) {
    console.error('Error fetching user calendar data:', error)
    throw error
  }
}