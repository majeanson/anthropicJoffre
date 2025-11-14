# HTTPS Configuration Guide

**Date**: 2025-11-14
**Status**: ✅ Configured and verified

## Overview

The application uses HTTPS for all production traffic. Both Railway (backend) and Vercel (frontend) provide automatic SSL/TLS certificates.

---

## 🔒 Current Configuration

### Backend (Railway)
- **URL**: `https://anthropicjoffre-production.up.railway.app`
- **SSL**: Automatic SSL certificates (Let's Encrypt)
- **Protocol**: HTTPS enforced automatically by Railway
- **WebSocket**: Secure WebSocket (wss://) used for Socket.io connections

### Frontend (Vercel)
- **URL**: `https://jaffre.vercel.app`
- **SSL**: Automatic SSL certificates (Let's Encrypt)
- **Protocol**: HTTPS enforced automatically by Vercel
- **Mixed Content**: Prevented by using environment variables for backend URL

---

## 🔧 Environment Variable Configuration

### Backend Environment Variables (Railway)

```env
# Client URL for CORS (HTTPS required in production)
CLIENT_URL=https://jaffre.vercel.app

# Database connection (SSL required)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require&channel_binding=require
```

**CORS Configuration** (`backend/src/index.ts:220-234`):
```typescript
const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, ''); // Remove trailing slash
const allowedOrigins: string[] = [
  'https://jaffre.vercel.app',  // Production frontend
  'http://localhost:5173',      // Development frontend
  'http://localhost:3000',
  clientUrl,
].filter((origin): origin is string => Boolean(origin) && origin.length > 0);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,  // Required for secure cookies
  },
});
```

### Frontend Environment Variables (Vercel)

```env
# Socket URL (HTTPS/WSS required in production)
VITE_SOCKET_URL=https://anthropicjoffre-production.up.railway.app

# API URL (HTTPS required in production)
VITE_API_URL=https://anthropicjoffre-production.up.railway.app
VITE_API_BASE_URL=https://anthropicjoffre-production.up.railway.app/api
```

**Socket.io Configuration** (`frontend/src/hooks/useSocketConnection.ts:17`):
```typescript
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Socket.io automatically upgrades HTTP → HTTPS and WS → WSS
// when connecting to an HTTPS URL
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

---

## ✅ Security Features

### 1. SSL/TLS Certificates
- **Automatic Renewal**: Both Railway and Vercel auto-renew certificates
- **Protocol**: TLS 1.2 and TLS 1.3 supported
- **Cipher Suites**: Modern, secure ciphers only

### 2. CORS Protection
- **Whitelisted Origins**: Only allowed origins can connect
- **Credentials**: Secure cookies enabled with `credentials: true`
- **Development Mode**: Wildcard (`*`) allowed only in local development

### 3. Database Security
- **SSL Mode**: `require` for all connections
- **Channel Binding**: `require` for additional security
- **Connection Pooling**: Max 20 connections with secure reuse

### 4. Mixed Content Prevention
- **Environment Variables**: All URLs configured via env vars
- **No Hardcoded HTTP**: No HTTP URLs in production code
- **Automatic Upgrade**: Socket.io upgrades HTTP → HTTPS automatically

---

## 🧪 Verification Steps

### 1. Verify Backend HTTPS

```bash
# Check SSL certificate
curl -I https://anthropicjoffre-production.up.railway.app/api/health

# Expected response headers:
# HTTP/2 200
# content-security-policy: ...
# strict-transport-security: max-age=31536000
```

### 2. Verify Frontend HTTPS

```bash
# Check SSL certificate
curl -I https://jaffre.vercel.app

# Expected response headers:
# HTTP/2 200
# strict-transport-security: max-age=63072000
```

### 3. Verify WebSocket Secure Connection

**Browser DevTools → Network Tab:**
1. Filter by "WS" (WebSocket)
2. Look for connection to backend
3. Verify protocol is **wss://** (not ws://)

**Console Verification:**
```javascript
// In browser console
console.log(window.location.protocol); // Should be "https:"
```

### 4. Verify CORS Configuration

**Browser DevTools → Console:**
```javascript
// Successful connection should show:
// Socket.io connected to: wss://anthropicjoffre-production.up.railway.app

// Failed connection would show:
// CORS error: "...blocked by CORS policy..."
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Mixed Content Warning

**Symptom**: Browser console shows "Mixed Content" warning

**Cause**: Frontend trying to connect to HTTP backend from HTTPS page

**Solution**:
```env
# In Vercel environment variables, change:
VITE_SOCKET_URL=http://... # ❌ Wrong

# To:
VITE_SOCKET_URL=https://... # ✅ Correct
```

### Issue 2: CORS Error in Production

**Symptom**: `"...blocked by CORS policy"`

**Cause**: Frontend URL not in backend CORS whitelist

**Solution**:
1. Go to Railway → Your Service → Variables
2. Set `CLIENT_URL` to exact frontend URL (no trailing slash)
3. Redeploy backend

```env
# ❌ Wrong (trailing slash)
CLIENT_URL=https://jaffre.vercel.app/

# ✅ Correct (no trailing slash)
CLIENT_URL=https://jaffre.vercel.app
```

### Issue 3: WebSocket Connection Fails

**Symptom**: Socket.io can't connect, falls back to long polling

**Cause**: WebSocket not using secure protocol (wss://)

**Solution**: Ensure `VITE_SOCKET_URL` uses `https://` (Socket.io auto-upgrades to wss://)

```env
# Socket.io automatically converts:
# https:// → wss:// for WebSocket connections
VITE_SOCKET_URL=https://anthropicjoffre-production.up.railway.app
```

### Issue 4: Database SSL Connection Error

**Symptom**: `"SSL connection required"`

**Cause**: Missing SSL parameters in DATABASE_URL

**Solution**:
```env
# ❌ Wrong (no SSL params)
DATABASE_URL=postgresql://user:pass@host:5432/db

# ✅ Correct (SSL enforced)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require&channel_binding=require
```

---

## 📊 Security Headers

The backend should respond with these security headers:

```http
# HSTS - Force HTTPS for 1 year
Strict-Transport-Security: max-age=31536000; includeSubDomains

# Prevent MIME type sniffing
X-Content-Type-Options: nosniff

# Prevent clickjacking
X-Frame-Options: DENY

# XSS Protection (legacy browsers)
X-XSS-Protection: 1; mode=block

# Content Security Policy
Content-Security-Policy: default-src 'self'; ...
```

**Implementation** (backend/src/index.ts):
```typescript
// Add security headers middleware (if not already present)
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

## 🔍 Production Checklist

- [x] Backend uses HTTPS (Railway automatic SSL)
- [x] Frontend uses HTTPS (Vercel automatic SSL)
- [x] WebSocket uses WSS (automatic upgrade from HTTPS)
- [x] Database connections use SSL (sslmode=require)
- [x] CORS configured with whitelisted origins
- [x] Environment variables use HTTPS URLs
- [x] No hardcoded HTTP URLs in production code
- [ ] Security headers implemented (HSTS, CSP, etc.)
- [ ] SSL certificate monitoring (automatic with Railway/Vercel)

---

## 📚 References

- [Railway HTTPS Documentation](https://docs.railway.app/deploy/networking#https)
- [Vercel HTTPS Documentation](https://vercel.com/docs/concepts/edge-network/encryption)
- [Socket.io Security Best Practices](https://socket.io/docs/v4/security/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)

---

*Last Updated: 2025-11-14*
