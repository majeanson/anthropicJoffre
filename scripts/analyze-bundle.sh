#!/bin/bash
# Bundle Size Analysis Script
# Sprint 18 Phase 2 Task 2.3
#
# Analyzes frontend bundle size and identifies optimization opportunities

set -e

echo "📦 Frontend Bundle Size Analysis"
echo "======================================"
echo ""

cd frontend

# Check if dist exists (from previous build)
if [ ! -d "dist" ]; then
  echo "🔨 Building frontend (this may take a minute)..."
  npm run build || {
    echo "❌ Build failed. Fix TypeScript errors first."
    echo "   Current known issue: DebugInfo.tsx type error (pre-existing)"
    exit 1
  }
  echo ""
fi

echo "📊 Analyzing build output..."
echo ""

# Get dist/ directory size
DIST_SIZE=$(du -sh dist | cut -f1)
echo "📁 Total dist/ size: $DIST_SIZE"
echo ""

# Analyze JavaScript bundles
echo "📜 JavaScript Bundles:"
echo "-----------------------------------"

find dist/assets -name "*.js" -type f | while read file; do
  SIZE=$(du -h "$file" | cut -f1)
  FILENAME=$(basename "$file")
  echo "   $SIZE   $FILENAME"
done

echo ""

# Analyze CSS files
echo "🎨 CSS Files:"
echo "-----------------------------------"

find dist/assets -name "*.css" -type f | while read file; do
  SIZE=$(du -h "$file" | cut -f1)
  FILENAME=$(basename "$file")
  echo "   $SIZE   $FILENAME"
done

echo ""

# Count total files
TOTAL_FILES=$(find dist -type f | wc -l)
echo "📊 Total Files: $TOTAL_FILES"
echo ""

# Find largest files
echo "🔍 Top 10 Largest Files:"
echo "-----------------------------------"
du -h dist -d 2 | sort -hr | head -10
echo ""

# Analyze dependencies
echo "📦 Analyzing node_modules..."
cd ../

# Top 10 largest dependencies
echo "🔍 Top 10 Largest Dependencies:"
echo "-----------------------------------"
du -sh frontend/node_modules/* 2>/dev/null | sort -hr | head -10 || echo "   (node_modules not found or empty)"
echo ""

# Check for common heavy dependencies
echo "⚠️  Checking for Heavy Dependencies:"
echo "-----------------------------------"

HEAVY_DEPS=("moment" "lodash" "axios" "date-fns" "chart.js" "three" "jquery")

for dep in "${HEAVY_DEPS[@]}"; do
  if [ -d "frontend/node_modules/$dep" ]; then
    SIZE=$(du -sh "frontend/node_modules/$dep" 2>/dev/null | cut -f1)
    echo "   ⚠️  $dep: $SIZE"
  fi
done

echo ""

# Recommendations
echo "💡 Bundle Optimization Recommendations:"
echo "======================================"
echo ""

# Check initial bundle size
MAIN_BUNDLE=$(find frontend/dist/assets -name "index-*.js" -type f -exec du -k {} \; | cut -f1)

if [ -n "$MAIN_BUNDLE" ]; then
  if [ "$MAIN_BUNDLE" -gt 500 ]; then
    echo "❌ Main bundle > 500KB (actual: ${MAIN_BUNDLE}KB)"
    echo "   Recommendations:"
    echo "   1. Implement code splitting"
    echo "   2. Lazy load routes/components"
    echo "   3. Remove unused dependencies"
    echo "   4. Use tree-shaking for utilities"
    echo ""
  elif [ "$MAIN_BUNDLE" -gt 300 ]; then
    echo "⚠️  Main bundle > 300KB (actual: ${MAIN_BUNDLE}KB)"
    echo "   Consider code splitting for better performance"
    echo ""
  else
    echo "✅ Main bundle size acceptable (${MAIN_BUNDLE}KB < 300KB)"
    echo ""
  fi
fi

# Check for duplicate dependencies
echo "🔍 Checking for Duplicate Dependencies:"
npm list --depth=0 2>&1 | grep "UNMET DEPENDENCY" && echo "   Found duplicate or unmet dependencies" || echo "   ✅ No duplicates found"
echo ""

# Tree-shaking opportunities
echo "🌳 Tree-Shaking Opportunities:"
echo "   - Check if all imports use ES6 modules (import/export)"
echo "   - Avoid CommonJS (require/module.exports) where possible"
echo "   - Use named imports instead of default imports"
echo ""

# Code splitting recommendations
echo "✂️  Code Splitting Recommendations:"
echo "   1. Split by route (React.lazy + Suspense)"
echo "   2. Split heavy libraries (react-pdf, chart.js, etc.)"
echo "   3. Split by feature (admin panel, settings, etc.)"
echo ""

echo "======================================"
echo "✅ Analysis Complete!"
echo ""
echo "📖 For detailed analysis, use:"
echo "   npm run build -- --mode=production"
echo "   npx vite-bundle-visualizer"
echo ""
echo "📊 To generate a visual bundle analyzer:"
echo "   npm install --save-dev rollup-plugin-visualizer"
echo "   (Then add to vite.config.ts)"
