'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You cancelled the authentication or denied access.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      default:
        return 'An unexpected error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-error mb-4">Authentication Error</h2>
          <p className="mb-6 text-base-content/70">
            {getErrorMessage(error)}
          </p>
          <div className="card-actions">
            <Link href="/auth/signin" className="btn btn-primary">
              Try Again
            </Link>
            <Link href="/" className="btn btn-ghost">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}