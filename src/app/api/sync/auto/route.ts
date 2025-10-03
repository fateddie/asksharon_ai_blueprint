/**
 * Auto-Sync API Endpoint
 * Handles automatic background synchronization for all active users
 * Location: /src/app/api/sync/auto/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { GmailService } from '@/lib/gmail'
import { CalendarService } from '@/lib/calendar'

const supabase = createClient()

// This endpoint can be called by cron jobs or webhooks for automatic syncing
export async function POST(request: NextRequest) {
  try {
    // Simple API key authentication for automated calls
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_TOKEN || 'sync-secret-token'

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API token required.' },
        { status: 401 }
      )
    }

    console.log('Starting automatic sync for all users...')

    // Get all users who have Google accounts connected and enabled sync
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        gmail_enabled,
        calendar_enabled,
        last_sync,
        google_access_token,
        google_refresh_token
      `)
      .not('google_access_token', 'is', null)
      .or('gmail_enabled.eq.true,calendar_enabled.eq.true')

    if (usersError) {
      console.error('Error fetching users for sync:', usersError)
      throw usersError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: 'No users found with Google accounts enabled for sync',
        totalUsers: 0,
        successful: 0,
        failed: 0
      })
    }

    console.log(`Found ${users.length} users to sync`)

    const syncResults = {
      totalUsers: users.length,
      successful: 0,
      failed: 0,
      details: [] as any[]
    }

    // Process each user
    for (const user of users) {
      const userResult = {
        userId: user.user_id,
        gmail: { attempted: false, success: false, emailCount: 0 },
        calendar: { attempted: false, success: false, eventCount: 0 },
        error: null as string | null
      }

      try {
        const accessToken = user.google_access_token
        const refreshToken = user.google_refresh_token

        if (!accessToken) {
          userResult.error = 'No access token available'
          syncResults.failed++
          syncResults.details.push(userResult)
          continue
        }

        // Sync Gmail if enabled
        if (user.gmail_enabled) {
          try {
            userResult.gmail.attempted = true
            const gmailService = new GmailService(accessToken, refreshToken)
            const gmailResult = await gmailService.syncToDatabase(user.user_id)
            userResult.gmail.success = gmailResult.success
            userResult.gmail.emailCount = gmailResult.emailCount
          } catch (error) {
            console.error(`Gmail sync failed for user ${user.user_id}:`, error)
            userResult.gmail.success = false
          }
        }

        // Sync Calendar if enabled
        if (user.calendar_enabled) {
          try {
            userResult.calendar.attempted = true
            const calendarService = new CalendarService(accessToken, refreshToken)
            const calendarResult = await calendarService.syncToDatabase(user.user_id)
            userResult.calendar.success = calendarResult.success
            userResult.calendar.eventCount = calendarResult.eventCount
          } catch (error) {
            console.error(`Calendar sync failed for user ${user.user_id}:`, error)
            userResult.calendar.success = false
          }
        }

        // Update last sync timestamp
        await supabase
          .from('user_profiles')
          .update({ last_sync: new Date().toISOString() })
          .eq('user_id', user.user_id)

        // Check if any sync was successful
        const anySuccess = userResult.gmail.success || userResult.calendar.success
        if (anySuccess) {
          syncResults.successful++
        } else {
          syncResults.failed++
          if (!userResult.error) {
            userResult.error = 'All enabled sync operations failed'
          }
        }

      } catch (error) {
        console.error(`Sync failed for user ${user.user_id}:`, error)
        userResult.error = error instanceof Error ? error.message : 'Unknown error'
        syncResults.failed++
      }

      syncResults.details.push(userResult)
    }

    console.log('Auto-sync completed:', {
      totalUsers: syncResults.totalUsers,
      successful: syncResults.successful,
      failed: syncResults.failed
    })

    return NextResponse.json({
      message: `Auto-sync completed for ${syncResults.totalUsers} users`,
      ...syncResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Auto-sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during auto-sync' },
      { status: 500 }
    )
  }
}

// GET endpoint to get auto-sync status/logs
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_TOKEN || 'sync-secret-token'

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API token required.' },
        { status: 401 }
      )
    }

    // Get sync statistics from database
    const { data: stats, error } = await supabase
      .from('user_profiles')
      .select('user_id, last_sync, gmail_enabled, calendar_enabled')
      .not('google_access_token', 'is', null)

    if (error) {
      throw error
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const summary = {
      totalUsers: stats?.length || 0,
      usersWithGmail: stats?.filter(u => u.gmail_enabled).length || 0,
      usersWithCalendar: stats?.filter(u => u.calendar_enabled).length || 0,
      recentlySynced: stats?.filter(u =>
        u.last_sync && new Date(u.last_sync) > oneDayAgo
      ).length || 0,
      needsSync: stats?.filter(u =>
        !u.last_sync || new Date(u.last_sync) < oneDayAgo
      ).length || 0,
    }

    return NextResponse.json({
      summary,
      lastChecked: now.toISOString(),
      users: stats?.map(user => ({
        userId: user.user_id,
        lastSync: user.last_sync,
        gmailEnabled: user.gmail_enabled,
        calendarEnabled: user.calendar_enabled,
        needsSync: !user.last_sync || new Date(user.last_sync) < oneDayAgo
      })) || []
    })

  } catch (error) {
    console.error('Auto-sync status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get auto-sync status' },
      { status: 500 }
    )
  }
}