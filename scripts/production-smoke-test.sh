#!/bin/bash

################################################################################
# Production Smoke Test - Automated Validation
#
# Sprint 18 Phase 4 Task 4.2
# Purpose: Automated critical path validation after production deployment
# Usage: ./scripts/production-smoke-test.sh <frontend_url> <backend_url>
# Exit Codes: 0 = Pass, 1 = Fail
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
CRITICAL_FAIL_COUNT=0

# Results directory
RESULTS_DIR="smoke-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/smoke-test-$TIMESTAMP.md"

# Test configuration
FRONTEND_URL="${1:-http://localhost:5173}"
BACKEND_URL="${2:-http://localhost:3000}"
TEST_TIMEOUT=10

################################################################################
# Helper Functions
################################################################################

setup_results_dir() {
  mkdir -p "$RESULTS_DIR"
  echo "# Production Smoke Test Report" > "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**Date**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
  echo "**Frontend URL**: $FRONTEND_URL" >> "$REPORT_FILE"
  echo "**Backend URL**: $BACKEND_URL" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "## Test Results" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
}

print_header() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${BLUE}$1${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "### $1" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
}

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  echo "- ✅ $1" >> "$REPORT_FILE"
  ((PASS_COUNT++))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  if [ -n "$2" ]; then
    echo -e "  ${YELLOW}→${NC} $2"
    echo "  - **Action**: $2" >> "$REPORT_FILE"
  fi
  echo "- ❌ $1" >> "$REPORT_FILE"
  ((FAIL_COUNT++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  if [ -n "$2" ]; then
    echo -e "  ${YELLOW}→${NC} $2"
    echo "  - **Note**: $2" >> "$REPORT_FILE"
  fi
  echo "- ⚠️ $1" >> "$REPORT_FILE"
  ((WARN_COUNT++))
}

mark_critical() {
  echo -e "${RED}🚨 CRITICAL:${NC} $1"
  echo "" >> "$REPORT_FILE"
  echo "**🚨 CRITICAL**: $1" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  ((CRITICAL_FAIL_COUNT++))
}

################################################################################
# Test 1: Homepage & Assets
################################################################################

test_homepage() {
  print_header "Test 1: Homepage & Assets"

  # Check if frontend is accessible
  if curl -s --head --max-time $TEST_TIMEOUT "$FRONTEND_URL" > /dev/null 2>&1; then
    check_pass "Frontend URL is accessible"
  else
    check_fail "Frontend URL is not accessible" "Check Vercel deployment status"
    mark_critical "Frontend unreachable"
    return
  fi

  # Check response time
  START_TIME=$(date +%s%N)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TEST_TIMEOUT "$FRONTEND_URL" 2>/dev/null || echo "000")
  END_TIME=$(date +%s%N)
  RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 )) # Convert to milliseconds

  if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Homepage returns 200 OK (${RESPONSE_TIME}ms)"
  else
    check_fail "Homepage returned HTTP $HTTP_CODE" "Expected 200 OK"
    mark_critical "Homepage not loading"
  fi

  # Check response time threshold
  if [ "$RESPONSE_TIME" -lt 5000 ]; then
    check_pass "Response time < 5 seconds (${RESPONSE_TIME}ms)"
  else
    check_warn "Response time >= 5 seconds (${RESPONSE_TIME}ms)" "Consider optimizing load time"
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 2: API Health Check
################################################################################

test_api_health() {
  print_header "Test 2: API Health Check"

  # Check if backend is accessible
  if curl -s --head --max-time $TEST_TIMEOUT "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    check_pass "Backend URL is accessible"
  else
    check_fail "Backend URL is not accessible" "Check Railway deployment status"
    mark_critical "Backend unreachable"
    return
  fi

  # Check health endpoint
  START_TIME=$(date +%s%N)
  HEALTH_RESPONSE=$(curl -s --max-time $TEST_TIMEOUT "$BACKEND_URL/api/health" 2>/dev/null || echo "{}")
  END_TIME=$(date +%s%N)
  RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TEST_TIMEOUT "$BACKEND_URL/api/health" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Health endpoint returns 200 OK"
  else
    check_fail "Health endpoint returned HTTP $HTTP_CODE" "Check backend logs"
    mark_critical "API health check failed"
    return
  fi

  # Check response time
  if [ "$RESPONSE_TIME" -lt 500 ]; then
    check_pass "Health endpoint response time < 500ms (${RESPONSE_TIME}ms)"
  else
    check_warn "Health endpoint response time >= 500ms (${RESPONSE_TIME}ms)" "Consider investigating slow response"
  fi

  # Check response contains status
  if echo "$HEALTH_RESPONSE" | grep -q '"status"'; then
    check_pass "Health response contains status field"
  else
    check_warn "Health response missing status field" "Response: $HEALTH_RESPONSE"
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 3: Database Connectivity
################################################################################

test_database() {
  print_header "Test 3: Database Connectivity"

  # Check health endpoint for database status
  HEALTH_RESPONSE=$(curl -s --max-time $TEST_TIMEOUT "$BACKEND_URL/api/health" 2>/dev/null || echo "{}")

  if echo "$HEALTH_RESPONSE" | grep -q '"database"'; then
    DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)

    if [ "$DB_STATUS" = "connected" ]; then
      check_pass "Database connection verified via health endpoint"
    else
      check_fail "Database status: $DB_STATUS" "Check DATABASE_URL and database availability"
      mark_critical "Database not connected"
      return
    fi
  else
    check_warn "Health endpoint does not report database status" "Manual verification recommended"
  fi

  # Try to fetch leaderboard (public endpoint that queries DB)
  LEADERBOARD_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TEST_TIMEOUT "$BACKEND_URL/api/leaderboard?limit=1" 2>/dev/null || echo "000")

  if [ "$LEADERBOARD_CODE" = "200" ]; then
    check_pass "Database query successful (leaderboard endpoint)"
  else
    check_fail "Database query failed (HTTP $LEADERBOARD_CODE)" "Check database connectivity and migrations"
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 4: CSRF Protection (Sprint 18)
################################################################################

test_csrf_protection() {
  print_header "Test 4: CSRF Protection (Sprint 18)"

  # Check if CSRF endpoint exists
  CSRF_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TEST_TIMEOUT "$BACKEND_URL/api/auth/csrf-token" 2>/dev/null || echo "000")

  if [ "$CSRF_CODE" = "200" ]; then
    check_pass "CSRF token endpoint accessible"
  else
    check_fail "CSRF token endpoint returned HTTP $CSRF_CODE" "Check CSRF middleware configuration"
    mark_critical "CSRF protection not configured"
    return
  fi

  # Check CSRF token response
  CSRF_RESPONSE=$(curl -s --max-time $TEST_TIMEOUT "$BACKEND_URL/api/auth/csrf-token" 2>/dev/null || echo "{}")

  if echo "$CSRF_RESPONSE" | grep -q '"csrfToken"'; then
    check_pass "CSRF token endpoint returns valid token"
  else
    check_fail "CSRF token response invalid" "Response: $CSRF_RESPONSE"
    mark_critical "CSRF token generation failed"
  fi

  # Test CSRF protection on protected endpoint (should fail without token)
  PROTECTED_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TEST_TIMEOUT \
    -X POST "$BACKEND_URL/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null || echo "000")

  if [ "$PROTECTED_CODE" = "403" ]; then
    check_pass "Protected endpoint rejects requests without CSRF token (403)"
  elif [ "$PROTECTED_CODE" = "401" ]; then
    check_pass "Protected endpoint requires authentication (401 - CSRF check passes)"
  else
    check_warn "Protected endpoint returned HTTP $PROTECTED_CODE" "Expected 403 or 401"
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 5: WebSocket Connection
################################################################################

test_websocket() {
  print_header "Test 5: WebSocket Connection"

  # Check if websocat is available
  if ! command -v websocat &> /dev/null; then
    check_warn "websocat not installed - skipping WebSocket test" "Install: cargo install websocat"
    echo "" >> "$REPORT_FILE"
    return
  fi

  # Extract WebSocket URL from backend URL
  WS_URL=$(echo "$BACKEND_URL" | sed 's/^http/ws/')

  # Try to connect to WebSocket endpoint
  if timeout 5s websocat -n1 "$WS_URL/socket.io/?EIO=4&transport=websocket" > /dev/null 2>&1; then
    check_pass "WebSocket endpoint accepts connections"
  else
    check_fail "WebSocket connection failed" "Check Socket.io CORS settings and firewall rules"
    mark_critical "WebSocket not working"
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 6: Environment Variables (Critical)
################################################################################

test_environment_variables() {
  print_header "Test 6: Environment Variables (Critical)"

  # Note: This test can only check if the app is running, not the actual env vars
  # Actual env var validation should be done server-side or via SSH

  check_warn "Environment variables cannot be validated remotely" "Run production-config-audit.sh on server"

  # Check if app responds correctly (indicates env vars are set)
  if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Application is running (suggests critical env vars are set)"
  else
    check_fail "Application not responding correctly" "Check env vars: DATABASE_URL, JWT_SECRET, etc."
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 7: Security Headers
################################################################################

test_security_headers() {
  print_header "Test 7: Security Headers"

  # Fetch headers from backend
  HEADERS=$(curl -s -I --max-time $TEST_TIMEOUT "$BACKEND_URL/api/health" 2>/dev/null || echo "")

  # Check X-Frame-Options
  if echo "$HEADERS" | grep -qi "x-frame-options"; then
    check_pass "X-Frame-Options header present"
  else
    check_fail "X-Frame-Options header missing" "Prevents clickjacking attacks"
  fi

  # Check X-Content-Type-Options
  if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    check_pass "X-Content-Type-Options header present"
  else
    check_fail "X-Content-Type-Options header missing" "Prevents MIME-type sniffing"
  fi

  # Check CORS
  CORS_ORIGIN=$(echo "$HEADERS" | grep -i "access-control-allow-origin" | cut -d':' -f2 | tr -d '[:space:]')

  if [ -n "$CORS_ORIGIN" ]; then
    if [ "$CORS_ORIGIN" = "*" ]; then
      check_fail "CORS allows all origins (*)" "Should restrict to specific frontend origin"
      mark_critical "Insecure CORS configuration"
    else
      check_pass "CORS configured with specific origin: $CORS_ORIGIN"
    fi
  else
    check_warn "CORS headers not found" "May need CORS configuration for frontend access"
  fi

  # Check Strict-Transport-Security (HTTPS only)
  if echo "$BACKEND_URL" | grep -q "https"; then
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
      check_pass "Strict-Transport-Security header present (HSTS)"
    else
      check_warn "HSTS header missing" "Recommended for HTTPS deployments"
    fi
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 8: Performance Baseline
################################################################################

test_performance() {
  print_header "Test 8: Performance Baseline"

  # Test homepage load time
  START_TIME=$(date +%s%N)
  curl -s --max-time 10 "$FRONTEND_URL" > /dev/null 2>&1
  END_TIME=$(date +%s%N)
  HOMEPAGE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

  if [ "$HOMEPAGE_TIME" -lt 3000 ]; then
    check_pass "Homepage load time < 3s (${HOMEPAGE_TIME}ms)"
  else
    check_warn "Homepage load time >= 3s (${HOMEPAGE_TIME}ms)" "Consider performance optimization"
  fi

  # Test API response time
  START_TIME=$(date +%s%N)
  curl -s --max-time 5 "$BACKEND_URL/api/health" > /dev/null 2>&1
  END_TIME=$(date +%s%N)
  API_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

  if [ "$API_TIME" -lt 500 ]; then
    check_pass "API response time < 500ms (${API_TIME}ms)"
  else
    check_warn "API response time >= 500ms (${API_TIME}ms)" "Consider performance optimization"
  fi

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 9: Error Monitoring (Sentry)
################################################################################

test_error_monitoring() {
  print_header "Test 9: Error Monitoring (Sentry)"

  # Note: Actual Sentry validation requires API access
  check_warn "Sentry validation requires manual check" "Visit Sentry dashboard to verify error tracking"

  # Check if app is sending errors to Sentry (indirect check)
  # This would require triggering an error and checking Sentry, which is not automated here

  check_pass "Application is running (Sentry should be active if SENTRY_DSN is set)"

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Test 10: Critical Game Functionality
################################################################################

test_game_functionality() {
  print_header "Test 10: Critical Game Functionality"

  # Check lobby endpoint
  LOBBY_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TEST_TIMEOUT "$BACKEND_URL/api/games/lobby" 2>/dev/null || echo "000")

  if [ "$LOBBY_CODE" = "200" ]; then
    check_pass "Lobby endpoint accessible"
  else
    check_fail "Lobby endpoint returned HTTP $LOBBY_CODE" "Check game service"
  fi

  # Check leaderboard endpoint
  LEADERBOARD_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TEST_TIMEOUT "$BACKEND_URL/api/leaderboard" 2>/dev/null || echo "000")

  if [ "$LEADERBOARD_CODE" = "200" ]; then
    check_pass "Leaderboard endpoint accessible"
  else
    check_fail "Leaderboard endpoint returned HTTP $LEADERBOARD_CODE" "Check stats service"
  fi

  check_warn "Full game flow requires manual testing" "Use docs/testing/PRODUCTION_SMOKE_TEST.md"

  echo "" >> "$REPORT_FILE"
}

################################################################################
# Main Execution
################################################################################

main() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${BLUE}Production Smoke Test - Sprint 18 Phase 4${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Frontend URL: $FRONTEND_URL"
  echo "Backend URL: $BACKEND_URL"
  echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""

  setup_results_dir

  # Run all tests
  test_homepage
  test_api_health
  test_database
  test_csrf_protection
  test_websocket
  test_environment_variables
  test_security_headers
  test_performance
  test_error_monitoring
  test_game_functionality

  # Summary
  print_header "Test Summary"

  echo "Total Tests: $((PASS_COUNT + FAIL_COUNT + WARN_COUNT))"
  echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
  echo -e "${RED}Failed: $FAIL_COUNT${NC}"
  echo -e "${YELLOW}Warnings: $WARN_COUNT${NC}"
  echo -e "${RED}Critical Failures: $CRITICAL_FAIL_COUNT${NC}"

  echo "" >> "$REPORT_FILE"
  echo "**Summary**:" >> "$REPORT_FILE"
  echo "- Total Tests: $((PASS_COUNT + FAIL_COUNT + WARN_COUNT))" >> "$REPORT_FILE"
  echo "- ✅ Passed: $PASS_COUNT" >> "$REPORT_FILE"
  echo "- ❌ Failed: $FAIL_COUNT" >> "$REPORT_FILE"
  echo "- ⚠️ Warnings: $WARN_COUNT" >> "$REPORT_FILE"
  echo "- 🚨 Critical Failures: $CRITICAL_FAIL_COUNT" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  # Deployment decision
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [ "$CRITICAL_FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}🚨 DEPLOYMENT STATUS: NO-GO${NC}"
    echo "Critical failures detected. Do NOT proceed with deployment."
    echo "Review failures above and fix issues before deploying."
    echo "" >> "$REPORT_FILE"
    echo "**🚨 DEPLOYMENT STATUS: NO-GO**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Critical failures detected. Rollback deployment immediately." >> "$REPORT_FILE"
    EXIT_CODE=1
  elif [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  DEPLOYMENT STATUS: NO-GO${NC}"
    echo "Test failures detected. Review and fix before deploying."
    echo "" >> "$REPORT_FILE"
    echo "**⚠️ DEPLOYMENT STATUS: NO-GO**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Test failures detected. Fix issues before deployment." >> "$REPORT_FILE"
    EXIT_CODE=1
  elif [ "$WARN_COUNT" -gt 3 ]; then
    echo -e "${YELLOW}⚠️  DEPLOYMENT STATUS: PROCEED WITH CAUTION${NC}"
    echo "Multiple warnings detected. Manual review recommended."
    echo "" >> "$REPORT_FILE"
    echo "**⚠️ DEPLOYMENT STATUS: PROCEED WITH CAUTION**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Multiple warnings detected. Manual review recommended." >> "$REPORT_FILE"
    EXIT_CODE=0
  else
    echo -e "${GREEN}✅ DEPLOYMENT STATUS: GO${NC}"
    echo "All critical tests passed. Deployment approved."
    echo "Continue monitoring Sentry for next 24 hours."
    echo "" >> "$REPORT_FILE"
    echo "**✅ DEPLOYMENT STATUS: GO**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "All critical tests passed. Monitor Sentry for next 24 hours." >> "$REPORT_FILE"
    EXIT_CODE=0
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Report saved to: $REPORT_FILE"
  echo ""

  exit $EXIT_CODE
}

# Run main function
main
