// Comprehensive logging system for development and testing
import fs from 'fs'
import path from 'path'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  userId?: string
  endpoint?: string
  operation?: string
  duration?: number
  metadata?: Record<string, any>
  authenticated?: boolean
  status?: string | number
  user?: string
  error?: string
  tokenValid?: boolean
  stack?: string
  requestId?: string
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logToFile = process.env.LOG_TO_FILE === 'true'
  private logDir = path.join(process.cwd(), 'logs')

  constructor() {
    // Set log level based on environment
    if (this.isDevelopment) {
      this.logLevel = LogLevel.DEBUG
    }

    // Create logs directory if logging to file
    if (this.logToFile && typeof window === 'undefined') {
      try {
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true })
        }
      } catch (error) {
        console.error('Failed to create logs directory:', error)
        this.logToFile = false
      }
    }
  }

  private writeToFile(level: string, message: string, context?: LogContext) {
    if (!this.logToFile || typeof window !== 'undefined') return

    try {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        level,
        message,
        ...context
      }

      const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`
      const logPath = path.join(this.logDir, logFileName)

      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n')

      // Also write errors to separate error log
      if (level === 'ERROR') {
        const errorLogPath = path.join(this.logDir, 'errors.log')
        fs.appendFileSync(errorLogPath, JSON.stringify(logEntry) + '\n')
      }
    } catch (error) {
      // Silently fail file logging to avoid infinite loops
      console.error('Failed to write log to file:', error)
    }
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const emoji = this.getEmoji(level)

    let formatted = `${emoji} [${timestamp}] ${level}: ${message}`

    if (context) {
      const contextParts = []
      if (context.userId) contextParts.push(`user:${context.userId}`)
      if (context.endpoint) contextParts.push(`endpoint:${context.endpoint}`)
      if (context.operation) contextParts.push(`op:${context.operation}`)
      if (context.duration) contextParts.push(`${context.duration}ms`)

      if (contextParts.length > 0) {
        formatted += ` [${contextParts.join(' | ')}]`
      }

      if (context.metadata) {
        formatted += ` ${JSON.stringify(context.metadata)}`
      }
    }

    return formatted
  }

  private getEmoji(level: string): string {
    switch (level) {
      case 'DEBUG': return '🔍'
      case 'INFO': return 'ℹ️'
      case 'WARN': return '⚠️'
      case 'ERROR': return '❌'
      case 'SUCCESS': return '✅'
      case 'API': return '🔗'
      case 'AUTH': return '🔑'
      case 'DB': return '🗄️'
      case 'AI': return '🤖'
      case 'PERFORMANCE': return '⚡'
      default: return '📝'
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context))
      this.writeToFile('DEBUG', message, context)
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context))
      this.writeToFile('INFO', message, context)
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context))
      this.writeToFile('WARN', message, context)
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context
      console.error(this.formatMessage('ERROR', message, errorContext))
      this.writeToFile('ERROR', message, errorContext)
    }
  }

  // Specialized logging methods
  success(message: string, context?: LogContext) {
    console.log(this.formatMessage('SUCCESS', message, context))
  }

  api(message: string, context?: LogContext) {
    console.log(this.formatMessage('API', message, context))
  }

  auth(message: string, context?: LogContext) {
    console.log(this.formatMessage('AUTH', message, context))
  }

  db(message: string, context?: LogContext) {
    console.log(this.formatMessage('DB', message, context))
  }

  ai(message: string, context?: LogContext) {
    console.log(this.formatMessage('AI', message, context))
  }

  performance(message: string, context?: LogContext) {
    console.log(this.formatMessage('PERFORMANCE', message, context))
  }

  // Request/Response logging helpers
  startTimer(): number {
    return Date.now()
  }

  endTimer(startTime: number, operation: string, context?: LogContext) {
    const duration = Date.now() - startTime
    const finalContext = { ...context, duration, operation }

    if (duration > 5000) {
      this.warn(`Slow operation detected`, finalContext)
    } else if (duration > 1000) {
      this.info(`Operation completed`, finalContext)
    } else {
      this.debug(`Operation completed`, finalContext)
    }

    return duration
  }

  // API request logger
  logRequest(method: string, url: string, context?: LogContext) {
    this.api(`${method} ${url}`, context)
  }

  logResponse(method: string, url: string, status: number, duration: number, context?: LogContext) {
    const responseContext = { ...context, status, duration }

    if (status >= 500) {
      this.error(`${method} ${url} - Server Error`, undefined, responseContext)
    } else if (status >= 400) {
      this.warn(`${method} ${url} - Client Error`, responseContext)
    } else if (status >= 300) {
      this.info(`${method} ${url} - Redirect`, responseContext)
    } else {
      this.success(`${method} ${url} - Success`, responseContext)
    }
  }

  // Database operation logging
  logDBOperation(operation: string, table?: string, context?: LogContext) {
    this.db(`${operation}${table ? ` on ${table}` : ''}`, context)
  }

  logDBError(operation: string, error: Error, context?: LogContext) {
    this.error(`Database ${operation} failed`, error, { ...context, operation: `db_${operation}` })
  }

  // Google API logging
  logGoogleAPI(service: string, operation: string, context?: LogContext) {
    this.api(`Google ${service}: ${operation}`, context)
  }

  // AI operation logging
  logAIOperation(operation: string, model?: string, context?: LogContext) {
    this.ai(`${operation}${model ? ` (${model})` : ''}`, context)
  }

  // Auth logging
  logAuth(event: string, user?: string, context?: LogContext) {
    this.auth(`${event}${user ? ` for ${user}` : ''}`, context)
  }

  // Create child logger with persistent context
  child(baseContext: LogContext): Logger {
    const childLogger = new Logger()

    // Override logging methods to include base context
    const originalMethods = ['debug', 'info', 'warn', 'error', 'success', 'api', 'auth', 'db', 'ai', 'performance']

    originalMethods.forEach(method => {
      const originalMethod = (childLogger as any)[method]
      ;(childLogger as any)[method] = (message: string, context?: LogContext) => {
        const mergedContext = { ...baseContext, ...context }
        originalMethod.call(childLogger, message, mergedContext)
      }
    })

    return childLogger
  }
}

// Create singleton instance
export const logger = new Logger()

// Export helper functions for common patterns
export const createAPILogger = (endpoint: string) => logger.child({ endpoint })
export const createUserLogger = (userId: string) => logger.child({ userId })

// Middleware helper for API routes
export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string,
  context?: LogContext
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = logger.startTimer()
    const opContext = { ...context, operation }

    try {
      logger.debug(`Starting ${operation}`, opContext)
      const result = await fn(...args)
      logger.endTimer(startTime, operation, opContext)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`${operation} failed`, error as Error, { ...opContext, duration })
      throw error
    }
  }
}

// Performance monitoring
export function logPerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  logger.performance(`${name} took ${(end - start).toFixed(2)}ms`)
}

// Request wrapper for Google APIs
export async function loggedFetch(url: string, options?: RequestInit, context?: LogContext) {
  const startTime = logger.startTimer()
  const method = options?.method || 'GET'

  logger.api(`${method} ${url}`, context)

  try {
    const response = await fetch(url, options)
    const duration = Date.now() - startTime

    logger.logResponse(method, url, response.status, duration, context)

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`${method} ${url} failed`, error as Error, { ...context, duration })
    throw error
  }
}