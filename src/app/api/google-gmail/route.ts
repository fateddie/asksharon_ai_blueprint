import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = cookies()
  let accessToken = cookieStore.get('google_access_token')?.value
  const refreshToken = cookieStore.get('google_refresh_token')?.value

  if (!accessToken) {
    if (!refreshToken) return null

    // Try to refresh the token
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

      if (!response.ok) return null

      const tokens = await response.json()
      accessToken = tokens.access_token
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return null
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

    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '20')

    // Get list of messages
    const messagesResponse = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?` +
      new URLSearchParams({
        maxResults: maxResults.toString(),
        q: 'in:inbox'
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      console.error('Gmail API error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
    }

    const messagesData = await messagesResponse.json()
    const messageIds = messagesData.messages || []

    // Get details for each message (in batches to avoid rate limits)
    const emails = []
    for (const { id } of messageIds.slice(0, maxResults)) {
      try {
        const messageResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        )

        if (messageResponse.ok) {
          const message = await messageResponse.json()
          const headers = message.payload?.headers || []

          const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

          emails.push({
            id: message.id,
            subject: getHeader('Subject'),
            from: getHeader('From'),
            date: getHeader('Date'),
            snippet: message.snippet || '',
            labels: message.labelIds || [],
            read: !message.labelIds?.includes('UNREAD')
          })
        }
      } catch (error) {
        console.error(`Error fetching message ${id}:`, error)
        // Continue with other messages
      }
    }

    return NextResponse.json(emails)
  } catch (error) {
    console.error('Error in Gmail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}