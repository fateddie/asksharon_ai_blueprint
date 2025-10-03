/**
 * Dashboard Data Hook with Caching
 * Provides cached dashboard data with automatic refresh
 */

import { useState, useEffect, useCallback } from 'react'
import { useUser } from './useUser'

interface DashboardData {
  tasks: {
    total: number
    completed: number
    pending: number
    completedToday: number
    highPriority: number
  }
  habits: {
    total: number
    completedToday: number
    longestStreak: number
    currentStreaks: Array<{ name: string; streak: number }>
  }
  calendar: {
    todayEvents: number
    weekEvents: number
    upcomingEvents: Array<{ title: string; startTime: string }>
  }
  email: {
    unreadCount: number
    accounts: number
  }
}

// In-memory cache
let cachedData: DashboardData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useDashboardData() {
  const { user, hasGoogleAccess } = useUser()
  const [data, setData] = useState<DashboardData | null>(cachedData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchDashboard = useCallback(async (force = false) => {
    // Return cached data if valid and not forced
    const now = Date.now()
    if (!force && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      setData(cachedData)
      return
    }

    if (!hasGoogleAccess || !user) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      const dashboardData = result.data

      // Update cache
      cachedData = dashboardData
      cacheTimestamp = now
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [hasGoogleAccess, user])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (hasGoogleAccess && user) {
      fetchDashboard()
    }
  }, [hasGoogleAccess, user, fetchDashboard])

  // Invalidate cache function
  const invalidateCache = useCallback(() => {
    cachedData = null
    cacheTimestamp = 0
    fetchDashboard(true)
  }, [fetchDashboard])

  // Refresh with force option
  const refresh = useCallback(() => {
    fetchDashboard(true)
  }, [fetchDashboard])

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache
  }
}
