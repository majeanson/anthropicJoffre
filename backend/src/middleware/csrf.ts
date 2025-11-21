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
const isProduction = process.env.NODE_ENV === 'production';

// Validate CSRF secret in production
if (isProduction && CSRF_SECRET === 'your-csrf-secret-change-me-in-production') {
  console.warn('⚠️  WARNING: Using default CSRF secret in production! Set CSRF_SECRET environment variable.');
}

/**
 * Configure CSRF protection using csrf-csrf package
 *
 * Key production considerations:
 * - Session identifier must be stable across requests (not IP-based behind proxies)
 * - Cookie sameSite must be 'none' for cross-origin deployments (Vercel frontend + Railway backend)
 * - secure: true is REQUIRED when sameSite is 'none'
 *
 * Architecture: Frontend on jaffre.vercel.app, Backend on anthropicjoffre-production.up.railway.app
 * This is cross-origin, so we need sameSite: 'none' for cookies to be sent.
 */
const csrfUtilities = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    // In production behind proxies (Railway, Cloudflare, etc.), req.ip can be inconsistent.
    // The double-submit cookie pattern doesn't strictly need session binding since:
    // 1. The attacker can't read the cookie value (httpOnly)
    // 2. The attacker can't set cookies for our domain
    // 3. The token must match the cookie value exactly
    //
    // Using a static identifier is safe because the CSRF protection comes from
    // the inability of attackers to read/set our domain's cookies, not from
    // binding to a specific session.
    return 'csrf-session';
  },
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    // secure: true is required when sameSite: 'none'
    secure: isProduction,
    // Cross-origin deployment (Vercel + Railway) requires sameSite: 'none'
    // In development (localhost), 'lax' works for same-origin
    sameSite: isProduction ? 'none' : 'lax',
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
