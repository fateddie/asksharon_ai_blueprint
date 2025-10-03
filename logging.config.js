// Logging configuration for development and testing
module.exports = {
  // Environment-specific settings
  development: {
    logLevel: 'DEBUG',
    enableConsoleLogging: true,
    enableFileLogging: false,
    logFormat: 'detailed',
    enablePerformanceMetrics: true,
    logSlowOperations: true,
    slowOperationThreshold: 1000, // ms
    enableAPILogging: true,
    enableDatabaseLogging: true,
    enableAuthLogging: true,
    maxLogEntries: 1000
  },

  test: {
    logLevel: 'WARN',
    enableConsoleLogging: false,
    enableFileLogging: true,
    logFormat: 'json',
    enablePerformanceMetrics: true,
    logSlowOperations: true,
    slowOperationThreshold: 500, // ms
    enableAPILogging: true,
    enableDatabaseLogging: false,
    enableAuthLogging: false,
    maxLogEntries: 100
  },

  production: {
    logLevel: 'INFO',
    enableConsoleLogging: false,
    enableFileLogging: true,
    logFormat: 'json',
    enablePerformanceMetrics: false,
    logSlowOperations: true,
    slowOperationThreshold: 5000, // ms
    enableAPILogging: true,
    enableDatabaseLogging: false,
    enableAuthLogging: false,
    maxLogEntries: 10000
  },

  // Specific endpoint configurations
  endpoints: {
    '/api/gmail-insights': {
      timeout: 30000, // 30s for AI processing
      logLevel: 'DEBUG',
      enableDetailedLogging: true
    },
    '/api/calendar-insights': {
      timeout: 15000, // 15s for calendar analysis
      logLevel: 'DEBUG',
      enableDetailedLogging: true
    },
    '/api/google-auth': {
      logLevel: 'INFO',
      enableDetailedLogging: false, // Security: don't log sensitive auth data
      maskSensitiveData: true
    },
    '/api/dashboard': {
      timeout: 10000,
      logLevel: 'WARN', // Only log issues
      enableCaching: true
    }
  },

  // Error categorization
  errorCategories: {
    'GOOGLE_API_ERROR': {
      severity: 'HIGH',
      alertThreshold: 3, // Alert after 3 occurrences
      retryable: true
    },
    'DATABASE_ERROR': {
      severity: 'CRITICAL',
      alertThreshold: 1,
      retryable: false
    },
    'OPENAI_TIMEOUT': {
      severity: 'MEDIUM',
      alertThreshold: 5,
      retryable: true
    },
    'COMPILATION_SLOW': {
      severity: 'LOW',
      alertThreshold: 10,
      retryable: false
    }
  },

  // Performance monitoring
  performance: {
    enableMetrics: true,
    sampleRate: 0.1, // 10% of requests
    trackUserJourney: true,
    trackAPILatency: true,
    trackDatabaseQueries: true,
    alertThresholds: {
      responseTime: 5000, // ms
      errorRate: 0.05, // 5%
      memoryUsage: 0.8 // 80%
    }
  },

  // Development helpers
  development_helpers: {
    logCompilationTimes: true,
    logHotReload: false,
    logFileChanges: false,
    enableDebugPanel: true,
    showPerformanceMetrics: true,
    highlightSlowQueries: true,
    enableRequestTracing: true
  },

  // Security and privacy
  security: {
    maskPasswords: true,
    maskApiKeys: true,
    maskPersonalInfo: true,
    logRetentionDays: 30,
    enableAuditLogging: false, // Enable in production for compliance
    obfuscateUserIds: false // Enable in production
  }
}