import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = cookies()
  let accessToken = cookieStore.get('google_access_token')?.value
  const refreshToken = cookieStore.get('google_refresh_token')?.value

  if (!accessToken && refreshToken) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })
      if (response.ok) {
        const tokens = await response.json()
        accessToken = tokens.access_token
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    }
  }

  return accessToken
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's calendar events
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: today.toISOString(),
        timeMax: tomorrow.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    // Get unread email count
    const gmailResponse = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?' +
      new URLSearchParams({
        q: 'in:inbox is:unread',
        maxResults: '100'
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    let todaysMeetings = 0
    let unreadEmails = 0

    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json()
      todaysMeetings = (calendarData.items || []).length
    }

    if (gmailResponse.ok) {
      const gmailData = await gmailResponse.json()
      unreadEmails = gmailData.resultSizeEstimate || 0
    }

    // Get upcoming events (next 7 days)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const upcomingResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: today.toISOString(),
        timeMax: weekFromNow.toISOString(),
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

    let upcomingEvents = 0
    if (upcomingResponse.ok) {
      const upcomingData = await upcomingResponse.json()
      upcomingEvents = (upcomingData.items || []).length
    }

    return NextResponse.json({
      upcomingEvents,
      unreadEmails,
      todaysMeetings
    })
  } catch (error) {
    console.error('Error fetching Google stats:', error)
    return NextResponse.json({
      upcomingEvents: 0,
      unreadEmails: 0,
      todaysMeetings: 0
    })
  }
}