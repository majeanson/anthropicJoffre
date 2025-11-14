# Sentry Alerts Configuration Guide

**Date**: 2025-11-14
**Status**: ✅ Ready to configure
**Platform**: Sentry.io - Error tracking and performance monitoring

---

## 🎯 Overview

Sentry is already integrated in both frontend and backend for error tracking. This guide covers setting up **proactive alerts** to catch critical issues before they impact users.

**What's Already Done**:
- ✅ Sentry SDK installed (frontend + backend)
- ✅ Error tracking active
- ✅ Performance monitoring enabled (100% transaction sampling)
- ✅ Environment variables configured (SENTRY_DSN)

**What's Missing**:
- ⚠️ Alert rules configuration
- ⚠️ Team notifications (email, Slack, PagerDuty)
- ⚠️ Error thresholds and priorities

---

## 🚀 Quick Setup (10 Minutes)

### Step 1: Access Sentry Dashboard

1. Go to https://sentry.io/login
2. Navigate to your project (or create one)
3. Go to **Alerts** → **Create Alert Rule**

### Step 2: Configure Basic Alert Rules

We'll set up 4 essential alerts for production:

1. **High Error Rate** - Catch sudden spikes in errors
2. **New Error Types** - Get notified of new bugs
3. **Performance Degradation** - Detect slow API responses
4. **Database Issues** - Monitor database connection errors

---

## 📋 Recommended Alert Rules

### Alert 1: High Error Rate (Critical)

**Purpose**: Detect sudden error spikes that could indicate a production issue.

**Configuration**:
```yaml
Alert Name: "🚨 High Error Rate - Production"
Environment: production
Conditions:
  - Error count > 50 in 10 minutes
  - Frequency: per hour
Actions:
  - Send email to: engineering@team.com
  - Send Slack message to: #alerts
  - Priority: High
```

**Sentry UI Steps**:
1. Alerts → Create Alert → **Issues**
2. Set conditions:
   - "When an event is seen"
   - Environment: `production`
   - Events: `50` in `10 minutes`
3. Actions:
   - Email: Your team
   - Integration: Slack (#alerts channel)
4. Save

---

### Alert 2: New Unique Errors (High Priority)

**Purpose**: Get notified immediately when a new type of error appears.

**Configuration**:
```yaml
Alert Name: "🆕 New Error Type Detected"
Environment: production
Conditions:
  - First seen error (new fingerprint)
  - Ignore errors with <5 users affected
Actions:
  - Send email to: engineering@team.com
  - Send Slack message to: #errors
  - Priority: Medium
```

**Sentry UI Steps**:
1. Alerts → Create Alert → **Issues**
2. Set conditions:
   - "When an issue is first seen"
   - Environment: `production`
   - Users affected: `>= 5`
3. Actions:
   - Email: Your team
   - Slack: #errors channel
4. Save

---

### Alert 3: Performance Degradation (Medium Priority)

**Purpose**: Detect when API response times degrade significantly.

**Configuration**:
```yaml
Alert Name: "⚠️ Slow API Performance"
Environment: production
Conditions:
  - Transaction duration p95 > 3000ms
  - For at least 5 minutes
Actions:
  - Send email to: engineering@team.com
  - Priority: Medium
```

**Sentry UI Steps**:
1. Alerts → Create Alert → **Metric**
2. Set conditions:
   - Metric: `transaction.duration`
   - Aggregation: `p95`
   - Threshold: `> 3000` (ms)
   - Time window: `5 minutes`
   - Environment: `production`
3. Actions:
   - Email: Your team
4. Save

---

### Alert 4: Database Connection Errors (Critical)

**Purpose**: Immediately alert on database connectivity issues.

**Configuration**:
```yaml
Alert Name: "🔴 Database Connection Failures"
Environment: production
Conditions:
  - Error message contains: "database connection"
  - OR Error message contains: "ECONNREFUSED"
  - Count > 10 in 5 minutes
Actions:
  - Send email to: engineering@team.com, ops@team.com
  - Send PagerDuty alert (if configured)
  - Priority: Critical
```

**Sentry UI Steps**:
1. Alerts → Create Alert → **Issues**
2. Set filters:
   - Message: `database connection` OR `ECONNREFUSED`
   - Environment: `production`
   - Events: `10` in `5 minutes`
3. Actions:
   - Email: Engineering + Ops teams
   - PagerDuty (optional)
4. Save

---

### Alert 5: Memory Leak Detection (Low Priority)

**Purpose**: Detect potential memory leaks before they crash the server.

**Configuration**:
```yaml
Alert Name: "💾 High Memory Usage"
Environment: production
Conditions:
  - Custom metric: heap_used > 450MB
  - For at least 10 minutes
Actions:
  - Send email to: engineering@team.com
  - Priority: Low
```

**Note**: Requires custom instrumentation (see "Custom Metrics" section below)

---

## 🔔 Notification Channels

### Email Notifications (Free)
**Setup**:
1. Sentry → Settings → Teams → Your Team
2. Add team member emails
3. Configure notification preferences per member

**Recommended for**:
- All engineers during business hours
- On-call rotation outside business hours

---

### Slack Integration (Recommended)
**Setup**:
1. Sentry → Settings → Integrations → Slack
2. Click "Add to Slack"
3. Authorize Sentry
4. Configure channels:
   - `#alerts` - Critical errors only
   - `#errors` - All errors
   - `#performance` - Performance alerts

**Recommended channels**:
```
#alerts          - Critical alerts only (high error rate, database failures)
#errors          - New error types, regression alerts
#performance     - Performance degradation, slow queries
#releases        - Deployment tracking (optional)
```

**Slack Alert Format**:
```
🚨 High Error Rate - Production
50 errors in 10 minutes
Environment: production
Project: jaffre-backend

View in Sentry: https://sentry.io/issues/12345
```

---

### PagerDuty Integration (Optional, for 24/7 on-call)
**Setup**:
1. Create PagerDuty account
2. Sentry → Settings → Integrations → PagerDuty
3. Configure escalation policies

**When to use**:
- You have paying customers
- 24/7 uptime is critical
- Multi-person on-call rotation

**Cost**: $19/user/month

---

## 🎨 Advanced Alert Patterns

### Alert Grouping (Reduce Noise)
```yaml
# Group similar errors together
Alert Name: "Database Errors"
Conditions:
  - Error message matches pattern: "database|ECONNREFUSED|query failed"
  - Count > 20 in 10 minutes
Grouping: By error type
Actions:
  - Send ONE consolidated Slack message
```

### Alert Deduplication
```yaml
# Don't spam the same alert
Alert Name: "High Error Rate"
Conditions:
  - Error count > 50 in 10 minutes
Frequency: Once per hour (max)
Cooldown: 30 minutes
```

### Environment-Specific Alerts
```yaml
# Different thresholds for different environments
Production:
  Error threshold: >10 in 5 min (send immediately)

Staging:
  Error threshold: >50 in 10 min (send once per hour)

Development:
  No alerts (errors expected during dev)
```

---

## 📊 Custom Metrics & Instrumentation

To enable advanced alerts, add custom metrics to your backend:

### Memory Usage Tracking
```typescript
// backend/src/index.ts
import * as Sentry from '@sentry/node';

// Track memory usage every minute
setInterval(() => {
  const mem = process.memoryUsage();

  Sentry.captureMessage('Memory Usage', {
    level: 'info',
    tags: {
      metric_type: 'memory',
    },
    extra: {
      heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: (mem.heapTotal / 1024 / 1024).toFixed(2),
      rss_mb: (mem.rss / 1024 / 1024).toFixed(2),
    },
  });

  // Alert if heap usage exceeds 450MB
  if (mem.heapUsed / 1024 / 1024 > 450) {
    Sentry.captureException(new Error('High memory usage detected'), {
      level: 'warning',
      tags: { alert_type: 'memory_leak' },
      extra: { heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(2) },
    });
  }
}, 60000); // Every minute
```

### Active Games Tracking
```typescript
// Track concurrent games (useful for capacity planning)
export function trackActiveGames(games: Map<string, GameState>) {
  const activeCount = Array.from(games.values()).filter(
    g => g.currentPhase !== 'game_over'
  ).length;

  if (activeCount > 80) {
    Sentry.captureMessage('High concurrent game count', {
      level: 'warning',
      tags: { alert_type: 'capacity' },
      extra: { active_games: activeCount, total_games: games.size },
    });
  }
}
```

### WebSocket Connection Monitoring
```typescript
// Track WebSocket health
io.on('connection', (socket) => {
  const connectedSockets = io.sockets.sockets.size;

  // Alert if connections exceed expected capacity
  if (connectedSockets > 400) {
    Sentry.captureMessage('High WebSocket connection count', {
      level: 'warning',
      tags: { alert_type: 'websocket_capacity' },
      extra: { connected_sockets: connectedSockets },
    });
  }
});
```

---

## 🧪 Testing Alerts

### Trigger a Test Alert
```typescript
// In backend code (temporary)
import * as Sentry from '@sentry/node';

// Trigger test error
Sentry.captureException(new Error('Test alert - please ignore'), {
  level: 'error',
  tags: {
    test: true,
    alert_type: 'test',
  },
});

// Trigger test warning
Sentry.captureMessage('Test warning - performance degradation', {
  level: 'warning',
  tags: {
    test: true,
    metric: 'response_time',
  },
  extra: {
    duration_ms: 5000,
  },
});
```

**Steps**:
1. Deploy code with test alerts
2. Trigger the test (create a game, join, etc.)
3. Check if alerts fire correctly
4. Verify email/Slack notifications received
5. Remove test alerts from code

---

## 📈 Alert Dashboard (Monitoring Alert Health)

### Metrics to Track
```
1. Alert volume per day (should be <10/day for production)
2. False positive rate (aim for <20%)
3. Time to acknowledge (should be <5 minutes)
4. Time to resolution (should be <30 minutes for critical)
```

### Sentry Stats Dashboard
```
Sentry → Stats → Issues
- Filter by: Environment, Time Range
- View: Error frequency, affected users, releases

Sentry → Performance
- View: Transaction duration, throughput, error rate
- Filter by: Endpoint, Environment
```

---

## ✅ Production Checklist

### Initial Setup
- [ ] Sentry account configured
- [ ] SENTRY_DSN environment variable set (frontend + backend)
- [ ] Error tracking verified (trigger test error)
- [ ] Performance monitoring enabled

### Alert Configuration
- [ ] High error rate alert created
- [ ] New error type alert created
- [ ] Performance degradation alert created
- [ ] Database connection alert created
- [ ] Alert notifications tested

### Team Setup
- [ ] Team members added to Sentry
- [ ] Email notifications configured
- [ ] Slack integration configured
- [ ] On-call rotation defined (optional)

### Advanced
- [ ] Custom metrics instrumented
- [ ] Alert grouping configured
- [ ] Deduplication rules set
- [ ] Environment-specific thresholds defined

---

## 🔍 Troubleshooting

### Alert Not Firing
```
1. Check Sentry → Alerts → Your Alert → Activity
2. Verify conditions match recent errors
3. Test with a manual error:
   Sentry.captureException(new Error('Test'))
4. Check notification settings (email/Slack)
```

### Too Many Alerts (Alert Fatigue)
```
Solutions:
1. Increase thresholds (e.g., 50 → 100 errors)
2. Add cooldown period (e.g., once per hour)
3. Group similar errors
4. Filter out known non-critical errors
5. Use "regressed" alerts instead of "all" errors
```

### Slack Integration Not Working
```
1. Sentry → Settings → Integrations → Slack → Reinstall
2. Verify channel permissions (#alerts must be public or invite Sentry bot)
3. Test with manual alert
4. Check Slack workspace admin settings
```

---

## 📚 Best Practices

### DO ✅
- Start with conservative thresholds (high error count)
- Use different Slack channels for different priorities
- Test alerts before going live
- Review alert volume weekly (adjust thresholds)
- Document on-call escalation procedures

### DON'T ❌
- Alert on every single error (causes alert fatigue)
- Send critical alerts to personal email only (use teams)
- Ignore performance degradation warnings
- Set thresholds too low (5 errors → 50 errors)
- Forget to test alerts after configuration

---

## 🎯 Success Metrics

### Good Alert System
```
- <10 alerts per day (production)
- >80% of alerts are actionable
- <5 minutes to acknowledge
- <30 minutes to resolve critical issues
- 0 missed critical alerts
```

### Bad Alert System
```
- >50 alerts per day (alert fatigue)
- <50% of alerts are actionable (false positives)
- >30 minutes to acknowledge
- Engineers ignore alerts
- Critical issues discovered by users, not alerts
```

---

## 📞 Support & Resources

- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Sentry Slack Integration](https://docs.sentry.io/product/integrations/slack/)
- [Sentry PagerDuty Integration](https://docs.sentry.io/product/integrations/pagerduty/)
- [Alert Best Practices](https://docs.sentry.io/product/alerts/best-practices/)

---

*Last Updated: 2025-11-14*
*Estimated Setup Time: 15-30 minutes*
*Recommended Review Frequency: Weekly (first month), Monthly (after stabilization)*
