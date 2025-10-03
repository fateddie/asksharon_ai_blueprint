'use client'

import { useState, useEffect } from 'react'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Brain,
  Mail,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Plus,
  Lightbulb
} from 'lucide-react'

interface AIInsightsDashboardProps {
  className?: string
}

export function AIInsightsDashboard({ className }: AIInsightsDashboardProps) {
  const { isAuthenticated } = useGoogleAuth()
  const [emailInsights, setEmailInsights] = useState<any>(null)
  const [calendarInsights, setCalendarInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    duration: 60,
    description: '',
    attendees: ''
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadAIInsights()
    }
  }, [isAuthenticated])

  const loadAIInsights = async () => {
    setLoading(true)
    try {
      // Use simple insights for faster response, with option to upgrade to full AI
      const [emailResponse, calendarResponse] = await Promise.all([
        fetch('/api/gmail-insights-simple?maxResults=10'),
        fetch('/api/calendar-insights').catch(() => null) // Optional, may timeout
      ])

      if (emailResponse.ok) {
        const emailData = await emailResponse.json()
        setEmailInsights(emailData)
      }

      if (calendarResponse && calendarResponse.ok) {
        const calendarData = await calendarResponse.json()
        setCalendarInsights(calendarData)
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestMeetingTime = async () => {
    if (!meetingForm.title.trim()) return

    try {
      const response = await fetch('/api/calendar-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_meeting_time',
          title: meetingForm.title,
          duration: meetingForm.duration,
          attendees: meetingForm.attendees.split(',').map(e => e.trim()).filter(Boolean)
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Meeting suggestions:', data.suggestions)
        // You could show these suggestions in a modal or update state
        alert(`Found ${data.suggestions.length} optimal meeting times! Check console for details.`)
      }
    } catch (error) {
      console.error('Error getting meeting suggestions:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Productivity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect your Google account to unlock AI-powered productivity insights
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Productivity Insights
              </span>
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
            <Button onClick={loadAIInsights} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Email AI Insights */}
      {emailInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Smart Email Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {emailInsights.summary.urgentCount}
                </div>
                <div className="text-sm text-red-600">Urgent Emails</div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {emailInsights.summary.actionRequired}
                </div>
                <div className="text-sm text-orange-600">Need Response</div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {emailInsights.summary.totalProcessed}
                </div>
                <div className="text-sm text-green-600">Analyzed</div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <Brain className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">AI</div>
                <div className="text-sm text-purple-600">Powered</div>
              </div>
            </div>

            {/* Key Highlights */}
            {emailInsights.summary.keyHighlights.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Key Highlights
                </h4>
                <div className="space-y-2">
                  {emailInsights.summary.keyHighlights.map((highlight: string, index: number) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <span className="text-sm">{highlight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {emailInsights.summary.suggestedActions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Suggested Actions</h4>
                <div className="space-y-2">
                  {emailInsights.summary.suggestedActions.slice(0, 3).map((action: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{action.action}</div>
                        <div className="text-xs text-muted-foreground truncate">{action.email}</div>
                      </div>
                      <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'}>
                        {action.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar AI Insights */}
      {calendarInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Smart Calendar Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calendar Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(calendarInsights.insights.meetingPatterns.averageDuration)}m
                </div>
                <div className="text-sm text-blue-600">Avg Meeting</div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {calendarInsights.insights.freeTimes.length}
                </div>
                <div className="text-sm text-green-600">Free Slots</div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(calendarInsights.insights.meetingPatterns.dailyMeetingCount)}
                </div>
                <div className="text-sm text-purple-600">Daily Meetings</div>
              </div>
            </div>

            {/* AI Suggestions */}
            {calendarInsights.insights.suggestions && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Productivity Suggestions
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Focus Time */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">Best Focus Times</h5>
                    <div className="space-y-1">
                      {calendarInsights.insights.suggestions.bestTimeForFocus.map((time: string, index: number) => (
                        <div key={index} className="text-sm text-green-700">📍 {time}</div>
                      ))}
                    </div>
                  </div>

                  {/* Meeting Times */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Optimal Meeting Times</h5>
                    <div className="space-y-1">
                      {calendarInsights.insights.suggestions.recommendedMeetingTimes.map((time: string, index: number) => (
                        <div key={index} className="text-sm text-blue-700">🕒 {time}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Work-Life Balance */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-purple-800">Work-Life Balance</h5>
                    <Badge variant="secondary">
                      {calendarInsights.insights.suggestions.workLifeBalance.score}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-purple-700">
                    {calendarInsights.insights.suggestions.workLifeBalance.suggestion}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Smart Meeting Scheduler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              AI Meeting Scheduler
            </div>
            <Button
              onClick={() => setShowMeetingForm(!showMeetingForm)}
              size="sm"
              variant={showMeetingForm ? "outline" : "default"}
            >
              <Plus className="h-4 w-4 mr-1" />
              {showMeetingForm ? 'Cancel' : 'Schedule Meeting'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showMeetingForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Meeting Title</label>
                <Input
                  placeholder="Team standup"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({...meetingForm, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={meetingForm.duration}
                  onChange={(e) => setMeetingForm({...meetingForm, duration: parseInt(e.target.value) || 60})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Attendees (comma-separated emails)</label>
              <Input
                placeholder="john@example.com, jane@example.com"
                value={meetingForm.attendees}
                onChange={(e) => setMeetingForm({...meetingForm, attendees: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Meeting agenda and details..."
                value={meetingForm.description}
                onChange={(e) => setMeetingForm({...meetingForm, description: e.target.value})}
              />
            </div>

            <Button onClick={handleSuggestMeetingTime} className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Get AI Scheduling Suggestions
            </Button>
          </CardContent>
        )}
      </Card>

      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">AI is analyzing your data...</p>
        </div>
      )}
    </div>
  )
}