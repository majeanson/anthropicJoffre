import { defineConfig, devices } from '@playwright/test';

// Test mode can be: 'quick', 'full', 'stress', 'marathon', 'continuous'
const TEST_MODE = process.env.TEST_MODE || 'default';

// Configure based on test mode
const getConfig = () => {
  switch (TEST_MODE) {
    case 'quick':
      return {
        timeout: 120000, // 2 minutes per test
        workers: 4, // More parallel workers for quick tests
        retries: 1,
        fullyParallel: true,
      };
    case 'full':
      return {
        timeout: 1800000, // 30 minutes per test
        workers: 2, // Moderate parallelism
        retries: 1,
        fullyParallel: false,
      };
    case 'stress':
      return {
        timeout: 600000, // 10 minutes per test
        workers: 1, // Sequential for stress tests
        retries: 0,
        fullyParallel: false,
      };
    case 'marathon':
      return {
        timeout: 3600000, // 60 minutes per test
        workers: 1, // Single worker for marathon tests
        retries: 0,
        fullyParallel: false,
      };
    case 'continuous':
      return {
        timeout: 300000, // 5 minutes per test
        workers: 2, // Some parallelism for continuous testing
        retries: 2, // More retries for flaky tests
        fullyParallel: false,
        repeatEach: 3, // Run each test 3 times
      };
    default:
      return {
        timeout: 120000, // 120 seconds per test (increased for stability)
        workers: 1, // Single worker by default
        retries: process.env.CI ? 2 : 1, // Enable 1 retry locally for flaky tests
        fullyParallel: false,
      };
  }
};

const modeConfig = getConfig();

export default defineConfig({
  testDir: './tests',
  fullyParallel: modeConfig.fullyParallel,
  forbidOnly: !!process.env.CI,
  retries: modeConfig.retries,
  workers: modeConfig.workers,
  timeout: modeConfig.timeout,

  // Different reporters based on environment
  reporter: process.env.CI
    ? [
        ['list'],
        ['json', { outputFile: 'test-results.json' }],
        ['html', { open: 'never' }]
      ]
    : [
        ['list'],
        ['html']
      ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Custom test attributes for different modes
    actionTimeout: TEST_MODE === 'quick' ? 5000 : 20000, // Increased from 15s to 20s
    navigationTimeout: TEST_MODE === 'quick' ? 10000 : 40000, // Increased from 30s to 40s

    // Additional stability settings
    ...(TEST_MODE !== 'quick' ? {
      // Longer default timeout for page.waitForSelector, etc.
      expect: {
        timeout: 10000, // 10s for expect assertions (default is 5s)
      },
    } : {}),
  },

  // Global setup/teardown for test modes
  globalSetup: TEST_MODE === 'continuous' ? './global-setup.ts' : undefined,
  globalTeardown: TEST_MODE === 'continuous' ? './global-teardown.ts' : undefined,

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Headless by default, headed for debugging
        headless: !process.env.HEADED,
        // Slow down actions in stress/marathon modes
        ...(TEST_MODE === 'stress' || TEST_MODE === 'marathon'
          ? { slowMo: 100 }
          : {}),
      },
    },
    // Additional browser testing in CI
    ...(process.env.CI ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],

  // Configure test output
  outputDir: './test-results',

  // Preserve test artifacts in CI
  preserveOutput: process.env.CI ? 'always' : 'failures-only',

  // Web server configuration - start both backend and frontend
  // Use array syntax to wait for both services to be ready
  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: process.env.DEBUG ? 'pipe' : 'ignore',
      stderr: process.env.DEBUG ? 'pipe' : 'ignore',
    },
    {
      command: 'cd ../frontend && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: process.env.DEBUG ? 'pipe' : 'ignore',
      stderr: process.env.DEBUG ? 'pipe' : 'ignore',
    },
  ],

  // Test match patterns for different test suites
  ...(TEST_MODE === 'game-flow' ? {
    testMatch: /2[3-6]-game-flow.*\.spec\.ts$/,
  } : {}),

  // Shard configuration for distributed testing
  ...(process.env.SHARD ? {
    shard: {
      current: parseInt(process.env.SHARD_INDEX || '1'),
      total: parseInt(process.env.SHARD_TOTAL || '1'),
    },
  } : {}),

  // Repeat configuration from modeConfig
  ...(modeConfig.repeatEach ? {
    repeatEach: modeConfig.repeatEach,
  } : {}),
});