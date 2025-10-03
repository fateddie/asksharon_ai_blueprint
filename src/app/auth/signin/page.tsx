'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('google', {
        callbackUrl: '/',
        redirect: false
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title mb-6">Connect Your Email & Calendar</h2>
          <p className="mb-6 text-base-content/70">
            Sign in with Google to manage your Gmail and Calendar appointments
          </p>
          <div className="card-actions">
            <button
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}