'use client'

import { Header } from '@/components/layout/Header'
import EmailManager from '@/components/features/EmailManager'
import { useState } from 'react'

export default function EmailPage() {
  const [isListening, setIsListening] = useState(false)

  const toggleVoiceListening = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onVoiceToggle={toggleVoiceListening} isListening={isListening} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Email Management</h1>
          <p className="text-muted-foreground">
            Manage your Gmail accounts, read and send emails efficiently.
          </p>
        </div>

        <EmailManager />
      </main>
    </div>
  )
}