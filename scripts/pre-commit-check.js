#!/usr/bin/env node

/**
 * Pre-commit validation script
 * Ensures code quality before committing
 *
 * Checks:
 * 1. TypeScript compilation (frontend & backend)
 * 2. Build errors
 * 3. BuildInfo synchronization
 * 4. Tests (optional, can be slow)
 *
 * Usage:
 *   npm run pre-commit
 *   npm run pre-commit:full (includes tests)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

// Configuration
const checks = {
  typescript: true,
  buildInfo: true,
  build: process.argv.includes('--build'),
  tests: process.argv.includes('--tests'),
  quick: process.argv.includes('--quick')
};

let hasErrors = false;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, cwd = process.cwd()) {
  try {
    log(`\n🔍 ${description}...`, 'blue');
    execSync(command, {
      stdio: 'inherit',
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    log(`✅ ${description} - PASSED`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} - FAILED`, 'red');
    hasErrors = true;
    return false;
  }
}

function checkBuildInfoSync() {
  log('\n🔍 Checking buildInfo synchronization...', 'blue');

  const rootBuildInfo = path.join(__dirname, '..', 'buildInfo.json');
  const frontendBuildInfo = path.join(__dirname, '..', 'frontend', 'src', 'buildInfo.json');

  if (!fs.existsSync(rootBuildInfo)) {
    log('⚠️  Root buildInfo.json not found', 'yellow');
    return true;
  }

  if (!fs.existsSync(frontendBuildInfo)) {
    log('⚠️  Frontend buildInfo.json not found - syncing now...', 'yellow');
    runCommand('npm run sync:buildinfo', 'Syncing buildInfo');
    return true;
  }

  const rootContent = fs.readFileSync(rootBuildInfo, 'utf8');
  const frontendContent = fs.readFileSync(frontendBuildInfo, 'utf8');

  if (rootContent !== frontendContent) {
    log('⚠️  BuildInfo files are out of sync - syncing now...', 'yellow');
    runCommand('npm run sync:buildinfo', 'Syncing buildInfo');

    // Check if sync created changes that need to be staged
    try {
      const gitStatus = execSync('git status --porcelain frontend/src/buildInfo.json', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        log('📝 Frontend buildInfo.json was updated - please stage this change:', 'yellow');
        log('   git add frontend/src/buildInfo.json', 'gray');
      }
    } catch (e) {
      // Git command failed, ignore
    }
  } else {
    log('✅ BuildInfo files are synchronized', 'green');
  }

  return true;
}

function checkTypeScript() {
  log('\n══════════════════════════════════════════', 'gray');
  log('  TypeScript Compilation Checks', 'blue');
  log('══════════════════════════════════════════', 'gray');

  const frontendPath = path.join(__dirname, '..', 'frontend');
  const backendPath = path.join(__dirname, '..', 'backend');

  // Check frontend TypeScript
  if (!checks.quick) {
    runCommand('npx tsc --noEmit --skipLibCheck', 'Frontend TypeScript', frontendPath);
  } else {
    runCommand('npx tsc --noEmit --skipLibCheck --incremental', 'Frontend TypeScript (incremental)', frontendPath);
  }

  // Check backend TypeScript
  if (!checks.quick) {
    runCommand('npx tsc --noEmit --skipLibCheck', 'Backend TypeScript', backendPath);
  } else {
    runCommand('npx tsc --noEmit --skipLibCheck --incremental', 'Backend TypeScript (incremental)', backendPath);
  }
}

function checkBuild() {
  log('\n══════════════════════════════════════════', 'gray');
  log('  Build Verification', 'blue');
  log('══════════════════════════════════════════', 'gray');

  runCommand('npm run build:frontend', 'Frontend Build');
  runCommand('npm run build:backend', 'Backend Build');
}

function runTests() {
  log('\n══════════════════════════════════════════', 'gray');
  log('  Running Tests', 'blue');
  log('══════════════════════════════════════════', 'gray');

  runCommand('npm run test:backend', 'Backend Tests');
}

function main() {
  console.clear();
  log('═══════════════════════════════════════════════', 'blue');
  log('   Pre-Commit Validation', 'blue');
  log('═══════════════════════════════════════════════', 'blue');

  const startTime = Date.now();

  // Always check buildInfo sync
  if (checks.buildInfo) {
    checkBuildInfoSync();
  }

  // TypeScript checks
  if (checks.typescript) {
    checkTypeScript();
  }

  // Build checks (optional, slower)
  if (checks.build) {
    checkBuild();
  }

  // Test checks (optional, slowest)
  if (checks.tests) {
    runTests();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  log('\n═══════════════════════════════════════════════', 'blue');

  if (hasErrors) {
    log(`   ❌ PRE-COMMIT FAILED (${duration}s)`, 'red');
    log('═══════════════════════════════════════════════', 'red');
    log('\n⚠️  Please fix the errors above before committing.', 'yellow');
    log('💡 Tip: Run "npm run fix" to auto-fix some issues.', 'gray');
    process.exit(1);
  } else {
    log(`   ✅ ALL CHECKS PASSED (${duration}s)`, 'green');
    log('═══════════════════════════════════════════════', 'green');
    log('\n🎉 Your code is ready to commit!', 'green');

    // Check for uncommitted buildInfo changes
    try {
      const gitStatus = execSync('git status --porcelain frontend/src/buildInfo.json', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        log('\n📝 Remember to stage buildInfo changes:', 'yellow');
        log('   git add frontend/src/buildInfo.json', 'gray');
      }
    } catch (e) {
      // Git command failed, ignore
    }
  }
}

// Run the checks
main();