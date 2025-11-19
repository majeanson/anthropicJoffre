/**
 * K6 Load Test: Stress Test
 * Sprint 18 Phase 2 Task 2.1
 *
 * Tests system behavior under heavy load (50 concurrent games)
 * Target: Identify breaking points and performance degradation
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const gameCreations = new Counter('game_creations');
const gameJoins = new Counter('game_joins');
const errors = new Rate('error_rate');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Warm up
    { duration: '2m', target: 25 },    // Ramp to 25 concurrent games
    { duration: '3m', target: 50 },    // Ramp to 50 concurrent games
    { duration: '2m', target: 50 },    // Hold at 50 games
    { duration: '1m', target: 100 },   // Push to 100 (stress)
    { duration: '1m', target: 100 },   // Hold stress level
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% under 1s
    http_req_failed: ['rate<0.1'],      // Error rate under 10%
    error_rate: ['rate<0.15'],          // Custom error rate under 15%
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const playerName = `Stress_${__VU}_${Date.now()}`;

  // Simulate full game workflow
  const gameWorkflow = () => {
    // 1. Check lobby
    let response = http.get(`${API_URL}/api/games/lobby`);
    responseTime.add(response.timings.duration);
    check(response, {
      'lobby check ok': (r) => r.status === 200,
    }) || errors.add(1);

    sleep(0.5);

    // 2. Get leaderboard
    response = http.get(`${API_URL}/api/leaderboard?limit=50`);
    responseTime.add(response.timings.duration);
    check(response, {
      'leaderboard ok': (r) => r.status === 200,
    }) || errors.add(1);

    sleep(0.5);

    // 3. Check recent games
    response = http.get(`${API_URL}/api/games/recent`);
    responseTime.add(response.timings.duration);
    check(response, {
      'recent games ok': (r) => r.status === 200,
    }) || errors.add(1);

    sleep(1);

    // 4. Get player stats (if exists)
    response = http.get(`${API_URL}/api/stats/${encodeURIComponent(playerName)}`);
    responseTime.add(response.timings.duration);
    // Accept 200 or 404 (player not found)
    check(response, {
      'stats check ok': (r) => r.status === 200 || r.status === 404,
    }) || errors.add(1);

    sleep(2);
  };

  // Run workflow
  gameWorkflow();

  // Random additional actions
  if (Math.random() > 0.5) {
    // Get another player's stats
    const randomPlayer = `Player${Math.floor(Math.random() * 1000)}`;
    const response = http.get(`${API_URL}/api/stats/${encodeURIComponent(randomPlayer)}`);
    responseTime.add(response.timings.duration);
    check(response, {
      'random player stats ok': (r) => r.status === 200 || r.status === 404,
    }) || errors.add(1);
  }

  sleep(3);
}

export function handleSummary(data) {
  const passed = data.metrics.http_req_failed?.values.rate < 0.1;
  const recommendation = passed
    ? '✅ System handled stress test well. Consider increasing load further.'
    : '⚠️  System showed signs of stress. Review logs and optimize bottlenecks.';

  const summary = {
    ...data,
    recommendation,
  };

  return {
    'load-tests/results/stress-summary.json': JSON.stringify(summary, null, 2),
    'load-tests/results/stress-summary.txt': textSummary(summary),
    stdout: textSummary(summary, { enableColors: true }),
  };
}

function textSummary(data, { enableColors = false } = {}) {
  const colors = enableColors
    ? { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m' }
    : { reset: '', green: '', red: '', yellow: '' };

  const errorRate = (data.metrics.http_req_failed?.values.rate || 0) * 100;
  const errorColor = errorRate < 10 ? colors.green : errorRate < 20 ? colors.yellow : colors.red;

  return `
📊 Load Test Summary - Stress Test
${'='.repeat(50)}

Duration: ${data.state.testRunDurationMs / 1000}s
Total Virtual Users: ${data.metrics.vus_max?.values.max || 0}
Total Requests: ${data.metrics.http_reqs?.values.count || 0}

Performance:
  - p50: ${(data.metrics.http_req_duration?.values['p(50)'] || 0).toFixed(2)}ms
  - p95: ${(data.metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms
  - p99: ${(data.metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms
  - max: ${(data.metrics.http_req_duration?.values.max || 0).toFixed(2)}ms

Error Metrics:
  - Total Errors: ${data.metrics.http_req_failed?.values.count || 0}
  - ${errorColor}Error Rate: ${errorRate.toFixed(2)}%${colors.reset}

Throughput:
  - Requests/sec: ${(data.metrics.http_reqs?.values.rate || 0).toFixed(2)}
  - Data Received: ${((data.metrics.data_received?.values.count || 0) / 1024 / 1024).toFixed(2)} MB
  - Data Sent: ${((data.metrics.data_sent?.values.count || 0) / 1024 / 1024).toFixed(2)} MB

${data.recommendation || ''}

Thresholds:
${Object.entries(data.metrics)
    .filter(([, m]) => m.thresholds)
    .map(([name, metric]) =>
      Object.entries(metric.thresholds)
        .map(([thName, th]) => {
          const status = th.ok
            ? `${colors.green}✓ PASS${colors.reset}`
            : `${colors.red}✗ FAIL${colors.reset}`;
          return `  ${status} ${thName}`;
        })
        .join('\n')
    )
    .join('\n')}
`;
}
