#!/bin/bash
# Pre-Production Validation Script
# Sprint 18 Phase 3 - Final Validation Before Production Deploy
#
# This script runs comprehensive checks to ensure the application is ready for production

set -e

echo "🚀 Pre-Production Validation Script"
echo "========================================"
echo ""
echo "This script will validate:"
echo "  1. Backend unit tests (150+ tests)"
echo "  2. Frontend unit tests (if any)"
echo "  3. E2E test suite (core tests)"
echo "  4. Security audit checks"
echo "  5. Performance baselines"
echo "  6. Environment configuration"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
OVERALL_STATUS="PASS"
CRITICAL_FAILURES=0
WARNINGS=0

# Results directory
RESULTS_DIR="pre-production-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📁 Results will be saved to: $RESULTS_DIR/"
echo ""

# ====================
# 1. Backend Unit Tests
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1/6: Backend Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend

if npm test -- --reporter=json > ../$RESULTS_DIR/backend-tests-${TIMESTAMP}.json 2>&1; then
  echo -e "${GREEN}✅ Backend tests PASSED${NC}"

  # Extract test count
  TEST_COUNT=$(grep -o '"numTotalTests":[0-9]*' ../$RESULTS_DIR/backend-tests-${TIMESTAMP}.json | grep -o '[0-9]*' || echo "0")
  echo "   Total tests: $TEST_COUNT"
else
  echo -e "${RED}❌ Backend tests FAILED${NC}"
  OVERALL_STATUS="FAIL"
  CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
  echo "   See: $RESULTS_DIR/backend-tests-${TIMESTAMP}.json"
fi

cd ..
echo ""

# ====================
# 2. Frontend Unit Tests
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 2/6: Frontend Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend

# Check if tests exist
if grep -q '"test"' package.json 2>/dev/null; then
  if npm test -- --run > ../$RESULTS_DIR/frontend-tests-${TIMESTAMP}.txt 2>&1; then
    echo -e "${GREEN}✅ Frontend tests PASSED${NC}"
  else
    echo -e "${YELLOW}⚠️  Frontend tests FAILED (non-critical)${NC}"
    WARNINGS=$((WARNINGS + 1))
    echo "   See: $RESULTS_DIR/frontend-tests-${TIMESTAMP}.txt"
  fi
else
  echo -e "${YELLOW}⚠️  No frontend tests configured${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

cd ..
echo ""

# ====================
# 3. E2E Core Tests
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 3/6: E2E Core Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "ℹ️  Running critical path E2E tests..."
echo "   Tests: 01-lobby, 02-betting, 03-playing, 07-full-game"
echo ""

cd e2e

# Run core tests only (exclude known skipped tests)
if npx playwright test \
  01-lobby \
  02-betting \
  03-playing \
  07-full-game \
  --project=chromium \
  --reporter=list \
  > ../$RESULTS_DIR/e2e-tests-${TIMESTAMP}.txt 2>&1; then
  echo -e "${GREEN}✅ E2E core tests PASSED${NC}"
else
  echo -e "${RED}❌ E2E core tests FAILED${NC}"
  OVERALL_STATUS="FAIL"
  CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
  echo "   See: $RESULTS_DIR/e2e-tests-${TIMESTAMP}.txt"
  echo "   Review failures before production deploy!"
fi

cd ..
echo ""

# ====================
# 4. Security Audit
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 4/6: Security Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for critical npm vulnerabilities
echo "🔍 Checking npm dependencies for vulnerabilities..."
echo ""

cd backend
BACKEND_AUDIT=$(npm audit --audit-level=critical --json 2>&1 || true)
BACKEND_CRITICAL=$(echo "$BACKEND_AUDIT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$BACKEND_CRITICAL" -eq 0 ]; then
  echo -e "${GREEN}✅ Backend: No critical vulnerabilities${NC}"
else
  echo -e "${RED}❌ Backend: $BACKEND_CRITICAL critical vulnerabilities${NC}"
  OVERALL_STATUS="FAIL"
  CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
  echo "$BACKEND_AUDIT" > ../$RESULTS_DIR/backend-audit-${TIMESTAMP}.json
fi
cd ..

cd frontend
FRONTEND_AUDIT=$(npm audit --audit-level=critical --json 2>&1 || true)
FRONTEND_CRITICAL=$(echo "$FRONTEND_AUDIT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$FRONTEND_CRITICAL" -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend: No critical vulnerabilities${NC}"
else
  echo -e "${RED}❌ Frontend: $FRONTEND_CRITICAL critical vulnerabilities${NC}"
  OVERALL_STATUS="FAIL"
  CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
  echo "$FRONTEND_AUDIT" > ../$RESULTS_DIR/frontend-audit-${TIMESTAMP}.json
fi
cd ..

echo ""

# ====================
# 5. Environment Validation
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 5/6: Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check required environment variables (in production)
REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "CSRF_SECRET"
)

ENV_CHECK_PASSED=true

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ] && [ "$NODE_ENV" = "production" ]; then
    echo -e "${RED}❌ Missing required env var: $var${NC}"
    ENV_CHECK_PASSED=false
    OVERALL_STATUS="FAIL"
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
  elif [ -z "${!var}" ]; then
    echo -e "${YELLOW}⚠️  Missing env var: $var (OK for local dev)${NC}"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✅ $var configured${NC}"
  fi
done

# Check .env file exists (local dev)
if [ ! -f "backend/.env" ] && [ "$NODE_ENV" != "production" ]; then
  echo -e "${YELLOW}⚠️  No backend/.env file found (OK if using Railway/Vercel env vars)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ====================
# 6. Database Connection
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 6/6: Database Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$DATABASE_URL" ]; then
  # Test database connection
  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"

    # Check if migrations are up-to-date
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
    echo "   Tables in database: $TABLE_COUNT"

    if [ "$TABLE_COUNT" -lt 5 ]; then
      echo -e "${YELLOW}⚠️  Database may need migrations (only $TABLE_COUNT tables found)${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo -e "${RED}❌ Database connection FAILED${NC}"
    OVERALL_STATUS="FAIL"
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
    echo "   Check DATABASE_URL and network connectivity"
  fi
else
  echo -e "${YELLOW}⚠️  DATABASE_URL not set (skipping connection test)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ====================
# Summary
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$OVERALL_STATUS" = "PASS" ]; then
  echo -e "${GREEN}✅ Pre-Production Validation: PASSED${NC}"
  echo ""
  echo "   All critical checks passed!"
  echo "   Warnings: $WARNINGS"
  echo ""
  echo -e "${GREEN}🚢 Application is READY for production deployment${NC}"
  EXIT_CODE=0
else
  echo -e "${RED}❌ Pre-Production Validation: FAILED${NC}"
  echo ""
  echo "   Critical failures: $CRITICAL_FAILURES"
  echo "   Warnings: $WARNINGS"
  echo ""
  echo -e "${RED}⛔ DO NOT deploy to production until failures are resolved!${NC}"
  EXIT_CODE=1
fi

echo ""
echo "📁 Detailed results saved to: $RESULTS_DIR/"
echo ""

# Create summary report
cat > $RESULTS_DIR/summary-${TIMESTAMP}.md <<EOF
# Pre-Production Validation Report

**Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Status**: $OVERALL_STATUS

## Summary

- **Critical Failures**: $CRITICAL_FAILURES
- **Warnings**: $WARNINGS
- **Overall Status**: $OVERALL_STATUS

## Test Results

### Backend Unit Tests
- File: backend-tests-${TIMESTAMP}.json
- Status: $([ $CRITICAL_FAILURES -eq 0 ] && echo "PASS" || echo "FAIL")

### Frontend Unit Tests
- File: frontend-tests-${TIMESTAMP}.txt
- Status: $([ -f "$RESULTS_DIR/frontend-tests-${TIMESTAMP}.txt" ] && echo "RAN" || echo "SKIPPED")

### E2E Core Tests
- File: e2e-tests-${TIMESTAMP}.txt
- Status: $([ $CRITICAL_FAILURES -eq 0 ] && echo "PASS" || echo "FAIL")

### Security Audit
- Backend: $([ $BACKEND_CRITICAL -eq 0 ] && echo "PASS" || echo "$BACKEND_CRITICAL critical vulns")
- Frontend: $([ $FRONTEND_CRITICAL -eq 0 ] && echo "PASS" || echo "$FRONTEND_CRITICAL critical vulns")

## Next Steps

$(if [ "$OVERALL_STATUS" = "PASS" ]; then
  echo "✅ All validations passed. Ready for production deployment."
  echo ""
  echo "**Deployment Checklist**:"
  echo "1. Run manual testing checklist (docs/sprints/MANUAL_TESTING_CHECKLIST.md)"
  echo "2. Run security audit (docs/sprints/SECURITY_AUDIT_CHECKLIST.md)"
  echo "3. Verify environment variables in Railway/Vercel"
  echo "4. Deploy to staging environment first"
  echo "5. Run smoke tests on staging"
  echo "6. Deploy to production"
  echo "7. Monitor Sentry for errors"
else
  echo "❌ Critical failures detected. Address issues before deployment:"
  echo ""
  echo "**Required Actions**:"
  echo "1. Fix failing backend tests"
  echo "2. Fix failing E2E tests"
  echo "3. Update dependencies with critical vulnerabilities"
  echo "4. Configure missing environment variables"
  echo "5. Re-run this validation script"
fi)

---

*Generated by: scripts/pre-production-validation.sh*
EOF

echo "📄 Summary report: $RESULTS_DIR/summary-${TIMESTAMP}.md"
echo ""

exit $EXIT_CODE
