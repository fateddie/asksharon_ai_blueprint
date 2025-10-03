import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { CalendarService } from '@/lib/calendar'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, title, description, location, startTime, endTime, isAllDay, attendees } = body

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

    // Update event in Google Calendar
    const updatedEvent = await calendarService.updateEvent(params.id, {
      title,
      description,
      location,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      isAllDay,
      attendees,
      status: 'confirmed',
      visibility: 'default'
    } as any)

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    // Update event in database
    await supabase
      .from('calendar_events')
      .update({
        title: updatedEvent.title,
        description: updatedEvent.description,
        location: updatedEvent.location,
        start_time: updatedEvent.startTime.toISOString(),
        end_time: updatedEvent.endTime.toISOString(),
        is_all_day: updatedEvent.isAllDay,
        attendees: updatedEvent.attendees,
        organizer: updatedEvent.organizer?.email,
        status: updatedEvent.status,
        visibility: updatedEvent.visibility,
        recurrence: updatedEvent.recurrence?.join(',')
      })
      .eq('google_event_id', params.id)
      .eq('email_account_id', account.id)

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error('Error in PUT /api/calendar/events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

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

    // Delete event from Google Calendar
    const success = await calendarService.deleteEvent(params.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    // Delete event from database
    await supabase
      .from('calendar_events')
      .delete()
      .eq('google_event_id', params.id)
      .eq('email_account_id', account.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/calendar/events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}