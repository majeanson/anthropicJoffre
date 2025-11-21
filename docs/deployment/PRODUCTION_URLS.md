# Production Environment URLs

**Last Updated**: 2025-11-21 (v4.0.0)
**Status**: ✅ **PRODUCTION LIVE**

---

## 🌐 Frontend (Vercel)

### Production
- **URL**: https://jaffre.vercel.app/
- **Status**: Live
- **Auto-Deploy**: Yes (on push to `main`)
- **CDN**: Vercel Edge Network (global)

### Preview Deployments
- **Auto-Generated**: On every Pull Request
- **Format**: `https://anthropic-joffre-{pr-id}.vercel.app`
- **Retention**: 30 days

### Dashboard
- **Vercel Project**: https://vercel.com/majeansons-projects/anthropic-joffre
- **Access**: Via GitHub authentication

---

## 🚂 Backend (Railway)

### Production
- **URL**: https://anthropicjoffre-production.up.railway.app
- **Health Check**: https://anthropicjoffre-production.up.railway.app/api/health
- **WebSocket**: wss://anthropicjoffre-production.up.railway.app
- **Status**: Live
- **Auto-Deploy**: Yes (on push to `main`)

### Dashboard
- **Railway Project**: https://railway.com/project/b33d63ae-9286-4a4a-9480-f4d7f6e816de
- **Service ID**: `51079ce5-6e26-498a-b131-014f1b745e74`
- **Environment**: `d2b92e23-a271-4295-9b9c-396125e17725`
- **Access**: Via GitHub authentication

### Database
- **Type**: PostgreSQL 15
- **Provider**: Railway (managed)
- **Connection**: Via `DATABASE_URL` environment variable
- **Backups**: Daily automatic (Railway managed)

---

## 📊 Monitoring & Tools

### Sentry (Error Tracking)
- **DSN**: `https://98c89a1454b32d24fd78092cf6a297e8@o4510241708244992.ingest.us.sentry.io/4510241709293568`
- **Project ID**: `4510241709293568`
- **Organization ID**: `o4510241708244992`
- **Dashboard**: https://sentry.io/organizations/o4510241708244992/projects/4510241709293568
- **Environment**: production

### GitHub Actions
- **Repository**: https://github.com/majeanson/anthropicJoffre
- **Workflows**:
  - Continuous Testing: `.github/workflows/continuous-testing.yml`
  - Nightly Tests: `.github/workflows/nightly-tests.yml`
- **Actions Tab**: https://github.com/majeanson/anthropicJoffre/actions

---

## 🔐 Environment Variables

### Frontend (Vercel)
```bash
VITE_SOCKET_URL=https://anthropicjoffre-production.up.railway.app
VITE_API_BASE_URL=https://anthropicjoffre-production.up.railway.app
NODE_ENV=production
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=https://98c89a1454b32d24fd78092cf6a297e8@o4510241708244992.ingest.us.sentry.io/4510241709293568
```

**Configure in**: Vercel Dashboard → Project Settings → Environment Variables

### Backend (Railway)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=(auto-provided by Railway PostgreSQL plugin)

# CORS (configured for production frontend)
CORS_ORIGIN=https://jaffre.vercel.app

# Secrets (configured in Railway dashboard)
SESSION_SECRET=(stored securely in Railway)
JWT_SECRET=(stored securely in Railway)

# Email (Resend)
RESEND_API_KEY=(stored securely in Railway)
EMAIL_FROM=noreply@your-domain.com

# Monitoring
SENTRY_DSN=https://98c89a1454b32d24fd78092cf6a297e8@o4510241708244992.ingest.us.sentry.io/4510241709293568
SENTRY_ENVIRONMENT=production

# Feature Flags
ENABLE_AUTOPLAY=true
ENABLE_DEBUG_ENDPOINTS=false
```

**Configure in**: Railway Dashboard → Project → Variables

---

## 🧪 Testing Endpoints

### Health Check
```bash
curl https://anthropicjoffre-production.up.railway.app/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-21T...",
  "uptime": 12345,
  "version": "4.0.0"
}
```

### WebSocket Connection Test
```bash
# Using wscat
wscat -c wss://anthropicjoffre-production.up.railway.app

# Or in browser console
const socket = io('https://anthropicjoffre-production.up.railway.app');
socket.on('connect', () => console.log('Connected!'));
```

### Frontend Availability
```bash
curl -I https://jaffre.vercel.app/
```

**Expected**: `HTTP/2 200`

---

## 📈 Performance Metrics

### Expected Response Times
- **Frontend (CDN)**: < 100ms (global edge network)
- **Backend API**: < 200ms (p95)
- **WebSocket Connect**: < 100ms
- **Database Queries**: < 50ms (p95)

### Load Capacity
- **Frontend**: Unlimited (Vercel CDN)
- **Backend**: ~100-500 concurrent connections (depends on Railway plan)
- **Database**: 100 connections (Railway PostgreSQL)

---

## 🚨 Uptime Monitoring

### Recommended Setup: UptimeRobot

**Monitors to Create**:

1. **Frontend (HTTP)**
   - URL: `https://jaffre.vercel.app/`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Alert: Email/SMS on downtime

2. **Backend Health Check (HTTP)**
   - URL: `https://anthropicjoffre-production.up.railway.app/api/health`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Expected: Status 200 + keyword "ok"
   - Alert: Email/SMS on downtime

3. **Backend WebSocket (Port)**
   - Host: `anthropicjoffre-production.up.railway.app`
   - Port: 443 (HTTPS/WSS)
   - Type: Port
   - Interval: 5 minutes
   - Alert: Email/SMS on downtime

### Alert Thresholds
- **Downtime**: > 1 minute → Alert
- **Response Time**: > 1000ms → Warning
- **Success Rate**: < 95% → Alert

### Setup Instructions
See: [UPTIME_MONITORING.md](./UPTIME_MONITORING.md) (will be created next)

---

## 🔄 Deployment Workflow

### Automatic Deployment
1. **Developer**: Push code to `main` branch
2. **GitHub Actions**: Run tests automatically
3. **Vercel**: Detect push → Build frontend → Deploy to CDN (2-3 min)
4. **Railway**: Detect push → Build backend → Deploy to production (3-5 min)
5. **Notification**: Deployment complete (Vercel/Railway emails)

### Rollback Procedure

**Vercel** (Frontend):
1. Go to: https://vercel.com/majeansons-projects/anthropic-joffre
2. Click "Deployments" tab
3. Find previous working deployment
4. Click "..." → "Promote to Production"
5. Confirm rollback

**Railway** (Backend):
1. Go to: https://railway.com/project/b33d63ae-9286-4a4a-9480-f4d7f6e816de
2. Click "Deployments" tab
3. Find previous working deployment
4. Click "Redeploy"
5. Confirm rollback

**Estimated Rollback Time**: 2-5 minutes

---

## 🛠️ Troubleshooting

### Frontend Issues

**Issue**: 404 Not Found
- Check Vercel deployment status
- Verify build completed successfully
- Check browser console for errors

**Issue**: Backend connection failed
- Verify `VITE_SOCKET_URL` environment variable
- Check CORS settings in Railway backend
- Test backend health check endpoint

### Backend Issues

**Issue**: 503 Service Unavailable
- Check Railway deployment status
- Verify backend is running (Railway dashboard)
- Check Railway logs: `railway logs --tail 100`

**Issue**: Database connection failed
- Verify PostgreSQL is running (Railway dashboard)
- Check `DATABASE_URL` environment variable
- Review connection pool settings

### Database Issues

**Issue**: Connection timeout
- Check Railway PostgreSQL status
- Verify connection string format
- Check connection pool exhaustion

**Issue**: Slow queries
- Review Sentry performance monitoring
- Check database size (Railway dashboard)
- Consider adding indexes

---

## 📞 Emergency Contacts

### Service Status Pages
- **Vercel**: https://www.vercel-status.com/
- **Railway**: https://railway.instatus.com/
- **GitHub**: https://www.githubstatus.com/

### Support
- **Vercel Support**: support@vercel.com
- **Railway Support**: https://railway.app/help
- **Sentry Support**: https://sentry.io/support/

### Team Access
- **GitHub Repository**: Requires GitHub account + collaborator access
- **Vercel Dashboard**: Login via GitHub (majeanson account)
- **Railway Dashboard**: Login via GitHub (majeanson account)
- **Sentry Dashboard**: Login via email/SSO

---

## 📋 Quick Reference Commands

### Check Production Status
```bash
# Frontend
curl -I https://jaffre.vercel.app/

# Backend health
curl https://anthropicjoffre-production.up.railway.app/api/health

# WebSocket test
wscat -c wss://anthropicjoffre-production.up.railway.app
```

### View Logs
```bash
# Railway logs (requires Railway CLI)
railway logs --tail 100

# Vercel logs
vercel logs https://jaffre.vercel.app
```

### Deploy Commands
```bash
# Frontend (Vercel CLI)
cd frontend
vercel --prod

# Backend (Railway CLI)
cd backend
railway up
```

---

## 🎯 Next Steps (Sprint 19)

### Phase 2: Validation
- [ ] Run load tests against production URLs
- [ ] Execute manual testing checklist
- [ ] Document results

### Phase 3: Monitoring
- [ ] Set up UptimeRobot monitors (3 monitors)
- [ ] Configure alert notifications
- [ ] Test alert delivery

### Phase 4: Optimization
- [ ] Review Sentry errors (last 7 days)
- [ ] Check performance metrics
- [ ] Optimize slow queries (if any)

---

## 🔗 Related Documentation

- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Complete infrastructure guide
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Railway deployment guide
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Incident handling
- [Sprint 19 Plan](../sprints/SPRINT_19_PLAN.md) - Current sprint tasks

---

*Last Updated: 2025-11-21 (v4.0.0)*
*Production Status: ✅ Live and operational*
