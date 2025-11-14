# Load Testing Results - Sprint 15

**Date**: 2025-11-14
**Tool**: Custom Socket.IO load testing script
**Backend**: https://anthropicjoffre-production.up.railway.app

---

## 📋 Test Overview

### Test Configuration
- **Concurrent Games**: 5
- **Players per Game**: 4 (simulated real players)
- **Game Duration**: 30 seconds per game
- **Reconnection Test**: Enabled (for 1 player in Game #1)
- **Total Connections**: 20 concurrent Socket.IO connections

### Test Scenarios
1. **Game Creation**: Player 1 creates a new game
2. **Player Joining**: Players 2-4 join the created game
3. **Team Selection**: Players select teams (Team 1: P1, P3; Team 2: P2, P4)
4. **Game Start**: Player 1 starts the game when 4/4 players ready
5. **Reconnection**: One player disconnects and reconnects mid-game
6. **Concurrent Load**: All 5 games running simultaneously

---

## 🎯 Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Game Creation Success Rate | ≥90% | ⏳ Pending |
| Player Join Success Rate | ≥90% | ⏳ Pending |
| Average Connection Latency | <500ms | ⏳ Pending |
| Reconnection Success | 100% | ⏳ Pending |
| Error Rate | <10% | ⏳ Pending |

---

## 📊 Expected Results

### Performance Metrics
- **Connection Latency**: Expected 100-300ms (Railway → Global CDN)
- **Game Creation Time**: <1 second
- **Player Join Time**: <500ms per player
- **Reconnection Time**: <2 seconds

### Memory Usage
- **Per Game**: ~2-5MB (4 players, game state, socket connections)
- **Total (5 games)**: ~10-25MB active memory
- **Cleanup**: Games should be cleaned up 15 minutes after completion

### Socket.IO Stability
- **Connection Success**: All 20 players should connect successfully
- **Event Handling**: All game events should be processed without errors
- **Disconnection Handling**: Reconnection should work within 30 seconds

---

## 🔧 How to Run the Load Test

### Prerequisites
```bash
npm install  # Installs socket.io-client
```

### Run Against Local Backend
```bash
npm run load-test
# OR
node load-test.js
```

### Run Against Production Backend

**Windows**:
```bash
set BACKEND_URL=https://anthropicjoffre-production.up.railway.app&& node load-test.js
```

**Linux/Mac**:
```bash
BACKEND_URL=https://anthropicjoffre-production.up.railway.app npm run load-test:prod
```

---

## 📝 Load Test Script Features

### Metrics Tracked
- ✅ Games created successfully
- ✅ Players joined successfully
- ✅ Games that failed to start
- ✅ Average connection latency
- ✅ Error count and details
- ✅ Reconnection success rate

### Test Output Example
```
🚀 Starting Load Test for Jaffre Card Game
Target: https://anthropicjoffre-production.up.railway.app
Concurrent Games: 5
Game Duration: 30s
Reconnection Test: Enabled

[Game 1] Starting simulation...
✓ LoadTest_P1_G1 connected (156ms)
[Game 1] Created: abc123
✓ LoadTest_P2_G1 connected (142ms)
[Game 1] LoadTest_P2_G1 joined (2/4)
✓ LoadTest_P3_G1 connected (138ms)
[Game 1] LoadTest_P3_G1 joined (3/4)
✓ LoadTest_P4_G1 connected (145ms)
[Game 1] LoadTest_P4_G1 joined (4/4)
[Game 1] All players joined. Starting game...

[Reconnection Test] Disconnecting LoadTest_P3_G1...
⊗ LoadTest_P3_G1 disconnected: client namespace disconnect
[Reconnection Test] Reconnecting LoadTest_P3_G1...
✓ LoadTest_P3_G1 connected (134ms)
✓ [Reconnection Test] LoadTest_P3_G1 successfully reconnected

[Game 1] Simulation complete.

============================================================
📊 LOAD TEST RESULTS
============================================================
Backend URL:          https://anthropicjoffre-production.up.railway.app
Test Duration:        62.45s
Concurrent Games:     5

Connection Metrics:
  Games Created:      5/5
  Players Joined:     15/15
  Games Failed:       0
  Avg Latency:        147.32ms

Error Summary:
  Total Errors:       0

============================================================
✅ LOAD TEST PASSED - Server handles concurrent games well
```

---

## 🚨 Known Issues & Limitations

### Current Limitations
1. **Windows Environment Variables**: Load test script uses Unix-style env vars. Windows users need to use `set BACKEND_URL=...` syntax.
2. **Production Impact**: Running load tests against production could impact live users. Recommend testing during low-traffic hours.
3. **Rate Limiting**: Server may have rate limits that affect load test results.

### Recommendations for Production Load Testing
1. **Use Staging Environment**: Test against a staging server identical to production
2. **Schedule Off-Hours**: Run tests during low-traffic periods (e.g., 2-4 AM UTC)
3. **Monitor Server Metrics**: Watch Railway dashboard for CPU, memory, and network usage
4. **Gradual Scaling**: Start with 2-3 concurrent games, then scale up to 10-20

---

## 🔍 Next Steps

### Recommended Load Testing Improvements
1. **Automated Monitoring**: Integrate with Railway API to collect server metrics during load tests
2. **Stress Testing**: Test with 20-50 concurrent games to find server limits
3. **Spike Testing**: Simulate sudden traffic spikes (Black Friday scenarios)
4. **Endurance Testing**: Run tests for 2-4 hours to detect memory leaks
5. **Geographic Testing**: Test from different regions (US, EU, Asia) for latency analysis

### Production Monitoring
- Set up Sentry alerts for error spikes during high-traffic periods
- Monitor Railway metrics dashboard for resource usage trends
- Track Socket.IO connection counts and error rates
- Document peak concurrent users (current capacity vs. future growth)

---

## 📈 Benchmark Targets

Based on Railway's free tier limits and Socket.IO performance:

| Scenario | Target Capacity | Notes |
|----------|----------------|-------|
| **Concurrent Games** | 50-100 games | ~200-400 active Socket.IO connections |
| **Peak Players** | 200-400 players | Assumes 50% spectator mode adoption |
| **Average Latency** | <300ms | Global average (Railway's CDN) |
| **Memory Usage** | <512MB | Railway free tier limit |
| **CPU Usage** | <80% | Sustained under normal load |

---

## ✅ Conclusion

The load testing script is ready for use. Key features:
- ✅ Simulates realistic multiplayer game scenarios
- ✅ Tests concurrent game creation and joining
- ✅ Validates reconnection functionality
- ✅ Measures latency and error rates
- ✅ Provides detailed metrics report

**Recommendation**: Run load tests against a local backend or staging environment first, then schedule production tests during off-peak hours.

---

*Generated: 2025-11-14*
*Script: load-test.js*
