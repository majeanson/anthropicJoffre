#!/usr/bin/env node

/**
 * Repeatability Testing Script
 * Runs E2E tests multiple times to detect flakiness and stability issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  iterations: process.env.REPEAT_COUNT || 10,
  testPattern: process.env.TEST_PATTERN || '',
  workers: process.env.WORKERS || 1,
  timeout: process.env.TEST_TIMEOUT || 300000, // 5 minutes per test run
  reportDir: path.join(__dirname, '..', 'repeatability-results'),
};

// Results tracking
const results = {
  totalRuns: 0,
  passed: 0,
  failed: 0,
  failures: [],
  startTime: Date.now(),
};

console.log('🔁 Repeatability Testing Script');
console.log('================================');
console.log(`Iterations: ${config.iterations}`);
console.log(`Test Pattern: ${config.testPattern || 'All tests'}`);
console.log(`Workers: ${config.workers}`);
console.log(`Timeout: ${config.timeout}ms`);
console.log('');

// Create results directory
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

// Run tests repeatedly
for (let i = 1; i <= config.iterations; i++) {
  console.log(`\n📋 Run ${i}/${config.iterations}`);
  console.log('─'.repeat(50));

  const runStartTime = Date.now();
  results.totalRuns++;

  try {
    // Build test command
    let command = `npx playwright test --workers=${config.workers}`;

    if (config.testPattern) {
      command += ` ${config.testPattern}`;
    }

    // Execute tests
    const output = execSync(command, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: config.timeout,
    });

    results.passed++;
    const duration = ((Date.now() - runStartTime) / 1000).toFixed(2);
    console.log(`✅ Run ${i} PASSED (${duration}s)`);

    // Save output
    fs.writeFileSync(
      path.join(config.reportDir, `run-${i}-pass.log`),
      output
    );

  } catch (error) {
    results.failed++;
    const duration = ((Date.now() - runStartTime) / 1000).toFixed(2);
    console.log(`❌ Run ${i} FAILED (${duration}s)`);

    // Track failure details
    results.failures.push({
      run: i,
      duration,
      error: error.message,
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || '',
    });

    // Save failure output
    fs.writeFileSync(
      path.join(config.reportDir, `run-${i}-fail.log`),
      `STDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}\n\nERROR:\n${error.message}`
    );
  }

  // Progress update
  const successRate = ((results.passed / results.totalRuns) * 100).toFixed(2);
  console.log(`   Progress: ${results.passed}/${results.totalRuns} passed (${successRate}%)`);
}

// Final report
console.log('\n');
console.log('═'.repeat(50));
console.log('📊 REPEATABILITY TEST RESULTS');
console.log('═'.repeat(50));
console.log(`Total Runs: ${results.totalRuns}`);
console.log(`Passed: ${results.passed} ✅`);
console.log(`Failed: ${results.failed} ❌`);
console.log(`Success Rate: ${((results.passed / results.totalRuns) * 100).toFixed(2)}%`);
console.log(`Total Duration: ${((Date.now() - results.startTime) / 1000 / 60).toFixed(2)} minutes`);
console.log('');

if (results.failures.length > 0) {
  console.log('Failed Runs:');
  results.failures.forEach((failure) => {
    console.log(`  - Run ${failure.run}: ${failure.duration}s`);
  });
  console.log('');
  console.log(`Detailed logs saved to: ${config.reportDir}`);
}

// Save summary
const summary = {
  config,
  results: {
    totalRuns: results.totalRuns,
    passed: results.passed,
    failed: results.failed,
    successRate: ((results.passed / results.totalRuns) * 100).toFixed(2) + '%',
    totalDuration: ((Date.now() - results.startTime) / 1000 / 60).toFixed(2) + ' minutes',
    failures: results.failures.map(f => ({
      run: f.run,
      duration: f.duration,
    })),
  },
  timestamp: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(config.reportDir, 'summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('Summary saved to: repeatability-results/summary.json');
console.log('');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
