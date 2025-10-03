import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { CalendarService } from '@/lib/calendar'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const maxResults = parseInt(searchParams.get('maxResults') || '50')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get the email account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Initialize Calendar service
    const calendarService = new CalendarService(
      account.access_token,
      account.refresh_token
    )

    // Fetch events from Google Calendar
    const timeMin = startDate ? new Date(startDate) : new Date()
    const timeMax = endDate ? new Date(endDate) : undefined

    const events = await calendarService.getEvents('primary', timeMin, timeMax, maxResults)

    // Store or update events in database
    for (const event of events) {
      await supabase
        .from('calendar_events')
        .upsert({
          user_id: session.user.id,
          email_account_id: account.id,
          google_event_id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          start_time: event.startTime.toISOString(),
          end_time: event.endTime.toISOString(),
          is_all_day: event.isAllDay,
          attendees: event.attendees,
          organizer: event.organizer?.email,
          status: event.status,
          visibility: event.visibility,
          recurrence: event.recurrence?.join(',')
        }, {
          onConflict: 'email_account_id,google_event_id'
        })
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error in GET /api/calendar/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, title, description, location, startTime, endTime, isAllDay, attendees } = body

    if (!accountId || !title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get the email account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Initialize Calendar service
    const calendarService = new CalendarService(
      account.access_token,
      account.refresh_token
    )

    // Create event in Google Calendar
    const newEvent = await calendarService.createEvent({
      title,
      description,
      location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isAllDay: isAllDay || false,
      attendees: attendees || [],
      status: 'confirmed',
      visibility: 'default'
    })

    if (!newEvent) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    // Store event in database
    const { data: dbEvent, error: dbError } = await supabase
      .from('calendar_events')
      .insert({
        user_id: session.user.id,
        email_account_id: account.id,
        google_event_id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        start_time: newEvent.startTime.toISOString(),
        end_time: newEvent.endTime.toISOString(),
        is_all_day: newEvent.isAllDay,
        attendees: newEvent.attendees,
        organizer: newEvent.organizer?.email,
        status: newEvent.status,
        visibility: newEvent.visibility,
        recurrence: newEvent.recurrence?.join(',')
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error storing event in database:', dbError)
    }

    return NextResponse.json({ event: newEvent }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/calendar/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}