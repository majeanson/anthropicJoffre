# Sprint 19: Production Launch & CI/CD Pipeline

**Status**: 🚀 **READY TO START**
**Start Date**: 2025-11-21
**Duration**: 1-2 weeks
**Goal**: Launch to production with automated CI/CD pipeline

---

## 🎯 Sprint Objectives

With all code quality improvements complete (14/18 tasks, 98/100 production readiness), Sprint 19 focuses on:

1. **Execute Sprint 18 validation tools** (pre-production verification)
2. **Set up CI/CD pipeline** (GitHub Actions)
3. **Production deployment** (Railway or similar)
4. **Post-launch monitoring** (Sentry, performance tracking)

---

## 📋 Phase 1: Pre-Production Validation (2-3 days)

**Goal**: Execute all Sprint 18 validation tools to verify production readiness

### Tasks

#### 1.1 Run Load Tests ⏸️ **TODO**
**Effort**: 4-6 hours
**Priority**: High

**Steps**:
1. Set up staging environment (Railway review app or local production build)
2. Run k6 baseline test (see `docs/deployment/LOAD_TESTING.md` if exists)
3. Run k6 stress test (find breaking points)
4. Run k6 WebSocket test (verify real-time performance)
5. Document results in `docs/deployment/LOAD_TEST_RESULTS.md`

**Success Criteria**:
- Baseline: 100 concurrent users, <100ms WebSocket latency
- Stress: Identify breaking point (target: 500+ concurrent users)
- No memory leaks during 10-minute test
- Database query times <50ms (p95)

---

#### 1.2 Execute Manual Testing Checklist ⏸️ **TODO**
**Effort**: 3-4 hours
**Priority**: High

**Steps**:
1. Open `docs/sprints/MANUAL_TESTING_CHECKLIST.md` (check if exists in archive)
2. Test all critical user flows:
   - Account registration + email verification
   - Game creation + joining
   - Full game playthrough (4 phases)
   - Spectator mode
   - Chat system
   - Reconnection flow
3. Document any issues found
4. Verify all keyboard shortcuts work (press `?` for help)

**Success Criteria**:
- 100% of critical flows working
- No console errors
- All accessibility features functional

---

#### 1.3 Execute Security Audit ⏸️ **TODO**
**Effort**: 2-3 hours
**Priority**: High

**Steps**:
1. Review `docs/sprints/SECURITY_AUDIT_CHECKLIST.md` (check archive)
2. Verify all items:
   - JWT refresh token rotation working
   - CSRF protection on all POST/PUT/DELETE
   - Rate limiting enforced
   - Input validation (Zod schemas)
   - SQL injection prevention (parameterized queries)
3. Run `npm audit` on both frontend and backend
4. Document findings in `docs/deployment/SECURITY_AUDIT_RESULTS.md`

**Success Criteria**:
- Zero high-severity npm vulnerabilities
- All security checklist items verified
- OWASP Top 10 protections confirmed

---

#### 1.4 Run Production Config Audit ⏸️ **TODO**
**Effort**: 1-2 hours
**Priority**: High

**Steps**:
1. Use automation script from Sprint 18 (check archive for details)
2. Verify all environment variables set correctly
3. Check CORS policy matches production domain
4. Verify database connection pooling configured
5. Confirm Sentry DSN and alerts configured

**Success Criteria**:
- All required env vars present
- No hardcoded secrets
- Production-ready configuration

---

#### 1.5 Establish Performance Baseline ⏸️ **TODO**
**Effort**: 2-3 hours
**Priority**: Medium

**Steps**:
1. Run Lighthouse audit on production build
2. Measure initial load time (target: <2s)
3. Measure WebSocket connection time (target: <100ms)
4. Document baseline metrics in `docs/deployment/PERFORMANCE_BASELINE.md`

**Success Criteria**:
- Lighthouse Performance score >90
- Lighthouse Accessibility score >90 (should be high with keyboard nav)
- Time to Interactive <2s
- First Contentful Paint <1s

---

## 📋 Phase 2: CI/CD Pipeline Setup (3-4 days)

**Goal**: Automate testing, building, and deployment with GitHub Actions

### Tasks

#### 2.1 Create GitHub Actions Workflow ⏸️ **TODO**
**Effort**: 4-6 hours
**Priority**: High

**File**: `.github/workflows/ci-cd.yml`

**Workflow Steps**:
1. **On PR**: Run tests, type checking, linting
2. **On merge to main**: Build, deploy to staging, run smoke tests
3. **On manual trigger**: Deploy to production

**Required Actions**:
```yaml
name: CI/CD Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      # Backend tests
      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Run backend unit tests
        run: cd backend && npm test

      - name: Type check backend
        run: cd backend && npx tsc --noEmit

      # Frontend tests
      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Type check frontend
        run: cd frontend && npx tsc --noEmit

      - name: Build frontend
        run: cd frontend && npm run build

      # E2E tests (optional, may be slow)
      # - name: Run E2E tests
      #   run: cd e2e && npm ci && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      # Add deployment steps here (Railway, Vercel, etc.)
      - name: Deploy to staging
        run: echo "Deploy to staging environment"
```

**Success Criteria**:
- All tests run on PR
- Type checking prevents bad merges
- Auto-deploy to staging on merge

---

#### 2.2 Add Automated Security Checks ⏸️ **TODO**
**Effort**: 1-2 hours
**Priority**: High

**Steps**:
1. Add `npm audit` to CI workflow
2. Add dependency scanning (Dependabot or Snyk)
3. Fail build on high-severity vulnerabilities

**File**: `.github/workflows/security.yml`

```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run npm audit (backend)
        run: cd backend && npm audit --audit-level=high
      - name: Run npm audit (frontend)
        run: cd frontend && npm audit --audit-level=high
```

**Success Criteria**:
- Weekly automated security scans
- PRs blocked if high-severity vulnerabilities

---

#### 2.3 Add Performance Regression Testing ⏸️ **TODO**
**Effort**: 2-3 hours
**Priority**: Medium

**Steps**:
1. Add Lighthouse CI to workflow
2. Set performance budgets
3. Fail build if performance degrades >10%

**File**: `.github/workflows/performance.yml`

**Success Criteria**:
- Lighthouse runs on every deployment
- Performance regressions caught automatically

---

## 📋 Phase 3: Production Deployment (1-2 days)

**Goal**: Deploy to production with monitoring and rollback capability

### Tasks

#### 3.1 Deploy to Production ⏸️ **TODO**
**Effort**: 2-4 hours
**Priority**: High

**Steps**:
1. Choose deployment platform:
   - **Option A**: Railway (recommended for MVP)
   - **Option B**: Vercel (frontend) + Railway (backend)
   - **Option C**: AWS ECS (more complex)
2. Configure environment variables
3. Set up database (PostgreSQL on Railway)
4. Deploy backend service
5. Deploy frontend service
6. Configure custom domain (optional)

**See**: `docs/deployment/RAILWAY_DEPLOY.md` for Railway guide

**Success Criteria**:
- Backend accessible at production URL
- Frontend accessible at production URL
- Database migrations applied
- All environment variables configured

---

#### 3.2 Configure Production Monitoring ⏸️ **TODO**
**Effort**: 1-2 hours
**Priority**: High

**Steps**:
1. Verify Sentry configured (should be done in Sprint 18)
2. Set up uptime monitoring (UptimeRobot or Pingdom)
3. Configure alert thresholds:
   - Error rate >5% → email alert
   - Response time >500ms → warning
   - Server down → immediate SMS/email
4. Set up log aggregation (optional: LogDNA, Papertrail)

**Success Criteria**:
- Real-time error tracking
- Uptime monitoring with alerts
- Performance metrics visible

---

#### 3.3 Run Production Smoke Test ⏸️ **TODO**
**Effort**: 1 hour
**Priority**: Critical

**Steps**:
1. Use automation script from Sprint 18 (check archive)
2. Verify all critical endpoints responding
3. Test full user flow on production
4. Check Sentry for any errors

**Success Criteria**:
- All smoke test checks pass
- No errors in Sentry
- Full game playthrough works

---

## 📋 Phase 4: Post-Launch Monitoring (Ongoing)

**Goal**: Monitor production health and user feedback

### Tasks

#### 4.1 Monitor Sentry for 7 Days ⏸️ **TODO**
**Effort**: 15 min/day
**Priority**: High

**Steps**:
1. Check Sentry daily for new errors
2. Triage and fix critical issues within 24 hours
3. Document common errors and solutions

**Success Criteria**:
- <1% error rate
- All critical errors fixed within 24 hours

---

#### 4.2 Track Performance Metrics ⏸️ **TODO**
**Effort**: Weekly
**Priority**: Medium

**Metrics to Track**:
- Daily Active Users (DAU)
- Average session duration
- Games played per user
- Page load time (Lighthouse)
- WebSocket latency (Sentry performance monitoring)
- Error rate by endpoint

**Success Criteria**:
- Performance stays within baseline ±10%
- User engagement metrics tracked

---

#### 4.3 Collect User Feedback ⏸️ **TODO**
**Effort**: Ongoing
**Priority**: Medium

**Steps**:
1. Add feedback form to app (optional)
2. Monitor Discord/GitHub issues
3. Create user feedback tracker

**Success Criteria**:
- Feedback mechanism in place
- Top 3 user requests identified

---

## 🎯 Sprint Success Criteria

### Must-Have (Required for Sprint Completion)
- ✅ All Phase 1 validation tests passing
- ✅ CI/CD pipeline running (test + deploy to staging)
- ✅ Deployed to production
- ✅ Sentry monitoring active
- ✅ Smoke tests passing on production

### Nice-to-Have (Can defer to Sprint 20)
- ⏸️ Performance regression testing in CI
- ⏸️ Custom domain configured
- ⏸️ Log aggregation set up

---

## 📊 Estimated Effort

| Phase | Tasks | Effort |
|-------|-------|--------|
| **Phase 1: Validation** | 5 tasks | 2-3 days |
| **Phase 2: CI/CD** | 3 tasks | 3-4 days |
| **Phase 3: Deployment** | 3 tasks | 1-2 days |
| **Phase 4: Monitoring** | 3 tasks | Ongoing |
| **TOTAL** | 14 tasks | **6-9 days** |

---

## 🚀 Next Steps

1. **Day 1-3**: Complete Phase 1 (Pre-production validation)
2. **Day 4-7**: Complete Phase 2 (CI/CD pipeline)
3. **Day 8-9**: Complete Phase 3 (Production deployment)
4. **Day 10+**: Begin Phase 4 (Post-launch monitoring)

---

## 📝 Definition of Done

Sprint 19 is complete when:
- ✅ App is live on production URL
- ✅ CI/CD pipeline deploys automatically
- ✅ All validation tests documented and passing
- ✅ Monitoring and alerts configured
- ✅ Zero critical bugs in production

---

## 🔗 References

- [ROADMAP.md](../../ROADMAP.md) - Project roadmap
- [IMPROVEMENT_PLAN.md](../IMPROVEMENT_PLAN.md) - Code quality improvements (14/18 complete)
- Sprint 18 docs (see `docs/archive/sprints/`) - Production hardening tools
- [RAILWAY_DEPLOY.md](../deployment/RAILWAY_DEPLOY.md) - Deployment guide

---

*Created: 2025-11-21*
*Sprint 19 Goal: Launch to production with automated CI/CD*
