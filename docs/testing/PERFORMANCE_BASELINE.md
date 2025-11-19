# Production Performance Baseline

**Sprint 18 Phase 4 Task 4.3**
**Purpose**: Establish performance benchmarks for production monitoring and regression detection
**Priority**: Critical
**Time**: Initial setup ~1 hour, ongoing monitoring automated

---

## Overview

Performance baselines provide objective metrics to detect performance regressions, capacity planning needs, and optimization opportunities. This document establishes measurement procedures, target metrics, and monitoring strategies for production.

**When to Measure**:
- ✅ Immediately after deployment (establish baseline)
- ✅ After infrastructure changes (database, server scaling)
- ✅ After major code changes (new features, refactoring)
- ✅ Monthly (track performance trends over time)
- ⏳ Automated monitoring (continuous)

**Pass Criteria**: All metrics must meet or exceed targets. Significant deviations (>20%) trigger investigation.

---

## Performance Categories

### 1. Frontend Performance
- **Page Load Metrics** - First Contentful Paint (FCP), Largest Contentful Paint (LCP), Time to Interactive (TTI)
- **Bundle Size** - JavaScript bundle size, CSS bundle size, total page weight
- **Runtime Performance** - JavaScript execution time, memory usage, frame rate

### 2. Backend Performance
- **API Response Times** - p50, p95, p99 latencies for critical endpoints
- **Database Query Performance** - Query execution times, connection pool utilization
- **WebSocket Performance** - Connection latency, message throughput, concurrent connections

### 3. Infrastructure Performance
- **Server Resources** - CPU usage, memory usage, disk I/O
- **Network Performance** - Bandwidth utilization, request rate, error rate
- **Database Resources** - Connection count, query rate, replication lag

---

## Measurement Tools

### Automated Tools

**1. Lighthouse (Frontend)**
```bash
# Run Lighthouse audit (automated)
./scripts/lighthouse-audit.sh https://your-app.vercel.app

# Output: lighthouse-results/report-YYYYMMDD_HHMMSS.html
```

**Metrics Collected**:
- Performance score (0-100)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)

**2. k6 Load Testing (Backend)**
```bash
# Baseline test (10 users, 1 minute)
cd load-tests
k6 run --out json=baseline-results.json baseline.k6.js

# Stress test (up to 100 users)
k6 run --out json=stress-results.json stress.k6.js

# WebSocket test (100 concurrent connections)
k6 run --out json=websocket-results.json websocket.k6.js
```

**Metrics Collected**:
- Request duration (p50, p95, p99)
- Request rate (req/s)
- Error rate (%)
- WebSocket message latency
- Connection establishment time

**3. Bundle Analysis (Frontend)**
```bash
# Analyze bundle size
./scripts/analyze-bundle.sh

# Output: Bundle size report with size breakdown
```

**Metrics Collected**:
- Total bundle size (KB, gzipped)
- Largest modules
- Duplicate dependencies
- Unused code

### Manual Tools

**1. Chrome DevTools**
- **Performance Tab** - Record user interactions, analyze frame rate, identify bottlenecks
- **Network Tab** - Analyze resource loading, identify slow requests
- **Memory Tab** - Detect memory leaks, analyze heap usage
- **Lighthouse Tab** - Run Lighthouse audits directly in browser

**2. Railway Dashboard (Backend)**
- **Metrics** - CPU, memory, network, disk usage over time
- **Logs** - Error rates, request logs, slow query logs
- **Deployments** - Build times, deployment success rate

**3. Vercel Analytics (Frontend)**
- **Web Vitals** - Real user monitoring (RUM) for Core Web Vitals
- **Page Speed** - p75 load times by page
- **Traffic** - Request count, bandwidth usage

---

## Performance Targets (Production)

### Frontend Targets

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **Lighthouse Performance Score** | ≥90 | 90-100 | 50-89 | 0-49 |
| **First Contentful Paint (FCP)** | ≤1.8s | ≤1.8s | 1.8s-3.0s | >3.0s |
| **Largest Contentful Paint (LCP)** | ≤2.5s | ≤2.5s | 2.5s-4.0s | >4.0s |
| **Time to Interactive (TTI)** | ≤3.8s | ≤3.8s | 3.8s-7.3s | >7.3s |
| **Total Blocking Time (TBT)** | ≤200ms | ≤200ms | 200ms-600ms | >600ms |
| **Cumulative Layout Shift (CLS)** | ≤0.1 | ≤0.1 | 0.1-0.25 | >0.25 |
| **Bundle Size (JS, gzipped)** | ≤250KB | ≤250KB | 250KB-500KB | >500KB |
| **Bundle Size (CSS, gzipped)** | ≤50KB | ≤50KB | 50KB-100KB | >100KB |

**Source**: [Web Vitals thresholds](https://web.dev/vitals/)

### Backend Targets

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **API Response Time (p95)** | ≤500ms | ≤500ms | 500ms-1s | >1s |
| **API Response Time (p99)** | ≤1s | ≤1s | 1s-2s | >2s |
| **WebSocket Latency** | ≤200ms | ≤200ms | 200ms-500ms | >500ms |
| **Database Query Time (p95)** | ≤100ms | ≤100ms | 100ms-500ms | >500ms |
| **Error Rate** | ≤1% | ≤1% | 1%-5% | >5% |
| **Request Rate Capacity** | ≥100 req/s | ≥100 | 50-100 | <50 |
| **Concurrent Users Capacity** | ≥50 users | ≥50 | 25-50 | <25 |
| **Concurrent WebSocket Connections** | ≥100 | ≥100 | 50-100 | <50 |

### Infrastructure Targets

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **CPU Usage (Average)** | ≤70% | ≤70% | 70%-85% | >85% |
| **Memory Usage (Average)** | ≤80% | ≤80% | 80%-90% | >90% |
| **Database Connections** | ≤20 | ≤20 | 20-40 | >40 |
| **Disk I/O (Average)** | ≤50% | ≤50% | 50%-75% | >75% |
| **Error Rate (Sentry)** | ≤1% | ≤1% | 1%-5% | >5% |

---

## Baseline Measurement Procedure

### Step 1: Frontend Baseline (Lighthouse)

**Objective**: Measure frontend performance in production-like conditions

```bash
# Run Lighthouse audit on production URL
./scripts/lighthouse-audit.sh https://your-app.vercel.app

# Review report
open lighthouse-results/report-*.html
```

**Record the following**:
- [ ] Performance Score: _____
- [ ] First Contentful Paint: _____
- [ ] Largest Contentful Paint: _____
- [ ] Time to Interactive: _____
- [ ] Total Blocking Time: _____
- [ ] Cumulative Layout Shift: _____

**Recommendations**:
- Run 3 times and take median (avoid outliers)
- Use incognito mode (disable extensions)
- Test on consistent network (disable throttling for baseline)
- Test from same geographic location

---

### Step 2: Backend Baseline (k6)

**Objective**: Measure backend API performance under load

```bash
cd load-tests

# Baseline test (10 users, 1 minute)
k6 run --out json=baseline-results.json baseline.k6.js

# Parse results
cat baseline-results.json | jq '.metrics."http_req_duration".values'
```

**Record the following**:
- [ ] Request Duration (p50): _____
- [ ] Request Duration (p95): _____
- [ ] Request Duration (p99): _____
- [ ] Request Rate: _____
- [ ] Error Rate: _____

**Run stress test**:
```bash
k6 run --out json=stress-results.json stress.k6.js
```

**Record the following**:
- [ ] Max Concurrent Users Supported: _____
- [ ] Max Request Rate: _____
- [ ] Breaking Point (users when errors > 5%): _____

---

### Step 3: WebSocket Baseline (k6)

**Objective**: Measure real-time communication performance

```bash
cd load-tests
k6 run --out json=websocket-results.json websocket.k6.js
```

**Record the following**:
- [ ] WebSocket Connection Latency: _____
- [ ] Message Latency (p95): _____
- [ ] Max Concurrent Connections: _____
- [ ] Connection Success Rate: _____

---

### Step 4: Bundle Size Baseline

**Objective**: Track frontend bundle size for regression detection

```bash
./scripts/analyze-bundle.sh
```

**Record the following**:
- [ ] Total JS Size (gzipped): _____
- [ ] Total CSS Size (gzipped): _____
- [ ] Largest JS Module: _____
- [ ] Total Page Weight (all assets): _____

---

### Step 5: Database Performance Baseline

**Objective**: Measure database query performance

**Manual Approach** (via Railway logs or database monitoring):
1. Enable slow query logging (queries > 100ms)
2. Monitor for 1 hour during normal traffic
3. Record slowest queries

**Automated Approach** (via backend API):
```bash
# Health endpoint includes database timing
time curl https://your-api.railway.app/api/health

# Leaderboard query (tests complex query)
time curl https://your-api.railway.app/api/leaderboard?limit=100

# Player stats query (tests aggregation)
time curl https://your-api.railway.app/api/stats/TestPlayer
```

**Record the following**:
- [ ] Health Endpoint Response Time: _____
- [ ] Leaderboard Query Time: _____
- [ ] Player Stats Query Time: _____
- [ ] Database Connection Pool Utilization: _____

---

### Step 6: Infrastructure Baseline (Railway)

**Objective**: Establish resource usage patterns

**Railway Dashboard**:
1. Navigate to your Railway project
2. Go to "Metrics" tab
3. Select "Last 24 hours" view
4. Record peak and average values

**Record the following**:
- [ ] CPU Usage (Average): _____
- [ ] CPU Usage (Peak): _____
- [ ] Memory Usage (Average): _____
- [ ] Memory Usage (Peak): _____
- [ ] Network Bandwidth (Average): _____
- [ ] Request Count (per minute): _____

---

## Baseline Report Template

```markdown
# Performance Baseline Report

**Date**: YYYY-MM-DD HH:MM
**Environment**: Production
**Deployment**: [Version/Git SHA]
**Tester**: [Name]

---

## Frontend Performance (Lighthouse)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Performance Score | _____ | ≥90 | [PASS/FAIL] |
| First Contentful Paint | _____ | ≤1.8s | [PASS/FAIL] |
| Largest Contentful Paint | _____ | ≤2.5s | [PASS/FAIL] |
| Time to Interactive | _____ | ≤3.8s | [PASS/FAIL] |
| Total Blocking Time | _____ | ≤200ms | [PASS/FAIL] |
| Cumulative Layout Shift | _____ | ≤0.1 | [PASS/FAIL] |

**Bundle Size**:
- JavaScript (gzipped): _____
- CSS (gzipped): _____
- Total Page Weight: _____

**Notes**: [Any observations about frontend performance]

---

## Backend Performance (k6)

### Baseline Test (10 users)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Request Duration (p50) | _____ | ≤200ms | [PASS/FAIL] |
| Request Duration (p95) | _____ | ≤500ms | [PASS/FAIL] |
| Request Duration (p99) | _____ | ≤1s | [PASS/FAIL] |
| Request Rate | _____ | ≥100 req/s | [PASS/FAIL] |
| Error Rate | _____ | ≤1% | [PASS/FAIL] |

### Stress Test

- Max Concurrent Users Supported: _____
- Max Request Rate: _____
- Breaking Point: _____ users (errors > 5%)

**Notes**: [Any observations about backend performance]

---

## WebSocket Performance

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Connection Latency | _____ | ≤200ms | [PASS/FAIL] |
| Message Latency (p95) | _____ | ≤200ms | [PASS/FAIL] |
| Max Concurrent Connections | _____ | ≥100 | [PASS/FAIL] |
| Connection Success Rate | _____ | ≥99% | [PASS/FAIL] |

**Notes**: [Any observations about WebSocket performance]

---

## Database Performance

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Health Endpoint | _____ | ≤100ms | [PASS/FAIL] |
| Leaderboard Query | _____ | ≤500ms | [PASS/FAIL] |
| Player Stats Query | _____ | ≤500ms | [PASS/FAIL] |
| Connection Pool Util | _____% | ≤50% | [PASS/FAIL] |

**Slow Queries** (>100ms):
1. [Query description] - _____ ms
2. [Query description] - _____ ms

**Notes**: [Any observations about database performance]

---

## Infrastructure Resources (Railway)

| Metric | Average | Peak | Target (Avg) | Status |
|--------|---------|------|--------------|--------|
| CPU Usage | _____% | _____% | ≤70% | [PASS/FAIL] |
| Memory Usage | _____% | _____% | ≤80% | [PASS/FAIL] |
| Network Bandwidth | _____ | _____ | N/A | N/A |
| Request Count | _____ req/min | _____ req/min | N/A | N/A |

**Notes**: [Any observations about resource usage]

---

## Overall Assessment

**Performance Status**: [EXCELLENT / GOOD / NEEDS IMPROVEMENT / POOR]

**Summary**:
- [Number] metrics meet targets
- [Number] metrics need improvement
- [Number] metrics are critical

**Key Findings**:
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

**Recommended Actions**:
1. [Action 1]
2. [Action 2]
3. [Action 3]

---

**Completed by**: [Name]
**Date**: YYYY-MM-DD HH:MM
```

---

## Ongoing Performance Monitoring

### Daily Automated Monitoring

**Tools**:
- **Vercel Analytics** - Real user monitoring (RUM) for frontend
- **Railway Metrics** - Server resource monitoring
- **Sentry Performance** - Backend transaction monitoring
- **UptimeRobot** - Uptime and response time monitoring (free tier)

**Setup**:
1. Enable Vercel Analytics (built-in, no configuration needed)
2. Enable Sentry Performance Monitoring:
   ```javascript
   // backend/src/index.ts
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     tracesSampleRate: 0.1, // 10% of transactions
   });
   ```
3. Configure UptimeRobot monitors:
   - Monitor 1: Homepage (https://your-app.vercel.app)
   - Monitor 2: API Health (https://your-api.railway.app/api/health)
   - Monitor 3: WebSocket (wss://your-api.railway.app/socket.io)

### Weekly Performance Review

**Checklist**:
- [ ] Review Vercel Analytics - Check Core Web Vitals trends
- [ ] Review Railway Metrics - Check CPU/memory usage trends
- [ ] Review Sentry Performance - Check slow transactions (>1s)
- [ ] Review UptimeRobot - Check uptime percentage (target: 99.9%)
- [ ] Compare against baseline - Flag any regression >20%

**Regression Criteria** (triggers investigation):
- Frontend: Any Web Vital regresses by >20%
- Backend: p95 latency increases by >20%
- Infrastructure: Average resource usage increases by >20%
- Errors: Error rate increases above 1%

### Monthly Performance Audit

**Full Baseline Refresh**:
1. Run all baseline measurements again
2. Compare to previous month's baseline
3. Document trends (improving, stable, degrading)
4. Update baseline targets if infrastructure changed
5. Create performance optimization roadmap

---

## Performance Optimization Checklist

If performance degrades below targets, follow this checklist:

### Frontend Optimizations

**Bundle Size**:
- [ ] Run `analyze-bundle.sh` to identify large modules
- [ ] Enable code splitting for large components
- [ ] Remove unused dependencies (`npm run analyze` → identify duplicates)
- [ ] Enable tree-shaking (ensure `sideEffects: false` in package.json)
- [ ] Use dynamic imports for rarely-used features

**Runtime Performance**:
- [ ] Identify slow components (React DevTools Profiler)
- [ ] Memoize expensive computations (`useMemo`, `useCallback`)
- [ ] Virtualize long lists (react-window for 100+ items)
- [ ] Lazy load images (`loading="lazy"` attribute)
- [ ] Reduce re-renders (React.memo for expensive components)

**Network Performance**:
- [ ] Enable HTTP/2 (automatic on Vercel)
- [ ] Compress images (use WebP format, optimize size)
- [ ] Add cache headers for static assets (Vercel handles this)
- [ ] Use CDN for static assets (Vercel CDN is automatic)

### Backend Optimizations

**API Performance**:
- [ ] Identify slow endpoints (Sentry Performance, Railway logs)
- [ ] Add database indexes for slow queries
- [ ] Implement caching (Redis, in-memory cache)
- [ ] Reduce database query count (N+1 query problem)
- [ ] Optimize JSON serialization (avoid large payloads)

**Database Performance**:
- [ ] Enable query logging (`log_min_duration_statement = 100`)
- [ ] Analyze slow queries (`EXPLAIN ANALYZE`)
- [ ] Add missing indexes
- [ ] Denormalize frequently-joined tables
- [ ] Implement connection pooling (already done via `pg` package)

**WebSocket Performance**:
- [ ] Reduce message frequency (batch updates)
- [ ] Compress WebSocket messages (Socket.io compression)
- [ ] Limit broadcast scope (room-based broadcasting)
- [ ] Implement message rate limiting (prevent spam)

### Infrastructure Optimizations

**Server Resources**:
- [ ] Scale up Railway instance (if CPU/memory >80%)
- [ ] Enable horizontal scaling (multiple instances)
- [ ] Optimize Docker image size (multi-stage builds)
- [ ] Reduce cold start time (keep service warm)

**Database Resources**:
- [ ] Upgrade database plan (if connections >20 or storage >80%)
- [ ] Enable read replicas for read-heavy workloads
- [ ] Implement query result caching
- [ ] Archive old data (game history >6 months)

---

## Performance Regression Testing

### Before Each Deployment

**Pre-Deployment Performance Check**:
```bash
# Step 1: Run load test against staging
cd load-tests
k6 run baseline.k6.js --env BACKEND_URL=https://staging-api.railway.app

# Step 2: Compare results to production baseline
# If p95 latency >20% worse, investigate before deploying

# Step 3: Run Lighthouse on staging frontend
./scripts/lighthouse-audit.sh https://staging-app.vercel.app

# Step 4: Compare scores
# If Performance Score drops >5 points, investigate before deploying
```

**CI/CD Integration** (future):
```yaml
# .github/workflows/performance.yml
name: Performance Regression Test

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging-app.vercel.app
          uploadArtifacts: true
          temporaryPublicStorage: true

  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: load-tests/baseline.k6.js
```

---

## Troubleshooting Performance Issues

### High API Latency

**Symptoms**: p95 response time >500ms

**Diagnosis**:
1. Check Railway logs for slow requests
2. Check Sentry Performance for slow transactions
3. Check database query times (slow query log)
4. Check external API calls (Resend, Sentry)

**Solutions**:
- Add database indexes
- Implement caching (Redis)
- Optimize database queries (reduce N+1)
- Increase server resources (scale up)

### High Frontend Load Time

**Symptoms**: LCP >2.5s, TTI >3.8s

**Diagnosis**:
1. Run Lighthouse audit
2. Check Network tab for slow resources
3. Check bundle size (`analyze-bundle.sh`)
4. Check for JavaScript errors (blocking rendering)

**Solutions**:
- Reduce bundle size (code splitting, tree-shaking)
- Optimize images (WebP, lazy loading)
- Reduce third-party scripts
- Enable HTTP/2 and compression

### High Memory Usage

**Symptoms**: Railway memory >80%, application crashes

**Diagnosis**:
1. Check Railway metrics for memory trend
2. Check for memory leaks (Node.js heap snapshot)
3. Check WebSocket connection count (memory per connection)
4. Check database connection pool size

**Solutions**:
- Reduce connection pool size
- Implement WebSocket connection limits
- Fix memory leaks (unreleased event listeners)
- Scale up Railway instance

### High Database CPU

**Symptoms**: Database CPU >70%, slow queries

**Diagnosis**:
1. Check slow query log
2. Run `EXPLAIN ANALYZE` on slow queries
3. Check for missing indexes
4. Check for table scans (sequential scans on large tables)

**Solutions**:
- Add missing indexes
- Optimize queries (reduce joins, subqueries)
- Denormalize frequently-joined tables
- Archive old data (reduce table size)

---

## Performance Baseline History

### Baseline 1 (Initial - Sprint 18)

**Date**: YYYY-MM-DD
**Version**: [Git SHA]

**Frontend**:
- Performance Score: _____
- LCP: _____
- TTI: _____

**Backend**:
- p95 Latency: _____
- Request Rate: _____
- Error Rate: _____

**Notes**: Initial production baseline after Sprint 18 deployment

---

### Baseline 2 (Post-Optimization)

**Date**: YYYY-MM-DD
**Version**: [Git SHA]

**Frontend**:
- Performance Score: _____ (Δ _____)
- LCP: _____ (Δ _____)
- TTI: _____ (Δ _____)

**Backend**:
- p95 Latency: _____ (Δ _____)
- Request Rate: _____ (Δ _____)
- Error Rate: _____ (Δ _____)

**Notes**: [What changed? Performance improvements?]

---

## Resources

**Measurement Tools**:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Frontend performance auditing
- [k6](https://k6.io) - Load testing for backend APIs
- [WebPageTest](https://www.webpagetest.org) - Comprehensive frontend testing
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Browser performance profiling

**Performance Guides**:
- [Web Vitals](https://web.dev/vitals/) - Core Web Vitals explained
- [Railway Metrics](https://docs.railway.app/reference/metrics) - Railway monitoring
- [Vercel Analytics](https://vercel.com/docs/analytics) - Real user monitoring
- [Sentry Performance](https://docs.sentry.io/product/performance/) - Backend transaction monitoring

**Optimization Guides**:
- [React Performance](https://react.dev/learn/render-and-commit) - React optimization techniques
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/) - Node.js profiling
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html) - Database optimization

---

*Last Updated: 2025-11-19*
*Sprint 18 Phase 4 Task 4.3*
