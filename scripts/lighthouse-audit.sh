#!/bin/bash
# Lighthouse Audit Script
# Sprint 18 Phase 2 Task 2.2
#
# Runs comprehensive Lighthouse audits for Performance, Accessibility, Best Practices, SEO

set -e

echo "🔍 Starting Lighthouse Audit"
echo "======================================"
echo ""

# Configuration
URL="${1:-http://localhost:3001}"
OUTPUT_DIR="lighthouse-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "📍 Target URL: $URL"
echo "📁 Output Directory: $OUTPUT_DIR"
echo ""

# Check if URL is accessible
echo "🔗 Checking URL accessibility..."
if ! curl -s --head "$URL" | head -n 1 | grep "HTTP" > /dev/null; then
  echo "❌ ERROR: URL is not accessible: $URL"
  echo "   Make sure the frontend is running (npm run dev)"
  exit 1
fi

echo "✅ URL is accessible"
echo ""

# Run Lighthouse Audit
echo "🚀 Running Lighthouse Audit..."
echo "   This may take 1-2 minutes..."
echo ""

npx lighthouse "$URL" \
  --output html \
  --output json \
  --output-path "$OUTPUT_DIR/lighthouse-${TIMESTAMP}" \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo \
  --emulated-form-factor=desktop \
  --throttling-method=devtools

echo ""
echo "======================================"
echo "✅ Lighthouse Audit Complete!"
echo ""
echo "📊 Results saved to:"
echo "   - $OUTPUT_DIR/lighthouse-${TIMESTAMP}.report.html"
echo "   - $OUTPUT_DIR/lighthouse-${TIMESTAMP}.report.json"
echo ""

# Extract key scores from JSON
if [ -f "$OUTPUT_DIR/lighthouse-${TIMESTAMP}.report.json" ]; then
  echo "📈 Audit Scores:"
  node -e "
    const fs = require('fs');
    const report = JSON.parse(fs.readFileSync('$OUTPUT_DIR/lighthouse-${TIMESTAMP}.report.json', 'utf8'));
    const scores = report.categories;

    console.log('   Performance:    ', (scores.performance.score * 100).toFixed(0), '/100');
    console.log('   Accessibility:  ', (scores.accessibility.score * 100).toFixed(0), '/100');
    console.log('   Best Practices: ', (scores['best-practices'].score * 100).toFixed(0), '/100');
    console.log('   SEO:            ', (scores.seo.score * 100).toFixed(0), '/100');
    console.log('');

    // Show target vs actual
    const targets = { performance: 90, accessibility: 90, 'best-practices': 90, seo: 90 };
    let allPassing = true;

    Object.entries(targets).forEach(([key, target]) => {
      const score = scores[key].score * 100;
      const status = score >= target ? '✅' : '❌';
      const label = key === 'best-practices' ? 'Best Practices' : key.charAt(0).toUpperCase() + key.slice(1);

      if (score < target) {
        console.log(status, label, 'below target (', score.toFixed(0), '/', target, ')');
        allPassing = false;
      }
    });

    if (allPassing) {
      console.log('🎉 All categories meet or exceed targets!');
    } else {
      console.log('');
      console.log('⚠️  Some categories need improvement. Review HTML report for details.');
    }

    process.exit(allPassing ? 0 : 1);
  "
fi

echo ""
echo "💡 Next Steps:"
echo "   1. Open the HTML report in your browser"
echo "   2. Review failing audits"
echo "   3. Implement recommended optimizations"
echo "   4. Re-run audit to verify improvements"
echo ""
echo "📖 View report:"
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "   open $OUTPUT_DIR/lighthouse-${TIMESTAMP}.report.html"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
  echo "   start $OUTPUT_DIR/lighthouse-${TIMESTAMP}.report.html"
else
  echo "   xdg-open $OUTPUT_DIR/lighthouse-${TIMESTAMP}.report.html"
fi
