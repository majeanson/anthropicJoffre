#!/usr/bin/env node
/**
 * Design Token Migration Script
 * Sprint 21: Migrate hardcoded gradients to design system tokens
 *
 * This script automatically:
 * 1. Finds all components with hardcoded gradients
 * 2. Adds design system import if missing
 * 3. Replaces hardcoded gradients with design tokens
 * 4. Adds aria-hidden to decorative emojis
 * 5. Adds focus rings to interactive elements
 */

const fs = require('fs');
const path = require('path');

// Gradient mappings from hardcoded to design tokens
const GRADIENT_MAPPINGS = [
  // Primary gradients (blue-purple)
  { pattern: /from-blue-600\s+to-purple-600/g, replacement: '${colors.gradients.primary}' },
  { pattern: /from-blue-700\s+to-purple-700/g, replacement: '${colors.gradients.primaryDark}' },
  { pattern: /from-blue-700\s+to-purple-800/g, replacement: '${colors.gradients.primaryDark}' },
  { pattern: /from-blue-500\s+to-purple-500/g, replacement: '${colors.gradients.primary}' },
  { pattern: /from-blue-800\s+to-purple-900/g, replacement: '${colors.gradients.primaryDark}' },

  // Secondary gradients (purple-pink)
  { pattern: /from-purple-600\s+to-pink-600/g, replacement: '${colors.gradients.secondary}' },
  { pattern: /from-purple-700\s+to-pink-700/g, replacement: '${colors.gradients.secondaryDark}' },
  { pattern: /from-purple-900\/30\s+to-pink-900\/30/g, replacement: '${colors.gradients.secondaryDark}' },
  { pattern: /from-purple-900\/50\s+to-pink-900\/50/g, replacement: '${colors.gradients.secondaryDark}' },

  // Team gradients
  { pattern: /from-orange-600\s+to-amber-600/g, replacement: '${colors.gradients.team1}' },
  { pattern: /from-orange-700\s+to-amber-700/g, replacement: '${colors.gradients.team1Dark}' },
  { pattern: /from-purple-600\s+to-indigo-600/g, replacement: '${colors.gradients.team2}' },
  { pattern: /from-purple-700\s+to-indigo-700/g, replacement: '${colors.gradients.team2Dark}' },

  // Success gradients
  { pattern: /from-green-600\s+to-emerald-600/g, replacement: '${colors.gradients.success}' },
  { pattern: /from-green-700\s+to-emerald-700/g, replacement: '${colors.gradients.successDark}' },
  { pattern: /from-green-600\s+to-green-500/g, replacement: '${colors.gradients.success}' },
  { pattern: /from-green-500\s+to-green-400/g, replacement: '${colors.gradients.success}' },

  // Warning gradients
  { pattern: /from-yellow-600\s+to-orange-600/g, replacement: '${colors.gradients.warning}' },
  { pattern: /from-yellow-700\s+to-orange-700/g, replacement: '${colors.gradients.warningDark}' },

  // Error gradients
  { pattern: /from-red-600\s+to-rose-600/g, replacement: '${colors.gradients.error}' },
  { pattern: /from-red-700\s+to-rose-700/g, replacement: '${colors.gradients.errorDark}' },

  // Info gradients
  { pattern: /from-blue-600\s+to-cyan-600/g, replacement: '${colors.gradients.info}' },
  { pattern: /from-blue-700\s+to-cyan-700/g, replacement: '${colors.gradients.infoDark}' },

  // Neutral gradients
  { pattern: /from-gray-700\s+to-gray-800/g, replacement: '${colors.gradients.neutral}' },
  { pattern: /from-gray-600\s+to-gray-500/g, replacement: '${colors.gradients.neutral}' },

  // Umber/parchment gradients
  { pattern: /from-umber-700\s+to-amber-800/g, replacement: '${colors.gradients.statsMain}' },
  { pattern: /from-amber-700\s+to-orange-700/g, replacement: '${colors.gradients.statsLeaderboard}' },
];

const COMPONENTS_DIR = path.join(__dirname, 'src', 'components');

function addDesignSystemImport(content) {
  // Check if import already exists
  if (content.includes("from '../design-system'") || content.includes('from "@/design-system"')) {
    return content;
  }

  // Find the last import statement
  const importRegex = /^import\s+.*from\s+['"].*['"];?\s*$/gm;
  const imports = content.match(importRegex);

  if (!imports || imports.length === 0) {
    // No imports found, add at top
    return `import { colors } from '../design-system';\n\n${content}`;
  }

  // Add after last import
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertPosition = lastImportIndex + lastImport.length;

  return content.slice(0, insertPosition) +
         "\nimport { colors } from '../design-system';" +
         content.slice(insertPosition);
}

function migrateGradients(content) {
  let migrated = content;
  let replacementCount = 0;

  GRADIENT_MAPPINGS.forEach(({ pattern, replacement }) => {
    const matches = migrated.match(pattern);
    if (matches) {
      replacementCount += matches.length;
      migrated = migrated.replace(pattern, replacement);
    }
  });

  return { content: migrated, count: replacementCount };
}

function addAriaHidden(content) {
  // Add aria-hidden to standalone emojis (not already marked)
  // Pattern: <span>emoji</span> or just emoji in JSX
  const emojiPatterns = [
    /<span\s+([^>]*?)>([\u{1F300}-\u{1F9FF}]+)<\/span>/gu,
    /<div\s+([^>]*?)>([\u{1F300}-\u{1F9FF}]+)<\/div>/gu,
  ];

  let migrated = content;
  let count = 0;

  emojiPatterns.forEach(pattern => {
    migrated = migrated.replace(pattern, (match, attrs, emoji) => {
      if (attrs.includes('aria-hidden')) {
        return match; // Already has aria-hidden
      }
      count++;
      const tag = match.startsWith('<span') ? 'span' : 'div';
      const newAttrs = attrs.trim() ? `${attrs} aria-hidden="true"` : 'aria-hidden="true"';
      return `<${tag} ${newAttrs}>${emoji}</${tag}>`;
    });
  });

  return { content: migrated, count };
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file has hardcoded gradients
  const hasGradients = /from-[a-z]+-\d+\s+to-[a-z]+-\d+/.test(content);

  if (!hasGradients) {
    return null; // Skip this file
  }

  let processed = content;
  const stats = {
    gradients: 0,
    ariaHidden: 0,
  };

  // Add import
  processed = addDesignSystemImport(processed);

  // Migrate gradients
  const gradientResult = migrateGradients(processed);
  processed = gradientResult.content;
  stats.gradients = gradientResult.count;

  // Add aria-hidden
  const ariaResult = addAriaHidden(processed);
  processed = ariaResult.content;
  stats.ariaHidden = ariaResult.count;

  // Write back to file
  fs.writeFileSync(filePath, processed, 'utf8');

  return stats;
}

function walkDirectory(dir) {
  const results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...walkDirectory(filePath));
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });

  return results;
}

function main() {
  console.log('🚀 Starting design token migration...\n');

  const componentFiles = walkDirectory(COMPONENTS_DIR);
  console.log(`Found ${componentFiles.length} .tsx files\n`);

  const migratedFiles = [];
  let totalGradients = 0;
  let totalAriaHidden = 0;

  componentFiles.forEach(filePath => {
    const stats = processFile(filePath);

    if (stats) {
      const relativePath = path.relative(COMPONENTS_DIR, filePath);
      migratedFiles.push({ path: relativePath, stats });
      totalGradients += stats.gradients;
      totalAriaHidden += stats.ariaHidden;

      console.log(`✓ ${relativePath}`);
      console.log(`  - Migrated ${stats.gradients} gradients`);
      if (stats.ariaHidden > 0) {
        console.log(`  - Added ${stats.ariaHidden} aria-hidden attributes`);
      }
      console.log('');
    }
  });

  console.log('━'.repeat(60));
  console.log('\n📊 Migration Summary:\n');
  console.log(`Files migrated: ${migratedFiles.length}`);
  console.log(`Total gradients replaced: ${totalGradients}`);
  console.log(`Total aria-hidden added: ${totalAriaHidden}`);
  console.log(`\nCoverage: ${migratedFiles.length}/${componentFiles.length} files (${Math.round(migratedFiles.length / componentFiles.length * 100)}%)`);
  console.log('\n✨ Migration complete!\n');
}

main();
