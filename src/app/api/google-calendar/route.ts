import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text())
      return null
    }

    const tokens = await response.json()
    return tokens.access_token
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return null
  }
}

async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = cookies()
  let accessToken = cookieStore.get('google_access_token')?.value
  const refreshToken = cookieStore.get('google_refresh_token')?.value

  if (!accessToken) {
    if (!refreshToken) return null

    // Try to refresh the token
    accessToken = await refreshAccessToken(refreshToken)
    if (!accessToken) return null

    // Note: In a real app, you'd want to update the cookie here
    // For now, we'll just use the new token for this request
  }

  return accessToken
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const timeMin = new Date()
    const timeMax = new Date()
    timeMax.setDate(timeMax.getDate() + days)

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50'
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text()
      console.error('Google Calendar API error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
    }

    const calendarData = await calendarResponse.json()
    const events = (calendarData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'No Title',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description,
      location: event.location,
      attendees: (event.attendees || []).map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName
      }))
    }))

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error in Google Calendar API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const eventData = await request.json()

    const googleEvent = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start,
        timeZone: 'America/New_York', // You might want to make this configurable
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'America/New_York',
      },
      attendees: eventData.attendees?.map((attendee: any) => ({
        email: attendee.email,
        displayName: attendee.name
      }))
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create event:', errorText)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    const createdEvent = await response.json()

    return NextResponse.json({
      id: createdEvent.id,
      title: createdEvent.summary,
      start: createdEvent.start?.dateTime || createdEvent.start?.date,
      end: createdEvent.end?.dateTime || createdEvent.end?.date,
      description: createdEvent.description,
      location: createdEvent.location,
    })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}