# Infrastructure Documentation

**Last Updated**: 2025-11-21 (v4.0.0)
**Status**: ✅ **PRODUCTION DEPLOYED**

---

## 🎯 Overview

The Trick Card Game is deployed using a modern, automated infrastructure:

- **Frontend**: Vercel (static hosting + CDN)
- **Backend**: Railway (Node.js + PostgreSQL)
- **CI/CD**: GitHub Actions (automated testing)
- **Monitoring**: Sentry (error tracking)
- **Database**: PostgreSQL on Railway

---

## 🏗️ Architecture

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       v             v
┌─────────────┐  ┌─────────────┐
│  Vercel     │  │  Railway    │
│  (Frontend) │  │  (Backend)  │
│             │  │             │
│ - Static    │  │ - Node.js   │
│ - CDN       │  │ - Socket.io │
│ - Auto SSL  │  │ - PostgreSQL│
└──────┬──────┘  └──────┬──────┘
       │                │
       │                │
       └────────┬───────┘
                │
                v
         ┌─────────────┐
         │   Users     │
         └─────────────┘
```

---

## 📦 1. Frontend Deployment (Vercel)

### Configuration Files
- **Root**: `vercel.json`
- **Backend**: `backend/vercel.json` (if deploying backend to Vercel)

### Current Setup

**File**: `vercel.json`
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install --prefix frontend"
}
```

### Deployment Process

**Automatic**:
- Push to `main` branch → Auto-deploy to production
- Pull request → Preview deployment
- Build time: ~2-3 minutes

**Manual** (via Vercel CLI):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Vercel Dashboard)

**Required**:
```bash
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_API_BASE_URL=https://your-backend.railway.app
NODE_ENV=production
```

**Optional**:
```bash
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENVIRONMENT=production
```

### Build Configuration

**Build Command**: `cd frontend && npm install && npm run build`
**Output Directory**: `frontend/dist`
**Framework Preset**: Vite
**Node Version**: 20.x

### Custom Domains (If Configured)
- Production: `your-domain.com` (example)
- Staging: `staging.your-domain.com` (example)

---

## 🚂 2. Backend Deployment (Railway)

### Configuration Files
- **Backend**: `backend/railway.toml`
- **Frontend**: `frontend/railway.toml` (if deploying frontend to Railway)

### Current Setup

**File**: `backend/railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/"
healthcheckTimeout = 100
```

### Deployment Process

**Automatic**:
- Push to `main` branch → Auto-deploy
- Railway detects changes in `backend/` directory
- Build time: ~3-5 minutes

**Manual** (via Railway CLI):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Environment Variables (Railway Dashboard)

**Required**:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://... (auto-provided by Railway)

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-domain.com

# Session/Auth
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# Email (Resend)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=your-email@domain.com
```

**Optional**:
```bash
# Sentry
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_AUTOPLAY=true
ENABLE_DEBUG_ENDPOINTS=false
```

### Database (PostgreSQL on Railway)

**Auto-provisioned**: Railway provides PostgreSQL plugin
**Connection**: `DATABASE_URL` environment variable
**Backups**: Railway automatic backups (daily)

**Database Initialization**:
```bash
# Run migrations (first deployment)
railway run npm run db:init
```

**Schema Location**: `backend/src/db/schema.sql`

### Health Checks

**Endpoint**: `GET /` or `GET /api/health`
**Expected Response**: `200 OK`
**Timeout**: 100s
**Frequency**: Every 30s

---

## 🔄 3. CI/CD Pipeline (GitHub Actions)

### Workflows

#### 1. Continuous Testing
**File**: `.github/workflows/continuous-testing.yml`

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main`
- Manual dispatch

**Jobs**:
1. **Quick Tests** (Sharded 4-way)
   - Duration: ~5-10 min
   - Runs on all PRs
   - 4 parallel shards for speed

2. **Full Tests**
   - Duration: ~30-60 min
   - Runs on push to main
   - Comprehensive E2E coverage

3. **Stress Tests**
   - Duration: ~30 min
   - Manual trigger or scheduled
   - Performance testing

4. **Marathon Tests**
   - Duration: ~2-4 hours
   - Manual trigger only
   - Long-running stability tests

**Database**: In-memory PostgreSQL (GitHub Actions service)

**Features**:
- Test result artifacts (7-30 days retention)
- PR comments with test status
- Auto-create issues on failure

#### 2. Nightly Tests
**File**: `.github/workflows/nightly-tests.yml`

**Triggers**:
- Scheduled: 2 AM UTC daily
- Manual dispatch

**Jobs**:
1. **Comprehensive Test Suite**
   - Multi-OS: Ubuntu, Windows, macOS
   - Multi-Browser: Chromium, Firefox, Webkit
   - Test types: Game flow, Bot tests, Marathon

2. **Performance Regression Tests**
   - Baseline comparisons
   - 3 runs for averaging
   - Metrics stored for 90 days

3. **Memory Leak Detection**
   - Marathon tests with profiling
   - 4GB heap allocated
   - Memory analysis artifacts

**Features**:
- Cross-platform testing
- Performance baseline tracking
- Auto-create issues on failure
- 30-day artifact retention

### Test Execution

**Quick Test** (Development):
```bash
cd e2e
npm run test:quick
```

**Full Test** (Pre-deployment):
```bash
cd e2e
npm run test:full
```

**Stress Test** (Performance):
```bash
cd e2e
npm run test:stress
```

**CI Environment Variables**:
```bash
CI=true
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trickgame
```

---

## 📊 4. Monitoring & Observability

### Sentry (Error Tracking)

**Setup**:
- Backend: `@sentry/node`
- Frontend: `@sentry/react`

**Configuration**:
```typescript
// Backend: backend/src/index.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
});

// Frontend: frontend/src/main.tsx
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Features**:
- Real-time error tracking
- Performance monitoring
- Session replay (on errors)
- Email alerts (configured in Sprint 18)

### Uptime Monitoring

**Recommended Tools**:
- UptimeRobot (free tier)
- Pingdom
- Better Uptime

**Endpoints to Monitor**:
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.railway.app/api/health`
- WebSocket: `wss://your-backend.railway.app` (custom check)

**Alert Thresholds**:
- Response time > 500ms: Warning
- Response time > 1000ms: Alert
- Downtime > 1 minute: Critical alert
- Error rate > 5%: Alert

---

## 🔐 5. Environment Variables

### Master List

**Frontend (Vercel)**:
```bash
# Backend Connection
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_API_BASE_URL=https://your-backend.railway.app

# Environment
NODE_ENV=production
VITE_ENVIRONMENT=production

# Monitoring
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Backend (Railway)**:
```bash
# Environment
NODE_ENV=production
PORT=3001

# Database (auto-provided by Railway)
DATABASE_URL=postgresql://postgres:password@host:5432/dbname

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-domain.com

# Authentication
SESSION_SECRET=generate-with-crypto-randomBytes-64
JWT_SECRET=generate-with-crypto-randomBytes-64

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@your-domain.com

# Monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_AUTOPLAY=true
ENABLE_DEBUG_ENDPOINTS=false
```

### Generating Secrets

```bash
# Session/JWT secrets (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use:
openssl rand -hex 64
```

---

## 🚀 6. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test` in backend, `npm run test:full` in e2e)
- [ ] Backend TypeScript compiles (`cd backend && npx tsc --noEmit`)
- [ ] Frontend builds successfully (`cd frontend && npm run build`)
- [ ] Environment variables configured in Vercel/Railway
- [ ] Database migrations applied (`railway run npm run db:init`)
- [ ] Sentry configured and tested
- [ ] CORS origins updated for production domains

### Post-Deployment

- [ ] Health check endpoint responding (`/api/health`)
- [ ] WebSocket connection working (test in browser console)
- [ ] Database queries working (check Sentry for errors)
- [ ] Smoke test passed (manual testing checklist)
- [ ] Performance baseline established (Lighthouse audit)
- [ ] Uptime monitoring configured
- [ ] Sentry receiving errors (test with intentional error)

### Rollback Plan

**Vercel** (Frontend):
```bash
# Via Dashboard: Deployments → Select previous → Promote to Production
# Via CLI:
vercel rollback
```

**Railway** (Backend):
```bash
# Via Dashboard: Deployments → Select previous → Redeploy
# Via CLI:
railway rollback
```

---

## 📈 7. Performance & Scaling

### Current Capacity

**Frontend (Vercel)**:
- **Bandwidth**: Unlimited
- **Builds**: 6000 min/month (free tier)
- **CDN**: Global edge network
- **Scaling**: Automatic

**Backend (Railway)**:
- **Memory**: 512MB-8GB (configurable)
- **CPU**: Shared → Dedicated (configurable)
- **Database**: 1GB storage (free tier) → 100GB+ (paid)
- **Scaling**: Vertical (upgrade plan) or Horizontal (multiple instances)

### Scaling Strategies

**Horizontal Scaling** (Multiple Backend Instances):
1. Enable Redis for session storage (shared state)
2. Use Railway's load balancer
3. Socket.io sticky sessions required

**Vertical Scaling** (Larger Instances):
1. Upgrade Railway plan (more RAM/CPU)
2. Optimize database queries
3. Add database connection pooling

**Database Scaling**:
1. Connection pooling (already implemented)
2. Read replicas (for analytics)
3. Upgrade to larger PostgreSQL instance

---

## 🔧 8. Maintenance & Operations

### Regular Tasks

**Daily**:
- [ ] Check Sentry for new errors
- [ ] Review deployment status (Vercel + Railway)
- [ ] Monitor uptime alerts

**Weekly**:
- [ ] Review GitHub Actions test results
- [ ] Check performance metrics (Lighthouse)
- [ ] Review database growth (Railway dashboard)

**Monthly**:
- [ ] Run security audit (`npm audit`)
- [ ] Review and rotate secrets (if needed)
- [ ] Check dependency updates
- [ ] Review Sentry error trends

### Incident Response

**See**: `docs/deployment/INCIDENT_RESPONSE.md` (if exists)

**Quick Response**:
1. Check Sentry for error spike
2. Check Railway logs (`railway logs`)
3. Check Vercel build logs
4. Rollback if critical (see Rollback Plan above)
5. Fix and redeploy

---

## 📚 9. Documentation References

### Internal Docs
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Railway deployment guide
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Resend email configuration
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Incident handling
- [PERFORMANCE_BASELINE.md](./PERFORMANCE_BASELINE.md) - Performance metrics

### External Docs
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Sentry Documentation](https://docs.sentry.io)

---

## 🎯 10. Sprint 19 Integration

### What's Already Done ✅

1. **GitHub Actions CI/CD** ✅
   - Continuous testing workflow
   - Nightly comprehensive tests
   - Multi-browser, multi-OS testing
   - Performance regression testing
   - Memory leak detection

2. **Vercel Deployment** ✅
   - Auto-deploy on push to main
   - Preview deployments on PRs
   - Build configuration complete

3. **Railway Deployment** ✅
   - Backend auto-deploy
   - PostgreSQL database provisioned
   - Health checks configured
   - Restart policies set

4. **Monitoring** ✅
   - Sentry configured (Sprint 18)
   - Email alerts configured

### What's Missing (Sprint 19 Tasks)

**Phase 1: Pre-Production Validation**
- ⏸️ Run load tests on production (k6)
- ⏸️ Execute manual testing checklist
- ⏸️ Document current production URLs
- ⏸️ Verify all environment variables

**Phase 2: CI/CD Enhancements**
- ⏸️ Add security scanning (npm audit on PR)
- ⏸️ Add Lighthouse CI (performance regression)
- ⏸️ Add auto-deploy to staging (if using separate staging environment)

**Phase 3: Production Optimization**
- ⏸️ Configure custom domain (if not done)
- ⏸️ Set up uptime monitoring (UptimeRobot)
- ⏸️ Create production smoke test automation
- ⏸️ Document production URLs and credentials

**Phase 4: Monitoring & Iteration**
- ⏸️ Monitor Sentry for 7 days
- ⏸️ Track performance metrics
- ⏸️ Collect user feedback

---

## 📞 11. Support & Troubleshooting

### Common Issues

**Issue**: Frontend can't connect to backend
- Check CORS_ORIGIN in Railway environment variables
- Verify VITE_SOCKET_URL in Vercel environment variables
- Check Railway backend logs: `railway logs`

**Issue**: Database connection failed
- Verify DATABASE_URL in Railway
- Check database is running (Railway dashboard)
- Review connection pool settings

**Issue**: Build failing
- Check Node version (should be 20.x)
- Clear build cache (Vercel/Railway dashboard)
- Check for missing dependencies

**Issue**: WebSocket not connecting
- Verify Railway backend is running
- Check firewall/proxy settings
- Test with `wscat -c wss://your-backend.railway.app`

### Getting Help

1. Check Railway logs: `railway logs --tail 100`
2. Check Vercel logs: Vercel Dashboard → Project → Logs
3. Check Sentry errors: Sentry Dashboard → Issues
4. GitHub Actions logs: Actions tab → Select workflow run

---

## 🎉 Summary

Your infrastructure is **already production-ready!**

**Strengths**:
- ✅ Automated CI/CD with GitHub Actions
- ✅ Multi-environment deployment (Vercel + Railway)
- ✅ Comprehensive testing (unit, E2E, performance, marathon)
- ✅ Error monitoring (Sentry)
- ✅ Database persistence (PostgreSQL)
- ✅ Auto-deploy on push

**Sprint 19 Focus**:
- Validate production performance (load tests)
- Enhance CI/CD (security scanning, Lighthouse)
- Set up uptime monitoring
- Document production URLs and access

---

*Last Updated: 2025-11-21 (v4.0.0)*
*Your infrastructure is ready for Sprint 19 Phase 1 validation!*
