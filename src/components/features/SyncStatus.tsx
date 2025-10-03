'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Activity
} from 'lucide-react'

interface SyncStatusData {
  user: {
    id: string
    email: string
    lastSync: string | null
  }
  gmail: {
    enabled: boolean
    lastSync: string | null
    totalEmails: number
    unreadCount: number
  }
  calendar: {
    enabled: boolean
    lastSync: string | null
    totalEvents: number
    todayEvents: number
  }
  hasGoogleAccount: boolean
  needsReauth: boolean
}

interface SyncStatusProps {
  compact?: boolean
  showDetails?: boolean
  autoRefresh?: boolean
}

export default function SyncStatus({
  compact = false,
  showDetails = true,
  autoRefresh = true
}: SyncStatusProps) {
  const { data: session } = useSession()
  const [syncData, setSyncData] = useState<SyncStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync')
      if (response.ok) {
        const data = await response.json()
        setSyncData(data)
      }
    } catch (error) {
      console.error('Error fetching sync status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger manual sync
  const triggerSync = async (syncType: 'gmail' | 'calendar' | 'all') => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ syncType }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Sync completed:', result)

        // Refresh status after sync
        await fetchSyncStatus()
        setLastRefresh(new Date())
      } else {
        console.error('Sync failed:', await response.text())
      }
    } catch (error) {
      console.error('Error during sync:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    if (session) {
      fetchSyncStatus()
    }
  }, [session])

  useEffect(() => {
    if (autoRefresh && session) {
      const interval = setInterval(() => {
        fetchSyncStatus()
        setLastRefresh(new Date())
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, session])

  if (!session || isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading sync status...</span>
        </div>
      </Card>
    )
  }

  if (!syncData?.hasGoogleAccount) {
    return null // Google account not connected
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getSyncStatusIcon = (lastSync: string | null) => {
    if (!lastSync) return <AlertCircle className="h-4 w-4 text-orange-500" />

    const date = new Date(lastSync)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffHours < 1) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (diffHours < 24) return <Clock className="h-4 w-4 text-blue-500" />
    return <AlertCircle className="h-4 w-4 text-orange-500" />
  }

  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-blue-500" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Data Sync</span>
                {isSyncing && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {syncData.gmail.enabled && (
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{formatRelativeTime(syncData.gmail.lastSync)}</span>
                  </div>
                )}
                {syncData.calendar.enabled && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatRelativeTime(syncData.calendar.lastSync)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={() => triggerSync('all')}
            disabled={isSyncing}
            size="sm"
            variant="outline"
            className="btn btn-sm"
          >
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="font-semibold">Data Synchronization</h3>
            <p className="text-sm text-muted-foreground">
              Last updated: {formatRelativeTime(syncData.user.lastSync)}
            </p>
          </div>
        </div>
        {isSyncing && <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />}
      </div>

      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Gmail Status */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Gmail</span>
                {getSyncStatusIcon(syncData.gmail.lastSync)}
              </div>
              <Badge variant={syncData.gmail.enabled ? "default" : "secondary"}>
                {syncData.gmail.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            {syncData.gmail.enabled && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Emails:</span>
                  <span className="font-medium">{syncData.gmail.totalEmails.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unread:</span>
                  <span className="font-medium">{syncData.gmail.unreadCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">{formatRelativeTime(syncData.gmail.lastSync)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Calendar Status */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <span className="font-medium">Calendar</span>
                {getSyncStatusIcon(syncData.calendar.lastSync)}
              </div>
              <Badge variant={syncData.calendar.enabled ? "default" : "secondary"}>
                {syncData.calendar.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            {syncData.calendar.enabled && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Events:</span>
                  <span className="font-medium">{syncData.calendar.totalEvents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today:</span>
                  <span className="font-medium">{syncData.calendar.todayEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">{formatRelativeTime(syncData.calendar.lastSync)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => triggerSync('all')}
          disabled={isSyncing}
          className="btn btn-primary"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </>
          )}
        </Button>

        {syncData.gmail.enabled && (
          <Button
            onClick={() => triggerSync('gmail')}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="btn btn-outline btn-sm"
          >
            <Mail className="h-4 w-4 mr-1" />
            Gmail Only
          </Button>
        )}

        {syncData.calendar.enabled && (
          <Button
            onClick={() => triggerSync('calendar')}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="btn btn-outline btn-sm"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Calendar Only
          </Button>
        )}
      </div>

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <div className="flex items-start space-x-2">
          <Database className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">
              <strong>Auto-sync:</strong> Your data automatically syncs every few hours.
              Use manual sync for immediate updates or when you need the latest information.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}