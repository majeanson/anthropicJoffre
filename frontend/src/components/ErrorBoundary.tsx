/**
 * ErrorBoundary Component
 * Sprint 8 Phase 8.1: Enhanced Error Handling with Verbose Logging
 *
 * Comprehensive error boundary with detailed debugging information
 */

import { Component, ErrorInfo, ReactNode } from 'react';

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: Record<string, unknown>) => void;
    };
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to external error tracking service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // If Sentry is configured, log the error
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    // Log error details for debugging
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errorLog.push(errorData);
      // Keep only last 10 errors
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (e) {
      console.error('Failed to store error in localStorage:', e);
    }
  };

  handleReset = () => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // If we've had too many errors, force a page reload
    if (this.state.errorCount > 3) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Otherwise, use the inline error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 to-gray-900">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Something Went Wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              An unexpected error occurred. Don't worry, your game progress should be saved.
            </p>
            {this.state.error && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  {this.state.error.message}
                </p>
                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Show Technical Details
                    </summary>
                    <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-48">
                      {this.state.error.stack}
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                Reload Game
              </button>
            </div>
            {this.state.errorCount > 1 && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Error count: {this.state.errorCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;