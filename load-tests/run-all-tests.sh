#!/bin/bash
# Run All Load Tests
# Sprint 18 Phase 2 Task 2.1

set -e

echo "🚀 Starting Load Test Suite"
echo "======================================"
echo ""

# Create results directory
mkdir -p load-tests/results

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
API_URL="${API_URL:-http://localhost:3000}"
WS_URL="${WS_URL:-ws://localhost:3000}"

echo "📍 Test Targets:"
echo "   Frontend: $BASE_URL"
echo "   API: $API_URL"
echo "   WebSocket: $WS_URL"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed!"
    echo "   Install from: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo "✅ k6 found: $(k6 version)"
echo ""

# Test 1: Baseline
echo "📊 Test 1/3: Baseline Performance (10 concurrent users)"
echo "   Duration: ~5 minutes"
k6 run --env BASE_URL="$BASE_URL" --env API_URL="$API_URL" load-tests/baseline.k6.js
echo ""

# Test 2: WebSocket
echo "📊 Test 2/3: WebSocket Stress (100 connections)"
echo "   Duration: ~6 minutes"
k6 run --env WS_URL="$WS_URL" load-tests/websocket.k6.js
echo ""

# Test 3: Stress
echo "📊 Test 3/3: Stress Test (up to 100 users)"
echo "   Duration: ~11 minutes"
k6 run --env API_URL="$API_URL" load-tests/stress.k6.js
echo ""

echo "======================================"
echo "✅ All Load Tests Complete!"
echo ""
echo "📁 Results saved to: load-tests/results/"
echo "   - baseline-summary.txt"
echo "   - websocket-summary.txt"
echo "   - stress-summary.txt"
echo ""
echo "📊 Review results and update performance baselines in:"
echo "   - load-tests/README.md"
echo "   - docs/sprints/SPRINT_18_PROGRESS.md"
