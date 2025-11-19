# Incident Response Plan

**Sprint 18 Phase 5 Task 5.2**
**Purpose**: Define procedures for handling production incidents quickly and effectively
**Priority**: High
**Last Updated**: 2025-11-19

---

## Overview

This document defines the incident response procedures for production issues. Following these procedures ensures consistent, rapid response to minimize downtime and user impact.

**Key Principles**:
1. **User Impact First** - Prioritize minimizing user disruption
2. **Communicate Early** - Alert team and users immediately
3. **Fix Fast, Analyze Later** - Resolve the incident, then do post-mortem
4. **Learn and Improve** - Every incident is a learning opportunity

---

## Severity Definitions

### Critical (P0)
**Impact**: Complete service outage or data loss affecting all users

**Examples**:
- Production site unreachable (>5 minutes)
- Database inaccessible or corrupted
- Authentication system down (no one can login)
- WebSocket server down (no games can be played)
- Security breach or data leak

**Response Time**: Immediate (within 5 minutes)
**Escalation**: All hands on deck
**Communication**: Public status page + email blast

---

### High (P1)
**Impact**: Major feature broken or affecting >50% of users

**Examples**:
- Game creation failing for all users
- Payment/registration system down
- Leaderboard not updating
- Direct messaging system down
- Sentry error rate >10% (100+ errors/minute)

**Response Time**: Within 30 minutes
**Escalation**: On-call engineer + backup
**Communication**: Status page update + email to active users

---

### Medium (P2)
**Impact**: Non-critical feature broken or affecting <50% of users

**Examples**:
- Spectator mode not working
- Game replay broken
- Profile stats not updating
- Bot AI behaving incorrectly
- Sentry error rate 1-10% (10-100 errors/minute)

**Response Time**: Within 2 hours (business hours)
**Escalation**: On-call engineer
**Communication**: Internal Slack notification

---

### Low (P3)
**Impact**: Minor bug or cosmetic issue affecting few users

**Examples**:
- UI rendering glitch
- Sound effects not playing
- Dark mode color inconsistency
- Typo in UI text
- Single user reports issue (not reproducible)

**Response Time**: Within 24 hours (business hours)
**Escalation**: None (handle in normal sprint)
**Communication**: Track in issue tracker

---

## Incident Response Workflow

### Phase 1: Detection & Alert (0-5 minutes)

**Incident Detected By**:
- **Sentry Alert** - Email notification for error rate spike
- **UptimeRobot** - Downtime alert (site unreachable)
- **User Report** - Support ticket or social media complaint
- **Manual Discovery** - Team member notices issue

**Immediate Actions**:
1. **Acknowledge Alert** - Confirm incident and severity
2. **Create Incident Channel** - Slack channel: `#incident-YYYY-MM-DD-description`
3. **Assign Incident Commander** - First person to acknowledge becomes IC
4. **Post Initial Update** - "Investigating issue with [feature]"

**Checklist**:
- [ ] Incident acknowledged within 5 minutes
- [ ] Incident channel created
- [ ] Incident Commander assigned
- [ ] Initial communication posted

---

### Phase 2: Triage & Communication (5-15 minutes)

**Incident Commander Responsibilities**:
1. **Assess Severity** - Use severity definitions above
2. **Gather Context** - Check Sentry, Railway logs, Vercel logs
3. **Determine User Impact** - How many users affected? What features broken?
4. **Communicate Status** - Post update to incident channel and status page

**Information to Gather**:
- **When**: When did incident start? (check Sentry first error timestamp)
- **What**: What is broken? What features affected?
- **Who**: How many users affected? Specific user reports?
- **Where**: Frontend, backend, database, network?
- **Why**: Recent deployment? Config change? External service outage?

**Communication Template**:
```markdown
## Incident: [Title]
**Severity**: [P0/P1/P2/P3]
**Status**: Investigating
**Started**: YYYY-MM-DD HH:MM UTC
**Impact**: [Description of user impact]

**Current Status**:
- [Timestamp] Incident detected
- [Timestamp] Triaging issue
- [Timestamp] [Next update]

**Root Cause**: Unknown (investigating)
**ETA to Resolution**: Unknown (investigating)
```

**Checklist**:
- [ ] Severity determined
- [ ] User impact assessed
- [ ] Context gathered (Sentry, logs)
- [ ] Status update posted

---

### Phase 3: Mitigation & Fix (15 minutes - 2 hours)

**Goal**: Restore service as quickly as possible

**Decision Tree**:

**Is a recent deployment the cause?**
- **YES** → Rollback immediately (see Rollback Procedure below)
- **NO** → Continue investigation

**Is the issue in frontend?**
- **YES** → Check Vercel deployment logs, browser console errors
- **NO** → Continue investigation

**Is the issue in backend?**
- **YES** → Check Railway logs, Sentry backend errors, API health endpoint
- **NO** → Continue investigation

**Is the issue in database?**
- **YES** → Check database connection, query performance, Railway Postgres dashboard
- **NO** → Continue investigation

**Is the issue in third-party service?**
- **YES** → Check Sentry status, Resend status, Railway status pages
- **NO** → Continue investigation

**Mitigation Strategies** (in priority order):

1. **Rollback** - Revert to last known good deployment
   ```bash
   # Vercel
   vercel rollback

   # Railway
   railway rollback
   ```

2. **Quick Fix** - Deploy hotfix if issue is simple
   ```bash
   # Fix code
   git commit -m "hotfix: [description]"
   git push

   # Verify deployment
   # Run smoke test
   ```

3. **Kill Switch** - Disable broken feature temporarily
   ```bash
   # Add feature flag to disable broken feature
   FEATURE_SPECTATOR_MODE=false
   ```

4. **Scale Up** - Increase resources if performance issue
   ```bash
   # Railway dashboard: Scale up CPU/memory
   # Or use CLI: railway up --plan [plan_name]
   ```

5. **Manual Intervention** - Direct database fix (LAST RESORT)
   ```sql
   -- Only if absolutely necessary
   -- Always backup first
   -- Document all changes
   ```

**Checklist**:
- [ ] Root cause identified
- [ ] Mitigation strategy selected
- [ ] Fix deployed/applied
- [ ] Service restored
- [ ] Smoke test passed

---

### Phase 4: Verification (Post-Fix)

**Goal**: Confirm issue is resolved and stable

**Verification Steps**:
1. **Run Smoke Test** - Execute production smoke test checklist
   ```bash
   ./scripts/production-smoke-test.sh https://your-app.vercel.app https://your-api.railway.app
   ```

2. **Monitor Sentry** - Watch for 15 minutes
   - Error rate should return to <1%
   - No new errors related to fix

3. **Check User Reports** - Verify users can access service
   - Test from multiple browsers/devices
   - Ask affected users to confirm resolution

4. **Monitor Performance** - Check Railway/Vercel metrics
   - Response times back to baseline
   - No resource exhaustion

**Checklist**:
- [ ] Smoke test passed
- [ ] Sentry error rate <1%
- [ ] User reports confirmed fix
- [ ] Performance metrics normal

---

### Phase 5: Communication & Closure (Post-Resolution)

**Goal**: Inform stakeholders and close incident

**Communication Template** (Resolution):
```markdown
## Incident Resolved: [Title]
**Severity**: [P0/P1/P2/P3]
**Status**: Resolved
**Started**: YYYY-MM-DD HH:MM UTC
**Resolved**: YYYY-MM-DD HH:MM UTC
**Duration**: [X hours Y minutes]

**Impact**: [Description of user impact]

**Root Cause**: [Brief description]

**Resolution**: [What was done to fix]

**Timeline**:
- [HH:MM] Incident detected
- [HH:MM] Triaged as [severity]
- [HH:MM] Root cause identified
- [HH:MM] Fix deployed
- [HH:MM] Service restored
- [HH:MM] Verification completed

**Follow-up Actions**:
- [ ] Post-mortem scheduled for [date]
- [ ] [Action item 1]
- [ ] [Action item 2]
```

**Checklist**:
- [ ] Resolution posted to incident channel
- [ ] Status page updated
- [ ] Affected users notified
- [ ] Post-mortem scheduled (for P0/P1)

---

### Phase 6: Post-Mortem (Within 48 hours for P0/P1)

**Goal**: Learn from incident and prevent recurrence

**Post-Mortem Template**:
```markdown
# Post-Mortem: [Incident Title]

**Date**: YYYY-MM-DD
**Severity**: [P0/P1/P2/P3]
**Duration**: [X hours Y minutes]
**Incident Commander**: [Name]
**Participants**: [Names]

---

## Summary

[2-3 sentence summary of what happened]

---

## Impact

- **Users Affected**: [Number or percentage]
- **Features Broken**: [List]
- **Revenue Impact**: [If applicable]
- **Duration**: [From detection to resolution]

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | [Event description] |
| HH:MM | [Event description] |
| HH:MM | [Event description] |

---

## Root Cause Analysis

**What Happened**:
[Detailed technical explanation]

**Why It Happened**:
[Root cause identification]

**Why Wasn't It Caught Earlier**:
[Gap analysis - testing, monitoring, etc.]

---

## What Went Well

- [Thing that went well]
- [Thing that went well]
- [Thing that went well]

---

## What Went Poorly

- [Thing that went poorly]
- [Thing that went poorly]
- [Thing that went poorly]

---

## Action Items

| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| [Action] | [Name] | [P0/P1/P2/P3] | YYYY-MM-DD | [Open/Closed] |
| [Action] | [Name] | [P0/P1/P2/P3] | YYYY-MM-DD | [Open/Closed] |

---

## Prevention Measures

**Immediate** (this week):
- [Measure to prevent immediate recurrence]

**Short-term** (this month):
- [Measure to improve detection/response]

**Long-term** (this quarter):
- [Measure to prevent similar incidents]

---

**Reviewed by**: [Name, Date]
**Approved by**: [Name, Date]
```

**Checklist**:
- [ ] Post-mortem document created
- [ ] Timeline documented
- [ ] Root cause identified
- [ ] Action items assigned with owners
- [ ] Prevention measures defined
- [ ] Post-mortem reviewed by team

---

## Common Incidents & Solutions

### Incident: Production Site Unreachable

**Symptoms**:
- Users report "Cannot connect to server"
- UptimeRobot alert: Frontend down
- Vercel status shows deployment failed

**Diagnosis**:
1. Check Vercel dashboard for deployment status
2. Check DNS resolution: `nslocalhost your-app.vercel.app`
3. Check browser network tab for errors

**Solutions**:
- **Deployment failed**: Redeploy from last known good commit
- **DNS issue**: Contact Vercel support
- **CDN issue**: Check Vercel status page, wait for resolution

**Prevention**:
- Enable automatic rollback on deployment failure
- Add pre-deployment smoke tests
- Monitor Vercel deployment webhooks

---

### Incident: Backend API Down

**Symptoms**:
- Frontend shows "Server error" messages
- Sentry: 100+ 503/504 errors
- Railway logs show "Application crashed"

**Diagnosis**:
1. Check Railway deployment logs
2. Check Railway resource usage (CPU/memory)
3. Check database connectivity
4. Check environment variables

**Solutions**:
- **Application crashed**: Check logs for error, redeploy or rollback
- **Out of memory**: Scale up Railway instance
- **Database down**: Check Railway Postgres status, restart if needed
- **Config error**: Verify environment variables

**Prevention**:
- Add memory/CPU usage alerts
- Implement graceful shutdown handling
- Add health check endpoint monitoring

---

### Incident: WebSocket Disconnections

**Symptoms**:
- Users report "Connection lost" messages
- Sentry: WebSocket connection errors
- Games freeze mid-play

**Diagnosis**:
1. Check Railway logs for WebSocket errors
2. Check CORS configuration
3. Check WebSocket connection count (Railway metrics)
4. Check network latency

**Solutions**:
- **CORS error**: Add frontend origin to CORS whitelist
- **Connection limit**: Scale up Railway instance
- **Network issue**: Contact Railway support
- **Code bug**: Review recent WebSocket changes, rollback

**Prevention**:
- Monitor WebSocket connection count
- Add connection timeout handling
- Load test WebSocket capacity regularly

---

### Incident: Database Performance Degradation

**Symptoms**:
- API responses >2s (normal: <500ms)
- Sentry: Database timeout errors
- Railway Postgres CPU >90%

**Diagnosis**:
1. Check Railway Postgres metrics
2. Check slow query log
3. Check connection pool utilization
4. Run `EXPLAIN ANALYZE` on slow queries

**Solutions**:
- **Missing index**: Add database index
- **Slow query**: Optimize query or add caching
- **Connection exhaustion**: Increase connection pool size
- **Database overload**: Scale up database plan

**Prevention**:
- Monitor database query performance
- Add query performance logging
- Regular database query audits
- Archive old data (>6 months)

---

### Incident: Authentication System Down

**Symptoms**:
- Users cannot login
- Sentry: JWT verification errors
- Login endpoint returns 500

**Diagnosis**:
1. Check Sentry for JWT errors
2. Check JWT_SECRET environment variable
3. Check database user table accessibility
4. Check refresh token endpoint

**Solutions**:
- **JWT secret missing**: Set JWT_SECRET in Railway env vars
- **Database error**: Check database connectivity
- **Expired tokens**: Clear localStorage, force re-login
- **CSRF protection**: Check CSRF token generation

**Prevention**:
- Monitor authentication endpoint error rate
- Add JWT secret rotation documentation
- Add authentication system smoke tests

---

## Rollback Procedure

### Vercel (Frontend) Rollback

**Automatic Rollback** (Recommended):
1. Go to Vercel dashboard → Project → Deployments
2. Find last successful deployment (green checkmark)
3. Click "..." → "Promote to Production"
4. Verify deployment completes (1-2 minutes)
5. Run smoke test to confirm

**Manual Rollback** (Command Line):
```bash
# View recent deployments
vercel list

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or rollback to previous deployment
vercel rollback
```

**Time to Complete**: 2-5 minutes

---

### Railway (Backend) Rollback

**Automatic Rollback** (Recommended):
1. Go to Railway dashboard → Project → Deployments
2. Find last successful deployment
3. Click "..." → "Redeploy"
4. Verify deployment completes (2-3 minutes)
5. Run smoke test to confirm

**Manual Rollback** (Command Line):
```bash
# View recent deployments
railway status

# Rollback to previous deployment
railway rollback

# Or redeploy specific commit
railway up --from [git-commit-sha]
```

**Time to Complete**: 3-5 minutes

---

### Database Rollback (LAST RESORT)

⚠️ **WARNING**: Database rollbacks are complex and risky. Only attempt if data corruption occurred.

**Prerequisites**:
- Recent database backup available
- Confirmed backup timestamp is before incident
- Database access credentials

**Procedure**:
```bash
# Step 1: Backup current (corrupted) database
pg_dump $DATABASE_URL > corrupted-backup-$(date +%Y%m%d_%H%M%S).sql

# Step 2: Download backup from Railway
# (Railway dashboard → Postgres → Backups → Download)

# Step 3: Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD_HHMMSS.sql

# Step 4: Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM games;"

# Step 5: Run database migrations
cd backend
npm run db:migrate
```

**Time to Complete**: 10-30 minutes (depending on database size)

**See**: `docs/deployment/DATABASE_BACKUP.md` for detailed backup/restore procedures

---

## Emergency Contacts

### On-Call Rotation

**Primary On-Call**:
- Name: [Your Name]
- Phone: [Phone Number]
- Email: [Email]
- Slack: @username

**Backup On-Call**:
- Name: [Backup Name]
- Phone: [Phone Number]
- Email: [Email]
- Slack: @username

**Escalation**:
- If primary doesn't respond within 15 minutes, contact backup
- If backup doesn't respond within 15 minutes, contact all team members

---

### External Services

**Railway Support**:
- Email: team@railway.app
- Discord: https://discord.gg/railway
- Status Page: https://status.railway.app

**Vercel Support**:
- Email: support@vercel.com
- Twitter: @vercel
- Status Page: https://www.vercel-status.com

**Sentry Support**:
- Email: support@sentry.io
- Status Page: https://status.sentry.io

**Resend Support** (Email Service):
- Email: support@resend.com
- Status Page: https://status.resend.com

---

## Monitoring & Alerting

### Sentry Alerts (Configured in Sprint 18)

**Alert Rules**:
1. **Critical Errors** - Error rate >10/minute
   - Severity: P0
   - Notification: Email immediately
   - Action: Create incident, investigate

2. **New Error Types** - New error class detected
   - Severity: P1
   - Notification: Email within 5 minutes
   - Action: Review error, triage severity

3. **Performance Degradation** - p95 response time >2s
   - Severity: P1
   - Notification: Email within 15 minutes
   - Action: Check performance metrics, investigate

**Sentry Dashboard**: https://sentry.io/organizations/[your-org]/issues/

---

### UptimeRobot Monitors (Recommended Setup)

**Monitor 1: Frontend Uptime**
- URL: https://your-app.vercel.app
- Interval: 5 minutes
- Alert: Email + SMS if down >5 minutes

**Monitor 2: Backend Health**
- URL: https://your-api.railway.app/api/health
- Interval: 5 minutes
- Alert: Email + SMS if down >5 minutes

**Monitor 3: WebSocket**
- URL: wss://your-api.railway.app/socket.io
- Interval: 5 minutes
- Alert: Email if connection fails

**UptimeRobot Dashboard**: https://uptimerobot.com/dashboard

---

## Tools & Resources

### Monitoring Dashboards

- **Sentry**: Error tracking and performance monitoring
- **Railway Metrics**: CPU, memory, network usage
- **Vercel Analytics**: Frontend performance and Web Vitals
- **UptimeRobot**: Uptime monitoring

### Incident Management

- **Slack**: `#incidents` channel for coordination
- **Google Docs**: Post-mortem document template
- **GitHub Issues**: Action item tracking

### Runbooks

- `docs/deployment/PRODUCTION_CONFIG_AUDIT.md` - Config validation
- `docs/testing/PRODUCTION_SMOKE_TEST.md` - Smoke testing
- `docs/deployment/DATABASE_BACKUP.md` - Backup/restore procedures
- `docs/deployment/ROLLBACK_GUIDE.md` - Rollback procedures

---

## Testing Incident Response

### Quarterly Fire Drills

**Goal**: Practice incident response procedures to ensure readiness

**Procedure**:
1. **Announce Drill** - Alert team: "Fire drill starting in 5 minutes"
2. **Simulate Incident** - Create realistic scenario (e.g., "Frontend deployment failed")
3. **Execute Response** - Follow incident response procedures
4. **Measure Performance** - Track response times, communication, resolution
5. **Debrief** - Discuss what went well/poorly
6. **Update Procedures** - Improve runbooks based on learnings

**Scenarios to Practice**:
- Frontend deployment failure → Rollback
- Backend API down → Investigate logs, restart
- Database connection loss → Check Railway Postgres
- WebSocket disconnections → Check CORS, connection limits
- Authentication system down → Check JWT secrets

**Metrics to Track**:
- Time to detection: [X minutes]
- Time to triage: [X minutes]
- Time to mitigation: [X minutes]
- Time to resolution: [X minutes]
- Total incident duration: [X hours]

---

*Last Updated: 2025-11-19*
*Sprint 18 Phase 5 Task 5.2*
