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

      // Extract Priority 1 items (most important)
      const priority1Match = content.match(/## Priority 1[\s\S]*?(?=##|$)/);
      if (priority1Match) {
        const items = priority1Match[0]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .slice(0, 5); // Take first 5 items

        if (items.length > 0) {
          return items;
        }
      }
    }

    // Fallback todos
    return [
      'Improve AI difficulty balancing',
      'Add more sound effects',
      'Enhanced mobile UI',
      'Tutorial mode for new players',
      'Achievement system'
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
