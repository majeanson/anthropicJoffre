# Load Testing with k6

**Sprint 18 Phase 2 Task 2.1**

This directory contains k6 load test scripts for performance testing the Trick Card Game application.

---

## Prerequisites

### Install k6

**macOS (Homebrew)**:
```bash
brew install k6
```

**Windows (Chocolatey)**:
```bash
choco install k6
```

**Windows (Manual)**:
Download from: https://dl.k6.io/msi/k6-latest-amd64.msi

**Linux (Debian/Ubuntu)**:
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## Test Scripts

### 1. Baseline Performance Test (`baseline.k6.js`)
Tests normal load with 10 concurrent users.

**Metrics**:
- Homepage load time
- API response times
- Lobby, leaderboard, recent games endpoints

**Run**:
```bash
k6 run load-tests/baseline.k6.js
```

**Expected Results**:
- p95 < 500ms
- Error rate < 1%

---

### 2. WebSocket Stress Test (`websocket.k6.js`)
Tests WebSocket connection handling with 100 concurrent connections.

**Metrics**:
- Connection establishment time
- Message latency
- Connection stability

**Run**:
```bash
k6 run load-tests/websocket.k6.js
```

**Expected Results**:
- p95 latency < 200ms
- Error rate < 5%

---

### 3. Stress Test (`stress.k6.js`)
Tests system behavior under heavy load (up to 100 concurrent users).

**Metrics**:
- Performance degradation under load
- Breaking point identification
- Error rate escalation

**Run**:
```bash
k6 run load-tests/stress.k6.js
```

**Expected Results**:
- p95 < 1000ms
- Error rate < 10%

---

## Running Tests

### Quick Start (All Tests)

```bash
# Run all tests
./load-tests/run-all-tests.sh

# Or run individually
k6 run load-tests/baseline.k6.js
k6 run load-tests/websocket.k6.js
k6 run load-tests/stress.k6.js
```

### Custom Environment Variables

```bash
# Test against production
k6 run --env BASE_URL=https://your-app.vercel.app \
       --env API_URL=https://your-api.railway.app \
       load-tests/baseline.k6.js

# Test with different load
k6 run --vus 50 --duration 30s load-tests/baseline.k6.js
```

---

## Interpreting Results

### Key Metrics

**Response Time (http_req_duration)**:
- p50: Median response time
- p95: 95th percentile (target: <500ms)
- p99: 99th percentile
- max: Worst case

**Error Rate (http_req_failed)**:
- Target: < 1% for baseline
- Target: < 10% for stress test

**Throughput (http_reqs)**:
- Requests per second
- Indicates system capacity

### Threshold Failures

If thresholds fail:
1. Check server logs for errors
2. Monitor CPU/memory usage
3. Review database query performance
4. Check network latency
5. Analyze bottlenecks with profiler

---

## Results Storage

Results are automatically saved to `load-tests/results/`:

```
load-tests/results/
├── baseline-summary.json    # JSON metrics
├── baseline-summary.txt     # Human-readable summary
├── websocket-summary.json
├── websocket-summary.txt
├── stress-summary.json
└── stress-summary.txt
```

---

## Performance Baselines (Sprint 18)

### Baseline Test (10 users):
- **p95 Response Time**: TBD
- **Error Rate**: TBD
- **Throughput**: TBD req/s

### WebSocket Test (100 connections):
- **p95 Latency**: TBD
- **Error Rate**: TBD
- **Max Connections**: TBD

### Stress Test (100 users):
- **p95 Response Time**: TBD
- **Error Rate**: TBD
- **Breaking Point**: TBD users

*Run tests and update baselines above*

---

## Advanced Usage

### Cloud Testing (k6 Cloud)

```bash
# Sign up at https://app.k6.io
k6 login cloud

# Run test in cloud
k6 cloud load-tests/baseline.k6.js

# Benefits:
# - Run from multiple global locations
# - Larger scale tests (1000+ VUs)
# - Real-time dashboards
# - Historical comparison
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Load Tests
on: [push]
jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run k6 local test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: load-tests/baseline.k6.js
          flags: --out json=results.json
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

---

## Monitoring During Tests

### Server Monitoring

```bash
# Monitor server resources during test
htop           # CPU/memory
netstat -an    # Network connections
tail -f logs   # Application logs
```

### Database Monitoring

```bash
# PostgreSQL connection count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Active queries
psql $DATABASE_URL -c "SELECT pid, query, state FROM pg_stat_activity WHERE state = 'active';"
```

---

## Optimization Recommendations

Based on test results, consider:

### If p95 > 500ms:
- [ ] Add database indexes
- [ ] Implement caching (Redis)
- [ ] Optimize slow queries
- [ ] Enable gzip compression
- [ ] Use CDN for static assets

### If Error Rate > 1%:
- [ ] Increase connection pool size
- [ ] Add retry logic
- [ ] Implement circuit breakers
- [ ] Review error logs
- [ ] Fix race conditions

### If WebSocket Latency > 200ms:
- [ ] Optimize Socket.io configuration
- [ ] Reduce message size
- [ ] Batch updates
- [ ] Use binary protocols
- [ ] Check network latency

---

## Troubleshooting

**Connection Refused**:
- Ensure backend is running on correct port
- Check firewall rules
- Verify BASE_URL and API_URL

**High Error Rate**:
- Check server logs
- Verify database is running
- Check rate limiting configuration
- Review authentication flow

**Low Throughput**:
- Increase `stages.target` values
- Reduce `sleep()` duration
- Check network bandwidth
- Review k6 resource limits

---

*Last Updated: 2025-11-18*
*Sprint 18 Phase 2 Task 2.1*
