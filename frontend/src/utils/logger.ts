/**
 * Frontend Logger
 * Sprint 8 Task 3: Replace console.log with Logger
 *
 * Structured logging for frontend with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class Logger {
  private enabled = import.meta.env.DEV;
  private maxErrorLogSize = 10;

  /**
   * Debug logs (development only)
   */
  debug(message: string, data?: LogData) {
    if (!this.enabled) return;
    console.debug(`[DEBUG] ${message}`, data || '');
  }

  /**
   * Info logs (development only)
   */
  info(message: string, data?: LogData) {
    if (!this.enabled) return;
    console.info(`[INFO] ${message}`, data || '');
  }

  /**
   * Warning logs (always logged)
   */
  warn(message: string, data?: LogData) {
    console.warn(`[WARN] ${message}`, data || '');
  }

  /**
   * Error logs (always logged + sent to backend)
   */
  error(message: string, error?: any, data?: LogData) {
    console.error(`[ERROR] ${message}`, error || '', data || '');

    // Send to backend for aggregation
    this.reportError(message, error, data);
  }

  /**
   * Report error to backend error tracking
   */
  private async reportError(message: string, error: any, data?: LogData) {
    try {
      const errorLog = {
        message,
        error: error?.toString(),
        stack: error?.stack,
        data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Store in localStorage for debugging
      this.storeErrorInLocalStorage(errorLog);

      // Send to backend (fire and forget)
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
      fetch(`${SOCKET_URL}/api/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
      }).catch(() => {
        // Ignore errors in error reporting
      });
    } catch (e) {
      // Fail silently
    }
  }

  /**
   * Store error in localStorage for debugging
   */
  private storeErrorInLocalStorage(errorLog: any) {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('errorLog') || '[]');
      storedErrors.push(errorLog);

      // Keep only last N errors
      if (storedErrors.length > this.maxErrorLogSize) {
        storedErrors.shift();
      }

      localStorage.setItem('errorLog', JSON.stringify(storedErrors));
    } catch (e) {
      // Fail silently
    }
  }

  /**
   * Get stored errors from localStorage
   */
  getStoredErrors(): any[] {
    try {
      return JSON.parse(localStorage.getItem('errorLog') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear stored errors
   */
  clearStoredErrors() {
    try {
      localStorage.removeItem('errorLog');
    } catch (e) {
      // Fail silently
    }
  }
}

export const logger = new Logger();
export default logger;
