'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Mic, User, Settings, Mail, LogOut, Plus, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getGreeting } from '@/lib/utils'
import Link from 'next/link'

interface HeaderProps {
  onVoiceToggle?: () => void
  isListening?: boolean
}

interface EmailAccount {
  id: string
  email_address: string
  is_primary: boolean
  is_active: boolean
  sync_status: string
}

export function Header({ onVoiceToggle, isListening = false }: HeaderProps) {
  const { data: session } = useSession()
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const greeting = getGreeting()

  // Check if user has Google OAuth access
  const hasGoogleAccess = !!session?.accessToken

  const handleSignIn = () => {
    signIn('google', { callbackUrl: window.location.href })
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Greeting */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl text-primary">PA</Link>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">{greeting}</h1>
            <p className="text-sm text-muted-foreground">
              {session ? `Welcome back, ${session.user?.name || 'User'}` : 'Ready to help you be productive'}
            </p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-2">
          {/* Google Account Status */}
          {session ? (
            <div className="hidden md:flex items-center space-x-2">
              {hasGoogleAccess ? (
                <div className="relative">
                  <button
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{session.user?.email || 'Connected'}</div>
                      <div className="text-xs text-muted-foreground">
                        Google services connected
                      </div>
                    </div>
                  </button>

                  {showAccountDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-50">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Google Integration</h4>
                          <Badge variant="outline" className="text-xs text-green-600">
                            Active
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span>Gmail Access</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">Connected</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span>Calendar Access</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">Connected</Badge>
                          </div>
                        </div>
                        <div className="flex justify-between mt-3 pt-2 border-t">
                          <Link href="/settings">
                            <Button variant="ghost" size="sm">Settings</Button>
                          </Link>
                          <Link href="/dashboard">
                            <Button variant="ghost" size="sm">Dashboard</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleSignIn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Google
                </Button>
              )}
            </div>
          ) : null}

          {/* Voice Control */}
          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            onClick={onVoiceToggle}
            className={`${isListening ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}`}
            title={isListening ? 'Stop listening' : 'Start voice command'}
          >
            <Mic className="h-4 w-4" />
          </Button>

          {/* Settings */}
          <Link href="/settings">
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          {/* User Menu */}
          {session ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                title="Profile"
                onClick={() => {
                  setShowAccountDropdown(false)
                  setShowUserDropdown(!showUserDropdown)
                }}
              >
                <User className="h-4 w-4" />
              </Button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 text-sm font-medium border-b">
                      {session.user?.name || 'User'}
                    </div>
                    <div className="px-3 py-1 text-xs text-muted-foreground border-b mb-2">
                      {session.user?.email}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button variant="ghost" onClick={handleSignIn}>
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showAccountDropdown || showUserDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowAccountDropdown(false)
            setShowUserDropdown(false)
          }}
        />
      )}
    </header>
  )
}