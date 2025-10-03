/**
 * Data Sync API Endpoint
 * Handles automatic synchronization of Gmail and Calendar data
 * Location: /src/app/api/sync/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { GmailService } from '@/lib/gmail'
import { CalendarService } from '@/lib/calendar'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateUserUUID } from '@/lib/uuid'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { syncType } = await request.json()

    if (!['gmail', 'calendar', 'all'].includes(syncType)) {
      return NextResponse.json(
        { error: 'Invalid sync type. Must be "gmail", "calendar", or "all"' },
        { status: 400 }
      )
    }

    const userId = session.user.email ? generateUserUUID(session.user.email) : 'unknown'
    const accessToken = session.accessToken as string
    const refreshToken = session.refreshToken as string

    const results: any = {
      syncType,
      timestamp: new Date().toISOString(),
      results: {}
    }

    // Sync Gmail data
    if (syncType === 'gmail' || syncType === 'all') {
      try {
        console.log('Starting Gmail sync...')
        const gmailService = new GmailService(accessToken, refreshToken)
        const gmailResult = await gmailService.syncToDatabase(userId)
        results.results.gmail = gmailResult
        console.log('Gmail sync completed:', gmailResult)
      } catch (error) {
        console.error('Gmail sync failed:', error)
        results.results.gmail = {
          success: false,
          emailCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Sync Calendar data
    if (syncType === 'calendar' || syncType === 'all') {
      try {
        console.log('Starting Calendar sync...')
        const calendarService = new CalendarService(accessToken, refreshToken)
        const calendarResult = await calendarService.syncToDatabase(userId)
        results.results.calendar = calendarResult
        console.log('Calendar sync completed:', calendarResult)
      } catch (error) {
        console.error('Calendar sync failed:', error)
        results.results.calendar = {
          success: false,
          eventCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Update last sync timestamp in user profile (skip if columns don't exist)
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      // Try to update user profile, but don't fail if columns don't exist
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            user_id: userId,
            email: session.user.email,
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
        console.log('✅ User profile updated (basic columns only)')
      } catch (profileError) {
        console.log('⚠️  User profile update skipped:', profileError.message)
      }
    } catch (error) {
      console.error('Error updating user profile sync status:', error)
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.email ? generateUserUUID(session.user.email) : 'unknown'
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get sync status from user profile (handle missing columns gracefully)
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('id', userId)
        .single()

      profile = profileData
      if (profileError && profileError.code !== 'PGRST116') {
        console.log('⚠️  Profile query error (expected if columns missing):', profileError.message)
      }
    } catch (error) {
      console.log('⚠️  Profile access error (expected if columns missing):', error.message)
    }

    // Get latest sync data
    const [emailStats, calendarStats] = await Promise.allSettled([
      supabase
        .from('user_email_stats')
        .select('last_sync, total_emails, unread_count')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('user_calendar_stats')
        .select('last_sync, total_events, today_events')
        .eq('user_id', userId)
        .single()
    ])

    const gmailStatus = emailStats.status === 'fulfilled' && emailStats.value.data
      ? {
          lastSync: emailStats.value.data.last_sync,
          totalEmails: emailStats.value.data.total_emails,
          unreadCount: emailStats.value.data.unread_count,
          enabled: false
        }
      : { enabled: false, lastSync: null }

    const calendarStatus = calendarStats.status === 'fulfilled' && calendarStats.value.data
      ? {
          lastSync: calendarStats.value.data.last_sync,
          totalEvents: calendarStats.value.data.total_events,
          todayEvents: calendarStats.value.data.today_events,
          enabled: false
        }
      : { enabled: false, lastSync: null }

    return NextResponse.json({
      user: {
        id: userId,
        email: session.user.email,
        lastSync: null
      },
      gmail: gmailStatus,
      calendar: calendarStatus,
      hasGoogleAccount: !!session.accessToken,
      needsReauth: false // Could be enhanced to check token expiry
    })

  } catch (error) {
    console.error('Sync status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}