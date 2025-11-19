/**
 * CSRF Protection Middleware
 * Sprint 18 Phase 1 Task 1.2
 *
 * Implements double-submit cookie pattern using csrf-csrf package
 * Protects all state-changing REST endpoints (POST, PUT, DELETE)
 */

import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';

const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-change-me-in-production';

// Validate CSRF secret in production
if (process.env.NODE_ENV === 'production' && CSRF_SECRET === 'your-csrf-secret-change-me-in-production') {
  console.warn('⚠️  WARNING: Using default CSRF secret in production! Set CSRF_SECRET environment variable.');
}

/**
 * Configure CSRF protection using csrf-csrf package
 */
const csrfUtilities = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    // Use user session or IP as identifier
    // This prevents CSRF tokens from being used across different sessions
    return req.ip || 'anonymous';
  },
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

/**
 * Middleware to validate CSRF token on state-changing requests
 * Apply this to all POST/PUT/DELETE endpoints
 */
export const csrfProtection = csrfUtilities.doubleCsrfProtection;

/**
 * Error handler for CSRF validation failures
 * Returns user-friendly error message
 */
export const csrfErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Check if this is a CSRF error
  if (err.message && err.message.includes('csrf')) {
    return res.status(403).json({
      error: 'Invalid CSRF token. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }

  // Not a CSRF error, pass to next error handler
  next(err);
};

/**
 * Endpoint to get CSRF token for client-side use
 * Call this before making state-changing requests
 */
export const getCsrfToken = (req: Request, res: Response) => {
  const token = csrfUtilities.generateCsrfToken(req, res);
  res.json({ csrfToken: token });
};

/**
 * Optional: Middleware to exempt specific routes from CSRF protection
 * Use sparingly - only for webhooks or API routes with other authentication
 */
export const csrfExempt = (paths: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (paths.some(path => req.path.startsWith(path))) {
      return next();
    }
    return csrfProtection(req, res, next);
  };
};
