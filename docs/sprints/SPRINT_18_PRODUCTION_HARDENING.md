# Sprint 18: Production Hardening Plan

**Sprint Goal**: Achieve 98-100/100 production readiness score through comprehensive security, performance, and stability improvements.

**Duration**: 22-28 hours across 5 phases
**Start Date**: 2025-11-18
**Target Completion**: 2025-11-25

**Current Production Status**:
- ✅ Deployed to production (Railway + Vercel)
- ✅ 368 backend tests passing (98.7%)
- ✅ 142 frontend tests passing (100%)
- ✅ 19/22 E2E suites passing (86%)
- 📊 Current readiness: 92/100
- 🎯 Target readiness: 98-100/100

---

## Phase 1: Critical Security & Stability (8-10 hours)

### Task 1.1: Implement JWT Refresh Token System
**Priority**: Critical
**Time Estimate**: 3-4 hours
**Status**: 🔴 Not Started

**Problem**: Users face sudden logouts after 7-day JWT expiration, poor UX for active users.

**Solution**: Implement refresh token rotation pattern.

**Implementation Steps**:
1. Create `refresh_tokens` database table
2. Implement `/api/auth/refresh` REST endpoint
3. Store refresh token in httpOnly cookie (more secure than localStorage)
4. Add automatic token refresh logic to AuthContext
5. Refresh tokens 1 hour before expiration
6. Write comprehensive tests

**Deliverables**:
- Database migration: `refresh_tokens` table with token, user_id, expires_at, created_at
- Backend endpoint: `POST /api/auth/refresh` with rate limiting (10 req/hour/user)
- Frontend: Auto-refresh logic in AuthContext with retry on failure
- Tests: 5-8 new tests covering refresh flow, expiration, concurrent requests, rotation

**Success Criteria**:
- [ ] Refresh tokens stored securely in httpOnly cookies
- [ ] Automatic refresh 1 hour before expiration
- [ ] Token rotation on each refresh (old token invalidated)
- [ ] Rate limiting prevents abuse
- [ ] Tests verify all edge cases

**Files to Create/Modify**:
- `backend/src/db/schema.sql` - Add refresh_tokens table
- `backend/src/db/auth.ts` - Refresh token CRUD operations
- `backend/src/api/auth.ts` - Add /refresh endpoint
- `frontend/src/contexts/AuthContext.tsx` - Add auto-refresh logic
- `backend/src/api/auth.test.ts` - Add refresh token tests

---

### Task 1.2: Add CSRF Protection
**Priority**: Critical
**Time Estimate**: 2-3 hours
**Status**: 🔴 Not Started

**Problem**: REST API endpoints vulnerable to cross-site request forgery attacks.

**Solution**: Implement double-submit cookie pattern with CSRF tokens.

**Implementation Steps**:
1. Install `csurf` or `csrf-csrf` package
2. Add CSRF token generation middleware
3. Include CSRF token in all state-changing requests (POST/PUT/DELETE)
4. Add CSRF validation middleware to protected routes
5. Handle CSRF errors gracefully on frontend
6. Write tests for CSRF protection

**Deliverables**:
- Backend middleware: CSRF token generation and validation
- Frontend: Include CSRF token in request headers
- Error handling: User-friendly CSRF error messages
- Tests: 3-5 tests covering token validation, missing token, invalid token

**Success Criteria**:
- [ ] All POST/PUT/DELETE endpoints protected
- [ ] CSRF tokens rotated on authentication state changes
- [ ] Frontend automatically includes tokens in requests
- [ ] Tests verify protection works

**Files to Create/Modify**:
- `backend/src/middleware/csrf.ts` - New CSRF middleware
- `backend/src/index.ts` - Apply CSRF middleware
- `frontend/src/utils/api.ts` - Add CSRF token handling
- `backend/src/middleware/csrf.test.ts` - CSRF tests

---

### Task 1.3: Configure Sentry Alerts & Monitoring
**Priority**: High
**Time Estimate**: 1.5 hours
**Status**: 🔴 Not Started

**Problem**: Sentry configured but no alerts → errors go unnoticed until users report them.

**Solution**: Configure email/Slack alerts for critical errors.

**Implementation Steps**:
1. Log in to Sentry dashboard
2. Configure alert rules:
   - Error rate > 10/minute → Immediate email
   - New error types → Email within 5 minutes
   - Performance degradation (p95 > 2s) → Email within 15 minutes
3. Set up Slack integration (optional)
4. Test alerts by triggering sample errors
5. Document alert response procedures

**Deliverables**:
- Configured alert rules in Sentry
- Test alerts triggered and received
- Documentation: `docs/deployment/INCIDENT_RESPONSE.md`

**Success Criteria**:
- [ ] Email alerts configured for critical errors
- [ ] Test alert received within 5 minutes
- [ ] Alert thresholds tuned to avoid noise
- [ ] Incident response procedures documented

**Files to Create**:
- `docs/deployment/INCIDENT_RESPONSE.md` - Alert response procedures

---

### Task 1.4: Document & Test Database Backup Strategy
**Priority**: High
**Time Estimate**: 1.5 hours
**Status**: 🔴 Not Started

**Problem**: No documented or tested database recovery procedure → risk of permanent data loss.

**Solution**: Document backup strategy and verify restore process works.

**Implementation Steps**:
1. Document Railway automatic backups (retention policy, frequency)
2. Write manual backup script using `pg_dump`
3. Test restore process on local database
4. Document step-by-step restore procedure
5. Schedule weekly backup validation tests
6. Create backup monitoring script

**Deliverables**:
- Documentation: `docs/deployment/DATABASE_BACKUP.md`
- Script: `scripts/backup-database.sh` for manual backups
- Script: `scripts/restore-database.sh` for recovery
- Test: Verify restore from backup works correctly

**Success Criteria**:
- [ ] Automatic backup retention documented
- [ ] Manual backup script tested and working
- [ ] Restore procedure documented with screenshots
- [ ] Recovery tested successfully on local database
- [ ] Backup validation script scheduled

**Files to Create**:
- `docs/deployment/DATABASE_BACKUP.md` - Backup procedures
- `scripts/backup-database.sh` - Manual backup script
- `scripts/restore-database.sh` - Restore script
- `scripts/validate-backup.sh` - Validation script

---

## Phase 2: Performance & Load Testing (4-5 hours)

### Task 2.1: Run Comprehensive Load Tests
**Priority**: High
**Time Estimate**: 2-3 hours
**Status**: 🔴 Not Started

**Problem**: No baseline performance metrics → can't detect regressions or capacity limits.

**Solution**: Run load tests with k6 and establish performance baselines.

**Implementation Steps**:
1. Review existing load test scripts in `backend/load-tests/`
2. Run baseline tests: 10 concurrent games, 100 requests/second
3. Monitor resource usage (CPU, memory, database connections)
4. Identify bottlenecks and optimization opportunities
5. Document performance baselines
6. Create performance regression tests for CI/CD

**Test Scenarios**:
- 10 concurrent games with 40 players
- 100 concurrent socket connections
- 1000 HTTP requests over 1 minute
- Database under load (100 writes/sec)

**Deliverables**:
- Load test results with graphs and metrics
- Performance baseline documentation
- Identified bottlenecks and recommendations
- CI/CD performance regression tests

**Success Criteria**:
- [ ] Load tests run successfully without crashes
- [ ] Response times: p95 < 500ms, p99 < 1000ms
- [ ] Zero socket disconnections under load
- [ ] Database connection pool healthy
- [ ] Baseline metrics documented

**Files to Create/Modify**:
- `docs/technical/PERFORMANCE_BASELINE.md` - Performance metrics
- `backend/load-tests/baseline.js` - Updated load test script
- `.github/workflows/performance.yml` - CI/CD performance tests (optional)

---

### Task 2.2: Run Lighthouse Audit on Production Build
**Priority**: Medium
**Time Estimate**: 1 hour
**Status**: 🔴 Not Started

**Problem**: Frontend performance unknown → potential UX issues undiscovered.

**Solution**: Run Lighthouse audit and fix critical issues.

**Implementation Steps**:
1. Build production frontend locally
2. Run Lighthouse audit (desktop + mobile)
3. Analyze results: Performance, Accessibility, Best Practices, SEO
4. Fix critical issues (score < 90)
5. Re-run audit to verify improvements
6. Document performance optimizations

**Target Scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Deliverables**:
- Lighthouse audit reports (before/after)
- Performance optimizations implemented
- Documentation of improvements

**Success Criteria**:
- [ ] All scores > 90
- [ ] No critical accessibility issues
- [ ] Bundle size < 500KB (gzipped)
- [ ] First Contentful Paint < 1.5s

**Files to Modify**:
- `frontend/vite.config.ts` - Build optimizations
- `frontend/src/main.tsx` - Code splitting improvements
- `docs/technical/LIGHTHOUSE_AUDIT.md` - Audit results

---

### Task 2.3: Bundle Size Analysis & Optimization
**Priority**: Medium
**Time Estimate**: 1 hour
**Status**: 🔴 Not Started

**Problem**: No visibility into bundle composition → potential bloat and slow load times.

**Solution**: Analyze bundle with Rollup visualizer and optimize.

**Implementation Steps**:
1. Generate bundle analysis: `npm run build -- --mode analyze`
2. Identify large dependencies (> 100KB)
3. Implement code splitting for large components
4. Lazy load non-critical features
5. Verify bundle size reduction
6. Document optimization strategies

**Deliverables**:
- Bundle analysis report with visualizations
- Code splitting implemented for large components
- Bundle size reduced by 15-20%

**Success Criteria**:
- [ ] Main bundle < 300KB (gzipped)
- [ ] Largest chunk < 150KB
- [ ] Code splitting for ProfileEditor, GameReplay, Leaderboard
- [ ] Lazy loading verified

**Files to Modify**:
- `frontend/src/App.tsx` - Add lazy loading
- `frontend/vite.config.ts` - Add rollup-plugin-visualizer
- `docs/technical/BUNDLE_OPTIMIZATION.md` - Optimization results

---

## Phase 3: Comprehensive Testing & Validation (5-6 hours)

### Task 3.1: Automated Test Suite Validation
**Priority**: High
**Time Estimate**: 1 hour
**Status**: 🔴 Not Started

**Problem**: 3 failing E2E suites block confidence in deployment stability.

**Solution**: Fix or document remaining E2E failures.

**Implementation Steps**:
1. Review failing E2E suites: 14-spectator, 15-timeout-system, 19-timeout-autoplay
2. Determine if failures are test issues or actual bugs
3. Fix bugs or update tests to match current behavior
4. Achieve 100% E2E pass rate
5. Document any known limitations

**Deliverables**:
- All E2E tests passing or properly skipped with justification
- Bug fixes for legitimate failures
- Updated test documentation

**Success Criteria**:
- [ ] 22/22 E2E suites passing or properly skipped
- [ ] Zero flaky tests
- [ ] Test suite runtime < 15 minutes
- [ ] All test failures documented

**Files to Modify**:
- `e2e/tests/14-spectator.spec.ts` - Fix spectator tests
- `e2e/tests/15-timeout-system.spec.ts` - Fix timeout tests
- `e2e/tests/19-timeout-autoplay.spec.ts` - Fix autoplay tests
- `docs/technical/E2E_TEST_STATUS.md` - Document test status

---

### Task 3.2: End-to-End User Flow Testing
**Priority**: High
**Time Estimate**: 2 hours
**Status**: 🔴 Not Started

**Problem**: Individual features tested, but complete user journeys not validated.

**Solution**: Test critical user flows from start to finish.

**Test Flows**:
1. New user registration → email verification → first game
2. Returning user login → find friend → play game → view stats
3. Guest user → Quick Play → create account mid-game
4. User creates lobby → invites friend → plays 3 rounds → rematch
5. User views leaderboard → clicks player → views profile → sends friend request
6. User sends DM → receives reply → deletes conversation

**Deliverables**:
- Manual test checklist with pass/fail for each flow
- Bug reports for any failures
- Screenshots/recordings of critical flows

**Success Criteria**:
- [ ] All 6 user flows complete successfully
- [ ] No console errors during flows
- [ ] All features work as expected
- [ ] Mobile-responsive flows tested

**Files to Create**:
- `docs/testing/USER_FLOW_TESTS.md` - Test results
- `docs/testing/USER_FLOW_CHECKLIST.md` - Test checklist

---

### Task 3.3: Manual Testing Checklist Execution
**Priority**: High
**Time Estimate**: 2 hours
**Status**: 🔴 Not Started

**Problem**: Automated tests miss edge cases and UX issues.

**Solution**: Execute comprehensive manual testing checklist.

**Test Categories**:
1. **Authentication** (15 min)
   - Register, login, logout, password reset, email verification
2. **Game Creation & Joining** (20 min)
   - Create lobby, join game, Quick Play, spectate, leave game
3. **Gameplay** (30 min)
   - Team selection, betting, card playing, scoring, rematch
4. **Social Features** (25 min)
   - Send DM, accept friend request, view profile, browse leaderboard
5. **Bot Management** (15 min)
   - Add bot, remove bot, change difficulty, swap with bot
6. **Responsive Design** (15 min)
   - Test on mobile, tablet, desktop
7. **Accessibility** (10 min)
   - Keyboard navigation, screen reader, color contrast

**Deliverables**:
- Completed testing checklist with pass/fail results
- Bug reports for failures
- UX improvement recommendations

**Success Criteria**:
- [ ] 95%+ test cases passing
- [ ] All critical bugs fixed
- [ ] No regressions from previous sprints
- [ ] Mobile experience validated

**Files to Create**:
- `docs/testing/MANUAL_TEST_CHECKLIST.md` - Test checklist
- `docs/testing/MANUAL_TEST_RESULTS.md` - Test results

---

### Task 3.4: Security Audit & Penetration Testing
**Priority**: Medium
**Time Estimate**: 1 hour
**Status**: 🔴 Not Started

**Problem**: No security validation → potential vulnerabilities undiscovered.

**Solution**: Basic security audit and penetration testing.

**Test Areas**:
1. **Authentication Bypass** - Attempt to access protected routes without login
2. **SQL Injection** - Test input fields with SQL injection payloads
3. **XSS Attacks** - Test chat/profile with XSS payloads
4. **CSRF** - Attempt cross-site requests
5. **Session Hijacking** - Test JWT token theft and replay
6. **Rate Limiting** - Test API abuse with rapid requests
7. **Authorization** - Attempt to access other users' data

**Deliverables**:
- Security audit report with findings
- Fixed vulnerabilities
- Documented security measures

**Success Criteria**:
- [ ] No critical vulnerabilities found
- [ ] All inputs sanitized properly
- [ ] Rate limiting working on all endpoints
- [ ] Authorization checks preventing data leaks

**Files to Create**:
- `docs/security/SECURITY_AUDIT.md` - Audit results
- `docs/security/SECURITY_CHECKLIST.md` - Testing checklist

---

## Phase 4: Production Environment Validation (3-4 hours)

### Task 4.1: Production Environment Configuration Audit
**Priority**: High
**Time Estimate**: 1.5 hours
**Status**: 🔴 Not Started

**Problem**: Production config drift from local → unexpected behavior in production.

**Solution**: Audit and document production configuration.

**Audit Areas**:
1. **Environment Variables** - Verify all required vars set in Railway/Vercel
2. **Database** - Verify connection pooling, SSL, backup config
3. **Secrets** - Verify JWT secret, Resend API key, Sentry DSN
4. **CORS** - Verify allowed origins match production URLs
5. **Rate Limiting** - Verify limits appropriate for production
6. **Logging** - Verify error logging to Sentry working
7. **Build Config** - Verify production optimizations enabled

**Deliverables**:
- Production configuration documentation
- Checklist of required environment variables
- Verification that all configs match documentation

**Success Criteria**:
- [ ] All environment variables documented
- [ ] No missing or incorrect configuration
- [ ] Secrets rotated if exposed in git history
- [ ] Configuration matches best practices

**Files to Create/Modify**:
- `docs/deployment/PRODUCTION_CONFIG.md` - Production config docs
- `docs/deployment/ENV_VARIABLES.md` - Environment variable reference
- `.env.example` - Update with all required variables

---

### Task 4.2: Production Smoke Test
**Priority**: Critical
**Time Estimate**: 1 hour
**Status**: 🔴 Not Started

**Problem**: No systematic validation that production deployment works.

**Solution**: Execute production smoke test checklist.

**Test Steps**:
1. Visit production URL → verify homepage loads
2. Create account → verify email sent
3. Verify email → verify account activated
4. Login → verify JWT token set
5. Create Quick Play game → verify game starts
6. Play 1 round → verify game mechanics work
7. Send chat message → verify WebSocket connection
8. View leaderboard → verify database queries work
9. Logout → verify session cleared

**Deliverables**:
- Smoke test checklist with results
- Screenshots of production working
- Bug reports if any failures

**Success Criteria**:
- [ ] All smoke test steps pass
- [ ] No console errors
- [ ] No Sentry errors triggered
- [ ] Response times < 2s for all actions

**Files to Create**:
- `docs/testing/PRODUCTION_SMOKE_TEST.md` - Smoke test checklist

---

### Task 4.3: Performance Baseline in Production
**Priority**: Medium
**Time Estimate**: 30 minutes
**Status**: 🔴 Not Started

**Problem**: Production performance unknown → can't detect regressions.

**Solution**: Measure production baseline performance.

**Metrics to Measure**:
1. **Page Load Time** - Time to interactive
2. **WebSocket Latency** - Connection time + message round-trip
3. **API Response Times** - p50, p95, p99 for all endpoints
4. **Database Query Times** - Slow query log analysis
5. **Error Rate** - Errors per 1000 requests

**Deliverables**:
- Performance baseline documentation
- Graphs/charts showing metrics
- Monitoring dashboard (Sentry Performance)

**Success Criteria**:
- [ ] Page load < 3s (desktop), < 5s (mobile)
- [ ] WebSocket latency < 100ms
- [ ] API p95 < 500ms
- [ ] Error rate < 0.1%

**Files to Create**:
- `docs/technical/PRODUCTION_PERFORMANCE.md` - Performance metrics

---

## Phase 5: Documentation & Launch Preparation (2-3 hours)

### Task 5.1: Update Production Readiness Documentation
**Priority**: Medium
**Time Estimate**: 1 hour
**Status**: 🔴 Not Started

**Problem**: Documentation out of date with latest changes.

**Solution**: Update all production documentation.

**Documentation to Update**:
1. `README.md` - Update features, deployment status
2. `ROADMAP.md` - Mark Sprint 18 complete
3. `CLAUDE.md` - Update with refresh token system, CSRF protection
4. `docs/technical/FEATURES.md` - Update with new features
5. `docs/deployment/RAILWAY_DEPLOY.md` - Update deployment guide

**Deliverables**:
- All documentation updated and accurate
- No broken links
- Screenshots updated where needed

**Success Criteria**:
- [ ] All docs reflect current state
- [ ] No outdated information
- [ ] Deployment guides tested and working
- [ ] Feature docs complete

**Files to Modify**:
- `README.md`
- `ROADMAP.md`
- `CLAUDE.md`
- `docs/technical/FEATURES.md`
- `docs/deployment/RAILWAY_DEPLOY.md`

---

### Task 5.2: Create Incident Response Plan
**Priority**: High
**Time Estimate**: 30 minutes
**Status**: 🔴 Not Started

**Problem**: No plan for handling production incidents → slow response, data loss risk.

**Solution**: Document incident response procedures.

**Plan Contents**:
1. **Severity Definitions** - Critical, high, medium, low
2. **Response Procedures** - Who to contact, escalation path
3. **Common Incidents** - Database down, API errors, WebSocket failures
4. **Rollback Procedure** - How to revert bad deployments
5. **Post-Mortem Template** - Root cause analysis format

**Deliverables**:
- `docs/deployment/INCIDENT_RESPONSE.md`
- Emergency contact list
- Rollback procedure documentation

**Success Criteria**:
- [ ] Response procedures for all common incidents
- [ ] Rollback tested and working
- [ ] Post-mortem template created
- [ ] Team trained on procedures

**Files to Create**:
- `docs/deployment/INCIDENT_RESPONSE.md` - Incident procedures
- `docs/deployment/ROLLBACK_GUIDE.md` - Rollback instructions

---

### Task 5.3: Final Pre-Launch Checklist
**Priority**: Critical
**Time Estimate**: 30 minutes
**Status**: 🔴 Not Started

**Problem**: Missing critical checks before launch → avoidable failures.

**Solution**: Execute comprehensive pre-launch checklist.

**Checklist Items**:
- [ ] All Phase 1-4 tasks complete
- [ ] All tests passing (368 backend, 142 frontend, 22 E2E)
- [ ] Production smoke test passed
- [ ] Load tests passed
- [ ] Security audit complete
- [ ] Sentry alerts configured
- [ ] Database backups verified
- [ ] Performance baselines documented
- [ ] Incident response plan ready
- [ ] Documentation updated
- [ ] Team briefed on launch

**Deliverables**:
- Completed pre-launch checklist
- Launch readiness report
- Go/no-go decision

**Success Criteria**:
- [ ] 100% checklist completion
- [ ] All critical issues resolved
- [ ] Production readiness: 98-100/100
- [ ] Confidence level: High

**Files to Create**:
- `docs/deployment/PRE_LAUNCH_CHECKLIST.md` - Final checklist
- `docs/deployment/LAUNCH_READINESS.md` - Readiness report

---

## Sprint Success Criteria

**Sprint Complete When**:
- [ ] All 15 tasks completed
- [ ] Production readiness score: 98-100/100
- [ ] All tests passing (backend, frontend, E2E)
- [ ] Production smoke test passed
- [ ] Performance baselines documented
- [ ] Security audit complete with no critical issues
- [ ] Incident response plan ready
- [ ] Documentation fully updated

**Exit Criteria**:
- [ ] No critical bugs
- [ ] No failing tests
- [ ] Production deployment stable
- [ ] Team confident in launch readiness

---

## Risk Management

**High-Risk Tasks**:
1. Task 1.1 (JWT Refresh) - Complex auth changes, potential for breaking existing sessions
2. Task 2.1 (Load Tests) - May uncover critical performance issues
3. Task 3.1 (E2E Fixes) - May reveal deeper architectural issues

**Mitigation Strategies**:
- Implement changes incrementally with rollback plan
- Test thoroughly on staging before production
- Monitor Sentry closely during rollout
- Keep old authentication working during transition

**Dependencies**:
- Task 1.2 (CSRF) depends on Task 1.1 (JWT Refresh) for cookie handling
- Task 4.2 (Smoke Test) depends on all Phase 1-3 tasks
- Task 5.3 (Pre-Launch) depends on all other tasks

---

## Time Tracking

**Phase 1**: 8-10 hours
**Phase 2**: 4-5 hours
**Phase 3**: 5-6 hours
**Phase 4**: 3-4 hours
**Phase 5**: 2-3 hours

**Total**: 22-28 hours
**Recommended Schedule**: 4-6 hours per day over 5 days

---

*Sprint 18 created: 2025-11-18*
*Based on: PRODUCTION_READY_SUMMARY_PLAN.md*
*Target completion: 2025-11-25*
