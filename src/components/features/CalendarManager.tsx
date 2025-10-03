'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, RefreshCw, AlertCircle } from 'lucide-react'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  organizer?: {
    email: string
    displayName?: string
  }
  status: string
}

export default function CalendarManager() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.accessToken) {
      fetchRealCalendarEvents()
    }
  }, [session])

  const fetchRealCalendarEvents = async () => {
    if (!session?.accessToken) return

    setLoading(true)
    setError(null)
    try {
      console.log('📅 Fetching real calendar events...')

      // Fetch events from Google Calendar API
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&timeMin=${new Date().toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.status}`)
      }

      const data = await response.json()
      console.log('📅 Calendar events fetched:', data.items?.length || 0)

      const fetchedEvents = data.items || []
      setEvents(fetchedEvents)

      // Process today's events
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

      const todaysEvents = fetchedEvents.filter((event: CalendarEvent) => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date || '')
        return eventStart >= todayStart && eventStart <= todayEnd
      })

      setTodayEvents(todaysEvents)

      // Process upcoming events (next 7 days)
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcoming = fetchedEvents.filter((event: CalendarEvent) => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date || '')
        return eventStart > todayEnd && eventStart <= weekFromNow
      }).slice(0, 5)

      setUpcomingEvents(upcoming)

    } catch (error) {
      console.error('❌ Error fetching calendar events:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch calendar events')
    } finally {
      setLoading(false)
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date
    const end = event.end?.dateTime || event.end?.date

    if (!start) return 'No time specified'

    const startDate = new Date(start)
    const endDate = new Date(end || start)

    if (event.start?.date) {
      // All-day event
      return 'All day'
    }

    return `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  const formatEventDate = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date
    if (!start) return ''

    return new Date(start).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!session) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Calendar Manager</h3>
          <p className="text-gray-600 mb-4">Sign in to view your Google Calendar events</p>
        </div>
      </Card>
    )
  }

  if (!session.accessToken) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Calendar Access Required</h3>
          <p className="text-gray-600 mb-4">Please connect your Google account to view calendar events</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Calendar Manager</h2>
          </div>
          <Button
            onClick={fetchRealCalendarEvents}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Total Events</h3>
            <p className="text-2xl font-bold text-blue-700">{events.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Today</h3>
            <p className="text-2xl font-bold text-green-700">{todayEvents.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">This Week</h3>
            <p className="text-2xl font-bold text-purple-700">{upcomingEvents.length}</p>
          </div>
        </div>
      </Card>

      {/* Today's Events */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Today's Events
        </h3>

        {todayEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.summary}</h4>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatEventTime(event)}
                    </div>
                    {event.location && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Events */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-600" />
          Upcoming Events
        </h3>

        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming events this week</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.summary}</h4>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatEventDate(event)} • {formatEventTime(event)}
                    </div>
                    {event.location && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export { CalendarManager }