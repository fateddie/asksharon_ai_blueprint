export interface ErrorDetails {
  code?: string
  message: string
  details?: any
  timestamp: string
  endpoint?: string
  userId?: string
}

export class AppError extends Error {
  public code: string
  public details: any
  public timestamp: string
  public endpoint?: string
  public userId?: string

  constructor(message: string, code: string = 'UNKNOWN', details?: any, endpoint?: string, userId?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
    this.endpoint = endpoint
    this.userId = userId
  }
}

export function logError(error: any, context?: { endpoint?: string; userId?: string; operation?: string }) {
  const timestamp = new Date().toISOString()
  const prefix = context?.operation ? `🔴 [${timestamp}] ERROR` : `❌ [${timestamp}] ERROR`

  if (error instanceof AppError) {
    console.error(`${prefix}: ${error.message}`, {
      code: error.code,
      endpoint: error.endpoint || context?.endpoint,
      userId: error.userId || context?.userId,
      details: error.details,
      operation: context?.operation
    })
  } else if (error?.code) {
    // Database or API errors
    console.error(`${prefix}: Database/API Error [${context?.endpoint || 'unknown'}]`, {
      code: error.code,
      message: error.message,
      details: error.details || error.hint,
      operation: context?.operation,
      userId: context?.userId
    })
  } else {
    // Generic errors
    console.error(`${prefix}: ${error?.message || error} [${context?.endpoint || 'unknown'}]`, {
      error: error,
      operation: context?.operation,
      userId: context?.userId
    })
  }
}

export function createErrorResponse(error: any, endpoint?: string): { error: string; code?: string; details?: any } {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details
    }
  }

  if (error?.code) {
    // Database errors
    switch (error.code) {
      case '22P02':
        return { error: 'Invalid data format', code: 'INVALID_FORMAT', details: 'Check UUID format' }
      case '42501':
        return { error: 'Access denied', code: 'ACCESS_DENIED', details: 'Row-level security policy violation' }
      case '23505':
        return { error: 'Duplicate entry', code: 'DUPLICATE', details: error.detail }
      default:
        return { error: 'Database error', code: error.code, details: error.message }
    }
  }

  return { error: 'Internal server error', code: 'INTERNAL_ERROR' }
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function logOperation(operation: string, endpoint?: string, duration?: number) {
  const timestamp = new Date().toISOString()
  const emoji = duration && duration > 1000 ? '⚠️ ' : duration && duration > 5000 ? '🐌' : '✅'
  const durationText = duration ? ` | ${duration}ms` : ''

  if (duration && duration > 5000) {
    console.warn(`${emoji} [${timestamp}] SLOW: ${operation} [endpoint:${endpoint || 'unknown'}]${durationText}`)
  } else if (duration && duration > 1000) {
    console.warn(`${emoji} [${timestamp}] WARN: Slow operation [op:${operation} | endpoint:${endpoint || 'unknown'}]${durationText}`)
  } else {
    console.log(`${emoji} [${timestamp}] SUCCESS: ${operation} [endpoint:${endpoint || 'unknown'}]${durationText}`)
  }
}

export function debugLog(message: string, data?: any, endpoint?: string) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString()
    console.log(`🔍 [${timestamp}] DEBUG: ${message} [endpoint:${endpoint || 'unknown'}]`, data ? data : '')
  }
}