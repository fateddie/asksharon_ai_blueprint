import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { generateUserUUID } from '@/lib/uuid'

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export function useUser() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.email ? generateUserUUID(session.user.email) : 'unknown',
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      })
    } else {
      setUser(null)
    }
  }, [session])

  // Only show loading when NextAuth is still determining session state
  const isLoading = status === 'loading'

  console.log('🔍 [useUser] State:', {
    status,
    isLoading,
    hasSession: !!session,
    sessionUser: session?.user?.email || 'none'
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!session && !!user,
    hasGoogleAccess: !!session?.accessToken
  }
}