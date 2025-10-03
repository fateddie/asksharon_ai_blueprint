/**
 * OpenAI Integration for Voice Command Processing
 * Provides natural language understanding for voice commands
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: false // Server-side only
})

export interface VoiceCommand {
  intent: 'create_task' | 'create_habit' | 'set_reminder' | 'query_status' | 'create_event' | 'query_calendar' | 'send_email' | 'read_emails' | 'query_inbox' | 'complete_habit' | 'log_sleep' | 'rate_day' | 'daily_checkin' | 'unknown'
  entities: {
    taskTitle?: string
    habitName?: string
    priority?: 'low' | 'medium' | 'high'
    dueDate?: string
    frequency?: 'daily' | 'weekly' | 'monthly'
    query?: string
    // Calendar entities
    eventTitle?: string
    eventDate?: string
    eventTime?: string
    eventDuration?: string
    eventLocation?: string
    eventAttendees?: string[]
    // Email entities
    emailRecipient?: string
    emailSubject?: string
    emailBody?: string
    emailCount?: number
    // Check-in entities
    wakeTime?: string
    sleepTime?: string
    dayRating?: number
  }
  confidence: number
  originalText: string
}

/**
 * Process voice command using OpenAI to extract intent and entities
 */
export async function processVoiceCommand(transcript: string): Promise<VoiceCommand> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured')
    return {
      intent: 'unknown',
      entities: {},
      confidence: 0,
      originalText: transcript
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: [
        {
          role: 'system',
          content: `You are a voice command processor for a personal productivity assistant with Gmail, Calendar, and habit tracking.
Extract the intent and entities from user voice commands.

Supported intents:
- create_task: Create a todo task
- create_habit: Track a new habit
- set_reminder: Set a reminder
- create_event: Create calendar event/appointment
- query_calendar: Ask about calendar/schedule
- send_email: Send an email
- read_emails: Read/check emails
- query_inbox: Ask about inbox
- complete_habit: Mark a habit as complete
- log_sleep: Log wake/sleep times
- rate_day: Rate how the day went
- daily_checkin: Complete daily check-in
- query_status: General status query
- unknown: Cannot understand

Respond ONLY with valid JSON in this exact format:
{
  "intent": "create_task|create_habit|set_reminder|create_event|query_calendar|send_email|read_emails|query_inbox|complete_habit|log_sleep|rate_day|daily_checkin|query_status|unknown",
  "entities": {
    "taskTitle": "string",
    "habitName": "string",
    "priority": "low|medium|high",
    "dueDate": "ISO date string",
    "frequency": "daily|weekly|monthly",
    "query": "string",
    "eventTitle": "string",
    "eventDate": "ISO date string",
    "eventTime": "HH:MM format",
    "eventDuration": "number of minutes",
    "eventLocation": "string",
    "eventAttendees": ["email1", "email2"],
    "emailRecipient": "email address",
    "emailSubject": "string",
    "emailBody": "string",
    "emailCount": number,
    "wakeTime": "HH:MM format",
    "sleepTime": "HH:MM format",
    "dayRating": number (1-10)
  },
  "confidence": 0.0-1.0
}

Examples:
- "Schedule dentist appointment tomorrow at 2pm" → {"intent":"create_event","entities":{"eventTitle":"dentist appointment","eventDate":"tomorrow","eventTime":"14:00"},"confidence":0.95}
- "What's on my calendar today?" → {"intent":"query_calendar","entities":{"query":"today"},"confidence":0.9}
- "Send email to john@example.com saying meeting confirmed" → {"intent":"send_email","entities":{"emailRecipient":"john@example.com","emailBody":"meeting confirmed"},"confidence":0.9}
- "Read my unread emails" → {"intent":"read_emails","entities":{"emailCount":10},"confidence":0.85}
- "Add task: buy groceries" → {"intent":"create_task","entities":{"taskTitle":"buy groceries"},"confidence":0.95}
- "I completed my reading habit" → {"intent":"complete_habit","entities":{"habitName":"reading"},"confidence":0.9}
- "I woke up at 7am and went to bed at 11pm" → {"intent":"log_sleep","entities":{"wakeTime":"07:00","sleepTime":"23:00"},"confidence":0.95}
- "Today was an 8 out of 10" → {"intent":"rate_day","entities":{"dayRating":8},"confidence":0.9}
- "Start my daily check-in" → {"intent":"daily_checkin","entities":{},"confidence":0.95}`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: 0.3, // Low temperature for consistent responses
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(response) as VoiceCommand
    return {
      ...parsed,
      originalText: transcript
    }
  } catch (error) {
    console.error('OpenAI processing error:', error)
    return {
      intent: 'unknown',
      entities: {},
      confidence: 0,
      originalText: transcript
    }
  }
}

/**
 * Generate a natural language response for the user
 */
export async function generateVoiceResponse(command: VoiceCommand, result: any): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback responses without OpenAI
    if (command.intent === 'create_task' && result.success) {
      return `Task "${command.entities.taskTitle}" created successfully!`
    }
    if (command.intent === 'create_habit' && result.success) {
      return `Habit "${command.entities.habitName}" added to your tracker!`
    }
    return 'Command processed.'
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful personal assistant. Generate a brief, friendly response (1-2 sentences)
to confirm the user's action. Be concise and encouraging.`
        },
        {
          role: 'user',
          content: `The user said: "${command.originalText}".
We detected intent: ${command.intent}
Result: ${JSON.stringify(result)}

Generate a friendly confirmation response.`
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    })

    return completion.choices[0]?.message?.content || 'Done!'
  } catch (error) {
    console.error('Response generation error:', error)
    return 'Command completed.'
  }
}

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}
