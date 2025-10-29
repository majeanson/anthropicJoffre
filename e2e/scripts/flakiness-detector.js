#!/usr/bin/env node

/**
 * Flakiness Detection Script
 * Identifies flaky tests by running them multiple times and analyzing failure patterns
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FlakinessDetector {
  constructor(options = {}) {
    this.options = {
      runs: options.runs || 5,
      testPattern: options.testPattern || '',
      threshold: options.threshold || 0.8, // 80% pass rate to be considered stable
      outputDir: options.outputDir || path.join(__dirname, '..', 'flakiness-report'),
      workers: options.workers || 1,
      verbose: options.verbose || false,
    };

    this.results = new Map(); // test name -> results array
    this.flakyCandidates = [];
  }

  async run() {
    console.log('🔍 Flakiness Detection Starting');
    console.log('================================');
    console.log(`Runs per test: ${this.options.runs}`);
    console.log(`Stability threshold: ${this.options.threshold * 100}%`);
    console.log('');

    // Create output directory
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Run tests multiple times
    for (let run = 1; run <= this.options.runs; run++) {
      console.log(`\n📋 Run ${run}/${this.options.runs}`);
      console.log('─'.repeat(40));

      await this.runTests(run);
    }

    // Analyze results
    this.analyzeResults();

    // Generate report
    this.generateReport();
  }

  async runTests(runNumber) {
    try {
      // Build command
      let command = `npx playwright test --reporter=json --workers=${this.options.workers}`;
      if (this.options.testPattern) {
        command += ` ${this.options.testPattern}`;
      }

      // Execute tests and capture JSON output
      const output = execSync(command, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Parse JSON results
      const results = JSON.parse(output);
      this.processResults(results, runNumber);

    } catch (error) {
      // Tests failed - still parse the output if available
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          this.processResults(results, runNumber);
        } catch (parseError) {
          console.error(`Run ${runNumber} failed to parse results`);
        }
      }
    }
  }

  processResults(results, runNumber) {
    if (!results.suites) return;

    // Recursively process test suites
    const processeSuite = (suite, parentName = '') => {
      const suiteName = parentName ? `${parentName} > ${suite.title}` : suite.title;

      // Process specs (tests) in this suite
      if (suite.specs) {
        for (const spec of suite.specs) {
          const testName = `${suiteName} > ${spec.title}`;
          const testResult = {
            run: runNumber,
            status: spec.tests?.[0]?.status || 'unknown',
            duration: spec.tests?.[0]?.duration || 0,
            error: spec.tests?.[0]?.error || null,
          };

          if (!this.results.has(testName)) {
            this.results.set(testName, []);
          }
          this.results.get(testName).push(testResult);

          if (this.options.verbose) {
            console.log(`  ${testResult.status === 'passed' ? '✅' : '❌'} ${testName}`);
          }
        }
      }

      // Process nested suites
      if (suite.suites) {
        for (const nestedSuite of suite.suites) {
          processeSuite(nestedSuite, suiteName);
        }
      }
    };

    for (const suite of results.suites) {
      processeSuite(suite);
    }
  }

  analyzeResults() {
    console.log('\n📊 Analyzing Flakiness Patterns');
    console.log('================================');

    for (const [testName, results] of this.results) {
      const passCount = results.filter(r => r.status === 'passed').length;
      const passRate = passCount / results.length;

      const testAnalysis = {
        name: testName,
        totalRuns: results.length,
        passed: passCount,
        failed: results.length - passCount,
        passRate: passRate,
        isFlaky: passRate > 0 && passRate < this.options.threshold,
        results: results,
      };

      if (testAnalysis.isFlaky) {
        this.flakyCandidates.push(testAnalysis);
        console.log(`⚠️  FLAKY: ${testName}`);
        console.log(`   Pass rate: ${(passRate * 100).toFixed(1)}% (${passCount}/${results.length})`);

        // Analyze failure patterns
        const failureRuns = results
          .map((r, i) => r.status === 'failed' ? i + 1 : null)
          .filter(r => r !== null);
        console.log(`   Failed on runs: ${failureRuns.join(', ')}`);
      }
    }

    if (this.flakyCandidates.length === 0) {
      console.log('✅ No flaky tests detected!');
    } else {
      console.log(`\n⚠️  Found ${this.flakyCandidates.length} flaky test(s)`);
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      summary: {
        totalTests: this.results.size,
        flakyTests: this.flakyCandidates.length,
        stabilityRate: ((this.results.size - this.flakyCandidates.length) / this.results.size * 100).toFixed(2) + '%',
      },
      flakyTests: this.flakyCandidates.map(test => ({
        name: test.name,
        passRate: (test.passRate * 100).toFixed(2) + '%',
        passed: test.passed,
        failed: test.failed,
        failureDetails: test.results
          .filter(r => r.status === 'failed')
          .map(r => ({
            run: r.run,
            error: r.error?.message || 'Unknown error',
          })),
      })),
      stableTests: Array.from(this.results.entries())
        .filter(([name]) => !this.flakyCandidates.find(f => f.name === name))
        .map(([name, results]) => ({
          name,
          status: results.every(r => r.status === 'passed') ? 'always_pass' : 'always_fail',
          runs: results.length,
        })),
    };

    // Save JSON report
    const jsonPath = path.join(this.options.outputDir, 'flakiness-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(this.options.outputDir, 'flakiness-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    console.log('\n📄 Reports Generated:');
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Flakiness Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .flaky { background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; }
    .stable { background: #d4edda; padding: 10px; margin: 10px 0; border-left: 4px solid #28a745; }
    .failed { background: #f8d7da; padding: 10px; margin: 10px 0; border-left: 4px solid #dc3545; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h1>🔍 Flakiness Detection Report</h1>
  <p>Generated: ${report.timestamp}</p>

  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Tests:</strong> ${report.summary.totalTests}</p>
    <p><strong>Flaky Tests:</strong> ${report.summary.flakyTests}</p>
    <p><strong>Stability Rate:</strong> ${report.summary.stabilityRate}</p>
  </div>

  <h2>⚠️ Flaky Tests</h2>
  ${report.flakyTests.length === 0 ? '<p>No flaky tests detected!</p>' : ''}
  ${report.flakyTests.map(test => `
    <div class="flaky">
      <h3>${test.name}</h3>
      <p><strong>Pass Rate:</strong> ${test.passRate} (${test.passed}/${test.passed + test.failed})</p>
      ${test.failureDetails.length > 0 ? `
        <details>
          <summary>Failure Details</summary>
          <ul>
            ${test.failureDetails.map(f => `
              <li>Run ${f.run}: ${f.error}</li>
            `).join('')}
          </ul>
        </details>
      ` : ''}
    </div>
  `).join('')}

  <h2>✅ Stable Tests</h2>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Status</th>
        <th>Runs</th>
      </tr>
    </thead>
    <tbody>
      ${report.stableTests.map(test => `
        <tr>
          <td>${test.name}</td>
          <td>${test.status === 'always_pass' ? '✅ Always Pass' : '❌ Always Fail'}</td>
          <td>${test.runs}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `;
  }
}

// CLI execution
if (require.main === module) {
  const detector = new FlakinessDetector({
    runs: parseInt(process.env.FLAKY_RUNS || '5'),
    testPattern: process.env.FLAKY_PATTERN || '',
    threshold: parseFloat(process.env.FLAKY_THRESHOLD || '0.8'),
    workers: parseInt(process.env.FLAKY_WORKERS || '1'),
    verbose: process.env.FLAKY_VERBOSE === 'true',
  });

  detector.run().catch(console.error);
}

module.exports = FlakinessDetector;