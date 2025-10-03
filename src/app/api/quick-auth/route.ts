import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

let tokenStorage: { [key: string]: any } = {} // Simple in-memory storage

export async function POST(request: NextRequest) {
  try {
    const { action, code } = await request.json()

    if (action === 'exchange_code' && code) {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3000/api/auth/callback/google',
        }),
      })

      const tokens = await tokenResponse.json()
      console.log('🎫 Quick auth tokens:', { hasAccessToken: !!tokens.access_token })

      if (tokens.access_token) {
        // Store tokens (simple approach)
        const userId = 'robertfreyne@gmail.com'
        tokenStorage[userId] = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000),
          timestamp: new Date().toISOString()
        }

        // Test immediate data access
        const [calendarTest, gmailTest] = await Promise.allSettled([
          fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&timeMin=' + new Date().toISOString(), {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          }).then(r => r.json()),
          fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          }).then(r => r.json())
        ])

        return NextResponse.json({
          success: true,
          message: 'Authentication successful!',
          data: {
            user: userId,
            tokens: { expires_at: tokenStorage[userId].expires_at },
            tests: {
              calendar: calendarTest.status === 'fulfilled' ? {
                success: true,
                events: calendarTest.value.items?.slice(0, 3).map((e: any) => ({
                  summary: e.summary,
                  start: e.start?.dateTime || e.start?.date
                })) || []
              } : { success: false, error: calendarTest.reason?.message },
              gmail: gmailTest.status === 'fulfilled' ? {
                success: true,
                messageCount: gmailTest.value.messages?.length || 0
              } : { success: false, error: gmailTest.reason?.message }
            }
          }
        })
      }
    }

    if (action === 'test_data') {
      const userId = 'robertfreyne@gmail.com'
      const userTokens = tokenStorage[userId]

      if (!userTokens) {
        return NextResponse.json({ error: 'No tokens found. Please authenticate first.' }, { status: 401 })
      }

      // Test with stored tokens
      const [calendarResponse, gmailResponse] = await Promise.allSettled([
        fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&timeMin=' + new Date().toISOString(), {
          headers: { Authorization: `Bearer ${userTokens.access_token}` }
        }),
        fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
          headers: { Authorization: `Bearer ${userTokens.access_token}` }
        })
      ])

      const results: any = { timestamp: new Date().toISOString(), user: userId }

      if (calendarResponse.status === 'fulfilled') {
        const calendarData = await calendarResponse.value.json()
        const today = new Date().toDateString()
        const todayEvents = calendarData.items?.filter((event: any) => {
          const eventDate = new Date(event.start?.dateTime || event.start?.date).toDateString()
          return eventDate === today
        }) || []

        results.calendar = {
          success: true,
          totalEvents: calendarData.items?.length || 0,
          todayEvents: todayEvents.length,
          todayEventsList: todayEvents.map((e: any) => ({
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            location: e.location
          })),
          upcomingEvents: calendarData.items?.slice(0, 5).map((e: any) => ({
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date
          })) || []
        }
      } else {
        results.calendar = { success: false, error: 'Failed to fetch calendar data' }
      }

      if (gmailResponse.status === 'fulfilled') {
        const gmailData = await gmailResponse.value.json()
        results.gmail = {
          success: true,
          messageCount: gmailData.messages?.length || 0,
          messages: gmailData.messages?.slice(0, 3) || []
        }
      } else {
        results.gmail = { success: false, error: 'Failed to fetch gmail data' }
      }

      return NextResponse.json({ success: true, realData: results })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Quick auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}