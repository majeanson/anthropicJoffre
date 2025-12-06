/**
 * CSRF Token Management
 * Sprint 18 Phase 1 Task 1.2
 *
 * Handles fetching and including CSRF tokens in requests
 */

import { API_ENDPOINTS } from '../config/constants';
import logger from '../utils/logger';

let csrfToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

/**
 * Fetch CSRF token from server
 * Caches token to avoid repeated requests
 */
export async function fetchCsrfToken(): Promise<string> {
  // If we already have a token, return it
  if (csrfToken) {
    return csrfToken;
  }

  // If a fetch is already in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

  // Fetch new token
  tokenPromise = (async () => {
    try {
      const response = await fetch(API_ENDPOINTS.csrfToken(), {
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken!;
    } catch (error) {
      logger.error('Error fetching CSRF token:', error);
      throw error;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

/**
 * Clear cached CSRF token
 * Call this after logout or CSRF errors
 */
export function clearCsrfToken() {
  csrfToken = null;
  tokenPromise = null;
}

/**
 * Get headers with CSRF token for fetch requests
 * Use this for POST/PUT/DELETE requests
 *
 * @param additionalHeaders - Optional additional headers to include
 */
export async function getHeadersWithCsrf(
  additionalHeaders: HeadersInit = {}
): Promise<HeadersInit> {
  const token = await fetchCsrfToken();

  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    ...additionalHeaders,
  };
}

// Auth endpoints exempt from CSRF (rate-limited, mobile Safari blocks cross-origin cookies)
const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
];

/**
 * Check if URL is exempt from CSRF protection
 */
function isCsrfExempt(url: string): boolean {
  return CSRF_EXEMPT_PATHS.some((path) => url.includes(path));
}

/**
 * Wrapper for fetch that automatically includes CSRF token
 * Use this for state-changing requests (POST/PUT/DELETE)
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryOnCsrfError - Whether to retry once if CSRF error occurs (default: true)
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {},
  retryOnCsrfError: boolean = true
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';

  // Only add CSRF for state-changing methods
  const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  // Skip CSRF for exempt endpoints (login, register, etc.)
  if (!needsCsrf || isCsrfExempt(url)) {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  // Ensure credentials are included for cookie-based auth
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };

  // Add CSRF token to headers
  try {
    const csrfHeaders = await getHeadersWithCsrf(options.headers);
    fetchOptions.headers = csrfHeaders;
  } catch (error) {
    logger.error('Failed to get CSRF token:', error);
    // Continue without CSRF token (will fail on server, but provides better error)
  }

  // Make the request
  const response = await fetch(url, fetchOptions);

  // If CSRF error and retry enabled, clear token and retry once
  if (!response.ok && retryOnCsrfError && response.status === 403) {
    try {
      const data = await response.clone().json();
      if (data.code === 'CSRF_VALIDATION_FAILED') {
        logger.warn('CSRF validation failed, retrying with new token...');
        clearCsrfToken();
        return fetchWithCsrf(url, options, false); // Retry without further retries
      }
    } catch (err) {
      // Response not JSON or other error, don't retry
    }
  }

  return response;
}

/**
 * Initialize CSRF token on app load
 * Call this in your app's initialization
 */
export async function initializeCsrf(): Promise<void> {
  try {
    await fetchCsrfToken();
  } catch (error) {
    logger.error('[CSRF] Failed to initialize token:', error);
    // Don't throw - app should still work, requests will fail with clear error
  }
}
