import { google } from 'googleapis'
import { createClient } from './supabase'

export interface EmailMessage {
  id: string
  threadId: string
  subject: string
  sender: string
  recipients: string[]
  bodyPreview: string
  receivedAt: Date
  isRead: boolean
  hasAttachments: boolean
  labels: string[]
}

export interface EmailStats {
  totalEmails: number
  unreadCount: number
  importantCount: number
  todayCount: number
  weekCount: number
  topSenders: Array<{ email: string; count: number }>
  averageResponseTime?: number
}

export interface EmailAccount {
  id: string
  email_address: string
  access_token: string
  refresh_token?: string
  token_expires_at?: Date
}

export class GmailService {
  private gmail
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

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
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

  async getMessages(maxResults: number = 10, query?: string): Promise<EmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query
      })

      const messages = response.data.messages || []
      const detailedMessages: EmailMessage[] = []

      for (const message of messages) {
        if (message.id) {
          const detail = await this.getMessageDetails(message.id)
          if (detail) {
            detailedMessages.push(detail)
          }
        }
      }

      return detailedMessages
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  async getMessageDetails(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      const message = response.data
      if (!message || !message.payload) {
        return null
      }

      const headers = message.payload.headers || []
      const getHeader = (name: string) =>
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const to = getHeader('To')
      const date = getHeader('Date')

      // Extract body preview
      let bodyPreview = ''
      if (message.snippet) {
        bodyPreview = message.snippet
      }

      // Check if message is read
      const isRead = !message.labelIds?.includes('UNREAD')

      // Check for attachments
      const hasAttachments = this.hasAttachments(message.payload)

      return {
        id: messageId,
        threadId: message.threadId || '',
        subject,
        sender: from,
        recipients: to.split(',').map(r => r.trim()).filter(r => r),
        bodyPreview,
        receivedAt: date ? new Date(date) : new Date(),
        isRead,
        hasAttachments,
        labels: message.labelIds || []
      }
    } catch (error) {
      console.error('Error fetching message details:', error)
      return null
    }
  }

  private hasAttachments(payload: any): boolean {
    if (payload.parts) {
      return payload.parts.some((part: any) =>
        part.filename && part.filename.length > 0
      )
    }
    return false
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      })
      return true
    } catch (error) {
      console.error('Error marking message as read:', error)
      return false
    }
  }

  async markAsUnread(messageId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['UNREAD']
        }
      })
      return true
    } catch (error) {
      console.error('Error marking message as unread:', error)
      return false
    }
  }

  async archiveMessage(messageId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['INBOX']
        }
      })
      return true
    } catch (error) {
      console.error('Error archiving message:', error)
      return false
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n')

      const encodedEmail = Buffer.from(email).toString('base64url')

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      })

      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  /**
   * Calculate email statistics from messages
   */
  calculateEmailStats(messages: EmailMessage[]): EmailStats {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    // Count emails by criteria
    const unreadCount = messages.filter(e => !e.isRead).length
    const importantCount = messages.filter(e => e.labels.includes('IMPORTANT')).length
    const todayCount = messages.filter(e => e.receivedAt >= todayStart).length
    const weekCount = messages.filter(e => e.receivedAt >= weekStart).length

    // Calculate top senders
    const senderCounts = messages.reduce((acc, email) => {
      const sender = email.sender.replace(/.*<(.+)>.*/, '$1').toLowerCase()
      acc[sender] = (acc[sender] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topSenders = Object.entries(senderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({ email, count }))

    return {
      totalEmails: messages.length,
      unreadCount,
      importantCount,
      todayCount,
      weekCount,
      topSenders,
    }
  }

  /**
   * Sync Gmail data to Supabase database
   */
  async syncToDatabase(userId: string): Promise<{ success: boolean; emailCount: number; error?: string }> {
    try {
      console.log(`Starting Gmail sync for user ${userId}`)

      // Fetch recent emails (more for initial sync)
      const messages = await this.getMessages(100, 'in:inbox OR in:sent')

      if (messages.length === 0) {
        return { success: true, emailCount: 0 }
      }

      // Calculate stats
      const stats = this.calculateEmailStats(messages)

      // Save email data to database
      const emailInserts = messages.map(message => ({
        user_id: userId,
        email_id: message.id,
        thread_id: message.threadId,
        subject: message.subject,
        sender: message.sender,
        recipients: message.recipients,
        date_received: message.receivedAt.toISOString(),
        snippet: message.bodyPreview,
        is_read: message.isRead,
        is_important: message.labels.includes('IMPORTANT'),
        labels: message.labels,
        has_attachments: message.hasAttachments,
        synced_at: new Date().toISOString(),
      }))

      // Upsert emails (insert or update on conflict)
      const supabase = createClient()
      const { error: emailError } = await supabase
        .from('user_emails')
        .upsert(emailInserts, {
          onConflict: 'user_id,email_id',
          ignoreDuplicates: false
        })

      if (emailError) {
        console.error('Error saving email data:', emailError)
        throw emailError
      }

      // Save email stats
      const { error: statsError } = await supabase
        .from('user_email_stats')
        .upsert({
          user_id: userId,
          total_emails: stats.totalEmails,
          unread_count: stats.unreadCount,
          important_count: stats.importantCount,
          today_count: stats.todayCount,
          week_count: stats.weekCount,
          top_senders: stats.topSenders,
          last_sync: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (statsError) {
        console.error('Error saving email stats:', statsError)
        throw statsError
      }

      console.log(`Gmail sync completed: ${messages.length} emails synced`)

      return { success: true, emailCount: messages.length }

    } catch (error) {
      console.error('Gmail sync failed:', error)
      return {
        success: false,
        emailCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Get user's Gmail data from database
 */
export async function getUserEmailData(userId: string) {
  try {
    const supabase = createClient()
    // Get email stats
    const { data: stats, error: statsError } = await supabase
      .from('user_email_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError
    }

    // Get recent emails
    const { data: emails, error: emailsError } = await supabase
      .from('user_emails')
      .select('*')
      .eq('user_id', userId)
      .order('date_received', { ascending: false })
      .limit(50)

    if (emailsError) {
      throw emailsError
    }

    return {
      stats: stats || null,
      emails: emails || [],
      lastSync: stats?.last_sync ? new Date(stats.last_sync) : null,
    }

  } catch (error) {
    console.error('Error fetching user email data:', error)
    throw error
  }
}