# Validation Error Monitoring Guide

## Overview

This document explains how to monitor and debug validation errors in production using our structured logging system.

## Quick Reference

**Search for validation errors:**
```bash
# In logs, search for
[VALIDATION_ERROR]

# Or filter by error type
errorType="VALIDATION_ERROR"
```

## Structured Logging Format

All validation errors are logged with the following structured metadata:

```json
{
  "level": "warn",
  "message": "[VALIDATION_ERROR] take_over_bot - Invalid payload",
  "errorType": "VALIDATION_ERROR",
  "eventName": "take_over_bot",
  "validationError": "newPlayerName: Required",
  "socketId": "Y4MGWt5IaE2iEz6MAAAl",
  "playerName": "Kreator",
  "gameId": "DX9NTLZ5",
  "payload": {
    "gameId": "DX9NTLZ5",
    "playerName": "Kreator",
    "botName": "Bot 1"
  },
  "timestamp": "2025-11-20T13:25:26.126Z",
  "environment": "production",
  "service": "trick-card-game-backend"
}
```

## Finding Validation Errors

### Railway Logs (Production)

**1. View All Validation Errors**
```
Search: VALIDATION_ERROR
```

**2. Filter by Event Name**
```
Search: eventName="take_over_bot"
```

**3. Filter by Error Type**
```
Search: validationError="newPlayerName: Required"
```

**4. Track Specific Player**
```
Search: playerName="Kreator"
```

**5. Debug Specific Game**
```
Search: gameId="DX9NTLZ5"
```

### Local Development

Validation errors are logged to:
- **Console**: Immediate visibility with color coding
- **logs/error.log**: Persistent error log (production only)
- **logs/combined.log**: All logs (production only)

**Example console output:**
```
[VALIDATION ERROR] take_over_bot failed: {
  error: 'newPlayerName: Required',
  payload: {
    "gameId": "DX9NTLZ5",
    "playerName": "Kreator",
    "botName": "Bot 1"
  },
  socketId: 'Y4MGWt5IaE2iEz6MAAAl',
  playerName: 'Kreator',
  gameId: 'DX9NTLZ5'
}
```

## Common Validation Errors

### 1. Missing Required Field
```json
{
  "validationError": "newPlayerName: Required",
  "payload": {
    "gameId": "ABC123",
    "botName": "Bot 1"
    // Missing: newPlayerName
  }
}
```

**Root Cause**: Frontend sending wrong parameter names or missing fields

**Fix**: Update frontend to send correct parameters

---

### 2. Wrong Parameter Names
```json
{
  "validationError": "newPlayerName: Required",
  "payload": {
    "gameId": "ABC123",
    "playerName": "Bob",  // ❌ Should be newPlayerName
    "botName": "Bot 1"    // ❌ Should be botNameToReplace
  }
}
```

**Root Cause**: Frontend/backend parameter name mismatch

**Fix**: Use proper TypeScript types exported from schemas

---

### 3. Invalid Data Type
```json
{
  "validationError": "amount: Expected number, received string",
  "payload": {
    "gameId": "ABC123",
    "amount": "7"  // ❌ Should be number 7
  }
}
```

**Root Cause**: Frontend sending string instead of number

**Fix**: Ensure proper type conversion before sending

---

### 4. Extra Properties (Strict Mode)
```json
{
  "validationError": "Unrecognized key(s) in object: 'extraField'",
  "payload": {
    "gameId": "ABC123",
    "newPlayerName": "Bob",
    "botNameToReplace": "Bot 1",
    "extraField": "value"  // ❌ Not allowed
  }
}
```

**Root Cause**: Frontend sending unexpected properties

**Fix**: Remove extra fields, only send what schema expects

## Monitoring Best Practices

### 1. Set Up Alerts

**High Priority**: Alert if validation error rate exceeds 1% of requests
```
(count(errorType="VALIDATION_ERROR") / count(eventName)) > 0.01
```

**Critical**: Alert if same validation error occurs > 10 times in 5 minutes
```
count(errorType="VALIDATION_ERROR" AND eventName="X") > 10 in 5m
```

### 2. Track Metrics

Monitor these key metrics:
- **Validation error rate by event** (which endpoints fail most)
- **Validation error rate by player** (problematic clients)
- **Validation error types** (most common mistakes)
- **Validation error trends** (increasing/decreasing over time)

### 3. Regular Review

**Weekly**:
- Review top 10 validation errors
- Identify patterns (same error repeatedly)
- Check if errors correlate with deployments

**Monthly**:
- Analyze validation error trends
- Identify events that need better validation
- Review if errors indicate frontend bugs

## Debugging Workflow

### Step 1: Identify the Error
```bash
# Search logs for validation errors
Search: VALIDATION_ERROR

# Result shows:
# eventName: "take_over_bot"
# validationError: "newPlayerName: Required"
```

### Step 2: Examine the Payload
```json
{
  "payload": {
    "gameId": "ABC123",
    "playerName": "Bob",
    "botName": "Bot 1"
  }
}
```

### Step 3: Compare with Schema
```typescript
// backend/src/validation/schemas.ts
export const takeOverBotPayloadSchema = z.object({
  gameId: gameIdSchema,
  botNameToReplace: playerNameSchema,  // ✅ Required
  newPlayerName: playerNameSchema,     // ✅ Required
}).strict();
```

### Step 4: Identify the Fix
Frontend is sending:
- ❌ `playerName` instead of `newPlayerName`
- ❌ `botName` instead of `botNameToReplace`

Fix: Update frontend to use correct parameter names

### Step 5: Verify the Fix
After deploying fix:
```bash
# Verify error is gone
Search: eventName="take_over_bot" AND validationError="newPlayerName: Required"

# Should show no results after fix is deployed
```

## Integration with External Monitoring

### Sentry
Validation errors are automatically sent to Sentry with:
- Error message
- Full stack trace
- Request context
- User information

### DataDog / New Relic
Use structured logging format to create custom dashboards:
- Validation error rate by event
- Top validation errors
- Error rate trends

### Grafana
Create alerts based on log queries:
```promql
rate(validation_errors_total{event="take_over_bot"}[5m]) > 0.1
```

## Log Retention

**Production**:
- **Console logs**: Captured by Railway (24-48 hours)
- **error.log**: Last 5 files × 5MB each
- **combined.log**: Last 5 files × 5MB each

**Development**:
- Console only (no file logging)

## Performance Impact

Validation logging is designed for minimal performance impact:
- **Structured JSON**: Fast to parse and index
- **Lazy evaluation**: Payload only serialized on error
- **Async logging**: Non-blocking I/O
- **Log level filtering**: Only warns+ in production

## Example Use Cases

### Use Case 1: Detect Frontend Bug
**Symptom**: Sudden spike in validation errors for `take_over_bot`

**Investigation**:
```bash
Search: eventName="take_over_bot" after:2025-11-20T13:00
```

**Finding**: All errors have same pattern - wrong parameter names

**Root Cause**: Frontend deployed with bug

**Action**: Rollback frontend deployment

---

### Use Case 2: Identify Problematic Client
**Symptom**: Same socketId generating many errors

**Investigation**:
```bash
Search: socketId="Y4MGWt5IaE2iEz6MAAAl"
```

**Finding**: Client is sending malformed requests

**Root Cause**: Outdated frontend version or malicious client

**Action**: Rate limit or block if malicious

---

### Use Case 3: Schema Evolution
**Symptom**: After schema change, validation errors spike

**Investigation**:
```bash
Search: VALIDATION_ERROR after:<deployment-time>
```

**Finding**: Old clients sending old format

**Root Cause**: Need backward compatibility period

**Action**: Support both old and new schemas temporarily

## Related Documentation

- [Validation System Architecture](./VALIDATION_SYSTEM.md)
- [Backend Testing Guide](./BACKEND_TESTING.md)
- [Error Handling](../../README.md#error-handling)

---

*Last updated: 2025-11-20*
