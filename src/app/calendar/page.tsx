'use client'

import { Header } from '@/components/layout/Header'
import CalendarManager from '@/components/features/CalendarManager'
import { useState } from 'react'

export default function CalendarPage() {
  const [isListening, setIsListening] = useState(false)

  const toggleVoiceListening = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onVoiceToggle={toggleVoiceListening} isListening={isListening} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Calendar Management</h1>
          <p className="text-muted-foreground">
            Manage your Google Calendar events and appointments.
          </p>
        </div>

        <CalendarManager />
      </main>
    </div>
  )
}