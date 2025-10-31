# Sprint 2: Performance & Security - Plan

**Start Date:** 2025-10-31
**Status:** 🚀 Active
**Focus:** Performance optimization, security hardening, no new features

---

## 🎯 Sprint Goals

Based on Sprint 1 success (database optimization, logging, test stability), Sprint 2 focuses on:

1. **Performance Optimization** - Reduce latency, optimize WebSocket communication
2. **Security Hardening** - Enhanced validation, rate limiting, CORS policies
3. **Infrastructure** - Monitoring improvements, deployment readiness
4. **Code Quality** - Continue refactoring patterns from Sprint 1

---

## 📋 Task List (Priority Order)

### Phase 1: Performance Optimization (High Impact)

#### 1. WebSocket Message Compression ⚡
**Priority:** High
**Effort:** 1-2 hours
**Impact:** Reduced bandwidth usage by 30-60%

**Implementation:**
- Enable Socket.io compression for all events
- Configure compression threshold (e.g., 1KB)
- Add compression metrics to health endpoint
- Test with large game state payloads

**Benefits:**
- Faster game state updates
- Lower bandwidth costs
- Better mobile performance

---

#### 2. Response Time Monitoring 📊
**Priority:** High
**Effort:** 1 hour
**Impact:** Better performance visibility

**Implementation:**
- Add response time tracking to all endpoints
- Add percentile calculations (p50, p95, p99)
- Expose metrics via `/api/metrics/response-times`
- Add alerting thresholds

**Metrics to Track:**
- REST endpoint response times
- Socket event handler execution times
- Database query durations
- Cache hit/miss rates

---

#### 3. Optimize Game State Updates 🎮
**Priority:** Medium
**Effort:** 2-3 hours
**Impact:** Reduced server load

**Implementation:**
- Implement delta updates (send only changes)
- Add game state diffing algorithm
- Reduce unnecessary broadcasts
- Batch multiple updates when possible

**Current State:**
- Full game state sent on every update (~5-10KB per update)
- 4 players × 60 updates/round = 240 full state transmissions

**Target:**
- Delta updates reduce payload to ~500B-1KB
- 80-90% bandwidth reduction during gameplay

---

### Phase 2: Security Hardening (Critical)

#### 4. Per-User Rate Limiting 🛡️
**Priority:** High
**Effort:** 2 hours
**Impact:** Prevent abuse, better DDoS protection

**Current:**
- IP-based rate limiting only
- Easy to bypass with VPN/proxy

**Implementation:**
- Add player name + IP combined limiting
- Socket event rate limiting (per player)
- Sliding window rate limiter
- Different limits per action type:
  - `play_card`: 15/minute (1 every 4 seconds)
  - `place_bet`: 10/minute
  - `chat`: 30/minute
  - Game creation: 5/hour per IP

**Configuration:**
```typescript
const rateLimits = {
  gameActions: { window: 60000, max: 15 }, // 15 actions/minute
  chat: { window: 60000, max: 30 },
  gameCreation: { window: 3600000, max: 5 }, // 5/hour
};
```

---

#### 5. Enhanced Input Validation 🔒
**Priority:** High
**Effort:** 2 hours
**Impact:** Prevent injection attacks, data corruption

**Areas to Validate:**
- Player names: alphanumeric + spaces, 2-20 chars, no XSS
- Game IDs: exact format validation
- Chat messages: HTML escaping, length limits
- Numeric values: range validation, NaN checks
- Card objects: complete structure validation

**Implementation:**
- Create `validation/schemas.ts` with Zod schemas
- Add validation middleware
- Sanitize all user inputs
- Add validation error metrics

---

#### 6. CORS Policy Review 🌐
**Priority:** Medium
**Effort:** 1 hour
**Impact:** Security hardening

**Current:**
- Development: allows all origins (`*`)
- Production: specific origins only

**Review:**
- Audit allowed origins list
- Remove unused origins
- Add origin validation logging
- Test cross-origin scenarios
- Document CORS policy

---

### Phase 3: Infrastructure & Monitoring

#### 7. Add Prometheus Metrics Export 📈
**Priority:** Medium
**Effort:** 2-3 hours
**Impact:** Production monitoring readiness

**Implementation:**
- Add `prom-client` integration
- Export metrics at `/metrics` endpoint
- Track:
  - HTTP request counts/durations
  - Socket connection counts
  - Active games gauge
  - Error rates by handler
  - Database query durations
  - Cache hit/miss ratios

**Example Metrics:**
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status="200"} 1523

# HELP active_games Current number of active games
# TYPE active_games gauge
active_games 5
```

---

#### 8. Add Request/Response Logging Middleware 📝
**Priority:** Low
**Effort:** 1 hour
**Impact:** Better debugging

**Implementation:**
- Already have `requestLogger` from Sprint 1
- Add request/response body logging (configurable)
- Add slow request warnings (>1s)
- Add correlation IDs for tracing

---

### Phase 4: Code Quality (Ongoing)

#### 9. Add TypeScript Strict Mode ⚙️
**Priority:** Low
**Effort:** 3-4 hours
**Impact:** Better type safety

**Implementation:**
- Enable `strict: true` in tsconfig.json
- Fix type errors incrementally
- Add missing type annotations
- Remove remaining `any` types

---

#### 10. Add Integration Tests 🧪
**Priority:** Low
**Effort:** 4-5 hours
**Impact:** Better test coverage

**Implementation:**
- WebSocket integration tests (backend)
- Multi-player game flow tests
- Database transaction tests
- Cache invalidation tests

---

## 📊 Success Metrics

### Performance Targets
- [ ] Socket message size reduced by 50% (compression)
- [ ] Game state update latency < 100ms (p95)
- [ ] REST endpoint response time < 50ms (p95)
- [ ] Database query time < 20ms average
- [ ] Cache hit rate > 80%

### Security Targets
- [ ] Zero XSS/injection vulnerabilities
- [ ] Per-user rate limiting active
- [ ] All inputs validated with schemas
- [ ] CORS policy documented and tested

### Monitoring Targets
- [ ] Response time metrics exported
- [ ] Prometheus metrics endpoint ready
- [ ] Health endpoint includes all subsystems
- [ ] Error rates tracked per handler

---

## 🚫 Out of Scope (Sprint 2)

**No New Features:**
- ❌ No new game modes
- ❌ No UI changes (except debug/monitoring)
- ❌ No new player features
- ❌ No AI improvements
- ❌ No social features

**Deferred to Sprint 3+:**
- Redis caching layer (only if Neon usage still high)
- Docker containerization
- CI/CD pipeline
- Staging environment

---

## 📝 Task Breakdown

### Week 1 (Days 1-3)
1. ✅ Create Sprint 2 plan
2. WebSocket message compression
3. Response time monitoring
4. Per-user rate limiting

### Week 1 (Days 4-5)
5. Enhanced input validation
6. CORS policy review
7. Optimize game state updates

### Week 2 (if needed)
8. Prometheus metrics export
9. TypeScript strict mode
10. Integration tests (stretch goal)

---

## 🔄 Daily Workflow

1. **Morning:** Review metrics from previous day
2. **Work:** Focus on 1-2 tasks per session
3. **Test:** Run all tests after each change
4. **Document:** Update docs as you go
5. **Commit:** Atomic commits with clear messages

---

## 📚 Resources

**Dependencies to Install:**
```bash
# For validation
npm install zod

# For Prometheus metrics (if implementing)
# npm install prom-client (already installed)

# For compression testing
# (Socket.io has built-in compression)
```

**Documentation:**
- Socket.io compression: https://socket.io/docs/v4/server-options/#perMessageDeflate
- Zod validation: https://zod.dev/
- Prometheus client: https://github.com/siimon/prom-client

---

## ✅ Sprint 1 Learnings Applied

From Sprint 1, we learned:
- ✅ Focus on high-impact, low-risk changes
- ✅ Write tests before/during implementation
- ✅ Document as you go
- ✅ Commit frequently with clear messages
- ✅ Monitor metrics to validate improvements

---

## 🎯 Sprint 2 Success Criteria

**Must Have:**
- WebSocket compression enabled
- Response time monitoring active
- Per-user rate limiting implemented
- Input validation enhanced
- All tests passing (142+ backend tests)

**Nice to Have:**
- Prometheus metrics export
- Game state delta updates
- TypeScript strict mode enabled

**Stretch Goals:**
- Integration test suite
- Redis caching layer evaluation

---

**Sprint Duration:** 1-2 weeks (depending on scope)
**Team Size:** 1 (Claude Code + User)
**Methodology:** Agile, incremental delivery

🚀 **Let's build a faster, more secure game server!**
