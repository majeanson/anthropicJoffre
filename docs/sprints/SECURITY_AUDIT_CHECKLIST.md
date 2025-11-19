# Security Audit Checklist

**Sprint 18 Phase 3 Task 3.4**
**Purpose**: Comprehensive security validation before production deployment

---

## Audit Overview

**Scope**: Full application security review covering authentication, authorization, input validation, data protection, and infrastructure security.

**Methodology**: Manual testing + automated scanning + code review

**Timeline**: 3-4 hours

**Tools Required**:
- Browser DevTools (Network, Application, Console tabs)
- OWASP ZAP or Burp Suite (optional, for advanced testing)
- SQLMap (for SQL injection testing)
- npm audit (for dependency vulnerabilities)

---

## 1. Authentication Security

### Password Security
- [ ] Minimum password length enforced (8+ characters)
- [ ] Password complexity requirements (uppercase, lowercase, numbers, symbols)
- [ ] Passwords hashed with bcrypt (NOT plaintext or MD5)
- [ ] Salt rounds ≥ 10 for bcrypt
- [ ] Password validation on both client and server
- [ ] Password reset tokens expire after 1 hour
- [ ] Old password required to change password (if logged in)

**Test**:
```bash
# Try weak password
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123"}'

# Expected: Error "Password must be at least 8 characters"
```

### Token Security (Sprint 18)
- [ ] JWT access tokens expire after 15 minutes
- [ ] Refresh tokens expire after 30 days
- [ ] Refresh tokens stored as httpOnly cookies (NOT localStorage)
- [ ] Refresh tokens hashed with SHA-256 in database
- [ ] Old refresh token revoked immediately on rotation
- [ ] Token theft detection enabled (suspicious usage → revoke all)
- [ ] Rate limiting on /api/auth/refresh (10 requests/hour)
- [ ] Tokens invalidated on logout
- [ ] "Logout All Devices" revokes ALL refresh tokens

**Test**:
```javascript
// In browser DevTools Console:

// 1. Check access token expiration
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires in:', (payload.exp * 1000 - Date.now()) / 1000 / 60, 'minutes');
// Expected: ~15 minutes or less

// 2. Check refresh token is httpOnly
document.cookie.includes('refresh_token');
// Expected: false (JavaScript cannot access httpOnly cookies)

// 3. Test token rotation
// Login → Wait 5 minutes → Check Network tab for /api/auth/refresh
// Expected: Auto-refresh before expiration, new access_token returned
```

### Session Security
- [ ] Sessions expire after inactivity (30 days for refresh token)
- [ ] Concurrent session limit enforced (optional)
- [ ] Session fixation prevented (new token on login)
- [ ] Session hijacking prevented (httpOnly + secure cookies)
- [ ] IP address tracking for suspicious activity
- [ ] User agent tracking for device identification

**Test**:
```bash
# Test session fixation
# 1. Get a token before login
# 2. Login
# 3. Check if old token still valid
# Expected: Old token rejected, new token required
```

### Account Security
- [ ] Email verification required before login
- [ ] Email verification tokens expire after 24 hours
- [ ] Account lockout after 5 failed login attempts (optional)
- [ ] Password reset requires email verification
- [ ] Password reset tokens single-use only
- [ ] No user enumeration (same error for invalid username/email)

**Test**:
```bash
# User enumeration test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"wrong"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com","password":"wrong"}'

# Expected: SAME error message for both (e.g., "Invalid credentials")
# ❌ BAD: "User not found" vs "Invalid password"
```

---

## 2. CSRF Protection (Sprint 18)

### CSRF Token Implementation
- [ ] CSRF tokens generated for all state-changing requests
- [ ] CSRF token stored in httpOnly cookie
- [ ] CSRF token validated on POST/PUT/DELETE/PATCH requests
- [ ] GET requests do NOT require CSRF token
- [ ] CSRF token unique per session
- [ ] CSRF token regenerated on login/logout
- [ ] Double-submit cookie pattern implemented correctly

**Test**:
```bash
# 1. Test without CSRF token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 403 Forbidden "CSRF token missing or invalid"

# 2. Test with invalid CSRF token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: invalid-token" \
  -d '{}'

# Expected: 403 Forbidden "CSRF validation failed"

# 3. Test with valid CSRF token
# (Get token from GET /api/csrf-token first)
TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r '.csrfToken')
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -b "csrf-token=..." \
  -d '{}'

# Expected: Success (200 OK)
```

### CSRF Error Handling
- [ ] User-friendly error messages (not "CSRF validation failed")
- [ ] Frontend auto-retries on CSRF failure (fetches new token)
- [ ] No sensitive data in CSRF error responses
- [ ] CSRF errors logged for monitoring

**Test**:
```javascript
// In browser: Delete CSRF cookie manually
document.cookie = 'csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

// Try to perform action (e.g., send message, update profile)
// Expected: Auto-retry with new CSRF token (user doesn't see error)
```

---

## 3. Input Validation & Injection Prevention

### SQL Injection
- [ ] All database queries use parameterized queries ($1, $2, ...)
- [ ] NO string concatenation in SQL queries
- [ ] User input NEVER directly embedded in SQL
- [ ] ORM/query builder used where possible
- [ ] Input length limits enforced

**Test**:
```bash
# Test SQL injection in login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com'"'"' OR 1=1--","password":"anything"}'

# Expected: Invalid credentials (NOT successful login)

# Test SQL injection in search
curl -X GET "http://localhost:3000/api/games/lobby?search=' OR 1=1--"

# Expected: No games found OR error (NOT all games returned)

# Advanced: Use SQLMap
sqlmap -u "http://localhost:3000/api/games/lobby?search=test" --batch --level=5 --risk=3

# Expected: No SQL injection vulnerabilities found
```

### XSS (Cross-Site Scripting)
- [ ] All user input escaped/sanitized before rendering
- [ ] React's JSX auto-escaping enabled (default)
- [ ] NO `dangerouslySetInnerHTML` without sanitization
- [ ] NO `eval()` or `Function()` with user input
- [ ] Content-Security-Policy header set
- [ ] X-XSS-Protection header set

**Test**:
```bash
# Test XSS in chat messages
# Send message with script tag
<script>alert('XSS')</script>

# Expected: Rendered as text (NOT executed)

# Test XSS in username
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"<script>alert(1)</script>","email":"xss@test.com","password":"Password123!"}'

# Expected: Either rejected OR escaped when displayed

# Test reflected XSS in URL
http://localhost:3001/?error=<script>alert(1)</script>

# Expected: Script NOT executed
```

### Command Injection
- [ ] NO `child_process.exec()` with user input
- [ ] NO `eval()` or `vm.runInThisContext()` with user input
- [ ] File paths validated and sanitized
- [ ] Path traversal prevented (no `../` in file names)

**Test**:
```bash
# Test command injection (if file upload exists)
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.txt;filename=../../etc/passwd"

# Expected: Rejected (invalid filename)

# Test path traversal
curl -X GET "http://localhost:3000/api/files/../../etc/passwd"

# Expected: 403 Forbidden or 404 Not Found (NOT file contents)
```

### NoSQL Injection (if using MongoDB)
- [ ] User input validated before MongoDB queries
- [ ] NO `$where` operator with user input
- [ ] Type validation (e.g., ensure userID is number, not object)

---

## 4. Authorization & Access Control

### Endpoint Authorization
- [ ] Protected endpoints require valid JWT token
- [ ] Expired tokens rejected (401 Unauthorized)
- [ ] Invalid tokens rejected (401 Unauthorized)
- [ ] Missing tokens rejected (401 Unauthorized)
- [ ] Token verification uses secret key (NOT hardcoded)

**Test**:
```bash
# Test without token
curl -X GET http://localhost:3000/api/protected

# Expected: 401 Unauthorized

# Test with invalid token
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer invalid.token.here"

# Expected: 401 Unauthorized

# Test with expired token
# (Use old token from >15 minutes ago)
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer <expired-token>"

# Expected: 401 Unauthorized
```

### Resource Ownership Validation
- [ ] Users can only access their own data
- [ ] User A cannot read User B's messages
- [ ] User A cannot delete User B's games
- [ ] Admin-only endpoints protected (kick player, test endpoints)

**Test**:
```bash
# 1. Login as User A, get token
TOKEN_A=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"userA@test.com","password":"password"}' \
  | jq -r '.access_token')

# 2. Login as User B, get their user_id
# (Assume User B's user_id is 999)

# 3. Try to access User B's data with User A's token
curl -X GET http://localhost:3000/api/messages/conversation/userB \
  -H "Authorization: Bearer $TOKEN_A"

# Expected: 403 Forbidden OR only User A's messages (NOT User B's private messages)
```

### Game Access Control
- [ ] Players can only play cards from their own hand
- [ ] Spectators cannot perform player actions
- [ ] Players cannot see other players' cards (except after reveal)
- [ ] Bots cannot be controlled by humans

**Test**:
```javascript
// In browser DevTools: Try to play card not in your hand
socket.emit('play_card', {
  gameId: 'test-game-id',
  card: { suit: 'red', value: 5 } // Card you don't own
});

// Expected: 'invalid_move' event with error message
```

---

## 5. Rate Limiting & DoS Prevention

### API Rate Limiting
- [ ] Rate limits enforced on all endpoints
- [ ] Stricter limits on sensitive endpoints (login, register, refresh)
- [ ] Rate limit headers returned (X-RateLimit-Limit, X-RateLimit-Remaining)
- [ ] Rate limit exceeded returns 429 Too Many Requests
- [ ] IP-based rate limiting (not user-based for public endpoints)

**Test**:
```bash
# Test login rate limit (should be ~5-10 requests/minute)
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
wait

# Expected: After 5-10 requests, 429 Too Many Requests

# Test refresh token rate limit (should be ~10 requests/hour)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/auth/refresh \
    -b "refresh_token=test-token" &
done
wait

# Expected: After 10 requests, 429 Too Many Requests
```

### WebSocket Rate Limiting
- [ ] Message rate limiting (e.g., 10 messages/second)
- [ ] Connection rate limiting (e.g., 5 connections/minute per IP)
- [ ] Automatic disconnection on abuse
- [ ] Flood protection (ignore rapid duplicate messages)

**Test**:
```javascript
// In browser: Try to flood chat
for (let i = 0; i < 100; i++) {
  socket.emit('send_game_chat', {
    gameId: 'test-game-id',
    message: 'Spam message ' + i
  });
}

// Expected: Rate limit error OR automatic disconnection
```

---

## 6. Data Protection & Privacy

### Sensitive Data Handling
- [ ] Passwords NEVER logged or returned in API responses
- [ ] JWT secrets stored in environment variables (NOT hardcoded)
- [ ] Database credentials in environment variables
- [ ] API keys in environment variables (Resend, Sentry)
- [ ] `.env` file in `.gitignore`
- [ ] No sensitive data in error messages

**Test**:
```bash
# Check API responses for sensitive data
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Password123!"}' \
  | jq .

# Expected: Response does NOT include password field

# Check error messages
curl -X GET http://localhost:3000/api/nonexistent

# Expected: Generic error (NOT stack trace or database details)
```

### Data Encryption
- [ ] HTTPS enabled in production (TLS 1.2+)
- [ ] Passwords encrypted with bcrypt (10+ rounds)
- [ ] Refresh tokens hashed with SHA-256
- [ ] Email verification tokens hashed (optional)
- [ ] Database connection encrypted (sslmode=require)

**Test**:
```bash
# Check HTTPS redirect (production only)
curl -I http://your-domain.com

# Expected: 301 Moved Permanently → https://your-domain.com

# Check TLS version
openssl s_client -connect your-domain.com:443 -tls1_2

# Expected: Connection successful

# Check database connection encryption
psql $DATABASE_URL -c "SHOW ssl;"

# Expected: on
```

### PII (Personally Identifiable Information)
- [ ] Email addresses only visible to owner
- [ ] IP addresses not exposed in API responses
- [ ] User agent strings not exposed in API responses
- [ ] No email addresses in URLs (use user_id instead)
- [ ] GDPR-compliant data deletion (optional)

---

## 7. Infrastructure Security

### Environment Variables
- [ ] All secrets in `.env` file
- [ ] `.env` in `.gitignore`
- [ ] `.env.example` provided (WITHOUT actual secrets)
- [ ] Production uses environment variables (Railway, Vercel)
- [ ] No hardcoded secrets in code

**Test**:
```bash
# Check .gitignore
grep ".env" .gitignore

# Expected: .env listed

# Check for hardcoded secrets
grep -r "sk_test_" backend/src/
grep -r "postgresql://" backend/src/

# Expected: No matches (secrets should be in process.env)
```

### Dependency Security
- [ ] All dependencies up-to-date
- [ ] No critical vulnerabilities in `npm audit`
- [ ] Dependency pinning (exact versions, not `^` or `~`)
- [ ] Regular dependency updates (Dependabot enabled)

**Test**:
```bash
# Check for vulnerabilities
cd backend && npm audit

# Expected: 0 critical vulnerabilities, 0 high vulnerabilities

cd frontend && npm audit

# Expected: 0 critical vulnerabilities, 0 high vulnerabilities

# Check for outdated packages
npm outdated

# Expected: No packages >2 major versions behind
```

### HTTP Security Headers
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` or `SAMEORIGIN`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS only)
- [ ] `Content-Security-Policy` set (restrictive)
- [ ] `Referrer-Policy: no-referrer` or `strict-origin-when-cross-origin`

**Test**:
```bash
# Check security headers
curl -I http://localhost:3000/api/health

# Expected:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# (More headers in production)
```

### CORS Configuration
- [ ] CORS restricted to trusted origins (NOT `*`)
- [ ] Credentials allowed only for trusted origins
- [ ] Preflight requests handled correctly
- [ ] No CORS errors in production

**Test**:
```bash
# Test CORS from different origin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Origin: http://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Expected: CORS error OR missing Access-Control-Allow-Origin header
```

---

## 8. Error Handling & Logging

### Error Messages
- [ ] User-facing errors are generic (no stack traces)
- [ ] Detailed errors logged server-side only
- [ ] No database schema exposed in errors
- [ ] No file paths exposed in errors
- [ ] HTTP status codes correct (401, 403, 404, 500)

**Test**:
```bash
# Trigger server error
curl -X GET http://localhost:3000/api/trigger-error

# Expected: { "error": "Internal server error" } (NOT stack trace)
```

### Logging
- [ ] Authentication failures logged
- [ ] Authorization failures logged
- [ ] CSRF violations logged
- [ ] Rate limit violations logged
- [ ] Suspicious activity logged (token theft detection)
- [ ] No sensitive data in logs (passwords, tokens)

**Test**:
```bash
# Check server logs after failed login attempt
# Expected: Log entry like:
# [WARN] Failed login attempt for email: test@test.com from IP: 192.168.1.1
```

---

## 9. Session & Cookie Security

### Cookie Configuration
- [ ] `httpOnly: true` for sensitive cookies (refresh_token, csrf-token)
- [ ] `secure: true` in production (HTTPS only)
- [ ] `sameSite: 'strict'` or `'lax'`
- [ ] Appropriate `maxAge` or `expires` set
- [ ] `path` restricted where appropriate

**Test**:
```javascript
// In browser DevTools:
// Application → Cookies → localhost

// Check refresh_token cookie:
// ✅ HttpOnly: true
// ✅ Secure: true (production)
// ✅ SameSite: Strict
// ✅ Expires: ~30 days from now

// Check csrf-token cookie:
// ✅ HttpOnly: true
// ✅ SameSite: Strict
```

---

## 10. Third-Party Integrations

### Email Service (Resend)
- [ ] API key stored securely (environment variable)
- [ ] Rate limiting on email sending (prevent spam)
- [ ] Email validation before sending
- [ ] Unsubscribe links included (optional)
- [ ] SPF/DKIM/DMARC configured (production)

**Test**:
```bash
# Test email sending rate limit
# (Try to send 100 verification emails rapidly)
# Expected: Rate limit after 10-20 emails
```

### Database (PostgreSQL)
- [ ] SSL/TLS enabled (sslmode=require)
- [ ] Strong database password (16+ characters)
- [ ] Database user has minimal privileges (NOT superuser)
- [ ] Connection pooling configured
- [ ] Automatic backups enabled

**Test**:
```bash
# Check SSL mode
psql $DATABASE_URL -c "SHOW ssl;"

# Expected: on
```

### Monitoring (Sentry)
- [ ] Sentry DSN in environment variable
- [ ] Alerts configured (error rate, latency)
- [ ] Source maps uploaded (optional)
- [ ] User context attached (user_id, username)
- [ ] No sensitive data in error reports

---

## Security Audit Summary Template

```markdown
## Security Audit Results - [Date]

**Auditor**: [Name]
**Environment**: [localhost/staging/production]
**Tools Used**: [List tools]

### Summary
- Total Checks: ___
- Passed: ___
- Failed: ___
- Critical Issues: ___
- High Issues: ___
- Medium Issues: ___
- Low Issues: ___

### Critical Issues
1. [Issue Name] - [Brief Description]
   - Severity: Critical
   - Affected Component: [Component]
   - Attack Vector: [How to exploit]
   - Impact: [Consequences]
   - Remediation: [Fix recommendation]
   - GitHub Issue: #___

2. ...

### High Issues
1. ...

### Medium Issues
1. ...

### Low Issues
1. ...

### Passed Security Controls
- [List all passing controls]

### Recommendations
1. [Priority 1 - Critical]
2. [Priority 2 - High]
3. [Priority 3 - Medium]

### Risk Assessment
**Overall Security Posture**: [Excellent/Good/Fair/Poor]

**Production Ready**: [Yes/No - If No, list blocking issues]

**Compliance**: [OWASP Top 10 coverage: X/10]
```

---

## Critical Security Controls (Must Pass)

Before production deployment, ALL of these MUST pass:

1. ✅ **Authentication**: Passwords hashed with bcrypt, tokens properly secured
2. ✅ **CSRF Protection**: All state-changing requests protected (Sprint 18)
3. ✅ **Token Security**: httpOnly cookies, rotation, theft detection (Sprint 18)
4. ✅ **SQL Injection**: All queries parameterized
5. ✅ **XSS Prevention**: All user input escaped
6. ✅ **Authorization**: Users can only access their own data
7. ✅ **Rate Limiting**: Prevents brute force and DoS attacks
8. ✅ **HTTPS**: Enabled in production
9. ✅ **Security Headers**: All recommended headers set
10. ✅ **Dependency Security**: No critical vulnerabilities

**All critical controls must be validated before production launch.**

---

*Last Updated: 2025-11-19*
*Sprint 18 Phase 3 Task 3.4*
