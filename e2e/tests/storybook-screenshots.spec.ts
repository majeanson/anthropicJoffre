import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STORYBOOK_URL = 'http://localhost:6006';

// All skins to test (using correct skin IDs from skins.ts)
const SKINS = [
  'midnight-alchemy',      // Dark - default
  'modern-minimal',        // Light
  'modern-minimal-dark',   // Dark
  'classic-parchment',     // Light
  'cyberpunk-neon',        // Dark
  'tavern-noir',           // Dark
  'luxury-casino',         // Dark
];

// Key representative stories to capture (selected showcase/all-variants stories)
const KEY_STORIES = [
  // Buttons - Core UI
  'midnight-alchemy-button--all-variants',
  'midnight-alchemy-button--all-sizes',
  'midnight-alchemy-button--disabled-variants',
  'midnight-alchemy-button--loading',

  // Alerts
  'midnight-alchemy-alert--all-variants',
  'midnight-alchemy-alert--dismissible-with-title',

  // Inputs
  'midnight-alchemy-input--all-variants',
  'midnight-alchemy-input--all-sizes',
  'midnight-alchemy-input--validation-states',

  // Select
  'midnight-alchemy-select--all-variants',
  'midnight-alchemy-select--all-sizes',
  'midnight-alchemy-select--comparison-states',

  // Checkbox/Toggle
  'midnight-alchemy-checkbox--all-checkbox-sizes',
  'midnight-alchemy-checkbox--all-toggle-sizes',
  'midnight-alchemy-checkbox--laboratory-settings',

  // Cards
  'midnight-alchemy-card--all-sizes',
  'midnight-alchemy-card--elemental-quartet',
  'midnight-alchemy-card--midnight-alchemy-showcase',
  'ui-uicard--all-sizes',
  'ui-uicard--all-gradients',
  'ui-uicard--real-world-examples',

  // Modals
  'midnight-alchemy-modal--all-themes',
  'midnight-alchemy-modal--preset-modals',

  // Tabs
  'midnight-alchemy-tabs--all-variants',
  'midnight-alchemy-tabs--with-icons-and-badges',

  // Spinner
  'midnight-alchemy-spinner--all-variants',
  'midnight-alchemy-spinner--all-colors',
  'midnight-alchemy-spinner--all-sizes',

  // Toast
  'ui-toast--all-variants',
  'ui-toast--quest-toasts',

  // Tooltip
  'ui-tooltip--all-positions',
  'ui-tooltip--all-variants',

  // Progress Bar
  'ui-progressbar--all-variants',
  'ui-progressbar--all-colors',
  'ui-progressbar--all-sizes',

  // Skeleton
  'ui-skeleton--quest-panel-loading',
  'ui-skeleton--leaderboard-loading',

  // Badge
  'ui-uibadge--all-variants',
  'ui-uibadge--all-colors',
  'ui-uibadge--team-badges',

  // Divider
  'ui-layout-uidivider--variants',
  'ui-layout-uidivider--gradient-variants',

  // Slider
  'ui-form-uislider--all-sizes',
  'ui-form-uislider--all-colors',

  // Toggle
  'ui-form-uitoggle--all-sizes',
  'ui-form-uitoggle--all-colors',

  // Dropdown
  'ui-uidropdownmenu--default',
  'ui-uidropdownmenu--profile-dropdown',

  // Social Components
  'ui-social-messagebubble--conversation-example',
  'ui-social-conversationitem--conversation-list-example',
  'ui-social-sociallistitem--list-example',
  'ui-social-onlinestatusbadge--all-states',
  'ui-social-unreadbadge--all-variants',

  // Game Components
  'components-gameheader--default',
  'components-gameheader--dark-mode',
  'ui-teamcard--all-variants',
  'ui-teamcard--team-badges',
  'game-botthinkingindicator--all-positions',
  'game-timeoutbanner--your-turn',
  'game-trickwinnerbanner--team-1-winner',
  'game-swapconfirmationmodal--same-team',

  // Quest System
  'quest-system-dailyquestspanel--all-quest-states',
  'quest-system-loginstreakbadge--all-streak-levels',
  'quest-system-rewardscalendar--all-milestones',

  // Achievement
  'components-achievementcard--all-tiers-light',
  'game-achievementunlocked--legendary-achievement',

  // Skin Selector
  'ui-skinselector--grid-selector',
  'ui-skinselector--dropdown-selector',

  // State Display
  'ui-statedisplay-loadingstate--all-states-showcase',

  // Header Action Button
  'ui-headeractionbutton--all-variants',

  // Icon Button
  'ui-iconbutton--square',
  'ui-iconbutton--circular',
];

// Create output directory
const OUTPUT_DIR = 'storybook-screenshots';

test.describe('Storybook Component Screenshots', () => {
  test.beforeAll(async () => {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    for (const skin of SKINS) {
      const skinDir = path.join(OUTPUT_DIR, skin);
      if (!fs.existsSync(skinDir)) {
        fs.mkdirSync(skinDir, { recursive: true });
      }
    }
  });

  test('Capture all key components across all skins', async ({ page }) => {
    const results: { skin: string; story: string; success: boolean; error?: string }[] = [];

    for (const skin of SKINS) {
      console.log(`\n=== Testing skin: ${skin} ===`);

      for (const story of KEY_STORIES) {
        try {
          // Use 'skin' parameter (not 'theme') to match Storybook config
          const storyUrl = `${STORYBOOK_URL}/iframe.html?args=&id=${story}&viewMode=story&globals=skin:${skin}`;
          await page.goto(storyUrl, { timeout: 15000 });
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(500); // Wait for animations

          const screenshotPath = path.join(OUTPUT_DIR, skin, `${story}.png`);
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
          });

          results.push({ skin, story, success: true });
          console.log(`  ✓ ${story}`);
        } catch (error) {
          const errorMessage = (error as Error).message;
          results.push({ skin, story, success: false, error: errorMessage });
          console.log(`  ✗ ${story} - ${errorMessage}`);
        }
      }
    }

    // Summary
    console.log(`\n=== Summary ===`);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`Total: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log(`\nFailed stories:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.skin}/${r.story}: ${r.error}`);
      });
    }

    // Write results to JSON for analysis
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'results.json'),
      JSON.stringify(results, null, 2)
    );

    expect(successful).toBeGreaterThan(0);
  });
});

// Quick test for different skins (for faster iteration)
test('Quick test - Compare light vs dark skins', async ({ page }) => {
  const testSkins = ['midnight-alchemy', 'modern-minimal', 'classic-parchment'];

  const quickStories = [
    'midnight-alchemy-button--all-variants',
    'midnight-alchemy-alert--all-variants',
    'ui-uicard--all-sizes',
  ];

  for (const skin of testSkins) {
    console.log(`\nTesting skin: ${skin}`);
    for (const story of quickStories) {
      const storyUrl = `${STORYBOOK_URL}/iframe.html?args=&id=${story}&viewMode=story&globals=skin:${skin}`;
      await page.goto(storyUrl, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Check that content rendered
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
      console.log(`  ✓ ${story}`);
    }
  }
});
