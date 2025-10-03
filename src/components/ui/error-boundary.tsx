'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 * Logs errors for debugging and monitoring
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to logging service
    logger.error('React Error Boundary caught error', error, {
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
          <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Something went wrong
              </h2>

              <p className="text-base-content/70">
                We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4">
                  <div className="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title font-medium">
                      Error Details (Development Only)
                    </div>
                    <div className="collapse-content">
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-sm">Error Message:</p>
                          <p className="text-sm font-mono bg-base-300 p-2 rounded">
                            {this.state.error.message}
                          </p>
                        </div>

                        {this.state.error.stack && (
                          <div>
                            <p className="font-semibold text-sm">Stack Trace:</p>
                            <pre className="text-xs font-mono bg-base-300 p-2 rounded overflow-x-auto">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}

                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <p className="font-semibold text-sm">Component Stack:</p>
                            <pre className="text-xs font-mono bg-base-300 p-2 rounded overflow-x-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </button>
                <button
                  className="btn btn-outline"
                  onClick={this.handleReset}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}
