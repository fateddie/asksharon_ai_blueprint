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
  intent: 'create_task' | 'create_habit' | 'set_reminder' | 'query_status' | 'unknown'
  entities: {
    taskTitle?: string
    habitName?: string
    priority?: 'low' | 'medium' | 'high'
    dueDate?: string
    frequency?: 'daily' | 'weekly' | 'monthly'
    query?: string
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
          content: `You are a voice command processor for a personal productivity assistant.
Extract the intent and entities from user voice commands.

Respond ONLY with valid JSON in this exact format:
{
  "intent": "create_task|create_habit|set_reminder|query_status|unknown",
  "entities": {
    "taskTitle": "string (for create_task)",
    "habitName": "string (for create_habit)",
    "priority": "low|medium|high (optional)",
    "dueDate": "ISO date string (optional)",
    "frequency": "daily|weekly|monthly (for create_habit, optional)",
    "query": "string (for query_status)"
  },
  "confidence": 0.0-1.0
}

Examples:
- "Add task: buy groceries" → {"intent":"create_task","entities":{"taskTitle":"buy groceries"},"confidence":0.95}
- "Create a habit to exercise daily" → {"intent":"create_habit","entities":{"habitName":"exercise","frequency":"daily"},"confidence":0.9}
- "What's on my todo list?" → {"intent":"query_status","entities":{"query":"todo list"},"confidence":0.85}
- "Remind me to call mom tomorrow" → {"intent":"set_reminder","entities":{"taskTitle":"call mom","dueDate":"tomorrow"},"confidence":0.9}`
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
