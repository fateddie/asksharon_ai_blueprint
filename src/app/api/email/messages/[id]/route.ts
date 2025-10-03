import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { GmailService } from '@/lib/gmail'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, accountId } = body

    if (!action || !accountId) {
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

    let success = false
    let updateData: any = {}

    switch (action) {
      case 'markRead':
        success = await gmailService.markAsRead(params.id)
        updateData = { is_read: true }
        break
      case 'markUnread':
        success = await gmailService.markAsUnread(params.id)
        updateData = { is_read: false }
        break
      case 'archive':
        success = await gmailService.archiveMessage(params.id)
        updateData = { is_archived: true }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
    }

    // Update local database
    await supabase
      .from('email_metadata')
      .update(updateData)
      .eq('message_id', params.id)
      .eq('email_account_id', account.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/email/messages/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}