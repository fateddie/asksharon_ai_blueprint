// Direct Google API integration without NextAuth
export interface GoogleCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  attendees?: Array<{
    email: string
    name?: string
  }>
}

export interface GoogleEmail {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
  labels: string[]
  read: boolean
}

class GoogleDirectService {
  private async getAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/google-auth/status')
      if (!response.ok) return null

      const data = await response.json()
      if (!data.authenticated) return null

      // The token is httpOnly, so we need to make API calls through our backend
      return 'valid' // We'll use this as a flag that auth is valid
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }

  async getCalendarEvents(days: number = 7): Promise<GoogleCalendarEvent[]> {
    const token = await this.getAccessToken()
    if (!token) throw new Error('Not authenticated with Google')

    try {
      const response = await fetch(`/api/google-calendar?days=${days}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      throw error
    }
  }

  async getEmails(maxResults: number = 20): Promise<GoogleEmail[]> {
    const token = await this.getAccessToken()
    if (!token) throw new Error('Not authenticated with Google')

    try {
      const response = await fetch(`/api/google-gmail?maxResults=${maxResults}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching emails:', error)
      throw error
    }
  }

  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id'>): Promise<GoogleCalendarEvent> {
    const token = await this.getAccessToken()
    if (!token) throw new Error('Not authenticated with Google')

    try {
      const response = await fetch('/api/google-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const token = await this.getAccessToken()
    if (!token) throw new Error('Not authenticated with Google')

    try {
      const response = await fetch('/api/google-gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, body }),
      })

      return response.ok
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  async getQuickStats(): Promise<{
    upcomingEvents: number
    unreadEmails: number
    todaysMeetings: number
  }> {
    const token = await this.getAccessToken()
    if (!token) throw new Error('Not authenticated with Google')

    try {
      const response = await fetch('/api/google-stats')
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching quick stats:', error)
      return {
        upcomingEvents: 0,
        unreadEmails: 0,
        todaysMeetings: 0
      }
    }
  }
}

export const googleService = new GoogleDirectService()