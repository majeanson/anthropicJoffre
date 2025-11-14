# Log Aggregation Setup Guide

**Date**: 2025-11-14
**Status**: ✅ Ready to configure
**Recommended Solution**: Logtail (BetterStack) - Official Railway integration

---

## 🎯 Overview

Log aggregation centralizes all backend logs for easier debugging, monitoring, and alerting. This is essential for production deployments where you can't SSH into servers.

**Why Log Aggregation?**
- ✅ Centralized logging across multiple service instances
- ✅ Persistent log storage (Railway only keeps recent logs)
- ✅ Advanced search and filtering
- ✅ Real-time alerts for errors and anomalies
- ✅ Performance metrics and analytics

---

## 🏆 Recommended Solution: Logtail (BetterStack)

### Why Logtail?
- ✅ **Official Railway Integration** - One-click setup
- ✅ **Free Tier** - 1GB/month, 3-day retention
- ✅ **Fast Setup** - <5 minutes
- ✅ **Modern UI** - Beautiful log viewer with syntax highlighting
- ✅ **Powerful Filtering** - SQL-like queries
- ✅ **Real-time Streaming** - Live tail functionality
- ✅ **Alerting** - Email/Slack notifications for errors

**Pricing**:
- Free: 1GB/month, 3-day retention
- Starter: $10/month - 5GB/month, 14-day retention
- Pro: $29/month - 25GB/month, 30-day retention

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Logtail Account

1. Go to https://betterstack.com/logtail
2. Click **Sign Up** (or sign in with GitHub)
3. Create a new source:
   - Source Name: `Jaffre Production Backend`
   - Platform: **Railway**
4. **Copy your Source Token** (starts with `logtail_...`)

### Step 2: Add to Railway

1. Go to Railway → Your Service → **Variables**
2. Add new variable:
   ```
   LOGTAIL_SOURCE_TOKEN=logtail_xxxxxxxxxxxxxxxx
   ```
3. Railway will auto-redeploy

### Step 3: Install Logtail SDK

```bash
cd backend
npm install @logtail/node @logtail/winston
```

### Step 4: Configure Winston Logger

**File**: `backend/src/utils/logger.ts`

```typescript
import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

// Initialize Logtail only in production
const logtail = process.env.LOGTAIL_SOURCE_TOKEN
  ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
  : null;

// Configure Winston with conditional Logtail transport
const transports: winston.transport[] = [
  // Console output (always enabled)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add Logtail transport in production
if (logtail) {
  transports.push(new LogtailTransport(logtail));
  console.log('✅ Logtail log aggregation enabled');
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

// Flush logs on exit (important for Logtail)
process.on('SIGTERM', async () => {
  if (logtail) await logtail.flush();
});

process.on('SIGINT', async () => {
  if (logtail) await logtail.flush();
});
```

### Step 5: Verify Setup

1. Deploy your backend
2. Go to Logtail dashboard
3. You should see logs streaming in real-time!

**Test it**:
```typescript
// In your backend code
logger.info('Test log message from Jaffre backend');
logger.error('Test error message', { userId: '123', action: 'test' });
```

---

## 🔍 Using Logtail Dashboard

### Live Tail
```
1. Click "Live Tail" in top-right
2. See logs streaming in real-time
3. Filter by level, message, or custom fields
```

### Search & Filter
```sql
-- Search for errors
level:error

-- Search by player name
playerName:"Alice"

-- Search by game ID
gameId:"abc123"

-- Combine filters
level:error AND gameId:"abc123"

-- Time range
@timestamp > now-1h
```

### Create Alerts
```
1. Go to Alerts → New Alert
2. Name: "High Error Rate"
3. Query: level:error
4. Threshold: >10 errors in 5 minutes
5. Notification: Email or Slack
6. Save
```

---

## 📊 Structured Logging Best Practices

### DO: Use Structured Logs
```typescript
// ✅ Good - Structured with context
logger.info('Player joined game', {
  playerName: 'Alice',
  gameId: 'abc123',
  teamId: 1,
  timestamp: Date.now()
});

// ✅ Good - Error with stack trace
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  query: 'SELECT * FROM games',
  duration: 5000
});
```

### DON'T: Use String Concatenation
```typescript
// ❌ Bad - Hard to search
logger.info(`Player ${playerName} joined game ${gameId}`);

// ❌ Bad - No context
logger.error('Error occurred');
```

### Log Levels
```typescript
logger.error()   // Critical errors that need immediate attention
logger.warn()    // Warning conditions (e.g., rate limit approaching)
logger.info()    // General informational messages
logger.http()    // HTTP request/response logs
logger.debug()   // Detailed debugging information
```

---

## 🎨 Custom Fields for Better Filtering

Add these fields to all game-related logs:

```typescript
// Game event logging
export function logGameEvent(event: string, gameId: string, data: any) {
  logger.info(event, {
    event_type: 'game',
    game_id: gameId,
    phase: data.phase,
    player_count: data.playerCount,
    ...data
  });
}

// Player action logging
export function logPlayerAction(action: string, playerId: string, data: any) {
  logger.info(action, {
    event_type: 'player_action',
    player_id: playerId,
    player_name: data.playerName,
    action_type: action,
    ...data
  });
}

// Error logging
export function logError(error: Error, context: any) {
  logger.error(error.message, {
    event_type: 'error',
    error_name: error.name,
    error_stack: error.stack,
    ...context
  });
}
```

**Usage**:
```typescript
// In socket handlers
socket.on('play_card', (data) => {
  logPlayerAction('play_card', socket.id, {
    playerName: player.name,
    gameId: data.gameId,
    card: data.card,
    currentPhase: game.currentPhase
  });
});

// In error handlers
try {
  await saveGameState(gameId, gameState);
} catch (error) {
  logError(error, {
    gameId,
    operation: 'save_game_state',
    playerCount: gameState.players.length
  });
}
```

---

## 🔔 Alert Configuration Examples

### 1. High Error Rate Alert
```
Name: High Error Rate
Query: level:error
Threshold: >20 errors in 10 minutes
Notification: Email + Slack
Action: Page on-call engineer
```

### 2. Database Connection Issues
```
Name: Database Connection Failures
Query: "Database connection failed"
Threshold: >5 errors in 5 minutes
Notification: Email
Action: Check Railway database status
```

### 3. Slow API Responses
```
Name: Slow API Performance
Query: http_duration >5000
Threshold: >10 requests in 5 minutes
Notification: Slack
Action: Investigate performance bottleneck
```

### 4. WebSocket Connection Drops
```
Name: High WebSocket Disconnect Rate
Query: "disconnected" AND reason:"transport error"
Threshold: >50 disconnects in 10 minutes
Notification: Email + PagerDuty
Action: Check Railway network status
```

---

## 🔧 Alternative Solutions

### Option 2: Papertrail (Simpler, older)
- **Pros**: Simple setup, free tier (50MB/month)
- **Cons**: Older UI, limited features
- **Setup**: https://www.papertrail.com/
- **Cost**: Free tier available

### Option 3: DataDog (Enterprise)
- **Pros**: Comprehensive APM + logs + metrics
- **Cons**: Expensive, overkill for small projects
- **Setup**: https://www.datadoghq.com/
- **Cost**: $15/host/month + usage

### Option 4: Grafana Loki (Self-hosted)
- **Pros**: Free, powerful, self-hosted
- **Cons**: Requires setup and maintenance
- **Setup**: https://grafana.com/oss/loki/
- **Cost**: Free (infrastructure cost only)

### Option 5: Railway Logs API (Basic)
- **Pros**: Free, built-in
- **Cons**: No persistence, limited filtering
- **Setup**: Use Railway CLI (`railway logs`)
- **Cost**: Free

---

## 📈 Expected Log Volume

### Current Usage Estimate
```
Average game: 100-200 log lines
Average game duration: 15-30 minutes
Concurrent games: 10-50

Per day:
- 100 games × 150 logs = 15,000 log lines
- ~1.5MB per day
- ~45MB per month

Logtail Free Tier: 1GB/month (plenty of headroom!)
```

### Optimization Tips
```typescript
// DON'T log every card play in production
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Card played', { card, player });
}

// DO log important events only
logger.info('Round completed', {
  gameId,
  roundNumber,
  winner: winningTeam,
  scores: teamScores
});

// DO use log levels appropriately
logger.debug()   // Only in development
logger.info()    // Important business events
logger.warn()    // Recoverable errors
logger.error()   // Critical failures
```

---

## ✅ Production Checklist

- [ ] Logtail account created
- [ ] Source token added to Railway environment variables
- [ ] @logtail/node and @logtail/winston installed
- [ ] Winston logger configured with Logtail transport
- [ ] Logs appearing in Logtail dashboard
- [ ] Structured logging implemented (event_type, game_id, player_id)
- [ ] Log levels used appropriately
- [ ] Alerts configured for critical errors
- [ ] Team members added to Logtail workspace
- [ ] Log retention period acceptable (3-30 days)

---

## 📚 Resources

- [Logtail Documentation](https://betterstack.com/docs/logs/logtail/)
- [Railway + Logtail Integration](https://docs.railway.app/guides/logtail)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Structured Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)

---

*Last Updated: 2025-11-14*
*Estimated Setup Time: 15-20 minutes*
