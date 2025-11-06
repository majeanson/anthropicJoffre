#!/usr/bin/env node

/**
 * Script to synchronize buildInfo.json from root to frontend
 * Ensures both files stay in sync for consistent version display
 *
 * Usage:
 *   npm run sync:buildinfo
 *
 * Or add to your build process:
 *   npm run build && npm run sync:buildinfo
 */

const fs = require('fs');
const path = require('path');

// File paths
const rootBuildInfo = path.join(__dirname, '..', 'buildInfo.json');
const frontendBuildInfo = path.join(__dirname, '..', 'frontend', 'src', 'buildInfo.json');

function syncBuildInfo() {
  try {
    // Check if root buildInfo exists
    if (!fs.existsSync(rootBuildInfo)) {
      console.error('❌ Root buildInfo.json not found at:', rootBuildInfo);
      process.exit(1);
    }

    // Read root buildInfo
    const rootContent = fs.readFileSync(rootBuildInfo, 'utf8');

    // Parse to validate JSON
    try {
      JSON.parse(rootContent);
    } catch (parseError) {
      console.error('❌ Root buildInfo.json contains invalid JSON:', parseError.message);
      process.exit(1);
    }

    // Write to frontend
    fs.writeFileSync(frontendBuildInfo, rootContent, 'utf8');

    // Get version for logging
    const buildInfo = JSON.parse(rootContent);

    console.log('✅ BuildInfo synchronized successfully!');
    console.log(`   Version: ${buildInfo.version}`);
    console.log(`   Date: ${buildInfo.buildDate || new Date().toISOString()}`);
    console.log(`   Root: ${rootBuildInfo}`);
    console.log(`   Frontend: ${frontendBuildInfo}`);

  } catch (error) {
    console.error('❌ Error syncing buildInfo:', error.message);
    process.exit(1);
  }
}

// Run the sync
syncBuildInfo();