import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting email account:', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/email/accounts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { is_active, is_primary } = body

    const supabase = createRouteHandlerClient({ cookies })

    // If setting as primary, unset other primary accounts
    if (is_primary) {
      await supabase
        .from('email_accounts')
        .update({ is_primary: false })
        .eq('user_id', session.user.id)
        .neq('id', params.id)
    }

    const { data: account, error } = await supabase
      .from('email_accounts')
      .update({
        is_active,
        is_primary,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating email account:', error)
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
    }

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Error in PATCH /api/email/accounts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}