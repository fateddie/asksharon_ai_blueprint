import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { DailyCheckinsService } from '@/lib/database'
import { generateUserUUID } from '@/lib/uuid'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = generateUserUUID(session.user.email)
    const checkin = await DailyCheckinsService.getToday(userId)

    return NextResponse.json({
      success: true,
      checkin
    })

  } catch (error) {
    console.error('Error fetching checkin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkin' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = generateUserUUID(session.user.email)
    const body = await request.json()

    const checkin = await DailyCheckinsService.createOrUpdate(userId, body)

    return NextResponse.json({
      success: true,
      checkin
    })

  } catch (error) {
    console.error('Error updating checkin:', error)
    return NextResponse.json(
      { error: 'Failed to update checkin' },
      { status: 500 }
    )
  }
}
