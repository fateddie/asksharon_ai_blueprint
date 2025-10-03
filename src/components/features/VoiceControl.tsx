'use client'

import { useState, useEffect, useCallback } from 'react'

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onend: () => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
}
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VoiceControlProps {
  onCommand?: (command: string) => void
  className?: string
  prominent?: boolean
}

export function VoiceControl({ onCommand, className, prominent = false }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setIsSupported(true)
      const SpeechRecognitionConstructor = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognitionInstance = new SpeechRecognitionConstructor()

      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)

        if (finalTranscript && onCommand) {
          console.log('🎯 Final transcript detected:', finalTranscript)
          onCommand(finalTranscript.trim())
        } else if (interimTranscript) {
          console.log('🔄 Interim transcript:', interimTranscript)
        }
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [onCommand])

  const toggleListening = useCallback(() => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      try {
        recognition.start()
        setIsListening(true)
        setTranscript('')
      } catch (error: any) {
        // If already started, just update state
        if (error.message?.includes('already started')) {
          setIsListening(true)
        } else {
          console.error('Error starting recognition:', error)
        }
      }
    }
  }, [recognition, isListening])

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }, [])

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MicOff className="h-5 w-5" />
            Voice Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your browser doesn't support voice recognition. Please use a modern browser like Chrome.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (prominent) {
    return (
      <Card className={`${className} border-2 ${isListening ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} transition-all duration-300`}>
        <CardContent className="py-8">
          <div className="text-center space-y-6">
            {/* Large Voice Button */}
            <div className="relative">
              <Button
                onClick={toggleListening}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className={`w-24 h-24 rounded-full ${isListening ? 'animate-pulse' : ''} transition-all duration-300`}
              >
                {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
              {isListening && (
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping"></div>
              )}
            </div>

            {/* Status and Title */}
            <div>
              <h2 className="text-2xl font-bold mb-2">🎤 Voice Assistant</h2>
              <Badge
                variant={isListening ? "default" : "secondary"}
                className="text-sm px-4 py-1"
              >
                {isListening ? "🔴 Listening..." : "⚪ Press to speak"}
              </Badge>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="max-w-md mx-auto p-4 bg-white border rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-2">You said:</p>
                <p className="text-lg">{transcript}</p>
              </div>
            )}

            {/* Quick Commands */}
            <div className="max-w-md mx-auto text-left">
              <p className="font-medium mb-3 text-center">✨ Try these commands:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">💼 "Add task: [task name]"</div>
                <div className="p-2 bg-gray-50 rounded">✅ "Complete habit [habit]"</div>
                <div className="p-2 bg-gray-50 rounded">📝 "Create note: [content]"</div>
                <div className="p-2 bg-gray-50 rounded">📅 "What's my schedule?"</div>
              </div>
            </div>

            {/* Test Speaker */}
            <Button
              variant="outline"
              onClick={() => speakText("Hello! I'm your personal assistant. How can I help you today?")}
              className="mx-auto"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Test Speaker
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Assistant
          </div>
          <Badge variant={isListening ? "default" : "secondary"}>
            {isListening ? "Listening..." : "Ready"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            className="flex-1"
          >
            {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
            {isListening ? "Stop Listening" : "Start Voice Command"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => speakText("Hello! I'm your personal assistant. How can I help you today?")}
            title="Test voice output"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>

        {transcript && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">You said:</p>
            <p className="text-muted-foreground">{transcript}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Try saying:</p>
          <ul className="space-y-1">
            <li>• "Add task: Review quarterly reports"</li>
            <li>• "Mark habit workout as complete"</li>
            <li>• "Create note about meeting ideas"</li>
            <li>• "What's on my schedule today?"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}