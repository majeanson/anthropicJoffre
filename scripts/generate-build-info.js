#!/usr/bin/env node

/**
 * Generate build information for the debug panel
 * This script extracts git info, version, and todos to display in the app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitInfo() {
  try {
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const commitDate = execSync('git log -1 --pretty=%ci', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

    return {
      commitMessage,
      commitHash,
      commitDate,
      branch
    };
  } catch (error) {
    console.warn('Failed to get git info:', error.message);
    return {
      commitMessage: 'Not available',
      commitHash: 'N/A',
      commitDate: 'N/A',
      branch: 'N/A'
    };
  }
}

function getVersion() {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
    );
    return packageJson.version || '0.0.0';
  } catch (error) {
    console.warn('Failed to read version:', error.message);
    return '0.0.0';
  }
}

function getFutureTodos() {
  try {
    const improvementsPath = path.join(__dirname, '../IMPROVEMENT_SUGGESTIONS.md');
    if (fs.existsSync(improvementsPath)) {
      const content = fs.readFileSync(improvementsPath, 'utf-8');

      // Manually curated list of next priority features (remaining incomplete)
      // Based on Priority 2, 3, 4, 6 from IMPROVEMENT_SUGGESTIONS.md
      const futureTodos = [
        'Game Replay Feature - Review and learn from completed games',
        'Improve Bot AI - Advanced strategy and card tracking',
        'Enhanced Leaderboard - Charts, statistics, and CSV export',
        'Achievements & Badges System - Earn rewards for milestones',
        'Friend System - Add friends and invite to games'
      ];

      return futureTodos;
    }

    // Fallback todos if file doesn't exist
    return [
      'Game Replay Feature',
      'Improve Bot AI',
      'Enhanced Leaderboard',
      'Achievements & Badges',
      'Friend System'
    ];
  } catch (error) {
    console.warn('Failed to read todos:', error.message);
    return ['Check IMPROVEMENT_SUGGESTIONS.md for todos'];
  }
}

function generateBuildInfo() {
  const gitInfo = getGitInfo();
  const version = getVersion();
  const futureTodos = getFutureTodos();

  const buildInfo = {
    buildDate: new Date().toISOString(),
    version,
    git: gitInfo,
    futureTodos
  };

  const outputPath = path.join(__dirname, '../frontend/src/buildInfo.json');
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

  console.log('✅ Build info generated successfully!');
  console.log(`   Version: ${version}`);
  console.log(`   Commit: ${gitInfo.commitHash} - ${gitInfo.commitMessage.split('\n')[0].substring(0, 50)}...`);
  console.log(`   Build: ${buildInfo.buildDate}`);
}

// Run the script
generateBuildInfo();
