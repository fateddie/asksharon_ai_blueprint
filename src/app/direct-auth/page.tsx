'use client'

import { useState } from 'react'

export default function DirectAuth() {
  const [authResult, setAuthResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const directGoogleAuth = () => {
    setLoading(true)

    // Direct Google OAuth URL
    const clientId = '1069421989747-57o22m4h20tpnemegpv2tu01g9murkv8.apps.googleusercontent.com'
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/callback/google')
    const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly')
    const responseType = 'code'
    const state = Math.random().toString(36).substring(7)

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=${responseType}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`

    console.log('🚀 Direct Google Auth URL:', authUrl)

    // Open in current window
    window.location.href = authUrl
  }

  const testCurrentSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const session = await response.json()
      setAuthResult({ session, timestamp: new Date().toISOString() })
      console.log('Current session:', session)
    } catch (error) {
      console.error('Session test failed:', error)
      setAuthResult({ error: error.message, timestamp: new Date().toISOString() })
    }
  }

  const testRealData = async () => {
    try {
      const response = await fetch('/api/test-real-data')
      const result = await response.json()
      setAuthResult({
        testResult: result,
        status: response.status,
        timestamp: new Date().toISOString()
      })
      console.log('Real data test:', result)
    } catch (error) {
      console.error('Real data test failed:', error)
      setAuthResult({ error: error.message, timestamp: new Date().toISOString() })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Direct Google Authentication Test</h1>

        <div className="space-y-4">
          <button
            onClick={directGoogleAuth}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : '🚀 Direct Google OAuth (Skip NextAuth)'}
          </button>

          <button
            onClick={testCurrentSession}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700"
          >
            🔍 Test Current Session
          </button>

          <button
            onClick={testRealData}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700"
          >
            📅 Test Real Gmail & Calendar Data
          </button>

          <a
            href="/"
            className="block w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 text-center"
          >
            ← Back to Homepage
          </a>
        </div>

        {authResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-2">Test Result:</h3>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(authResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Direct Google OAuth" to start authentication</li>
            <li>Complete Google authorization in the popup/redirect</li>
            <li>You'll be redirected back to this page</li>
            <li>Click "Test Current Session" to see if you're authenticated</li>
            <li>Click "Test Google Calendar API" to see if you can access real data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}