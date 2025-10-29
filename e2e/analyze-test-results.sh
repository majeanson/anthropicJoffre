#!/bin/bash
# Analyze E2E test results for debugging

echo "=== E2E Test Results Analysis ==="
echo

if [ ! -f "test-output.txt" ]; then
  echo "❌ test-output.txt not found. Run 'npm run test:all' first."
  exit 1
fi

# Count results
total=$(grep -c "^\s*[✓✘-]" test-output.txt || echo "0")
passed=$(grep -c "^\s*✓" test-output.txt || echo "0")
failed=$(grep -c "^\s*✘" test-output.txt || echo "0")
skipped=$(grep -c "^\s*-" test-output.txt || echo "0")

echo "📊 Summary:"
echo "  Total:   $total tests"
echo "  ✓ Passed: $passed tests"
echo "  ✘ Failed: $failed tests"
echo "  - Skipped: $skipped tests"
echo

if [ "$failed" -gt 0 ]; then
  echo "❌ Failed Tests:"
  grep "^\s*✘" test-output.txt | sed 's/^/  /'
  echo

  echo "📝 Failure Details:"
  echo "  Check playwright-report/index.html for detailed errors"
  echo "  Or run: npx playwright show-report"
fi

echo
echo "✅ Test output saved to: test-output.txt"
