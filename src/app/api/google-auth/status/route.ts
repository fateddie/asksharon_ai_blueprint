import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    const userCookie = cookieStore.get('google_user')?.value

    if (!accessToken || !userCookie) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    // Verify token is still valid by making a simple API call
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        // Token is invalid, clear cookies
        const clearResponse = NextResponse.json({ authenticated: false, user: null })
        clearResponse.cookies.delete('google_access_token')
        clearResponse.cookies.delete('google_refresh_token')
        clearResponse.cookies.delete('google_user')
        return clearResponse
      }

      const userInfo = JSON.parse(userCookie)
      return NextResponse.json({
        authenticated: true,
        user: userInfo,
        hasValidToken: true
      })
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json({ authenticated: false, user: null })
    }
  } catch (error) {
    console.error('Error in status check:', error)
    return NextResponse.json({ authenticated: false, user: null })
  }
}