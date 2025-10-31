# CORS Policy Documentation

**Last Updated:** 2025-10-31 (Sprint 2)
**Maintainer:** Development Team

---

## Overview

This document describes the Cross-Origin Resource Sharing (CORS) configuration for the Trick Card Game backend. CORS is critical for security, controlling which frontend origins can access the API and WebSocket endpoints.

---

## Current Configuration

### Allowed Origins (Production)

When `CLIENT_URL` environment variable is set (production), the following origins are allowed:

1. **`https://jaffre.vercel.app`**
   - Primary production frontend (Vercel deployment)
   - Protocol: HTTPS only
   - Status: Active

2. **`CLIENT_URL` from environment**
   - Configured via environment variable
   - Allows flexible deployment to different domains
   - Auto-strips trailing slashes

### Allowed Origins (Development)

When `CLIENT_URL` is **not** set (development), CORS is set to `*` (allow all origins).

**Development Origins (when specified):**
- `http://localhost:5173` - Vite dev server (default)
- `http://localhost:3000` - Alternative dev port
- `CLIENT_URL` - Custom development URL

---

## Configuration Code

### Socket.io CORS

```typescript
const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, ''); // Remove trailing slash
const allowedOrigins: string[] = [
  'https://jaffre.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  clientUrl || '',
].filter((origin): origin is string => Boolean(origin) && origin.length > 0);

const corsOrigin = clientUrl ? allowedOrigins : '*';

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // ... other config
});
```

### Express CORS

```typescript
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
```

---

## Security Features

### ✅ Production Safety

- **Explicit origin whitelist** when `CLIENT_URL` is set
- **No wildcards** in production
- **HTTPS enforced** for production domains
- **Credentials enabled** for cookie/session support

### ⚠️ Development Flexibility

- **Wildcard allowed** only in development (no `CLIENT_URL` set)
- **Localhost ports** explicitly whitelisted
- **HTTP permitted** for local development

---

## Environment Variables

### `CLIENT_URL`

**Purpose:** Specifies the production frontend URL
**Format:** Full URL with protocol (e.g., `https://jaffre.vercel.app`)
**Default:** None (triggers development mode with wildcard CORS)

**Production Example:**
```bash
CLIENT_URL=https://jaffre.vercel.app
```

**Staging Example:**
```bash
CLIENT_URL=https://staging.jaffre.vercel.app
```

---

## Adding New Origins

### Production Deployment

To add a new production origin:

1. **Update `allowedOrigins` array** in `backend/src/index.ts`:
   ```typescript
   const allowedOrigins: string[] = [
     'https://jaffre.vercel.app',
     'https://new-domain.com', // Add here
     'http://localhost:5173',
     'http://localhost:3000',
     clientUrl || '',
   ];
   ```

2. **Test CORS headers**:
   ```bash
   curl -H "Origin: https://new-domain.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        http://localhost:3001/api/health
   ```

3. **Verify response headers**:
   - `Access-Control-Allow-Origin: https://new-domain.com`
   - `Access-Control-Allow-Credentials: true`

### Development Environment

For development, set `CLIENT_URL` to your local development URL or leave unset to allow all origins.

---

## CORS Headers

### Request Headers (Preflight)

Clients send preflight OPTIONS requests with:
- `Origin: <requesting-origin>`
- `Access-Control-Request-Method: <method>`
- `Access-Control-Request-Headers: <headers>`

### Response Headers (Server)

Server responds with:
- `Access-Control-Allow-Origin: <allowed-origin>` (or `*` in dev)
- `Access-Control-Allow-Methods: GET, POST`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Headers: <requested-headers>`

---

## Troubleshooting

### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Frontend origin not in allowed list
**Solution:**
1. Check `CLIENT_URL` environment variable
2. Verify origin in `allowedOrigins` array
3. Ensure protocol matches (http vs https)
4. Check for trailing slashes

### "CORS policy: The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when credentials are enabled"

**Cause:** Using `*` with `credentials: true`
**Solution:** Set specific `CLIENT_URL` to enable credentials

### WebSocket Connection Fails

**Cause:** Socket.io CORS misconfiguration
**Solution:**
1. Check Socket.io CORS config matches Express CORS
2. Verify `methods: ['GET', 'POST']` includes required methods
3. Test with browser dev tools Network tab

---

## Testing CORS

### Manual Testing

```bash
# Test API endpoint
curl -H "Origin: https://jaffre.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:3001/api/health

# Expected response headers:
# Access-Control-Allow-Origin: https://jaffre.vercel.app
# Access-Control-Allow-Credentials: true
```

### Browser Testing

1. Open browser dev tools (F12)
2. Go to Network tab
3. Make request from allowed origin
4. Check response headers for `Access-Control-Allow-Origin`

---

## Security Best Practices

### ✅ DO

- **Use specific origins** in production
- **Enable credentials** for cookie/session support
- **Use HTTPS** for production domains
- **Validate origin** against whitelist
- **Log CORS violations** for monitoring
- **Test CORS** after every deployment

### ❌ DON'T

- **Use wildcards (`*`)** in production
- **Allow all origins** in production
- **Mix HTTP and HTTPS** origins
- **Forget trailing slashes** (auto-stripped)
- **Expose internal endpoints** to external origins

---

## Monitoring

### CORS Violations

CORS violations are logged in the health endpoint:

```json
GET /api/health/detailed

{
  "cors": {
    "origin": "https://jaffre.vercel.app or All origins (development)"
  }
}
```

### Logging

- **Invalid origin requests** are logged in development
- **CORS misconfigurations** trigger server warnings
- **Preflight failures** logged with origin and method

---

## Deployment Checklist

Before deploying to production:

- [ ] `CLIENT_URL` environment variable set
- [ ] Only HTTPS origins in allowed list
- [ ] Wildcard CORS disabled (`corsOrigin !== '*'`)
- [ ] Credentials enabled for session support
- [ ] CORS headers tested with production domain
- [ ] WebSocket connections tested from production
- [ ] Health endpoint shows correct origin whitelist

---

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Socket.io CORS](https://socket.io/docs/v4/handling-cors/)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)

---

**Status:** ✅ Production-ready CORS configuration
**Last Reviewed:** 2025-10-31 (Sprint 2)
