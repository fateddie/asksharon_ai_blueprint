'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Calendar, CheckCircle, ArrowRight, Shield, Zap, Users } from 'lucide-react'

interface GoogleAccountPromptProps {
  onConnect?: () => void
  showFeatures?: boolean
  compact?: boolean
}

export default function GoogleAccountPrompt({
  onConnect,
  showFeatures = true,
  compact = false
}: GoogleAccountPromptProps) {
  const { data: session } = useSession()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await signIn('google', { callbackUrl: '/?connected=true' })
      onConnect?.()
    } catch (error) {
      console.error('Error connecting Google account:', error)
      setIsConnecting(false)
    }
  }

  // Don't show if user has NextAuth session with Google access
  if (session?.accessToken) {
    return null
  }

  if (compact) {
    return (
      <Card className="p-4 border-dashed border-2 border-muted-foreground/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium">Connect Google Account</h4>
              <p className="text-sm text-muted-foreground">Access Gmail and Calendar</p>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn btn-primary"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </Card>
    )
  }

  const features = [
    {
      icon: Mail,
      title: 'Gmail Integration',
      description: 'Read, send, and manage your emails directly from the assistant',
      benefits: ['Smart email categorization', 'Quick replies', 'Attachment handling']
    },
    {
      icon: Calendar,
      title: 'Calendar Management',
      description: 'Create, edit, and track your appointments and meetings',
      benefits: ['Event scheduling', 'Meeting reminders', 'Calendar insights']
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and you control what we access',
      benefits: ['OAuth2 security', 'No data selling', 'Revoke anytime']
    }
  ]

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="text-center mb-6">
        <div className="flex justify-center space-x-2 mb-4">
          <div className="p-3 rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div className="p-3 rounded-full bg-green-100">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">Connect Your Google Account</h3>
        <p className="text-muted-foreground mb-4">
          Unlock the full power of your Personal Assistant by connecting Gmail and Calendar
        </p>

        <div className="flex justify-center space-x-6 mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Secure OAuth2</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Instant Setup</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Revoke Anytime</span>
          </div>
        </div>

        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          size="lg"
          className="btn btn-primary px-8"
        >
          {isConnecting ? (
            <>
              <div className="loading loading-spinner loading-sm mr-2"></div>
              Connecting...
            </>
          ) : (
            <>
              Connect Google Account
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {showFeatures && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-2 rounded-lg bg-white/80">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
              <div className="space-y-1">
                {feature.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center justify-center space-x-1 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-white/50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h5 className="font-medium text-sm mb-1">What happens next?</h5>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• You'll be redirected to Google's secure sign-in</li>
              <li>• Grant permissions for Gmail and Calendar access</li>
              <li>• Return here to start using your connected account</li>
              <li>• Your existing data remains completely private</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}