/**
 * Testing Utilities
 * Helper functions for testing components, API routes, and services
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Test Data Generators
// ============================================================================

export const generateTestUUID = () => {
  return '00000000-0000-0000-0000-000000000000'
}

export const generateTestTask = (overrides?: Partial<any>) => {
  return {
    id: generateTestUUID(),
    user_id: generateTestUUID(),
    title: 'Test Task',
    description: 'This is a test task',
    completed: false,
    priority: 'medium' as const,
    due_date: new Date().toISOString(),
    tags: ['test'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

export const generateTestHabit = (overrides?: Partial<any>) => {
  return {
    id: generateTestUUID(),
    user_id: generateTestUUID(),
    name: 'Test Habit',
    description: 'This is a test habit',
    frequency: 'daily' as const,
    target_count: 1,
    current_streak: 0,
    longest_streak: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

export const generateTestUser = (overrides?: Partial<any>) => {
  return {
    id: generateTestUUID(),
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    timezone: 'UTC',
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

// ============================================================================
// Mock Data
// ============================================================================

export const mockSession = {
  user: {
    id: generateTestUUID(),
    email: 'test@example.com',
    name: 'Test User'
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

export const mockGoogleTokens = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expiry_date: Date.now() + 3600000
}

// ============================================================================
// API Testing Helpers
// ============================================================================

export interface MockRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  query?: Record<string, string>
}

export const createMockRequest = (options: MockRequestOptions = {}) => {
  const url = new URL('http://localhost:3000/api/test')

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return {
    method: options.method || 'GET',
    headers: new Headers(options.headers || {}),
    body: options.body ? JSON.stringify(options.body) : null,
    url: url.toString(),
    ...options
  }
}

export const createMockResponse = () => {
  return {
    json: async (data: any) => new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    }),
    status: (code: number) => ({
      json: async (data: any) => new Response(JSON.stringify(data), {
        status: code,
        headers: { 'Content-Type': 'application/json' }
      })
    })
  }
}

// ============================================================================
// Database Testing Helpers
// ============================================================================

export const setupTestDatabase = async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables not set for testing')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return supabase
}

export const cleanupTestData = async (supabase: any, userId: string) => {
  // Clean up test data in reverse order of dependencies
  await supabase.from('habit_entries').delete().eq('user_id', userId)
  await supabase.from('habits').delete().eq('user_id', userId)
  await supabase.from('tasks').delete().eq('user_id', userId)
  await supabase.from('notes').delete().eq('user_id', userId)
  await supabase.from('calendar_events').delete().eq('user_id', userId)
  await supabase.from('email_metadata').delete().eq('user_id', userId)
  await supabase.from('email_accounts').delete().eq('user_id', userId)
}

// ============================================================================
// Async Testing Helpers
// ============================================================================

export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Condition not met within ${timeout}ms`)
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ============================================================================
// Assertion Helpers
// ============================================================================

export const assertResponseSuccess = (response: any) => {
  if (!response.ok) {
    throw new Error(`Response not successful: ${response.status} ${response.statusText}`)
  }
}

export const assertResponseError = (response: any, expectedStatus?: number) => {
  if (response.ok) {
    throw new Error('Expected error response but got success')
  }
  if (expectedStatus && response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus} but got ${response.status}`)
  }
}

export const assertObjectMatches = (actual: any, expected: Partial<any>) => {
  Object.entries(expected).forEach(([key, value]) => {
    if (actual[key] !== value) {
      throw new Error(`Expected ${key} to be ${value} but got ${actual[key]}`)
    }
  })
}

// ============================================================================
// Environment Testing Helpers
// ============================================================================

export const isTestEnvironment = () => {
  return process.env.NODE_ENV === 'test'
}

export const requireEnvVar = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

// ============================================================================
// Mock Fetch Helper
// ============================================================================
// Note: For Jest tests, you'll need to install @types/jest
// For Playwright, use page.route() instead

export const createMockFetch = (responses: Record<string, any>) => {
  return ((url: string, options?: any) => {
    const key = `${options?.method || 'GET'} ${url}`
    const response = responses[key] || responses[url]

    if (!response) {
      return Promise.reject(new Error(`No mock response for ${key}`))
    }

    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
      headers: new Headers(response.headers || {})
    })
  }) as typeof fetch
}

// ============================================================================
// Console Spy Helpers
// ============================================================================

export const suppressConsole = () => {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  }

  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}

  return () => {
    console.log = originalConsole.log
    console.warn = originalConsole.warn
    console.error = originalConsole.error
  }
}

export const captureConsole = () => {
  const logs: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  }

  console.log = (...args: any[]) => logs.push(args.join(' '))
  console.warn = (...args: any[]) => warnings.push(args.join(' '))
  console.error = (...args: any[]) => errors.push(args.join(' '))

  return {
    logs,
    warnings,
    errors,
    restore: () => {
      console.log = originalConsole.log
      console.warn = originalConsole.warn
      console.error = originalConsole.error
    }
  }
}
