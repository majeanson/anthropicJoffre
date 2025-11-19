# Sentry Alerts Configuration
**Sprint 18 Phase 1 Task 1.3**

This document describes the Sentry alert configuration for production monitoring and incident response.

---

## Overview

Sentry is configured for real-time error tracking and performance monitoring. Alerts are configured to notify the team of critical issues before they impact users.

**Current Status**: ✅ Sentry SDK integrated (backend + frontend)
**Alert Status**: ⚠️ Alerts need configuration (Task 1.3)

---

## Alert Rules Configuration

### 1. High Error Rate Alert
**Purpose**: Detect sudden spikes in application errors

**Trigger Conditions**:
- Error rate > 10 errors/minute for 5 consecutive minutes
- OR error rate increases by 50% compared to baseline

**Alert Actions**:
- Send email to: `YOUR_EMAIL@example.com`
- Severity: **Critical**
- Notification delay: Immediate

**Configuration Steps**:
1. Log in to [Sentry Dashboard](https://sentry.io)
2. Navigate to **Alerts** → **Create Alert Rule**
3. Select environment: **Production**
4. Set condition: `Number of Errors` > 50 in `5 minutes`
5. Add action: `Send email to YOUR_EMAIL@example.com`
6. Save rule: "High Error Rate - Production"

**Expected Response**:
- Investigate error logs within 15 minutes
- Check Sentry issue details for stack traces
- Deploy hotfix if critical user-facing bug
- Post-mortem if error affects > 10% of users

---

### 2. New Error Type Alert
**Purpose**: Catch new bugs introduced in deployments

**Trigger Conditions**:
- New error type appears (not seen in last 7 days)
- First seen after latest deployment

**Alert Actions**:
- Send email to: `YOUR_EMAIL@example.com`
- Severity: **High**
- Notification delay: 5 minutes

**Configuration Steps**:
1. Navigate to **Alerts** → **Create Alert Rule**
2. Select condition: `A new issue is created`
3. Filter: `Environment: production`
4. Add action: `Send email`
5. Save rule: "New Issue Detected - Production"

**Expected Response**:
- Review error within 30 minutes
- Determine if rollback needed
- Create GitHub issue if not urgent
- Fix in next release if low priority

---

### 3. Performance Degradation Alert
**Purpose**: Detect slow responses before users complain

**Trigger Conditions**:
- p95 response time > 2 seconds for 10 consecutive minutes
- OR p95 increases by 100% compared to last hour

**Alert Actions**:
- Send email to: `YOUR_EMAIL@example.com`
- Severity: **Medium**
- Notification delay: 15 minutes

**Configuration Steps**:
1. Navigate to **Performance** → **Alerts**
2. Create metric alert: `p95(transaction.duration)` > 2000ms
3. Time window: 10 minutes
4. Environment: Production
5. Add action: Send email
6. Save rule: "Performance Degradation - p95 > 2s"

**Expected Response**:
- Check server resources (CPU, memory, database)
- Review slow query logs
- Scale infrastructure if needed
- Investigate code changes in last deployment

---

### 4. Authentication Failure Spike
**Purpose**: Detect potential security incidents or system issues

**Trigger Conditions**:
- > 20 authentication failures in 5 minutes
- From same IP: potential brute force attack
- From many IPs: potential system issue

**Alert Actions**:
- Send email to: `YOUR_EMAIL@example.com`
- Severity: **High**
- Notification delay: Immediate

**Configuration Steps**:
1. Create custom metric alert
2. Filter: `event.message contains "Login failed" OR "Invalid credentials"`
3. Condition: Count > 20 in 5 minutes
4. Environment: Production
5. Add action: Send email
6. Save rule: "Auth Failure Spike"

**Expected Response**:
- Check if legitimate traffic spike or attack
- Review IP addresses in Sentry traces
- Enable rate limiting if brute force
- Check auth system health if system issue

---

### 5. Database Connection Errors
**Purpose**: Detect database outages immediately

**Trigger Conditions**:
- Any error containing "database" or "connection pool"
- Error rate > 5/minute

**Alert Actions**:
- Send email to: `YOUR_EMAIL@example.com`
- Severity: **Critical**
- Notification delay: Immediate

**Configuration Steps**:
1. Create issue alert
2. Filter: `error.value contains "database" OR "ECONNREFUSED" OR "connection pool"`
3. Condition: First seen OR count > 5 in 1 minute
4. Environment: Production
5. Add action: Send email
6. Save rule: "Database Connection Errors"

**Expected Response**:
- Check Railway database status immediately
- Check connection pool configuration
- Restart backend if connection pool exhausted
- Scale database if resource limits reached

---

### 6. Refresh Token Theft Detection
**Purpose**: Security alert for suspicious token usage

**Trigger Conditions**:
- Error message contains "TOKEN_THEFT_DETECTED"
- Any occurrence triggers alert

**Alert Actions**:
- Send email to: `YOUR_EMAIL@example.com`
- Severity: **Critical - Security**
- Notification delay: Immediate

**Configuration Steps**:
1. Create issue alert
2. Filter: `error.value contains "TOKEN_THEFT_DETECTED"`
3. Condition: First seen
4. Environment: Production
5. Add action: Send email with "SECURITY" prefix
6. Save rule: "Token Theft Detection - SECURITY"

**Expected Response**:
- Investigate user account immediately
- Review recent login history for affected user
- Check for suspicious IP addresses
- Consider temporary account suspension if needed
- Document incident for security audit

---

## Email Configuration

**Primary Alert Email**: `YOUR_EMAIL@example.com` (Update this!)

**Email Template** (configure in Sentry):
```
Subject: [Sentry] {{ rule.name }} - {{ project.name }}

Alert: {{ rule.name }}
Environment: {{ event.environment }}
Error Count: {{ count }}
Time: {{ event.datetime }}

Issue: {{ event.title }}
{{ event.web_url }}

Stack Trace:
{{ event.exception }}

Recent Logs:
{{ event.breadcrumbs }}

---
Sentry Alert for {{ project.name }}
Configure alerts: https://sentry.io/settings/YOUR_ORG/alerts/
```

---

## Slack Integration (Optional)

For faster team notifications, configure Slack integration:

### Setup Steps:
1. In Sentry: **Settings** → **Integrations** → **Slack**
2. Click **Add Workspace**
3. Authorize Sentry app in Slack
4. Create channel: `#prod-alerts`
5. Update all alert rules to send to Slack channel

### Slack Message Format:
```
🚨 **Critical Alert**: High Error Rate
📊 Environment: Production
⚠️ 50 errors in last 5 minutes
🔗 View in Sentry: [Link]
```

---

## Alert Testing

Before going live, test all alerts:

### Test Procedure:
```bash
# 1. Trigger a test error in production
curl -X POST https://your-api.com/api/test/sentry-error \
  -H "X-Test-Alert: true"

# 2. Verify alert received within expected delay

# 3. Check email inbox for alert

# 4. Verify Sentry dashboard shows the error

# 5. Mark test issue as resolved in Sentry
```

### Test Checklist:
- [ ] High error rate alert received
- [ ] New issue alert received
- [ ] Performance alert received (trigger slow endpoint)
- [ ] Auth failure alert received (trigger failed logins)
- [ ] Database error alert received (simulate connection failure)
- [ ] Security alert received (trigger token theft detection)

---

## Alert Tuning

After going live, monitor alert frequency and adjust thresholds:

### Week 1-2: Learning Phase
- Keep all alerts enabled
- Track false positive rate
- Document normal traffic patterns
- Note peak usage times

### Week 3-4: Tuning Phase
- Increase thresholds if too many false positives
- Decrease thresholds if missing real issues
- Add filters to reduce noise
- Adjust time windows based on traffic patterns

### Ongoing:
- Review alerts monthly
- Remove alerts that never fire
- Add new alerts based on incidents
- Update email list as team changes

---

## Alert Response Procedures

### Severity Levels:

**Critical (Respond immediately)**:
- Production down
- Database unavailable
- Security incident
- Error rate > 50/min

**High (Respond within 30 min)**:
- New error type after deployment
- Auth system degraded
- Performance 2x slower

**Medium (Respond within 2 hours)**:
- Slow queries
- Non-critical errors
- Performance 50% slower

**Low (Respond next business day)**:
- Intermittent errors < 5/hour
- Minor performance degradation

---

## Monitoring Dashboard

Create Sentry dashboard with key metrics:

### Widgets to Add:
1. **Error Rate** (last 24 hours)
2. **p95 Response Time** (last 24 hours)
3. **Top 10 Errors** (last 7 days)
4. **Error Rate by Endpoint** (last 24 hours)
5. **User Impact** (affected users count)
6. **Release Health** (error rate by version)

**Dashboard URL**: `https://sentry.io/organizations/YOUR_ORG/dashboard/`

---

## Maintenance

### Weekly:
- [ ] Review resolved issues
- [ ] Update ignore list for known issues
- [ ] Check alert email delivery

### Monthly:
- [ ] Review alert thresholds
- [ ] Archive old issues (> 90 days)
- [ ] Update team member email list
- [ ] Test backup notification channels

### Quarterly:
- [ ] Review alert response times
- [ ] Update incident response procedures
- [ ] Train new team members on alerts
- [ ] Audit security-related alerts

---

## Cost Management

**Current Plan**: Free tier (5,000 errors/month)

**Upgrade Triggers**:
- Consistently hitting 80% of error quota
- Need longer data retention (> 30 days)
- Want advanced features (custom metrics, SAML SSO)

**Paid Plans**:
- **Team**: $26/month (50,000 errors)
- **Business**: $80/month (500,000 errors)

**Cost Optimization**:
- Filter out non-actionable errors
- Sample high-volume low-priority errors
- Use error grouping to reduce unique issues

---

## Quick Reference

**Sentry Dashboard**: `https://sentry.io`
**Documentation**: `https://docs.sentry.io/product/alerts/`
**Support**: `support@sentry.io`

**Emergency Contacts**:
- Primary: `YOUR_EMAIL@example.com`
- Secondary: `TEAM_EMAIL@example.com`
- On-call: `ONCALL_EMAIL@example.com`

---

*Last Updated: 2025-11-18*
*Sprint 18 Phase 1 Task 1.3*
*Status: Documentation Complete - Configuration Pending*
