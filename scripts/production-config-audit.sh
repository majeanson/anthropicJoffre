#!/bin/bash
# Production Configuration Audit Script
# Sprint 18 Phase 4 Task 4.1
#
# Audits production environment configuration for security and correctness

set -e

echo "🔍 Production Configuration Audit"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0
CRITICAL_ISSUES=0

# Results directory
RESULTS_DIR="production-audit-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/audit-report-${TIMESTAMP}.md"

# Start report
cat > "$REPORT_FILE" <<EOF
# Production Config Audit Report

**Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Auditor**: Automated Script
**Environment**: ${NODE_ENV:-unknown}

## Summary

EOF

echo "📁 Results will be saved to: $REPORT_FILE"
echo ""

# Helper functions
check_pass() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
  echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
  echo -e "${RED}❌ $1${NC}"
  echo "   $2"
  echo "### ❌ FAILED: $1" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "$2" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
}

check_warn() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  WARNINGS=$((WARNINGS + 1))
  echo -e "${YELLOW}⚠️  $1${NC}"
  echo "   $2"
  echo "### ⚠️  WARNING: $1" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "$2" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
}

mark_critical() {
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
  echo -e "${RED}🚨 CRITICAL: $1${NC}"
}

# ====================
# 1. Environment Variables Check
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1/10: Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check critical variables
CRITICAL_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET" "CSRF_SECRET")

for var in "${CRITICAL_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    check_fail "$var is not set" "This is a critical security variable"
    mark_critical "$var missing"
  else
    # Check length for secrets
    if [[ "$var" == *"SECRET"* ]]; then
      LENGTH=${#!var}
      if [ "$LENGTH" -lt 64 ]; then
        check_fail "$var is too short ($LENGTH chars)" "Secrets should be 64+ characters"
        mark_critical "$var too short"
      else
        check_pass "$var is set and has sufficient length ($LENGTH chars)"
      fi
    else
      check_pass "$var is set"
    fi
  fi
done

# Check JWT_SECRET != JWT_REFRESH_SECRET
if [ -n "$JWT_SECRET" ] && [ -n "$JWT_REFRESH_SECRET" ]; then
  if [ "$JWT_SECRET" = "$JWT_REFRESH_SECRET" ]; then
    check_fail "JWT_SECRET == JWT_REFRESH_SECRET" "These must be different values"
    mark_critical "Reused JWT secrets"
  else
    check_pass "JWT secrets are different"
  fi
fi

# Check NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
  check_pass "NODE_ENV=production"
elif [ -z "$NODE_ENV" ]; then
  check_warn "NODE_ENV not set" "Should be 'production' in production"
else
  check_fail "NODE_ENV=$NODE_ENV" "Should be 'production'"
fi

echo ""

# ====================
# 2. Database Configuration
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 2/10: Database Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$DATABASE_URL" ]; then
  # Check SSL mode
  if [[ "$DATABASE_URL" == *"sslmode=require"* ]] || [[ "$DATABASE_URL" == *"sslmode=verify-full"* ]]; then
    check_pass "Database SSL enabled"
  else
    check_fail "Database SSL not enforced" "Add 'sslmode=require' to DATABASE_URL"
    mark_critical "Database SSL disabled"
  fi

  # Test connection
  if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
      check_pass "Database connection successful"

      # Check table count
      TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
      if [ "$TABLE_COUNT" -gt 5 ]; then
        check_pass "Database has $TABLE_COUNT tables (migrations applied)"
      else
        check_warn "Database has only $TABLE_COUNT tables" "Migrations may be missing"
      fi
    else
      check_fail "Database connection failed" "Check DATABASE_URL and network connectivity"
      mark_critical "Cannot connect to database"
    fi
  else
    check_warn "psql not installed" "Cannot test database connection"
  fi
else
  check_fail "DATABASE_URL not set" "Database connection required"
  mark_critical "No database configured"
fi

echo ""

# ====================
# 3. Security Headers (if backend running)
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 3/10: Security Headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

if curl -s --head "$BACKEND_URL/api/health" > /dev/null 2>&1; then
  HEADERS=$(curl -s -I "$BACKEND_URL/api/health" 2>/dev/null)

  # Check critical security headers
  if echo "$HEADERS" | grep -qi "x-frame-options"; then
    check_pass "X-Frame-Options header present"
  else
    check_fail "X-Frame-Options header missing" "Prevents clickjacking attacks"
  fi

  if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    check_pass "X-Content-Type-Options header present"
  else
    check_fail "X-Content-Type-Options header missing" "Prevents MIME-type sniffing"
  fi

  if echo "$HEADERS" | grep -qi "strict-transport-security"; then
    check_pass "Strict-Transport-Security header present (HSTS)"
  else
    check_warn "HSTS header missing" "Important for HTTPS enforcement (may be handled by proxy)"
  fi

  # Check CORS
  CORS_ORIGIN=$(echo "$HEADERS" | grep -i "access-control-allow-origin" | cut -d':' -f2 | tr -d ' \r\n')
  if [ "$CORS_ORIGIN" = "*" ]; then
    check_fail "CORS allows all origins (*)" "Should restrict to specific origins"
    mark_critical "Insecure CORS configuration"
  elif [ -n "$CORS_ORIGIN" ]; then
    check_pass "CORS restricted to: $CORS_ORIGIN"
  else
    check_warn "CORS headers not found" "May be intentional or configured at proxy level"
  fi
else
  check_warn "Backend not accessible at $BACKEND_URL" "Cannot check security headers"
fi

echo ""

# ====================
# 4. SSL/TLS Configuration
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 4/10: SSL/TLS Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$BACKEND_URL" ] && [[ "$BACKEND_URL" == https://* ]]; then
  DOMAIN=$(echo "$BACKEND_URL" | sed 's|https://||' | cut -d'/' -f1)

  if command -v openssl &> /dev/null; then
    # Check certificate expiration
    CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d'=' -f2)

    if [ -n "$CERT_EXPIRY" ]; then
      check_pass "SSL certificate valid until: $CERT_EXPIRY"

      # Check if expiring soon (< 30 days)
      EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null)
      NOW_EPOCH=$(date +%s)
      DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

      if [ "$DAYS_LEFT" -lt 30 ]; then
        check_warn "SSL certificate expires in $DAYS_LEFT days" "Renew soon"
      fi
    else
      check_warn "Could not check SSL certificate expiration" "Verify manually"
    fi

    # Check TLS version
    if echo | openssl s_client -connect "$DOMAIN":443 -tls1_2 2>/dev/null | grep -q "TLSv1.2"; then
      check_pass "TLS 1.2+ supported"
    else
      check_warn "Could not verify TLS version" "Ensure TLS 1.2+ is enabled"
    fi
  else
    check_warn "openssl not installed" "Cannot check SSL certificate"
  fi
else
  check_warn "Backend URL not HTTPS or not set" "Production should use HTTPS"
fi

echo ""

# ====================
# 5. Dependency Security
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 5/10: Dependency Security"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend dependencies
if [ -f "backend/package.json" ]; then
  cd backend
  AUDIT_OUTPUT=$(npm audit --audit-level=critical --json 2>&1 || true)
  CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
  HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")

  if [ "$CRITICAL_VULNS" -eq 0 ]; then
    check_pass "Backend: No critical vulnerabilities"
  else
    check_fail "Backend: $CRITICAL_VULNS critical vulnerabilities" "Run 'npm audit fix'"
    mark_critical "Backend has $CRITICAL_VULNS critical vulnerabilities"
  fi

  if [ "$HIGH_VULNS" -eq 0 ]; then
    check_pass "Backend: No high vulnerabilities"
  else
    check_warn "Backend: $HIGH_VULNS high vulnerabilities" "Review and fix if possible"
  fi

  cd ..
else
  check_warn "backend/package.json not found" "Cannot audit backend dependencies"
fi

# Frontend dependencies
if [ -f "frontend/package.json" ]; then
  cd frontend
  AUDIT_OUTPUT=$(npm audit --audit-level=critical --json 2>&1 || true)
  CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
  HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")

  if [ "$CRITICAL_VULNS" -eq 0 ]; then
    check_pass "Frontend: No critical vulnerabilities"
  else
    check_fail "Frontend: $CRITICAL_VULNS critical vulnerabilities" "Run 'npm audit fix'"
    mark_critical "Frontend has $CRITICAL_VULNS critical vulnerabilities"
  fi

  if [ "$HIGH_VULNS" -eq 0 ]; then
    check_pass "Frontend: No high vulnerabilities"
  else
    check_warn "Frontend: $HIGH_VULNS high vulnerabilities" "Review and fix if possible"
  fi

  cd ..
else
  check_warn "frontend/package.json not found" "Cannot audit frontend dependencies"
fi

echo ""

# ====================
# 6. Git Security
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 6/10: Git Security"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check .gitignore
if [ -f ".gitignore" ]; then
  if grep -q ".env" ".gitignore"; then
    check_pass ".env is in .gitignore"
  else
    check_fail ".env not in .gitignore" "Add .env to prevent committing secrets"
    mark_critical ".env not ignored by git"
  fi

  if grep -q "node_modules" ".gitignore"; then
    check_pass "node_modules is in .gitignore"
  else
    check_warn "node_modules not in .gitignore" "Should ignore node_modules"
  fi
else
  check_fail ".gitignore not found" "Create .gitignore file"
fi

# Check for committed secrets (simple scan)
if git rev-parse --git-dir > /dev/null 2>&1; then
  POTENTIAL_SECRETS=$(git grep -i "password\|secret\|api_key\|token" -- '*.js' '*.ts' '*.json' 2>/dev/null | grep -v "test\|spec\|docs" || true)

  if [ -n "$POTENTIAL_SECRETS" ]; then
    check_warn "Potential secrets found in code" "Review: git grep -i 'password|secret|api_key'"
  else
    check_pass "No obvious secrets in code"
  fi
fi

echo ""

# ====================
# 7. File Permissions
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 7/10: File Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists (shouldn't in production, but check anyway)
if [ -f ".env" ]; then
  PERMS=$(stat -c "%a" .env 2>/dev/null || stat -f "%Lp" .env 2>/dev/null)
  if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
    check_pass ".env has secure permissions ($PERMS)"
  else
    check_warn ".env has loose permissions ($PERMS)" "Should be 600 or 400"
  fi
else
  check_pass ".env not found (using environment variables)"
fi

# Check script permissions
SCRIPTS=("scripts/*.sh" "load-tests/*.sh")
for pattern in "${SCRIPTS[@]}"; do
  for script in $pattern; do
    if [ -f "$script" ]; then
      if [ -x "$script" ]; then
        check_pass "$script is executable"
      else
        check_warn "$script is not executable" "Run: chmod +x $script"
      fi
    fi
  done
done

echo ""

# ====================
# 8. Build Validation
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 8/10: Build Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check backend build
if [ -d "backend/dist" ]; then
  check_pass "Backend build directory exists"
elif [ -f "backend/tsconfig.json" ]; then
  check_warn "Backend not built" "Run: cd backend && npm run build"
fi

# Check frontend build
if [ -d "frontend/dist" ]; then
  check_pass "Frontend build directory exists"

  # Check bundle size
  BUNDLE_SIZE=$(du -sh frontend/dist 2>/dev/null | cut -f1)
  check_pass "Frontend bundle size: $BUNDLE_SIZE"

  # Check for source maps in production
  if ls frontend/dist/assets/*.map > /dev/null 2>&1; then
    check_warn "Source maps found in production build" "Consider removing or uploading to Sentry"
  else
    check_pass "No source maps in production build"
  fi
else
  check_warn "Frontend not built" "Run: cd frontend && npm run build"
fi

echo ""

# ====================
# 9. Documentation
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 9/10: Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for required documentation
REQUIRED_DOCS=(
  "README.md"
  ".env.example"
  "docs/deployment/RAILWAY_DEPLOY.md"
  "docs/deployment/PRODUCTION_CONFIG_AUDIT.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    check_pass "$doc exists"
  else
    check_warn "$doc missing" "Create documentation"
  fi
done

echo ""

# ====================
# 10. Backup Configuration
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 10/10: Backup Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check backup scripts
if [ -f "scripts/backup-database.sh" ]; then
  check_pass "Backup script exists"
else
  check_warn "Backup script missing" "Create scripts/backup-database.sh"
fi

# Check for backup documentation
if [ -f "docs/deployment/DATABASE_BACKUP.md" ]; then
  check_pass "Backup documentation exists"
else
  check_warn "Backup documentation missing" "Create docs/deployment/DATABASE_BACKUP.md"
fi

echo ""

# ====================
# Generate Report
# ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Audit Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update report summary
sed -i.bak "s/## Summary/## Summary\n\n- **Total Checks**: $TOTAL_CHECKS\n- **Passed**: $PASSED_CHECKS\n- **Failed**: $FAILED_CHECKS\n- **Warnings**: $WARNINGS\n- **Critical Issues**: $CRITICAL_ISSUES/" "$REPORT_FILE"
rm "${REPORT_FILE}.bak" 2>/dev/null || true

if [ $CRITICAL_ISSUES -eq 0 ] && [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✅ Production Configuration Audit: PASSED${NC}"
  echo ""
  echo "   All critical checks passed!"
  echo "   Passed: $PASSED_CHECKS"
  echo "   Warnings: $WARNINGS"
  echo ""
  echo -e "${GREEN}🚢 Configuration is PRODUCTION READY${NC}"

  echo "" >> "$REPORT_FILE"
  echo "## Overall Status" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "✅ **PASSED** - Configuration is production ready" >> "$REPORT_FILE"

  EXIT_CODE=0
else
  echo -e "${RED}❌ Production Configuration Audit: FAILED${NC}"
  echo ""
  echo "   Critical issues: $CRITICAL_ISSUES"
  echo "   Failed checks: $FAILED_CHECKS"
  echo "   Warnings: $WARNINGS"
  echo ""
  echo -e "${RED}⛔ DO NOT deploy to production until issues are resolved!${NC}"

  echo "" >> "$REPORT_FILE"
  echo "## Overall Status" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "❌ **FAILED** - Critical issues must be fixed before deployment" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**Critical Issues**: $CRITICAL_ISSUES" >> "$REPORT_FILE"

  EXIT_CODE=1
fi

echo ""
echo "📄 Full report: $REPORT_FILE"
echo ""

exit $EXIT_CODE
