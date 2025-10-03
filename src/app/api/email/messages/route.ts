import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { GmailService } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const maxResults = parseInt(searchParams.get('maxResults') || '10')
    const query = searchParams.get('query') || undefined

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

    // Initialize Gmail service
    const gmailService = new GmailService(
      account.access_token,
      account.refresh_token
    )

    // Fetch messages from Gmail
    const messages = await gmailService.getMessages(maxResults, query)

    // Store or update messages in database
    for (const message of messages) {
      await supabase
        .from('email_metadata')
        .upsert({
          user_id: session.user.id,
          email_account_id: account.id,
          message_id: message.id,
          thread_id: message.threadId,
          subject: message.subject,
          sender: message.sender,
          recipients: message.recipients,
          body_preview: message.bodyPreview,
          received_at: message.receivedAt.toISOString(),
          is_read: message.isRead,
          has_attachments: message.hasAttachments,
          labels: message.labels
        }, {
          onConflict: 'email_account_id,message_id'
        })
    }

    // Update last sync time
    await supabase
      .from('email_accounts')
      .update({
        last_sync: new Date().toISOString(),
        sync_status: 'completed'
      })
      .eq('id', account.id)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error in GET /api/email/messages:', error)
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
    const { accountId, to, subject, message } = body

    if (!accountId || !to || !subject || !message) {
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

    // Initialize Gmail service
    const gmailService = new GmailService(
      account.access_token,
      account.refresh_token
    )

    // Send email
    const success = await gmailService.sendEmail(to, subject, message)

    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/email/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}