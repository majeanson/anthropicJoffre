# Load Testing Results - Sprint 15 (Updated)

**Date**: 2025-11-14
**Last Updated**: 2025-11-14
**Tools**:
- Basic load test: `load-test.js`
- Advanced load test: `load-test-advanced.js` (NEW!)
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

## 🔧 How to Run the Load Tests

### Prerequisites
```bash
npm install  # Installs socket.io-client
```

### Basic Load Test (5 Concurrent Games)

**Local Backend**:
```bash
npm run load-test
```

**Production Backend**:
```bash
npm run load-test:prod
```

### Advanced Load Tests (NEW!)

**Baseline (5 concurrent games)**:
```bash
npm run load-test:advanced
```

**Moderate Load (10 concurrent games)**:
```bash
npm run load-test:moderate
```

**Heavy Load (20 concurrent games)**:
```bash
npm run load-test:heavy
```

**Stress Test (50 concurrent games)**:
```bash
npm run load-test:stress
```

**Spike Test (gradual ramp-up to 30 games)**:
```bash
npm run load-test:spike
```

**Custom Configuration**:
```bash
# Custom number of games
NUM_GAMES=15 node load-test-advanced.js

# Custom game duration
GAME_DURATION_MS=60000 node load-test-advanced.js

# Disable reconnection tests
RECONNECT_TEST=false node load-test-advanced.js

# Production backend
BACKEND_URL=https://anthropicjoffre-production.up.railway.app NUM_GAMES=10 node load-test-advanced.js
```

---

## 📝 Load Test Script Features

### Basic Load Test (`load-test.js`)
**Metrics Tracked**:
- ✅ Games created successfully
- ✅ Players joined successfully
- ✅ Games that failed to start
- ✅ Average connection latency
- ✅ Error count and details
- ✅ Reconnection success rate (1 player per test)

### Advanced Load Test (`load-test-advanced.js`) - NEW!
**Enhanced Metrics**:
- ✅ **Latency Distribution**: Min, Max, Average, p95, p99 percentiles
- ✅ **Success Rates**: Game creation, player joins, reconnections (%)
- ✅ **Error Categorization**: Connection, game creation, player join, reconnection, timeout, other
- ✅ **Transport Tracking**: WebSocket vs Polling ratio
- ✅ **Memory Monitoring**: Client-side heap and RSS usage
- ✅ **Comprehensive Reporting**: Detailed pass/fail criteria evaluation
- ✅ **Flexible Testing**: Concurrent and spike test modes
- ✅ **Individual Timeouts**: Per-player join timeout detection (15s)
- ✅ **Game Timeout Protection**: 60s timeout for entire game setup

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

## ✅ Advanced Load Test Output Example

```
📊 ADVANCED LOAD TEST RESULTS
======================================================================
Backend URL:               http://localhost:3000
Test Type:                 concurrent
Test Duration:             42.15s
Target Concurrent Games:   10
Game Duration Each:        30s

📈 Connection Metrics:
  Games Created:           10/10 (100.00%)
  Players Joined:          30/30 (100.00%)
  Games Failed:            0
  Players Connected:       40
  Players Disconnected:    40

⚡ Latency Statistics:
  Average:                 145.32ms
  Min:                     89ms
  Max:                     312ms
  95th Percentile (p95):   287ms
  99th Percentile (p99):   305ms

🔄 Reconnection Metrics:
  Attempts:                2
  Successes:               2
  Failures:                0
  Success Rate:            100.00%

🔌 Transport Distribution:
  WebSocket:               40 (100.00%)
  Polling:                 0 (0.00%)

❌ Error Summary:
  Total Errors:            0
  Connection Errors:       0
  Game Creation Errors:    0
  Player Join Errors:      0
  Reconnection Errors:     0
  Timeout Errors:          0
  Other Errors:            0

💾 Memory Usage (Client):
  Heap Used:               45.23 MB
  Heap Total:              58.12 MB
  RSS:                     112.34 MB

======================================================================
✅ LOAD TEST PASSED - Server performs well under load

Passing Criteria:
  ✓ Game creation success rate ≥ 90%
  ✓ Player join success rate ≥ 90%
  ✓ Total errors < number of games
  ✓ Average latency < 1000ms
  ✓ Reconnection success rate ≥ 80%
======================================================================
```

## ✅ Conclusion

**Two Load Testing Tools Available**:

1. **Basic Load Test** (`load-test.js`):
   - ✅ Simple 5-game concurrent test
   - ✅ Basic metrics (games created, latency, errors)
   - ✅ Good for quick smoke testing

2. **Advanced Load Test** (`load-test-advanced.js`) - **RECOMMENDED**:
   - ✅ Multiple test modes (concurrent, spike)
   - ✅ Configurable game count (5, 10, 20, 50+)
   - ✅ Comprehensive metrics (latency distribution, error categorization)
   - ✅ Transport tracking (WebSocket vs Polling)
   - ✅ Memory monitoring
   - ✅ Detailed pass/fail criteria evaluation
   - ✅ Better error handling and timeout detection

**Recommendation**:
- Use **advanced load test** for comprehensive performance validation
- Start with 5-10 games locally to verify functionality
- Run 20-50 game stress tests before production deployment
- Schedule production tests during off-peak hours with monitoring

---

*Generated: 2025-11-14*
*Script: load-test.js*
