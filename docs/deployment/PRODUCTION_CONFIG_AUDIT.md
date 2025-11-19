# Production Environment Configuration Audit

**Sprint 18 Phase 4 Task 4.1**
**Purpose**: Ensure production environment is correctly configured and secure
**Priority**: High
**Estimated Time**: 1.5 hours

---

## Overview

This document provides a comprehensive checklist for auditing production environment configuration to prevent config drift, security vulnerabilities, and deployment failures.

**Audit Frequency**:
- Before each production deployment
- Monthly security review
- After infrastructure changes
- After security incidents

---

## 1. Environment Variables Audit

### Required Production Variables

#### Critical Security Variables ⚠️
```bash
# JWT & Authentication (Sprint 18)
JWT_SECRET=<64+ character random string>
JWT_REFRESH_SECRET=<64+ character random string, DIFFERENT from JWT_SECRET>
CSRF_SECRET=<64+ character random string>

# Session Management
SESSION_SECRET=<64+ character random string>

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Email Service (Resend)
RESEND_API_KEY=re_<your_key>
EMAIL_FROM=<verified-domain@example.com>

# Error Monitoring (Sentry)
SENTRY_DSN=https://<key>@<project>.ingest.sentry.io/<id>

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-api.railway.app
```

#### Optional Variables
```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-staging.vercel.app

# Feature Flags
ENABLE_BOTS=true
ENABLE_SPECTATORS=true
ENABLE_SOCIAL_FEATURES=true

# Logging
LOG_LEVEL=info  # error, warn, info, debug
LOG_FORMAT=json  # json, pretty

# Performance
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### Audit Checklist

- [ ] **All required variables are set** (no undefined)
- [ ] **JWT_SECRET is 64+ characters** (check length)
- [ ] **JWT_REFRESH_SECRET ≠ JWT_SECRET** (different values)
- [ ] **CSRF_SECRET is unique** (not same as JWT secrets)
- [ ] **DATABASE_URL uses SSL** (`sslmode=require`)
- [ ] **DATABASE_URL password is strong** (16+ chars, alphanumeric + special)
- [ ] **NODE_ENV=production** (not development)
- [ ] **FRONTEND_URL is HTTPS** (not HTTP)
- [ ] **BACKEND_URL is HTTPS** (not HTTP)
- [ ] **RESEND_API_KEY starts with `re_`** (valid format)
- [ ] **EMAIL_FROM uses verified domain** (not onboarding@resend.dev)
- [ ] **SENTRY_DSN is valid** (check format)
- [ ] **No secrets in git history** (scan with git-secrets)
- [ ] **Secrets rotated** (if exposed or > 90 days old)
- [ ] **Separate secrets for staging/prod** (not reusing)

### How to Check

**Railway (Backend)**:
```bash
# List all environment variables
railway variables

# Check specific variable
railway variables | grep JWT_SECRET

# Set variable
railway variables set JWT_SECRET=<value>
```

**Vercel (Frontend)**:
```bash
# List all environment variables
vercel env ls

# Pull environment variables
vercel env pull

# Add variable
vercel env add JWT_SECRET production
```

---

## 2. Database Configuration Audit

### PostgreSQL Settings

#### Connection Settings
- [ ] **SSL/TLS enabled** (`sslmode=require`)
- [ ] **Connection pooling configured** (min: 2, max: 10)
- [ ] **Connection timeout set** (30 seconds)
- [ ] **Statement timeout set** (60 seconds)
- [ ] **Idle connection timeout** (10 minutes)

#### Security Settings
- [ ] **Database user has minimal privileges** (not superuser)
- [ ] **Password is strong** (16+ characters, alphanumeric + special)
- [ ] **Password rotated** (every 90 days)
- [ ] **No public access** (only from Railway/Vercel IPs)
- [ ] **Backups enabled** (daily, 30-day retention)
- [ ] **Point-in-time recovery enabled** (if available)

#### Performance Settings
- [ ] **Indexes created** (on foreign keys, frequently queried columns)
- [ ] **Vacuuming configured** (autovacuum enabled)
- [ ] **Statistics up-to-date** (ANALYZE run regularly)

### How to Check

```sql
-- Check SSL status
SHOW ssl;
-- Expected: on

-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('your_database'));

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check slow queries (if pg_stat_statements enabled)
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Railway Database**:
```bash
# Connect to database
railway connect

# Check connection
psql $DATABASE_URL -c "SELECT version();"

# Run migrations
psql $DATABASE_URL -f backend/src/db/migrations/*.sql
```

---

## 3. Application Configuration Audit

### Server Configuration

#### Express.js Settings
- [ ] **Trust proxy enabled** (`app.set('trust proxy', 1)`)
- [ ] **Helmet middleware enabled** (security headers)
- [ ] **CORS configured** (restricted origins, not `*`)
- [ ] **Rate limiting enabled** (all endpoints)
- [ ] **Body parser limits set** (10MB max)
- [ ] **Compression enabled** (gzip)
- [ ] **Error handling configured** (no stack traces in production)

#### Socket.io Settings
- [ ] **CORS configured** (restricted origins)
- [ ] **Ping timeout set** (25 seconds)
- [ ] **Ping interval set** (10 seconds)
- [ ] **Max HTTP buffer size set** (1MB)
- [ ] **Connection limits enforced** (per IP)
- [ ] **Namespace isolation** (if using multiple namespaces)

### Frontend Configuration

#### Vite Build Settings
- [ ] **Production mode** (`NODE_ENV=production`)
- [ ] **Source maps disabled** (or uploaded to Sentry)
- [ ] **Code splitting enabled**
- [ ] **Tree shaking enabled**
- [ ] **Minification enabled**
- [ ] **Asset optimization** (images compressed)

#### React Settings
- [ ] **React DevTools disabled** (production build)
- [ ] **PropTypes removed** (production build)
- [ ] **Console logs removed** (production build)
- [ ] **Error boundaries implemented**

### How to Check

**Backend**:
```bash
# Check server is running
curl https://your-api.railway.app/api/health

# Check CORS headers
curl -I -H "Origin: https://evil.com" https://your-api.railway.app/api/health

# Check rate limiting
for i in {1..20}; do curl https://your-api.railway.app/api/health; done

# Check compression
curl -I -H "Accept-Encoding: gzip" https://your-api.railway.app/api/health
```

**Frontend**:
```bash
# Check bundle size
ls -lh frontend/dist/assets/

# Check source maps
ls -la frontend/dist/assets/*.map

# Check console warnings
# (Open browser DevTools, check for React warnings)
```

---

## 4. Security Headers Audit

### Required Headers

```http
# Security Headers (set by Helmet)
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()

# CORS Headers
Access-Control-Allow-Origin: https://your-app.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization

# Custom Headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

### Audit Checklist

- [ ] **Content-Security-Policy set** (restrictive, no `unsafe-eval`)
- [ ] **X-Content-Type-Options: nosniff**
- [ ] **X-Frame-Options: DENY** (or SAMEORIGIN)
- [ ] **X-XSS-Protection: 1; mode=block**
- [ ] **Strict-Transport-Security set** (HTTPS only, 1 year)
- [ ] **Referrer-Policy: no-referrer** (or strict-origin-when-cross-origin)
- [ ] **Permissions-Policy set** (disable unused browser features)
- [ ] **Access-Control-Allow-Origin NOT `*`** (specific origins only)
- [ ] **Access-Control-Allow-Credentials: true** (for cookies)

### How to Check

```bash
# Check all headers
curl -I https://your-api.railway.app/api/health

# Check specific header
curl -I https://your-api.railway.app/api/health | grep -i "x-frame-options"

# Check CSP
curl -I https://your-api.railway.app/api/health | grep -i "content-security-policy"

# Use online tool
# https://securityheaders.com/
# https://observatory.mozilla.org/
```

---

## 5. SSL/TLS Configuration Audit

### Certificate Validation

- [ ] **Valid SSL certificate** (not expired, not self-signed)
- [ ] **Certificate chain complete** (intermediate certs included)
- [ ] **TLS 1.2+ enabled** (TLS 1.0/1.1 disabled)
- [ ] **Strong cipher suites** (AES-256, no RC4/DES)
- [ ] **HSTS enabled** (max-age 31536000)
- [ ] **Certificate auto-renewal** (Let's Encrypt or similar)

### How to Check

```bash
# Check certificate
openssl s_client -connect your-api.railway.app:443 -servername your-api.railway.app

# Check TLS version
curl -I --tlsv1.2 https://your-api.railway.app/api/health

# Check SSL rating
# https://www.ssllabs.com/ssltest/

# Check certificate expiration
echo | openssl s_client -servername your-api.railway.app -connect your-api.railway.app:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 6. Logging & Monitoring Audit

### Sentry Configuration

- [ ] **Sentry DSN configured**
- [ ] **Environment set** (`production`)
- [ ] **Release tracking enabled** (git SHA or version)
- [ ] **Source maps uploaded** (for stack traces)
- [ ] **Error sampling rate** (100% or 50%)
- [ ] **Performance monitoring enabled** (10% sampling)
- [ ] **User context attached** (user_id, username)
- [ ] **Alert rules configured** (error rate, latency)
- [ ] **Slack/email notifications** (for critical errors)

### Application Logging

- [ ] **Log level set** (`info` or `warn` for production)
- [ ] **Structured logging** (JSON format)
- [ ] **No sensitive data in logs** (passwords, tokens, credit cards)
- [ ] **Request logging** (with correlation IDs)
- [ ] **Error logging** (with stack traces)
- [ ] **Performance logging** (slow queries, slow endpoints)
- [ ] **Log aggregation** (Railway logs, CloudWatch, etc.)
- [ ] **Log rotation** (to prevent disk space issues)

### How to Check

**Sentry**:
```bash
# Test Sentry connection
curl -X POST https://your-sentry-dsn.ingest.sentry.io/api/<project>/store/ \
  -H "Content-Type: application/json" \
  -d '{"message":"Test event","level":"info"}'

# Check Sentry dashboard
# https://sentry.io/organizations/your-org/projects/your-project/
```

**Railway Logs**:
```bash
# View logs
railway logs

# Follow logs
railway logs --follow

# Filter logs
railway logs | grep ERROR
```

---

## 7. Deployment Configuration Audit

### Railway (Backend)

- [ ] **Correct branch deployed** (`main` for production)
- [ ] **Auto-deploy enabled** (on git push)
- [ ] **Health check configured** (`/api/health`)
- [ ] **Restart policy set** (always)
- [ ] **Resource limits set** (CPU, memory)
- [ ] **Region selected** (closest to users)
- [ ] **Custom domain configured** (if applicable)
- [ ] **HTTPS enforced** (HTTP redirects to HTTPS)

### Vercel (Frontend)

- [ ] **Correct branch deployed** (`main` for production)
- [ ] **Auto-deploy enabled** (on git push)
- [ ] **Build command correct** (`npm run build`)
- [ ] **Output directory correct** (`dist`)
- [ ] **Environment variables set** (all required vars)
- [ ] **Region selected** (Edge Network or specific region)
- [ ] **Custom domain configured** (if applicable)
- [ ] **HTTPS enforced** (default)
- [ ] **Preview deployments** (for pull requests)

### How to Check

**Railway**:
```bash
# Check deployment status
railway status

# Check resource usage
railway ps

# Check logs
railway logs
```

**Vercel**:
```bash
# Check deployment status
vercel ls

# Check domains
vercel domains ls

# Inspect deployment
vercel inspect <deployment-url>
```

---

## 8. Dependency Security Audit

### Backend Dependencies

- [ ] **No critical vulnerabilities** (`npm audit`)
- [ ] **No high vulnerabilities** (or accepted risk documented)
- [ ] **Dependencies up-to-date** (< 6 months old)
- [ ] **Unused dependencies removed**
- [ ] **Dev dependencies not in production** (`--production` flag)
- [ ] **Lock file committed** (`package-lock.json`)
- [ ] **Automated security scans** (Dependabot, Snyk)

### Frontend Dependencies

- [ ] **No critical vulnerabilities** (`npm audit`)
- [ ] **No high vulnerabilities** (or accepted risk documented)
- [ ] **Dependencies up-to-date** (< 6 months old)
- [ ] **Unused dependencies removed**
- [ ] **Bundle size acceptable** (< 500KB gzipped)
- [ ] **Lock file committed** (`package-lock.json`)

### How to Check

```bash
# Backend
cd backend
npm audit
npm audit --audit-level=critical
npm outdated

# Frontend
cd frontend
npm audit
npm audit --audit-level=critical
npm outdated

# Check for specific vulnerabilities
npm audit --json | jq '.vulnerabilities'

# Fix vulnerabilities
npm audit fix
npm audit fix --force  # Use with caution
```

---

## 9. Performance Configuration Audit

### Caching

- [ ] **HTTP caching headers set** (`Cache-Control`, `ETag`)
- [ ] **Static assets cached** (1 year for versioned assets)
- [ ] **API responses cached** (where appropriate)
- [ ] **CDN configured** (for static assets)
- [ ] **Redis/in-memory cache** (for hot data, optional)

### Database

- [ ] **Connection pooling** (prevent connection exhaustion)
- [ ] **Query optimization** (indexes on foreign keys)
- [ ] **N+1 query prevention** (eager loading)
- [ ] **Slow query logging** (> 1 second)
- [ ] **Database monitoring** (Railway dashboard)

### Application

- [ ] **Compression enabled** (gzip for responses)
- [ ] **Keep-alive enabled** (persistent connections)
- [ ] **Request timeout** (60 seconds max)
- [ ] **WebSocket limits** (max connections per IP)
- [ ] **Memory limits** (prevent leaks)

### How to Check

```bash
# Check caching headers
curl -I https://your-app.vercel.app/assets/index-abc123.js

# Check compression
curl -I -H "Accept-Encoding: gzip" https://your-api.railway.app/api/health

# Check response time
time curl https://your-api.railway.app/api/health

# Load test (using k6)
k6 run load-tests/baseline.k6.js
```

---

## 10. Backup & Disaster Recovery Audit

### Database Backups

- [ ] **Automated backups enabled** (daily)
- [ ] **Backup retention** (30 days minimum)
- [ ] **Backup testing** (restore tested monthly)
- [ ] **Point-in-time recovery** (if available)
- [ ] **Off-site backups** (different region/provider)
- [ ] **Backup encryption** (at rest)
- [ ] **Backup documentation** (restore procedures)

### Code & Configuration

- [ ] **Git repository backed up** (GitHub has automatic backups)
- [ ] **Environment variables documented** (`docs/deployment/ENV_VARIABLES.md`)
- [ ] **Deployment scripts versioned** (in git)
- [ ] **Infrastructure as code** (Railway/Vercel config files)

### How to Check

```bash
# Railway backup
# (Check Railway dashboard for backup settings)

# Test database restore
pg_dump $DATABASE_URL > backup.sql
psql $STAGING_DATABASE_URL < backup.sql

# Verify backup
psql $STAGING_DATABASE_URL -c "SELECT count(*) FROM users;"
```

---

## Audit Report Template

```markdown
# Production Config Audit Report

**Date**: YYYY-MM-DD
**Auditor**: [Name]
**Environment**: Production
**Version**: [Git SHA or version]

## Summary

- **Total Checks**: ___
- **Passed**: ___
- **Failed**: ___
- **Warnings**: ___
- **Critical Issues**: ___

## Critical Issues

1. [Issue] - [Description]
   - **Severity**: Critical
   - **Impact**: [Description]
   - **Remediation**: [Action items]
   - **Timeline**: [Immediate/1 day/1 week]

## Failed Checks

1. [Check Name]
   - **Category**: [Security/Performance/Configuration]
   - **Current State**: [Description]
   - **Expected State**: [Description]
   - **Action Required**: [Fix instructions]

## Warnings

1. [Warning]
   - **Category**: [Security/Performance/Configuration]
   - **Details**: [Description]
   - **Recommendation**: [Suggested action]

## Passed Checks

- [List all passing checks]

## Recommendations

1. [Priority 1 - Critical]
2. [Priority 2 - High]
3. [Priority 3 - Medium]

## Next Audit

**Scheduled**: [Date]
**Focus Areas**: [Specific areas to review]

---

**Audit Status**: [PASS/FAIL]
**Production Ready**: [YES/NO - If NO, list blocking issues]
```

---

## Automation Script

See `scripts/production-config-audit.sh` for automated audit execution.

---

## Frequency & Maintenance

**Before Every Deployment**:
- Environment variables check
- Dependency security scan
- Build validation

**Monthly**:
- Full configuration audit
- SSL certificate check
- Backup restore test
- Performance baseline review

**Quarterly**:
- Comprehensive security audit
- Third-party penetration test (optional)
- Disaster recovery drill

**After Security Incidents**:
- Full security review
- Secret rotation
- Access log review

---

*Last Updated: 2025-11-19*
*Sprint 18 Phase 4 Task 4.1*
