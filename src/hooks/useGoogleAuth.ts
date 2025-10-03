import { useState, useEffect } from 'react'

export interface GoogleUser {
  id: string
  email: string
  name: string
  picture?: string
}

export interface GoogleAuthState {
  user: GoogleUser | null
  isAuthenticated: boolean
  isLoading: boolean
  connect: () => void
  disconnect: () => Promise<void>
}

export function useGoogleAuth(): GoogleAuthState {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/google-auth/status')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user || null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connect = () => {
    window.location.href = '/api/google-auth'
  }

  const disconnect = async () => {
    try {
      await fetch('/api/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      setUser(null)
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    connect,
    disconnect,
  }
}