'use client'

import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import CalendarManager from '@/components/features/CalendarManager'
import EmailManager from '@/components/features/EmailManager'
import GoogleAccountPrompt from '@/components/features/GoogleAccountPrompt'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()
  const hasGoogleAccess = !!session?.accessToken

  if (!hasGoogleAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Connect your Google account to access your Gmail and Calendar data.
            </p>
          </div>

          <GoogleAccountPrompt />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Your real-time Gmail and Calendar data powered by Google integration.
          </p>
        </div>

        {/* Connection Status Banner */}
        <Card className="mb-8 p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="font-semibold text-green-900">Google Services Connected</div>
            </div>
            <div className="text-sm text-green-700">
              ✓ Gmail Access • ✓ Calendar Access • Connected as: <span className="font-medium">{session.user?.email}</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div>
            <CalendarManager />
          </div>

          {/* Email Section */}
          <div>
            <EmailManager />
          </div>
        </div>

      </main>
    </div>
  )
}