'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Terminal,
  Bug,
  Info,
  AlertTriangle,
  X,
  RefreshCw,
  Download,
  Filter,
  Trash2
} from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  level: string
  message: string
  context?: any
  endpoint?: string
  userId?: string
}

interface LoggingDashboardProps {
  className?: string
  maxEntries?: number
}

export function LoggingDashboard({ className, maxEntries = 100 }: LoggingDashboardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  // In a real implementation, you'd connect to a logging service or WebSocket
  // For now, we'll simulate some log entries
  useEffect(() => {
    if (isExpanded) {
      // Simulate loading logs (in production, this would fetch from your logging service)
      const sampleLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Application started successfully',
          context: { version: '1.0.0' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'WARN',
          message: 'Profile query error (expected if columns missing)',
          context: { error: 'invalid input syntax for type uuid: "robertfreyne@gmail.com"' },
          endpoint: '/api/sync'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'SUCCESS',
          message: 'Google authentication verified',
          context: { user: 'robertfreyne@gmail.com', duration: 45 },
          endpoint: '/api/google-auth/status'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'ERROR',
          message: 'OpenAI API timeout',
          context: { operation: 'email_categorization', timeout: 10000 },
          endpoint: '/api/gmail-insights'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'PERFORMANCE',
          message: 'Slow operation detected',
          context: { operation: 'calendar_sync', duration: 5500 },
          endpoint: '/api/calendar-insights'
        }
      ]
      setLogs(sampleLogs)
    }
  }, [isExpanded])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.level.toLowerCase() === filter.toLowerCase()
  })

  const getLogIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return <X className="h-4 w-4 text-red-500" />
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      case 'debug': return <Bug className="h-4 w-4 text-gray-500" />
      case 'success': return <div className="h-4 w-4 rounded-full bg-green-500" />
      case 'performance': return <div className="h-4 w-4 rounded-full bg-purple-500" />
      default: return <Terminal className="h-4 w-4 text-gray-500" />
    }
  }

  const getLogBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'destructive'
      case 'warn': return 'secondary'
      case 'success': return 'default'
      default: return 'outline'
    }
  }

  const exportLogs = () => {
    const logData = JSON.stringify(logs, null, 2)
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    setLogs([])
  }

  if (!isExpanded) {
    return (
      <Card className={`${className} cursor-pointer hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Development Logs</span>
              <Badge variant="outline" className="text-xs">
                {logs.length} entries
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              View Logs
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
            <Terminal className="h-5 w-5" />
            Development Logging Dashboard
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Controls */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'error', 'warn', 'info', 'success', 'performance'].map(level => (
            <Button
              key={level}
              variant={filter === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(level)}
            >
              <Filter className="h-3 w-3 mr-1" />
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>

        {/* Log Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['error', 'warn', 'info', 'success', 'performance'].map(level => {
            const count = logs.filter(log => log.level.toLowerCase() === level).length
            return (
              <div key={level} className="text-center p-2 border rounded">
                <div className="flex justify-center mb-1">{getLogIcon(level)}</div>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">{level}</div>
              </div>
            )
          })}
        </div>

        {/* Log Entries */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'all' ? 'No logs available' : `No ${filter} logs found`}
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getLogIcon(log.level)}
                    <Badge variant={getLogBadgeVariant(log.level)} className="text-xs">
                      {log.level}
                    </Badge>
                    {log.endpoint && (
                      <Badge variant="outline" className="text-xs">
                        {log.endpoint}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-sm mb-2">{log.message}</div>

                {log.context && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Context
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>

        {/* Development Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📊 Current Logging Insights</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• Profile UUID errors: Database expects UUID format, receiving email strings</div>
            <div>• NextAuth debug mode enabled: Consider disabling in production</div>
            <div>• OpenAI timeouts: API calls taking longer than 10s threshold</div>
            <div>• Slow operations: Some endpoints taking 5+ seconds to respond</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-3">
            <h5 className="font-medium text-sm mb-2">🔧 Quick Fixes</h5>
            <div className="text-xs space-y-1">
              <div>• Fix UUID format in user profiles</div>
              <div>• Add OpenAI timeout handling</div>
              <div>• Optimize slow database queries</div>
            </div>
          </Card>

          <Card className="p-3">
            <h5 className="font-medium text-sm mb-2">📈 Performance</h5>
            <div className="text-xs space-y-1">
              <div>• Avg response time: 2.3s</div>
              <div>• Slowest endpoint: /api/dashboard</div>
              <div>• Cache hit rate: 67%</div>
            </div>
          </Card>

          <Card className="p-3">
            <h5 className="font-medium text-sm mb-2">🚀 Suggestions</h5>
            <div className="text-xs space-y-1">
              <div>• Enable request caching</div>
              <div>• Add health check endpoint</div>
              <div>• Implement rate limiting</div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}