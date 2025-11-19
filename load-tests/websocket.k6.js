/**
 * K6 Load Test: WebSocket Connections
 * Sprint 18 Phase 2 Task 2.1
 *
 * Tests WebSocket connection handling with 100 concurrent connections
 * Target: Verify Socket.io can handle production load
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const wsConnections = new Counter('ws_connections');
const wsMessages = new Counter('ws_messages');
const wsErrors = new Rate('ws_errors');
const wsLatency = new Trend('ws_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp to 20 connections
    { duration: '1m', target: 50 },    // Ramp to 50 connections
    { duration: '2m', target: 100 },   // Ramp to 100 connections
    { duration: '2m', target: 100 },   // Hold 100 connections
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    ws_latency: ['p(95)<200'],         // 95% of messages under 200ms
    ws_errors: ['rate<0.05'],          // Error rate under 5%
  },
};

const BASE_URL = __ENV.WS_URL || 'ws://localhost:3000';

export default function () {
  const playerName = `LoadTest_${__VU}_${Date.now()}`;
  const url = `${BASE_URL}?playerName=${encodeURIComponent(playerName)}`;

  const startTime = Date.now();

  const response = ws.connect(url, { tags: { player: playerName } }, function (socket) {
    wsConnections.add(1);

    socket.on('open', function open() {
      console.log(`VU ${__VU}: Connected as ${playerName}`);

      // Create a game
      const createPayload = JSON.stringify({
        type: 'create_game',
        playerName: playerName,
      });
      socket.send(createPayload);
      wsMessages.add(1);
    });

    socket.on('message', function (message) {
      const latency = Date.now() - startTime;
      wsLatency.add(latency);
      wsMessages.add(1);

      try {
        const data = JSON.parse(message);

        check(data, {
          'received valid message': (d) => d !== null,
        }) || wsErrors.add(1);

        // Handle game_created event
        if (data.type === 'game_created' || message.includes('game_created')) {
          console.log(`VU ${__VU}: Game created successfully`);
          socket.close();
        }

        // Handle errors
        if (data.type === 'error' || data.error) {
          console.error(`VU ${__VU}: Error - ${data.message || data.error}`);
          wsErrors.add(1);
          socket.close();
        }
      } catch (e) {
        wsErrors.add(1);
        console.error(`VU ${__VU}: Failed to parse message - ${e.message}`);
      }
    });

    socket.on('error', function (e) {
      wsErrors.add(1);
      console.error(`VU ${__VU}: WebSocket error - ${e.error()}`);
    });

    socket.on('close', function () {
      console.log(`VU ${__VU}: Disconnected`);
    });

    // Keep connection alive for 10 seconds
    socket.setTimeout(function () {
      socket.close();
    }, 10000);
  });

  check(response, {
    'websocket connection status 101': (r) => r && r.status === 101,
  }) || wsErrors.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-tests/results/websocket-summary.json': JSON.stringify(data, null, 2),
    'load-tests/results/websocket-summary.txt': textSummary(data),
    stdout: textSummary(data, { enableColors: true }),
  };
}

function textSummary(data, { enableColors = false } = {}) {
  const colors = enableColors
    ? { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m' }
    : { reset: '', green: '', red: '' };

  return `
📊 Load Test Summary - WebSocket
${'='.repeat(50)}

Duration: ${data.state.testRunDurationMs / 1000}s

WebSocket Metrics:
  - Total Connections: ${data.metrics.ws_connections?.values.count || 0}
  - Total Messages: ${data.metrics.ws_messages?.values.count || 0}
  - Error Rate: ${((data.metrics.ws_errors?.values.rate || 0) * 100).toFixed(2)}%

Latency:
  - p50: ${(data.metrics.ws_latency?.values['p(50)'] || 0).toFixed(2)}ms
  - p95: ${(data.metrics.ws_latency?.values['p(95)'] || 0).toFixed(2)}ms
  - p99: ${(data.metrics.ws_latency?.values['p(99)'] || 0).toFixed(2)}ms
  - max: ${(data.metrics.ws_latency?.values.max || 0).toFixed(2)}ms

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
