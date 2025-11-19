# Sprint 18 Phase 2: Performance & Load Testing Guide

**Sprint 18 Phase 2 - Complete Implementation Guide**
**Status**: Tools & Scripts Ready
**Estimated Time**: 4-5 hours actual execution

---

## Overview

Phase 2 focuses on establishing performance baselines and identifying optimization opportunities through comprehensive testing.

### Goals:
1. ✅ Create load test infrastructure (k6 scripts)
2. ✅ Create Lighthouse audit automation
3. ✅ Create bundle size analysis tools
4. ⏳ Run tests and establish baselines (requires running servers)
5. ⏳ Document performance benchmarks
6. ⏳ Identify and fix critical performance issues

---

## Task 2.1: Load Testing (2-3 hours)

### Prerequisites
- Backend server running (`cd backend && npm run dev`)
- Frontend server running (`cd frontend && npm run dev`)
- Install k6: https://k6.io/docs/getting-started/installation/

### Load Test Scripts Created ✅

**1. Baseline Performance Test** (`load-tests/baseline.k6.js`):
- Tests: 10 concurrent users
- Duration: ~5 minutes
- Metrics: API response times, error rates
- Target: p95 < 500ms, error rate < 1%

**2. WebSocket Stress Test** (`load-tests/websocket.k6.js`):
- Tests: 100 concurrent WebSocket connections
- Duration: ~6 minutes
- Metrics: Connection time, message latency
- Target: p95 < 200ms, error rate < 5%

**3. Stress Test** (`load-tests/stress.k6.js`):
- Tests: Up to 100 concurrent users
- Duration: ~11 minutes
- Metrics: Performance under load, breaking points
- Target: p95 < 1000ms, error rate < 10%

### Running Load Tests

```bash
# Install k6 (if not already installed)
# macOS: brew install k6
# Windows: choco install k6
# Linux: See load-tests/README.md

# Run all tests
./load-tests/run-all-tests.sh

# Or run individually
k6 run load-tests/baseline.k6.js
k6 run load-tests/websocket.k6.js
k6 run load-tests/stress.k6.js

# Test against different environment
k6 run --env BASE_URL=https://your-app.vercel.app \
       --env API_URL=https://your-api.railway.app \
       load-tests/baseline.k6.js
```

### Expected Outputs

Results saved to `load-tests/results/`:
- `baseline-summary.json` - Detailed metrics
- `baseline-summary.txt` - Human-readable summary
- `websocket-summary.json`
- `websocket-summary.txt`
- `stress-summary.json`
- `stress-summary.txt`

### Performance Baselines to Establish

**Baseline Test (10 users)**:
- [ ] p50 response time: ___ ms
- [ ] p95 response time: ___ ms
- [ ] p99 response time: ___ ms
- [ ] Error rate: ___ %
- [ ] Throughput: ___ req/s

**WebSocket Test (100 connections)**:
- [ ] p50 latency: ___ ms
- [ ] p95 latency: ___ ms
- [ ] Error rate: ___ %
- [ ] Max stable connections: ___

**Stress Test (100 users)**:
- [ ] p95 response time: ___ ms
- [ ] Error rate: ___ %
- [ ] Breaking point: ___ concurrent users
- [ ] CPU usage at peak: ___ %
- [ ] Memory usage at peak: ___ MB

### Interpreting Results

**🟢 PASS**: All thresholds met
- Proceed to next task
- Document baselines in SPRINT_18_PROGRESS.md

**🟡 WARNING**: Some thresholds missed
- Review specific failing metrics
- Check server logs for errors
- Consider minor optimizations

**🔴 FAIL**: Multiple threshold failures
- Critical performance issues detected
- Review bottlenecks (database, network, CPU)
- Optimize before proceeding
- Re-run tests after fixes

### Common Optimizations

**If p95 > 500ms**:
1. Add database indexes
2. Implement Redis caching
3. Optimize N+1 queries
4. Enable gzip compression

**If Error Rate > 1%**:
1. Increase database connection pool
2. Add retry logic
3. Fix race conditions
4. Review error logs

**If WebSocket Latency > 200ms**:
1. Reduce message payload size
2. Batch updates
3. Optimize Socket.io config
4. Check network latency

---

## Task 2.2: Lighthouse Audit (1 hour)

### Prerequisites
- Frontend server running on http://localhost:3001
- Lighthouse CLI available (comes with Chrome/Node)

### Running Lighthouse Audit ✅

```bash
# Run automated audit
./scripts/lighthouse-audit.sh

# Or run manually
npx lighthouse http://localhost:3001 \
  --output html \
  --output json \
  --output-path ./lighthouse-reports/report \
  --chrome-flags="--headless"

# Against production
./scripts/lighthouse-audit.sh https://your-app.vercel.app
```

### Audit Categories & Targets

**Performance** (Target: 90+):
- [ ] First Contentful Paint: < 1.8s
- [ ] Largest Contentful Paint: < 2.5s
- [ ] Total Blocking Time: < 200ms
- [ ] Cumulative Layout Shift: < 0.1
- [ ] Speed Index: < 3.4s

**Accessibility** (Target: 90+):
- [ ] Color contrast sufficient
- [ ] ARIA attributes correct
- [ ] Image alt text present
- [ ] Form labels associated
- [ ] Keyboard navigation works

**Best Practices** (Target: 90+):
- [ ] HTTPS enabled
- [ ] No browser errors in console
- [ ] Images have correct aspect ratio
- [ ] Deprecated APIs not used
- [ ] Secure headers set

**SEO** (Target: 90+):
- [ ] Meta description present
- [ ] Title tag present
- [ ] Crawlable links
- [ ] Robots.txt valid
- [ ] Mobile viewport configured

### Reviewing Results

1. Open HTML report (auto-opens after script completes)
2. Review failing audits in each category
3. Note specific recommendations
4. Prioritize fixes by impact vs effort
5. Implement top 3-5 optimizations
6. Re-run audit to verify improvements

### Common Fixes

**Performance < 90**:
- Implement code splitting
- Lazy load images
- Minimize JavaScript
- Use CDN for static assets
- Enable browser caching

**Accessibility < 90**:
- Add ARIA labels
- Fix color contrast
- Add alt text to images
- Improve keyboard navigation
- Add skip links

**Best Practices < 90**:
- Fix console errors
- Update deprecated APIs
- Add security headers
- Optimize images
- Enable HTTPS

---

## Task 2.3: Bundle Size Analysis (1 hour)

### Prerequisites
- Frontend built (`cd frontend && npm run build`)
- Node.js installed

### Running Bundle Analysis ✅

```bash
# Run automated analysis
./scripts/analyze-bundle.sh

# Or manually check build output
cd frontend
npm run build
du -sh dist/
ls -lh dist/assets/
```

### Bundle Size Targets

**Main Bundle** (index-*.js):
- 🟢 Target: < 300KB gzipped
- 🟡 Warning: 300-500KB
- 🔴 Critical: > 500KB

**Total dist/ size**:
- 🟢 Target: < 2MB
- 🟡 Warning: 2-5MB
- 🔴 Critical: > 5MB

**Number of chunks**:
- 🟢 Target: 5-10 chunks (code splitting)
- 🟡 Warning: 1-4 chunks (minimal splitting)
- 🔴 Critical: 1 chunk (no splitting)

### Analysis Checklist

- [ ] Identify largest bundle file
- [ ] Check for duplicate dependencies
- [ ] Review top 10 largest node_modules
- [ ] Verify tree-shaking is working
- [ ] Check for unused dependencies
- [ ] Identify code splitting opportunities

### Optimization Strategies

**1. Code Splitting**:
```typescript
// Before: All routes loaded upfront
import AdminPanel from './AdminPanel';

// After: Lazy load routes
const AdminPanel = lazy(() => import('./AdminPanel'));
```

**2. Tree Shaking**:
```typescript
// Before: Import entire library
import _ from 'lodash';

// After: Import only what you need
import debounce from 'lodash/debounce';
```

**3. Remove Heavy Dependencies**:
- Replace `moment` with `date-fns` (smaller, tree-shakeable)
- Replace `lodash` with native JS or individual imports
- Remove unused packages from package.json

**4. Dynamic Imports**:
```typescript
// Load heavy libraries only when needed
const loadChartLibrary = async () => {
  const Chart = await import('chart.js');
  return Chart;
};
```

**5. Analyze with Visualizer**:
```bash
npm install --save-dev rollup-plugin-visualizer
# Add to vite.config.ts
# Generates interactive bundle visualization
```

### Expected Improvements

**After Optimization**:
- Main bundle: 200-300KB (30-40% reduction)
- Initial load time: 1-2s (50% faster)
- Lighthouse Performance: 90+ (previously 60-80)

---

## Phase 2 Completion Checklist

### Task 2.1: Load Testing
- [x] Create k6 load test scripts (3 scripts)
- [x] Create load test documentation
- [x] Create automated test runner
- [ ] Run baseline test and record metrics
- [ ] Run WebSocket test and record metrics
- [ ] Run stress test and record metrics
- [ ] Document performance baselines
- [ ] Identify and fix critical bottlenecks (if any)

### Task 2.2: Lighthouse Audit
- [x] Create Lighthouse audit script
- [ ] Run audit on localhost
- [ ] Record all category scores
- [ ] Review failing audits
- [ ] Fix critical issues (Performance < 70, Accessibility < 80)
- [ ] Re-run audit to verify fixes
- [ ] Document final scores

### Task 2.3: Bundle Size Analysis
- [x] Create bundle analysis script
- [ ] Build frontend for production
- [ ] Analyze bundle sizes
- [ ] Identify optimization opportunities
- [ ] Implement top 3 optimizations
- [ ] Re-build and verify size reduction
- [ ] Document final bundle sizes

---

## Deliverables

### Documentation Required

1. **Load Test Results** → `load-tests/results/`
   - Baseline summary (JSON + TXT)
   - WebSocket summary (JSON + TXT)
   - Stress test summary (JSON + TXT)

2. **Lighthouse Reports** → `lighthouse-reports/`
   - HTML report with scores
   - JSON report with detailed metrics

3. **Bundle Analysis** → `docs/sprints/BUNDLE_ANALYSIS.md`
   - Current bundle sizes
   - Optimization recommendations
   - Before/after metrics (if optimizations applied)

4. **Performance Baselines** → `docs/sprints/SPRINT_18_PROGRESS.md`
   - Update "Performance Metrics" section
   - Document all baseline values
   - Note any issues found

---

## Success Criteria

**Phase 2 is complete when**:
1. ✅ All test scripts created and documented
2. ✅ All analysis tools created and documented
3. ⏳ All tests executed successfully
4. ⏳ Performance baselines documented
5. ⏳ Lighthouse scores ≥ 80 in all categories
6. ⏳ Bundle size ≤ 500KB (main chunk)
7. ⏳ No critical performance issues identified

**Production Readiness Impact**: +1-2 points (94/100 → 95-96/100)

---

## Troubleshooting

### Load Tests

**k6 not installed**:
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux (Debian/Ubuntu)
sudo apt-get install k6
```

**Connection refused errors**:
- Ensure servers are running (backend + frontend)
- Check firewall rules
- Verify URLs in test scripts

**High error rates**:
- Check server logs for errors
- Review database connection pool
- Monitor server resources (CPU/memory)

### Lighthouse

**"URL not accessible"**:
- Start frontend dev server: `cd frontend && npm run dev`
- Wait for server to be ready
- Check localhost:3001 in browser first

**Low scores**:
- Review specific failing audits
- Click on each audit for detailed explanation
- Implement recommended fixes
- Re-run audit to verify

### Bundle Analysis

**Build fails**:
- Fix TypeScript errors (currently: DebugInfo.tsx)
- Run `npm install` if dependencies missing
- Check for syntax errors in source files

**Bundle too large**:
- Review node_modules for heavy packages
- Implement code splitting
- Remove unused dependencies
- Use tree-shaking techniques

---

*Last Updated: 2025-11-18*
*Sprint 18 Phase 2*
*Tools Ready - Awaiting Execution*
