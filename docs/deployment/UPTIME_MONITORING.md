# Uptime Monitoring Setup Guide

**Last Updated**: 2025-11-21 (v4.0.0)
**Recommended Tool**: UptimeRobot (Free Tier)
**Estimated Setup Time**: 15-20 minutes

---

## 🎯 Overview

This guide walks you through setting up comprehensive uptime monitoring for your production environment using **UptimeRobot** (free tier includes 50 monitors).

**What You'll Monitor**:
1. Frontend availability (Vercel)
2. Backend health check (Railway)
3. WebSocket connectivity (Railway)

**Alerts**:
- Email notifications
- Optional: SMS, Slack, Discord, Telegram

---

## 📦 Step 1: Create UptimeRobot Account

### Sign Up

1. Go to: https://uptimerobot.com/
2. Click **"Sign Up Free"**
3. Enter your email: `your-email@example.com`
4. Verify email address
5. Log in to dashboard

**Free Tier Limits**:
- ✅ 50 monitors
- ✅ 5-minute check intervals
- ✅ Unlimited alerts
- ✅ Email alerts included
- ✅ SMS alerts (limited)

---

## 📊 Step 2: Create Monitors

### Monitor 1: Frontend (Vercel)

**Purpose**: Ensure frontend is accessible to users

1. Click **"+ Add New Monitor"**
2. **Monitor Type**: HTTP(s)
3. **Friendly Name**: `Jaffre Frontend (Vercel)`
4. **URL**: `https://jaffre.vercel.app/`
5. **Monitoring Interval**: 5 minutes
6. **Monitor Timeout**: 30 seconds
7. **HTTP Method**: GET
8. **Expected Status Code**: 200

**Advanced Settings** (optional):
- **Keyword to Look For**: Leave empty (just check status code)
- **Custom HTTP Headers**: None needed
- **POST Value**: None

**Alert Contacts**: Select your email

**Click**: "Create Monitor"

✅ **Expected Result**: Green status, ~100-200ms response time

---

### Monitor 2: Backend Health Check (Railway)

**Purpose**: Ensure backend API is responding correctly

1. Click **"+ Add New Monitor"**
2. **Monitor Type**: HTTP(s)
3. **Friendly Name**: `Jaffre Backend Health (Railway)`
4. **URL**: `https://anthropicjoffre-production.up.railway.app/api/health`
5. **Monitoring Interval**: 5 minutes
6. **Monitor Timeout**: 30 seconds
7. **HTTP Method**: GET
8. **Expected Status Code**: 200

**Advanced Settings**:
- **Keyword to Look For**: `ok` (verify health check returns "ok")
- **Keyword Type**: Exists
- **Custom HTTP Headers**: None needed

**Alert Contacts**: Select your email

**Click**: "Create Monitor"

✅ **Expected Result**: Green status, ~200-400ms response time, keyword "ok" found

---

### Monitor 3: WebSocket Connectivity (Railway)

**Purpose**: Ensure WebSocket server is accepting connections

1. Click **"+ Add New Monitor"**
2. **Monitor Type**: Port
3. **Friendly Name**: `Jaffre WebSocket (Railway)`
4. **Hostname**: `anthropicjoffre-production.up.railway.app`
5. **Port**: 443 (HTTPS/WSS uses port 443)
6. **Monitoring Interval**: 5 minutes
7. **Monitor Timeout**: 30 seconds

**Alert Contacts**: Select your email

**Click**: "Create Monitor"

✅ **Expected Result**: Green status, port open and accepting connections

---

## 🔔 Step 3: Configure Alert Contacts

### Email Alerts (Default)

1. Go to **"My Settings"** → **"Alert Contacts"**
2. Your email should already be listed
3. Click **"Edit"** to configure:
   - **Email Address**: Your email
   - **Email Format**: HTML (easier to read)
   - **Alert When**: Down, Up (both)
4. Click **"Update Alert Contact"**

### Add SMS Alerts (Optional - Paid Feature)

1. Click **"+ Add Alert Contact"**
2. **Type**: SMS
3. **Phone Number**: +1-XXX-XXX-XXXX
4. **Alert When**: Down only (to save SMS credits)
5. Click **"Create Alert Contact"**

**Note**: UptimeRobot free tier includes 10 SMS/month

### Add Slack Alerts (Optional - Free)

1. Go to your Slack workspace
2. Create a channel: `#uptime-alerts`
3. Add Slack integration:
   - Workspace Settings → Apps → Browse App Directory
   - Search "Incoming WebHooks"
   - Click "Add to Slack"
   - Choose channel: `#uptime-alerts`
   - Copy **Webhook URL**

4. Back in UptimeRobot:
   - Click **"+ Add Alert Contact"**
   - **Type**: Web-Hook
   - **Webhook URL**: Paste Slack webhook URL
   - **POST Value**:
     ```json
     {"text":"*monitorFriendlyName* is *alertTypeFriendlyName* (monitorURL)"}
     ```
   - Click **"Create Alert Contact"**

---

## 📈 Step 4: Configure Notification Settings

### Alert Threshold

1. Go to **"My Settings"** → **"Notifications"**
2. Configure:
   - **Alert When Monitor is Down**: After 1 check (5 minutes)
   - **Alert When Monitor is Up**: Immediately
   - **Repeat Down Notifications**: Every 30 minutes (optional)
   - **Maintenance Windows**: None (or configure planned maintenance)

**Recommendation**: Alert after 1 check to avoid false positives from brief network hiccups.

---

## 🧪 Step 5: Test Alerts

### Test Monitor Alerts

1. Go to **"Dashboard"**
2. Find one of your monitors
3. Click **"Edit"**
4. Temporarily change URL to something invalid:
   - Example: `https://jaffre.vercel.app/nonexistent-test-page-404`
5. Click **"Save Changes"**
6. Wait 5 minutes for check to run
7. **Expected**: Receive down alert via email/SMS/Slack
8. Change URL back to correct value
9. Click **"Save Changes"**
10. Wait 5 minutes
11. **Expected**: Receive up alert

✅ **If you received both alerts**: Monitoring is working correctly!

---

## 📊 Step 6: Set Up Status Page (Optional)

### Public Status Page

UptimeRobot offers a free public status page showing your service uptime.

1. Go to **"Public Status Pages"**
2. Click **"+ Add New PSP"**
3. **Friendly Name**: `Jaffre Game Status`
4. **Custom Domain**: Leave empty (use UptimeRobot subdomain)
5. **Subdomain**: `jaffre` (example: https://jaffre.betteruptime.com)
6. **Select Monitors**: Check all 3 monitors
7. **Design**: Choose a theme
8. **Custom Logo**: Upload your logo (optional)
9. Click **"Create Status Page"**

**Status Page URL**: `https://stats.uptimerobot.com/xxxxx`

**Share With**:
- Team members
- Users (if public)
- Support tickets

---

## 🎯 Step 7: Dashboard Overview

### Monitor Status Dashboard

Your UptimeRobot dashboard now shows:

```
✅ Jaffre Frontend (Vercel)       99.9% uptime  | Last check: 2 min ago  | Response: 123ms
✅ Jaffre Backend Health (Railway) 99.8% uptime  | Last check: 1 min ago  | Response: 234ms
✅ Jaffre WebSocket (Railway)      99.9% uptime  | Last check: 3 min ago  | Port: Open
```

### Interpreting Status

**Green (Up)**:
- Service is responding
- Response time is acceptable
- No action needed

**Yellow (Warning)**:
- Response time > 1000ms
- Intermittent timeouts
- **Action**: Investigate performance

**Red (Down)**:
- Service not responding
- Timeout or connection refused
- **Action**: Immediate investigation (see Incident Response)

---

## 📈 Step 8: Set Up Reporting

### Email Reports (Weekly Summary)

1. Go to **"My Settings"** → **"Reports"**
2. Click **"+ Add New Report"**
3. **Report Name**: `Weekly Uptime Summary`
4. **Frequency**: Weekly (Monday morning)
5. **Recipients**: Your email
6. **Monitors**: Select all 3
7. **Include**:
   - ✅ Uptime percentage
   - ✅ Average response time
   - ✅ Downtime incidents
   - ✅ Response time graph
8. Click **"Create Report"**

**Report Contents**:
- 7-day uptime percentage
- Average/min/max response times
- Downtime events (if any)
- Response time graph

---

## 🔧 Advanced Configuration

### Response Time Alerts

**Purpose**: Get alerted if response time degrades (even if service is "up")

1. Edit a monitor (e.g., Backend Health)
2. Go to **"Advanced Settings"**
3. Enable **"Alert if Response Time"**:
   - **Greater Than**: 1000ms (1 second)
   - **For**: 3 consecutive checks (15 minutes)
4. Click **"Save Changes"**

**Use Case**: Detect performance degradation before users complain

### Maintenance Windows

**Purpose**: Disable alerts during planned maintenance

1. Go to **"Maintenance Windows"**
2. Click **"+ Add New MW"**
3. **Type**: Once or Recurring
4. **Date/Time**: Select maintenance window
5. **Duration**: 1-2 hours (typical)
6. **Monitors**: Select all or specific monitors
7. Click **"Create Maintenance Window"**

**Example**: Weekly database maintenance on Sundays at 2 AM

---

## 📊 Monitoring Best Practices

### Alert Fatigue Prevention

**Problem**: Too many alerts → Ignore important ones

**Solutions**:
1. **Alert Threshold**: After 2-3 checks (10-15 minutes) instead of immediately
2. **Maintenance Windows**: Schedule known maintenance
3. **Repeat Alerts**: Every 30-60 minutes (not every 5 minutes)
4. **SMS Alerts**: Only for critical services (frontend, backend)
5. **Slack Alerts**: Non-critical monitoring

### Uptime Goals

**Industry Standards**:
- **99.9% (Three Nines)**: ~43 minutes downtime/month
- **99.99% (Four Nines)**: ~4 minutes downtime/month

**Your Targets** (Realistic for MVP):
- **Frontend (Vercel)**: 99.9% (highly reliable CDN)
- **Backend (Railway)**: 99.5-99.9% (good for MVP)
- **Database**: 99.9% (Railway managed)

### Response Time Targets

**Good**:
- Frontend: < 200ms (CDN, should be fast)
- Backend API: < 300ms (acceptable)
- WebSocket: < 100ms (real-time requirement)

**Warning**:
- Frontend: 200-500ms (investigate CDN)
- Backend API: 300-1000ms (investigate performance)
- WebSocket: 100-500ms (may affect real-time experience)

**Alert**:
- Frontend: > 500ms (CDN issue or overload)
- Backend API: > 1000ms (performance degradation)
- WebSocket: > 500ms (may cause disconnections)

---

## 🚨 Step 9: Incident Response Integration

### When Alert is Received

**Immediate Actions** (< 5 minutes):
1. **Check Status**: UptimeRobot dashboard
2. **Verify Issue**: Open production URL in incognito browser
3. **Check Sentry**: https://sentry.io (for errors)
4. **Check Logs**:
   - Railway: https://railway.com/project/.../logs
   - Vercel: https://vercel.com/.../logs

**Investigation** (5-15 minutes):
1. Identify root cause (see logs/errors)
2. Determine severity (P0/P1/P2)
3. Decide: Fix or Rollback

**Resolution**:
- If quick fix: Deploy fix
- If complex: Rollback to last known good deployment
- If external: Wait for Vercel/Railway status update

**See**: [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) for detailed procedures

---

## 📊 Step 10: Integration with Other Tools

### Integrate with Sentry

**Purpose**: Correlate downtime with error spikes

1. In Sentry: Settings → Integrations → WebHooks
2. Add webhook: `https://api.uptimerobot.com/v2/...` (UptimeRobot provides)
3. In UptimeRobot: Add Sentry as alert contact (webhook)

**Benefit**: See if downtime correlates with error spike

### Integrate with GitHub Actions

**Purpose**: Pause alerts during active deployments

**Option 1: Manual Maintenance Window**
- Before deployment: Create 15-minute maintenance window
- After deployment: Remove window

**Option 2: GitHub Actions Integration** (Advanced)
```yaml
# .github/workflows/deploy.yml
- name: Notify UptimeRobot (deployment start)
  run: |
    curl -X POST https://api.uptimerobot.com/v2/createMWindow \
      -d "api_key=${{ secrets.UPTIMEROBOT_API_KEY }}" \
      -d "duration=15"

# ... deployment steps ...

- name: Notify UptimeRobot (deployment complete)
  run: |
    curl -X POST https://api.uptimerobot.com/v2/deleteMWindow \
      -d "api_key=${{ secrets.UPTIMEROBOT_API_KEY }}"
```

---

## 🎉 Summary: Your Monitoring Setup

After completing this guide, you have:

✅ **3 Monitors Active**:
- Frontend (Vercel) - HTTP check
- Backend (Railway) - Health check with keyword
- WebSocket (Railway) - Port check

✅ **Alerts Configured**:
- Email notifications (immediate)
- Optional: SMS, Slack, Discord

✅ **Reporting**:
- Weekly uptime summary emails
- Public status page (optional)

✅ **Response Time Tracking**:
- Alert if response time > 1000ms
- Historical graphs available

✅ **Incident Response**:
- Clear escalation path
- Integration with Sentry/logs

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Monitor shows "Down" but service works in browser
- **Cause**: UptimeRobot IP blocked by firewall/CDN
- **Solution**: Whitelist UptimeRobot IPs (check their docs)

**Issue**: False positive alerts (service briefly unavailable)
- **Cause**: Network hiccup or brief deploy
- **Solution**: Increase alert threshold to 2-3 checks

**Issue**: Not receiving alerts
- **Cause**: Email in spam folder or alert contact not enabled
- **Solution**: Check spam, verify alert contact is enabled for monitor

### UptimeRobot Support
- **Documentation**: https://blog.uptimerobot.com/documentation/
- **Support**: support@uptimerobot.com
- **API Docs**: https://uptimerobot.com/api/

---

## 🎯 Next Steps (Sprint 19 Phase 3)

After setting up monitoring:

1. ✅ Run load tests (Phase 1)
2. ✅ Monitor for 24 hours
3. ✅ Adjust alert thresholds if needed
4. ✅ Document any incidents
5. ✅ Create incident response runbook

**See**: [Sprint 19 Plan](../sprints/SPRINT_19_PLAN.md) for full task list

---

*Last Updated: 2025-11-21 (v4.0.0)*
*Estimated Setup Time: 15-20 minutes*
*Recommended Tool: UptimeRobot (Free Tier)*
