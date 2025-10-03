'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, RefreshCw, MailOpen, MailX, AlertCircle, Inbox, Archive, Star } from 'lucide-react'

interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  labelIds: string[]
  payload?: {
    headers: Array<{
      name: string
      value: string
    }>
  }
}

interface ProcessedEmail {
  id: string
  subject: string
  sender: string
  snippet: string
  date: string
  isRead: boolean
  isImportant: boolean
  labels: string[]
}

function EmailManager() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ProcessedEmail[]>([])
  const [unreadMessages, setUnreadMessages] = useState<ProcessedEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    important: 0
  })

  useEffect(() => {
    if (session?.accessToken) {
      fetchRealGmailData()
    }
  }, [session])

  const fetchRealGmailData = async () => {
    if (!session?.accessToken) return

    setLoading(true)
    setError(null)
    try {
      console.log('📧 Fetching real Gmail data...')

      // Fetch recent messages
      const messagesResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=20', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
        },
      })

      if (!messagesResponse.ok) {
        throw new Error(`Failed to fetch Gmail messages: ${messagesResponse.status}`)
      }

      const messagesData = await messagesResponse.json()
      console.log('📧 Gmail messages fetched:', messagesData.messages?.length || 0)

      // Fetch unread messages
      const unreadResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
        },
      })

      const unreadData = unreadResponse.ok ? await unreadResponse.json() : { messages: [] }

      // Process messages to get details
      const processedMessages: ProcessedEmail[] = []
      const processedUnread: ProcessedEmail[] = []

      if (messagesData.messages) {
        // Get detailed info for first 10 messages
        const messageDetails = await Promise.allSettled(
          messagesData.messages.slice(0, 10).map(async (msg: { id: string }) => {
            const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/json',
              },
            })
            return response.ok ? response.json() : null
          })
        )

        messageDetails.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const message: GmailMessage = result.value
            const headers = message.payload?.headers || []

            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
            const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString()

            const processed: ProcessedEmail = {
              id: message.id,
              subject,
              sender: from,
              snippet: message.snippet || '',
              date,
              isRead: !message.labelIds?.includes('UNREAD'),
              isImportant: message.labelIds?.includes('IMPORTANT') || false,
              labels: message.labelIds || []
            }

            processedMessages.push(processed)

            if (!processed.isRead) {
              processedUnread.push(processed)
            }
          }
        })
      }

      setMessages(processedMessages)
      setUnreadMessages(processedUnread)

      // Update stats
      setStats({
        total: messagesData.messages?.length || 0,
        unread: unreadData.messages?.length || 0,
        important: processedMessages.filter(m => m.isImportant).length
      })

      console.log('📧 Gmail data processed:', {
        total: processedMessages.length,
        unread: processedUnread.length
      })

    } catch (error) {
      console.error('❌ Error fetching Gmail data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch Gmail data')
    } finally {
      setLoading(false)
    }
  }

  const formatSender = (sender: string) => {
    // Extract name from email format "Name <email@domain.com>"
    const match = sender.match(/^(.+?)\s*</)
    return match ? match[1].trim() : sender
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  if (!session) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Email Manager</h3>
          <p className="text-gray-600 mb-4">Sign in to view your Gmail messages</p>
        </div>
      </Card>
    )
  }

  if (!session.accessToken) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gmail Access Required</h3>
          <p className="text-gray-600 mb-4">Please connect your Google account to view Gmail messages</p>
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
            <Mail className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold">Email Manager</h2>
          </div>
          <Button
            onClick={fetchRealGmailData}
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
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Inbox className="h-4 w-4 mr-2" />
              Total Messages
            </h3>
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center">
              <MailX className="h-4 w-4 mr-2" />
              Unread
            </h3>
            <p className="text-2xl font-bold text-red-700">{stats.unread}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Important
            </h3>
            <p className="text-2xl font-bold text-yellow-700">{stats.important}</p>
          </div>
        </div>
      </Card>

      {/* Unread Messages */}
      {unreadMessages.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MailX className="h-5 w-5 mr-2 text-red-600" />
            Unread Messages ({unreadMessages.length})
          </h3>

          <div className="space-y-3">
            {unreadMessages.map((message) => (
              <div key={message.id} className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4 hover:bg-red-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{message.subject}</h4>
                      <span className="text-sm text-gray-500">{formatDate(message.date)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">From: {formatSender(message.sender)}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.snippet}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Unread
                      </Badge>
                      {message.isImportant && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Important
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Messages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2 text-blue-600" />
          Recent Messages
        </h3>

        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No messages found</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`${!message.isRead ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                        {message.subject}
                      </h4>
                      <span className="text-sm text-gray-500">{formatDate(message.date)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">From: {formatSender(message.sender)}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.snippet}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      {!message.isRead && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          New
                        </Badge>
                      )}
                      {message.isImportant && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Important
                        </Badge>
                      )}
                    </div>
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

export { EmailManager }
export default EmailManager