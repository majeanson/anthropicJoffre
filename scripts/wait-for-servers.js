#!/usr/bin/env node

/**
 * Wait for backend and frontend servers to be ready before running tests
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';
const MAX_RETRIES = 60; // 60 seconds
const RETRY_INTERVAL = 1000; // 1 second

function checkServer(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode < 500);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function waitForServer(url, name) {
  console.log(`⏳ Waiting for ${name} at ${url}...`);

  for (let i = 0; i < MAX_RETRIES; i++) {
    const isReady = await checkServer(url);
    if (isReady) {
      console.log(`✅ ${name} is ready!`);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
  }

  console.error(`❌ ${name} did not start within ${MAX_RETRIES} seconds`);
  return false;
}

async function main() {
  console.log('🚀 Waiting for servers to be ready...\n');

  const backendReady = await waitForServer(BACKEND_URL, 'Backend');
  const frontendReady = await waitForServer(FRONTEND_URL, 'Frontend');

  if (backendReady && frontendReady) {
    console.log('\n✅ All servers are ready! Starting tests...\n');
    process.exit(0);
  } else {
    console.error('\n❌ One or more servers failed to start');
    process.exit(1);
  }
}

main();
