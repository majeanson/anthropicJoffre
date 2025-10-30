#!/bin/bash

# Create dated results folder
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
RESULTS_DIR="test-results-archive/${DATE}"
mkdir -p "${RESULTS_DIR}"

echo "=========================================="
echo "E2E Test Suite with Safety Checks"
echo "=========================================="
echo ""

# Health check function
check_health() {
  local service=$1
  local url=$2
  local max_attempts=30
  local attempt=0

  echo "Checking $service at $url..."

  while [ $attempt -lt $max_attempts ]; do
    if curl -s "$url" > /dev/null 2>&1; then
      echo "✅ $service is ready!"
      return 0
    fi
    attempt=$((attempt + 1))
    echo "  Waiting for $service... (attempt $attempt/$max_attempts)"
    sleep 1
  done

  echo "❌ $service failed to start after $max_attempts seconds"
  return 1
}

# TypeScript check function
check_typescript() {
  local project=$1
  local path=$2

  echo "Checking TypeScript in $project..."

  cd "$path" || return 1

  if npx tsc --noEmit > /dev/null 2>&1; then
    echo "✅ $project TypeScript check passed!"
    cd - > /dev/null
    return 0
  else
    echo "❌ $project has TypeScript errors!"
    echo ""
    echo "Running TypeScript check to show errors:"
    npx tsc --noEmit
    cd - > /dev/null
    return 1
  fi
}

# Check TypeScript in backend
if ! check_typescript "Backend" "../backend"; then
  echo ""
  echo "ERROR: Backend has TypeScript errors!"
  echo ""
  echo "Please fix TypeScript errors before running tests:"
  echo "  cd backend"
  echo "  npx tsc --noEmit"
  echo ""
  exit 1
fi

# Check TypeScript in frontend
if ! check_typescript "Frontend" "../frontend"; then
  echo ""
  echo "ERROR: Frontend has TypeScript errors!"
  echo ""
  echo "Please fix TypeScript errors before running tests:"
  echo "  cd frontend"
  echo "  npx tsc --noEmit"
  echo ""
  exit 1
fi

echo ""

# Check backend health
if ! check_health "Backend" "http://localhost:3000/api/health"; then
  echo ""
  echo "ERROR: Backend server is not running!"
  echo ""
  echo "Please start the backend server first:"
  echo "  cd backend"
  echo "  npm run dev"
  echo ""
  exit 1
fi

# Check frontend health
if ! check_health "Frontend" "http://localhost:5173"; then
  echo ""
  echo "ERROR: Frontend server is not running!"
  echo ""
  echo "Please start the frontend server first:"
  echo "  cd frontend"
  echo "  npm run dev"
  echo ""
  exit 1
fi

echo ""
echo "✅ All safety checks passed!"
echo "  - TypeScript: Backend & Frontend"
echo "  - Servers: Backend & Frontend"
echo ""
echo "Results will be saved to: ${RESULTS_DIR}"
echo ""
echo "Running full E2E test suite..."
echo ""

# Run tests with detailed output
npx playwright test \
  --reporter=html,line \
  --output="${RESULTS_DIR}/artifacts" \
  > "${RESULTS_DIR}/test-output.txt" 2>&1

# Save the exit code
EXIT_CODE=$?

# Copy HTML report
if [ -d "playwright-report" ]; then
  cp -r playwright-report "${RESULTS_DIR}/html-report"
fi

# Create summary file
cat > "${RESULTS_DIR}/summary.md" << SUMMARY
# Test Run Summary

**Date**: ${DATE}
**Exit Code**: ${EXIT_CODE}

## Safety Checks (All Passed)
✅ TypeScript: Backend (npx tsc --noEmit)
✅ TypeScript: Frontend (npx tsc --noEmit)
✅ Backend Health: http://localhost:3000/api/health
✅ Frontend Health: http://localhost:5173

## Quick Stats
\`\`\`
$(tail -n 20 "${RESULTS_DIR}/test-output.txt" | grep -E "passed|failed|skipped" || echo "No summary found")
\`\`\`

## Files
- test-output.txt: Full test output
- html-report/: HTML report (open index.html)
- artifacts/: Screenshots and traces

## View Results
\`\`\`bash
# View text output
cat ${RESULTS_DIR}/test-output.txt

# Open HTML report
npx playwright show-report ${RESULTS_DIR}/html-report
\`\`\`
SUMMARY

echo ""
echo "=========================================="
echo "✅ Test run complete!"
echo "=========================================="
echo ""
echo "📁 Results saved to: ${RESULTS_DIR}"
echo "📊 Summary: ${RESULTS_DIR}/summary.md"
echo ""

# Display quick stats
tail -n 10 "${RESULTS_DIR}/test-output.txt" | grep -E "passed|failed|skipped" || true

echo ""
echo "Exit code: ${EXIT_CODE}"

exit ${EXIT_CODE}
