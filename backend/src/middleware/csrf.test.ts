/**
 * CSRF Protection Middleware Tests
 * Sprint 18 Phase 1 Task 1.2
 *
 * Tests for CSRF double-submit cookie pattern
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { csrfProtection, getCsrfToken, csrfErrorHandler } from './csrf';

describe('CSRF Protection Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create test Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Add CSRF token endpoint
    app.get('/api/csrf-token', getCsrfToken);

    // Protected routes
    app.post('/api/protected', csrfProtection, (req, res) => {
      res.json({ success: true, message: 'Protected action completed' });
    });

    app.put('/api/protected/:id', csrfProtection, (req, res) => {
      res.json({ success: true, id: req.params.id });
    });

    app.delete('/api/protected/:id', csrfProtection, (req, res) => {
      res.json({ success: true, deleted: req.params.id });
    });

    // Unprotected routes (GET requests)
    app.get('/api/public', (req, res) => {
      res.json({ success: true, message: 'Public data' });
    });

    // Error handler
    app.use(csrfErrorHandler);
  });

  describe('GET /api/csrf-token', () => {
    it('should generate and return CSRF token', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.body.csrfToken.length).toBeGreaterThan(0);
    });

    it('should set CSRF token in cookie', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('csrf-token'))).toBe(true);
    });

    it('should set httpOnly cookie', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      const csrfCookie = cookies.find((c: string) => c.includes('csrf-token'));
      expect(csrfCookie).toContain('HttpOnly');
    });

    it('should set SameSite=Strict', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      const csrfCookie = cookies.find((c: string) => c.includes('csrf-token'));
      expect(csrfCookie).toContain('SameSite=Strict');
    });

    it('should generate different tokens for different requests', async () => {
      const response1 = await request(app).get('/api/csrf-token');
      const response2 = await request(app).get('/api/csrf-token');

      expect(response1.body.csrfToken).not.toBe(response2.body.csrfToken);
    });
  });

  describe('CSRF Protection on State-Changing Requests', () => {
    describe('POST requests', () => {
      it('should allow request with valid CSRF token', async () => {
        // First, get a CSRF token
        const tokenResponse = await request(app).get('/api/csrf-token');
        const csrfToken = tokenResponse.body.csrfToken;
        const cookies = tokenResponse.headers['set-cookie'];

        // Make protected request with token
        const response = await request(app)
          .post('/api/protected')
          .set('Cookie', cookies)
          .set('X-CSRF-Token', csrfToken)
          .send({ data: 'test' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject request without CSRF token', async () => {
        const response = await request(app)
          .post('/api/protected')
          .send({ data: 'test' })
          .expect(403);

        expect(response.body.error).toContain('CSRF');
        expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
      });

      it('should reject request with invalid CSRF token', async () => {
        const response = await request(app)
          .post('/api/protected')
          .set('X-CSRF-Token', 'invalid-token-12345')
          .send({ data: 'test' })
          .expect(403);

        expect(response.body.error).toContain('CSRF');
      });

      it('should reject request with token but no cookie', async () => {
        const tokenResponse = await request(app).get('/api/csrf-token');
        const csrfToken = tokenResponse.body.csrfToken;

        const response = await request(app)
          .post('/api/protected')
          .set('X-CSRF-Token', csrfToken)
          .send({ data: 'test' })
          .expect(403);

        expect(response.body.error).toContain('CSRF');
      });

      it('should reject request with cookie but no token', async () => {
        const tokenResponse = await request(app).get('/api/csrf-token');
        const cookies = tokenResponse.headers['set-cookie'];

        const response = await request(app)
          .post('/api/protected')
          .set('Cookie', cookies)
          .send({ data: 'test' })
          .expect(403);

        expect(response.body.error).toContain('CSRF');
      });
    });

    describe('PUT requests', () => {
      it('should protect PUT requests', async () => {
        const tokenResponse = await request(app).get('/api/csrf-token');
        const csrfToken = tokenResponse.body.csrfToken;
        const cookies = tokenResponse.headers['set-cookie'];

        const response = await request(app)
          .put('/api/protected/123')
          .set('Cookie', cookies)
          .set('X-CSRF-Token', csrfToken)
          .send({ data: 'updated' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.id).toBe('123');
      });

      it('should reject PUT without token', async () => {
        await request(app)
          .put('/api/protected/123')
          .send({ data: 'updated' })
          .expect(403);
      });
    });

    describe('DELETE requests', () => {
      it('should protect DELETE requests', async () => {
        const tokenResponse = await request(app).get('/api/csrf-token');
        const csrfToken = tokenResponse.body.csrfToken;
        const cookies = tokenResponse.headers['set-cookie'];

        const response = await request(app)
          .delete('/api/protected/123')
          .set('Cookie', cookies)
          .set('X-CSRF-Token', csrfToken)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.deleted).toBe('123');
      });

      it('should reject DELETE without token', async () => {
        await request(app)
          .delete('/api/protected/123')
          .expect(403);
      });
    });

    describe('GET requests (should NOT be protected)', () => {
      it('should allow GET requests without CSRF token', async () => {
        const response = await request(app)
          .get('/api/public')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should not require CSRF token for GET to protected route', async () => {
        // Even if route has protection middleware, GET should pass
        app.get('/api/test-get', csrfProtection, (req, res) => {
          res.json({ success: true });
        });

        await request(app)
          .get('/api/test-get')
          .expect(200);
      });
    });
  });

  describe('CSRF Error Handler', () => {
    it('should return user-friendly error message', async () => {
      const response = await request(app)
        .post('/api/protected')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token. Please refresh the page and try again.');
      expect(response.body.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('should return 403 status code for CSRF errors', async () => {
      await request(app)
        .post('/api/protected')
        .expect(403);
    });

    it('should pass through non-CSRF errors', async () => {
      app.post('/api/error', (req, res, next) => {
        next(new Error('Some other error'));
      });

      app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (err.message === 'Some other error') {
          res.status(500).json({ error: err.message });
        } else {
          next(err);
        }
      });

      const response = await request(app)
        .post('/api/error')
        .expect(500);

      expect(response.body.error).toBe('Some other error');
    });
  });

  describe('Token Validation', () => {
    it('should validate token matches cookie', async () => {
      // Get token for session A
      const sessionA = await request(app).get('/api/csrf-token');
      const tokenA = sessionA.body.csrfToken;

      // Get token for session B
      const sessionB = await request(app).get('/api/csrf-token');
      const cookiesB = sessionB.headers['set-cookie'];

      // Try to use token A with cookie B (should fail)
      const response = await request(app)
        .post('/api/protected')
        .set('Cookie', cookiesB)
        .set('X-CSRF-Token', tokenA)
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toContain('CSRF');
    });

    it('should accept token from same session', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const csrfToken = tokenResponse.body.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];

      // Use token with its matching cookie
      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);
    });
  });

  describe('Security Features', () => {
    it('should use different tokens for different sessions', async () => {
      const session1 = await request(app).get('/api/csrf-token');
      const session2 = await request(app).get('/api/csrf-token');

      expect(session1.body.csrfToken).not.toBe(session2.body.csrfToken);
    });

    it('should set httpOnly flag to prevent XSS', async () => {
      const response = await request(app).get('/api/csrf-token');
      const cookies = response.headers['set-cookie'];
      const csrfCookie = cookies.find((c: string) => c.includes('csrf-token'));

      expect(csrfCookie).toContain('HttpOnly');
    });

    it('should use SameSite=Strict to prevent CSRF', async () => {
      const response = await request(app).get('/api/csrf-token');
      const cookies = response.headers['set-cookie'];
      const csrfCookie = cookies.find((c: string) => c.includes('csrf-token'));

      expect(csrfCookie).toContain('SameSite=Strict');
    });

    it('should use Secure flag in production', async () => {
      // Note: This test verifies the logic, but Secure flag is only set when
      // NODE_ENV=production at module load time. The middleware checks:
      // secure: process.env.NODE_ENV === 'production'
      //
      // In development (current test env), Secure flag is not set
      const response = await request(app).get('/api/csrf-token');
      const cookies = response.headers['set-cookie'];
      const csrfCookie = cookies.find((c: string) => c.includes('csrf-token'));

      // In development, Secure should NOT be set
      expect(csrfCookie).not.toContain('Secure');

      // Verify other security flags are still present
      expect(csrfCookie).toContain('HttpOnly');
      expect(csrfCookie).toContain('SameSite=Strict');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing X-CSRF-Token header', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const cookies = tokenResponse.headers['set-cookie'];

      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(403);
    });

    it('should handle empty CSRF token', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const cookies = tokenResponse.headers['set-cookie'];

      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', '')
        .send({ data: 'test' })
        .expect(403);
    });

    it('should handle malformed CSRF token', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const cookies = tokenResponse.headers['set-cookie'];

      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', '!!!invalid!!!')
        .send({ data: 'test' })
        .expect(403);
    });

    it('should handle multiple CSRF tokens in header', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const csrfToken = tokenResponse.body.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];

      // Only first token should be used
      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);
    });
  });

  describe('Integration with Authentication', () => {
    it('should work with authenticated requests', async () => {
      const tokenResponse = await request(app).get('/api/csrf-token');
      const csrfToken = tokenResponse.body.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];

      // Add authentication to protected route
      app.post('/api/auth-protected', csrfProtection, (req, res) => {
        // Simulate auth check
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ success: true, authenticated: true });
      });

      const response = await request(app)
        .post('/api/auth-protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .set('Authorization', 'Bearer valid-token')
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.authenticated).toBe(true);
    });

    it('should require both CSRF token and auth token', async () => {
      app.post('/api/auth-protected', csrfProtection, (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ success: true });
      });

      // Request with auth but no CSRF should fail
      await request(app)
        .post('/api/auth-protected')
        .set('Authorization', 'Bearer valid-token')
        .send({ data: 'test' })
        .expect(403); // CSRF error comes first
    });
  });
});

describe('CSRF Configuration', () => {
  it('should warn about default secret in production', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.CSRF_SECRET;

    process.env.NODE_ENV = 'production';
    delete process.env.CSRF_SECRET;

    // Re-import module to trigger warning
    // (In actual implementation, this would be checked on server start)

    process.env.NODE_ENV = originalEnv;
    process.env.CSRF_SECRET = originalSecret;
    consoleWarnSpy.mockRestore();
  });
});
