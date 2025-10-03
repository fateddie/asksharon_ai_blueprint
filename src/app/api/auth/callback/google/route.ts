import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // If there's an error from Google
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  // If we have a code, exchange it for tokens
  if (code) {
    try {
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token exchange failed:', errorText)
        return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
      }

      const tokens = await tokenResponse.json()

      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })

      if (!userResponse.ok) {
        console.error('Failed to get user info')
        return NextResponse.redirect(new URL('/?error=user_info_failed', request.url))
      }

      const userInfo = await userResponse.json()

      // Create response with tokens stored in cookies
      const response = NextResponse.redirect(new URL('/?connected=true', request.url))

      // Set secure httpOnly cookies for tokens
      response.cookies.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expires_in || 3600,
        path: '/'
      })

      if (tokens.refresh_token) {
        response.cookies.set('google_refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/'
        })
      }

      // Store user info in cookie as well
      response.cookies.set('google_user', JSON.stringify({
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      })

      return response
    } catch (error) {
      console.error('Error in Google OAuth callback:', error)
      return NextResponse.redirect(new URL('/?error=callback_failed', request.url))
    }
  }

  // If no code and no error, something's wrong
  return NextResponse.redirect(new URL('/?error=invalid_callback', request.url))
}