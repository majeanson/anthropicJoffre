/**
 * K6 Load Test: Baseline Performance
 * Sprint 18 Phase 2 Task 2.1
 *
 * Tests baseline performance with 10 concurrent users
 * Target: Establish performance baseline metrics
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const wsConnectionTime = new Trend('ws_connection_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
    errors: ['rate<0.05'],             // Custom error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const API_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Homepage load
  let response = http.get(BASE_URL);
  check(response, {
    'homepage status 200': (r) => r.status === 200,
    'homepage loads in <2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: API health check
  response = http.get(`${API_URL}/api/health`);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'health check status 200': (r) => r.status === 200,
    'health check <200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Lobby list
  response = http.get(`${API_URL}/api/games/lobby`);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'lobby list status 200': (r) => r.status === 200,
    'lobby list <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);

  // Test 4: Recent games
  response = http.get(`${API_URL}/api/games/recent`);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'recent games status 200': (r) => r.status === 200,
    'recent games <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Leaderboard
  response = http.get(`${API_URL}/api/leaderboard?limit=100`);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'leaderboard status 200': (r) => r.status === 200,
    'leaderboard <1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(3);
}

export function handleSummary(data) {
  return {
    'load-tests/results/baseline-summary.json': JSON.stringify(data, null, 2),
    'load-tests/results/baseline-summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, { indent = '', enableColors = true } = {}) {
  const colors = enableColors
    ? { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m' }
    : { reset: '', green: '', red: '', yellow: '' };

  let summary = `
${indent}📊 Load Test Summary - Baseline
${indent}${'='.repeat(50)}
${indent}
${indent}Duration: ${data.state.testRunDurationMs / 1000}s
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}
${indent}HTTP Performance:
${indent}  - p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms
${indent}  - p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  - p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
${indent}  - max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
${indent}
${indent}Success Metrics:
${indent}  - Successful Requests: ${data.metrics.http_reqs.values.count - data.metrics.http_req_failed.values.count}
${indent}  - Failed Requests: ${data.metrics.http_req_failed.values.count}
${indent}  - Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
${indent}
${indent}Thresholds:
`;

  for (const [name, threshold] of Object.entries(data.metrics)) {
    if (threshold.thresholds) {
      for (const [thresholdName, thresholdValue] of Object.entries(threshold.thresholds)) {
        const passed = thresholdValue.ok;
        const status = passed
          ? `${colors.green}✓ PASS${colors.reset}`
          : `${colors.red}✗ FAIL${colors.reset}`;
        summary += `${indent}  ${status} ${thresholdName}\n`;
      }
    }
  }

  return summary;
}
