import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  console.log('🔗 Direct auth callback received:', { code: !!code, state, error })

  if (error) {
    return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 })
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/api/direct-auth',
      }),
    })

    const tokens = await tokenResponse.json()
    console.log('🎫 Token exchange result:', {
      success: tokenResponse.ok,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens)
      return NextResponse.json({ error: 'Failed to exchange code for tokens', details: tokens }, { status: 400 })
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const userInfo = await userResponse.json()
    console.log('👤 User info:', { email: userInfo.email, name: userInfo.name })

    // Test Google Calendar access immediately
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const calendarData = await calendarResponse.json()
    console.log('📅 Calendar test:', {
      success: calendarResponse.ok,
      eventCount: calendarData.items?.length || 0
    })

    // Test Gmail access
    const gmailResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const gmailData = await gmailResponse.json()
    console.log('📧 Gmail test:', {
      success: gmailResponse.ok,
      messageCount: gmailData.messages?.length || 0
    })

    // Return success with test results
    return NextResponse.json({
      success: true,
      user: userInfo,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
      testResults: {
        calendar: {
          success: calendarResponse.ok,
          eventCount: calendarData.items?.length || 0,
          events: calendarData.items?.slice(0, 3).map((event: any) => ({
            summary: event.summary,
            start: event.start?.dateTime || event.start?.date,
          })) || []
        },
        gmail: {
          success: gmailResponse.ok,
          messageCount: gmailData.messages?.length || 0,
        }
      }
    })

  } catch (error) {
    console.error('❌ Direct auth error:', error)
    return NextResponse.json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}