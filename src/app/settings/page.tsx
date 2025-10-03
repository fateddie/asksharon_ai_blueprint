'use client'

import { Header } from '@/components/layout/Header'
import AccountManager from '@/components/features/AccountManager'
import { useState } from 'react'

export default function SettingsPage() {
  const [isListening, setIsListening] = useState(false)

  const toggleVoiceListening = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onVoiceToggle={toggleVoiceListening} isListening={isListening} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your connected accounts and preferences.
          </p>
        </div>

        <AccountManager />
      </main>
    </div>
  )
}