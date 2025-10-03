import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id || session.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching email accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error in GET /api/email/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email_address, access_token, refresh_token, token_expires_at, is_primary } = body

    if (!email_address || !access_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    // If this is set as primary, unset other primary accounts
    if (is_primary) {
      await supabase
        .from('email_accounts')
        .update({ is_primary: false })
        .eq('user_id', session.user.id || session.user.email)
    }

    const { data: account, error } = await supabase
      .from('email_accounts')
      .insert([{
        user_id: session.user.id || session.user.email,
        email_address,
        provider: 'gmail',
        access_token,
        refresh_token,
        token_expires_at,
        is_primary: is_primary || false,
        sync_status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating email account:', error)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/email/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}