# Disaster Recovery Plan - Jaffre Card Game

**Last Updated**: 2025-11-14
**Version**: 1.0.0
**Owner**: Development Team

---

## 🚨 Emergency Contacts

### Service Providers
- **Frontend (Vercel)**: https://vercel.com/majeansons-projects/anthropic-joffre
- **Backend (Railway)**: https://railway.app/project/b33d63ae-9286-4a4a-9480-f4d7f6e816de
- **Database (Vercel Postgres)**: Managed via Vercel dashboard
- **Monitoring (Sentry)**: Error tracking and alerts

### Incident Response Team
- **Primary**: Development Team Lead
- **Secondary**: DevOps Engineer (if applicable)
- **Escalation**: Railway Support, Vercel Support

---

## 📋 Table of Contents

1. [Critical Systems Overview](#critical-systems-overview)
2. [Backup & Restore Procedures](#backup--restore-procedures)
3. [Service Outage Scenarios](#service-outage-scenarios)
4. [Database Disaster Recovery](#database-disaster-recovery)
5. [Rollback Procedures](#rollback-procedures)
6. [Security Incidents](#security-incidents)
7. [Post-Incident Review](#post-incident-review)

---

## 🏗️ Critical Systems Overview

### Production Architecture

```
┌─────────────────────────────────────────────────┐
│                   Users                         │
└───────────────┬─────────────────────────────────┘
                │
      ┌─────────┴─────────┐
      │                   │
      ▼                   ▼
┌──────────┐        ┌──────────┐
│ Vercel   │        │ Railway  │
│ Frontend │◄──────►│ Backend  │
│          │        │          │
└──────────┘        └────┬─────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Vercel       │
                  │ Postgres DB  │
                  └──────────────┘
```

### Service Dependencies

| Service | Hosting | Dependencies | RPO* | RTO** |
|---------|---------|--------------|------|-------|
| Frontend | Vercel | CDN, DNS | 0 hours | 5 min |
| Backend | Railway | Database, ENV vars | 0 hours | 15 min |
| Database | Vercel Postgres | None | 24 hours | 1 hour |
| Monitoring | Sentry | Backend events | N/A | N/A |

*RPO = Recovery Point Objective (max data loss)
**RTO = Recovery Time Objective (max downtime)

---

## 💾 Backup & Restore Procedures

### Database Backups

#### Automated Backups (Vercel Postgres)
- **Frequency**: Daily automated backups
- **Retention**: 7 days (free tier) or 30 days (paid tier)
- **Location**: Vercel's managed storage
- **Verification**: Weekly backup restore test recommended

#### Manual Backup Procedure

```bash
# 1. Export database to SQL dump
# Access Vercel Postgres dashboard:
# https://vercel.com/majeansons-projects/anthropic-joffre/stores

# 2. Use Vercel CLI to create backup
vercel env pull .env.backup
npx pg_dump $POSTGRES_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 3. Upload backup to secure storage (GitHub, S3, etc.)
git add backup-*.sql
git commit -m "chore: Database backup $(date +%Y-%m-%d)"
git push origin backup-branch
```

#### Restore from Backup

```bash
# 1. Download backup file
git checkout backup-branch
git pull origin backup-branch

# 2. Restore to database
npx psql $POSTGRES_URL < backup-YYYYMMDD-HHMMSS.sql

# 3. Verify data integrity
npx psql $POSTGRES_URL -c "SELECT COUNT(*) FROM users;"
npx psql $POSTGRES_URL -c "SELECT COUNT(*) FROM games;"
npx psql $POSTGRES_URL -c "SELECT COUNT(*) FROM player_stats;"

# 4. Test critical functionality
npm run test:backend
npm run test:e2e -- 01-lobby.spec.ts
```

### Code Repository Backups

- **Primary**: GitHub (https://github.com/majeanson/anthropicJoffre)
- **Frequency**: Real-time (every commit)
- **Retention**: Unlimited
- **Mirroring**: Consider GitLab or Bitbucket mirror for redundancy

---

## 🔥 Service Outage Scenarios

### Scenario 1: Frontend Down (Vercel Outage)

**Detection**:
- Users report "Cannot load website"
- Vercel status page shows incident
- Sentry shows spike in errors

**Immediate Actions**:
1. Check Vercel status: https://www.vercel-status.com/
2. Verify DNS resolution: `nslookup jaffre.vercel.app`
3. Check deployment logs in Vercel dashboard

**Recovery Steps**:
```bash
# If deployment failed, rollback to previous version
vercel rollback --yes

# Or redeploy latest working commit
vercel deploy --prod

# Verify recovery
curl -I https://jaffre.vercel.app/
```

**Expected RTO**: 5-10 minutes

---

### Scenario 2: Backend Down (Railway Outage)

**Detection**:
- Frontend shows "Cannot connect to server"
- Socket.IO connections failing
- Sentry shows "ECONNREFUSED" errors

**Immediate Actions**:
1. Check Railway status dashboard
2. Verify backend deployment: https://railway.app/project/b33d63ae-9286-4a4a-9480-f4d7f6e816de
3. Check logs for errors

**Recovery Steps**:
```bash
# 1. Check Railway logs
railway logs --tail 100

# 2. If crashed, restart service
railway up

# 3. If deployment failed, rollback
railway rollback

# 4. Verify backend is up
curl https://anthropicjoffre-production.up.railway.app/api/health
```

**Expected RTO**: 15-30 minutes

---

### Scenario 3: Database Connection Lost

**Detection**:
- Backend throws "ECONNREFUSED" or "Connection timeout" errors
- Sentry shows database query failures
- Users cannot save game state

**Immediate Actions**:
1. Check Vercel Postgres dashboard
2. Verify connection string: `echo $POSTGRES_URL` (redact before sharing)
3. Test connection: `npx psql $POSTGRES_URL -c "SELECT 1;"`

**Recovery Steps**:
```bash
# 1. Verify environment variables
vercel env pull .env.production
cat .env.production | grep POSTGRES_URL

# 2. Test database connection
npm run db:verify

# 3. If connection pool exhausted, restart backend
railway restart

# 4. If database is down, check Vercel status
# https://www.vercel-status.com/

# 5. As last resort, restore from backup (see above)
```

**Expected RTO**: 1-2 hours (if restore needed)

---

### Scenario 4: Full Platform Outage (All Services Down)

**Detection**:
- Website unreachable
- Backend unreachable
- Database unreachable

**Immediate Actions**:
1. Verify internet connection
2. Check all service status pages
3. Notify users via social media/Discord/email

**Recovery Steps**:
1. **Triage**: Identify which services are down
2. **Communicate**: Post status update on GitHub README
3. **Escalate**: Contact Railway and Vercel support
4. **Temporary Fallback**: Deploy static maintenance page

```html
<!-- Temporary maintenance page -->
<!DOCTYPE html>
<html>
<head>
  <title>Jaffre - Maintenance</title>
</head>
<body>
  <h1>🔧 Scheduled Maintenance</h1>
  <p>We're currently performing emergency maintenance.</p>
  <p>Expected recovery: [ETA]</p>
  <p>Follow updates: [Status Page URL]</p>
</body>
</html>
```

**Expected RTO**: 2-4 hours (worst case)

---

## 💣 Database Disaster Recovery

### Scenario: Data Corruption

**Detection**:
- Users report incorrect game scores
- Leaderboard shows duplicate entries
- Database integrity check fails

**Recovery Steps**:

```bash
# 1. Immediately take database offline (prevent further corruption)
# Set maintenance mode in backend:
railway env set MAINTENANCE_MODE=true

# 2. Export current state (even if corrupted)
npx pg_dump $POSTGRES_URL > corrupted-$(date +%Y%m%d-%H%M%S).sql

# 3. Restore from latest known-good backup
npx psql $POSTGRES_URL < backup-YYYYMMDD-HHMMSS.sql

# 4. Run integrity checks
npx psql $POSTGRES_URL -c "
  SELECT tablename, COUNT(*)
  FROM pg_tables
  WHERE schemaname = 'public'
  GROUP BY tablename;
"

# 5. Verify critical tables
npm run db:verify

# 6. Re-enable service
railway env set MAINTENANCE_MODE=false

# 7. Monitor for anomalies
tail -f logs/backend.log
```

### Scenario: Accidental Data Deletion

**Detection**:
- User reports "All my stats are gone"
- Admin notices missing records
- Automated monitoring detects row count drop

**Recovery Steps**:

```bash
# 1. Identify deletion timestamp
npx psql $POSTGRES_URL -c "
  SELECT MAX(created_at) FROM games;
  SELECT MAX(created_at) FROM users;
  SELECT MAX(created_at) FROM player_stats;
"

# 2. Find backup closest to deletion time
ls -lh backup-*.sql

# 3. Restore to temporary database
npx psql $TEMP_DB_URL < backup-YYYYMMDD-HHMMSS.sql

# 4. Export only missing records
npx psql $TEMP_DB_URL -c "
  COPY (SELECT * FROM users WHERE created_at > '2025-11-14')
  TO '/tmp/missing-users.csv' CSV HEADER;
"

# 5. Import to production
npx psql $POSTGRES_URL -c "
  COPY users FROM '/tmp/missing-users.csv' CSV HEADER;
"

# 6. Verify recovery
npx psql $POSTGRES_URL -c "SELECT COUNT(*) FROM users;"
```

---

## ⏮️ Rollback Procedures

### Frontend Rollback (Vercel)

```bash
# 1. List recent deployments
vercel ls

# 2. Find last working deployment ID
vercel inspect <deployment-id>

# 3. Promote to production
vercel promote <deployment-id> --yes

# 4. Verify rollback
curl https://jaffre.vercel.app/ | grep "version"
```

### Backend Rollback (Railway)

```bash
# 1. View deployment history
railway deployments

# 2. Rollback to previous version
railway rollback --deployment <deployment-id>

# 3. Verify rollback
curl https://anthropicjoffre-production.up.railway.app/api/health
```

### Database Schema Rollback

```bash
# 1. Identify problematic migration
ls -lh backend/src/db/migrations/

# 2. Create rollback migration
cat > backend/src/db/migrations/999_rollback_migration_XXX.sql <<EOF
-- Rollback migration XXX
DROP TABLE IF EXISTS new_table;
ALTER TABLE existing_table DROP COLUMN new_column;
EOF

# 3. Apply rollback
npm run db:migrate

# 4. Verify schema
npx psql $POSTGRES_URL -c "\d"
```

---

## 🔒 Security Incidents

### Scenario: Suspected Data Breach

**Immediate Actions (First 15 Minutes)**:
1. **Isolate**: Take affected service offline
2. **Preserve**: Create forensic backup
3. **Assess**: Determine breach scope
4. **Notify**: Alert security team and stakeholders

**Investigation Steps**:
```bash
# 1. Check recent database access
npx psql $POSTGRES_URL -c "
  SELECT usename, client_addr, query_start, query
  FROM pg_stat_activity
  ORDER BY query_start DESC
  LIMIT 50;
"

# 2. Review backend logs for suspicious activity
railway logs --tail 1000 | grep "ERROR\|WARN\|401\|403\|500"

# 3. Check Sentry for unusual error patterns
# Visit: https://sentry.io/organizations/[org]/issues/

# 4. Verify environment variables not exposed
grep -r "POSTGRES_URL\|JWT_SECRET" .

# 5. Rotate all credentials
vercel env rm POSTGRES_URL
vercel env add POSTGRES_URL
railway env set JWT_SECRET=<new-secret>
```

**Remediation**:
1. Force logout all users (invalidate JWT tokens)
2. Reset passwords for affected accounts
3. Patch security vulnerability
4. Deploy updated code
5. Monitor for continued suspicious activity

### Scenario: DDoS Attack

**Detection**:
- Sudden spike in traffic
- Legitimate users cannot connect
- Railway shows high CPU/memory usage

**Mitigation**:
```bash
# 1. Enable Vercel DDoS protection (Enterprise feature)
# Contact Vercel support

# 2. Rate limit backend endpoints
# Already configured in backend/src/middleware/rateLimiter.ts

# 3. Block suspicious IPs at Railway level
# Use Railway's firewall rules

# 4. Temporarily enable maintenance mode
railway env set MAINTENANCE_MODE=true

# 5. Scale up backend resources
# Upgrade Railway plan or optimize code
```

---

## 📝 Post-Incident Review

### Incident Report Template

```markdown
# Incident Report: [Brief Title]

**Date**: YYYY-MM-DD
**Duration**: X hours Y minutes
**Severity**: Critical / High / Medium / Low
**Impact**: X users affected, Y% uptime lost

## Summary
[1-2 sentence description]

## Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service restored
- HH:MM - Incident closed

## Root Cause
[Technical explanation]

## Resolution
[What was done to fix it]

## Action Items
- [ ] Prevent recurrence: [specific task]
- [ ] Improve monitoring: [specific task]
- [ ] Update documentation: [specific task]
- [ ] Post-mortem review: [date]

## Lessons Learned
[What we learned]
```

---

## 🧪 Testing Disaster Recovery

### Quarterly DR Drill Checklist

- [ ] **Database Restore**: Restore from 7-day-old backup to staging
- [ ] **Frontend Rollback**: Rollback Vercel deployment to previous version
- [ ] **Backend Rollback**: Rollback Railway deployment to previous version
- [ ] **Load Testing**: Run load tests to verify capacity
- [ ] **Monitoring**: Verify Sentry alerts work
- [ ] **Documentation**: Update this document with lessons learned

### Automated Health Checks

```bash
# Add to CI/CD pipeline
#!/bin/bash

echo "🏥 Health Check - Production Services"

# 1. Frontend
FRONTEND_STATUS=$(curl -o /dev/null -s -w "%{http_code}" https://jaffre.vercel.app/)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✓ Frontend: OK"
else
  echo "✗ Frontend: FAILED ($FRONTEND_STATUS)"
  exit 1
fi

# 2. Backend
BACKEND_STATUS=$(curl -o /dev/null -s -w "%{http_code}" https://anthropicjoffre-production.up.railway.app/api/health)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✓ Backend: OK"
else
  echo "✗ Backend: FAILED ($BACKEND_STATUS)"
  exit 1
fi

# 3. Database
if npx psql $POSTGRES_URL -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Database: OK"
else
  echo "✗ Database: FAILED"
  exit 1
fi

echo "✅ All systems operational"
```

---

## 📞 Escalation Paths

### Level 1: Development Team (0-15 minutes)
- Check service dashboards
- Review logs and Sentry
- Apply known fixes

### Level 2: Platform Support (15-60 minutes)
- Contact Railway support: https://railway.app/help
- Contact Vercel support: https://vercel.com/support
- Escalate to paid support if available

### Level 3: External Experts (60+ minutes)
- Database consultant for data recovery
- Security firm for breach investigation
- Legal counsel for compliance issues

---

## ✅ Preventive Measures

### Daily
- [x] Monitor Sentry for errors
- [x] Check Railway resource usage
- [x] Verify automated backups run

### Weekly
- [ ] Review database size and growth
- [ ] Check for security updates
- [ ] Test staging deployment

### Monthly
- [ ] Run load tests
- [ ] Review disaster recovery plan
- [ ] Update documentation

### Quarterly
- [ ] Perform full DR drill
- [ ] Review and update RTO/RPO targets
- [ ] Audit security measures

---

## 📚 Additional Resources

- **Railway Documentation**: https://docs.railway.app/
- **Vercel Documentation**: https://vercel.com/docs
- **PostgreSQL Backup Guide**: https://www.postgresql.org/docs/current/backup.html
- **Sentry Incident Management**: https://docs.sentry.io/
- **GitHub Repository**: https://github.com/majeanson/anthropicJoffre

---

*This disaster recovery plan should be reviewed and updated quarterly or after any major incident.*

*Last Reviewed: 2025-11-14*
*Next Review Due: 2026-02-14*
