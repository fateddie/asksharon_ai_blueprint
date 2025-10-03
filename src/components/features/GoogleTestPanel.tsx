'use client'

import { useState, useEffect } from 'react'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { googleService } from '@/lib/google-direct'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Calendar, TrendingUp, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface GoogleTestPanelProps {
  className?: string
}

export function GoogleTestPanel({ className }: GoogleTestPanelProps) {
  const { user, isAuthenticated, isLoading, connect, disconnect } = useGoogleAuth()
  const [stats, setStats] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [emails, setEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastTest, setLastTest] = useState<Date | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadGoogleData()
    }
  }, [isAuthenticated])

  const loadGoogleData = async () => {
    setLoading(true)
    try {
      // Load stats, calendar events, and emails in parallel
      const [statsData, eventsData, emailsData] = await Promise.all([
        googleService.getQuickStats().catch(() => null),
        googleService.getCalendarEvents(3).catch(() => []),
        googleService.getEmails(5).catch(() => [])
      ])

      setStats(statsData)
      setEvents(eventsData)
      setEmails(emailsData)
      setLastTest(new Date())
    } catch (error) {
      console.error('Error loading Google data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (isAuthenticated) {
      loadGoogleData()
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Google Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Connect your Google account to test Gmail and Calendar integration
            </p>
            <Button onClick={connect} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Connect Google Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Google Integration Test
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={disconnect} size="sm" variant="destructive">
              Disconnect
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Connected to Google</p>
              <p className="text-sm text-green-600">
                {user?.email} • Connected {lastTest ? `at ${lastTest.toLocaleTimeString()}` : 'now'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{stats.upcomingEvents}</div>
              <div className="text-sm text-blue-600">Upcoming Events</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Mail className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{stats.unreadEmails}</div>
              <div className="text-sm text-orange-600">Unread Emails</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stats.todaysMeetings}</div>
              <div className="text-sm text-purple-600">Today's Meetings</div>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {events.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next 3 Days - Calendar Events
            </h4>
            <div className="space-y-2">
              {events.slice(0, 3).map((event, index) => (
                <div key={index} className="p-3 border rounded-lg bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{event.title}</h5>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.start).toLocaleDateString()} at{' '}
                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>
                      )}
                    </div>
                    <Badge variant="secondary">Calendar</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Emails */}
        {emails.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Recent Emails
            </h4>
            <div className="space-y-2">
              {emails.slice(0, 3).map((email, index) => (
                <div key={index} className="p-3 border rounded-lg bg-card">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h5 className="font-medium truncate">{email.subject}</h5>
                      <p className="text-sm text-muted-foreground truncate">{email.from}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{email.snippet}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <Badge variant={email.read ? "secondary" : "default"}>
                        {email.read ? "Read" : "Unread"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(email.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading Google data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}