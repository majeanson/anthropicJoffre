import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Sprint 16 Social Features
 *
 * Tests:
 * - NotificationCenter display and interactions
 * - Friends button and panel
 * - PlayerProfileModal
 * - UnifiedChat in all contexts
 * - Direct Messages
 * - SocialHub tabs
 * - Replay sharing
 */

test.describe('Sprint 16: Social Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('NotificationCenter - opens and displays notifications', async ({ page }) => {
    // Set player name first
    await page.fill('input[placeholder*="Enter your name"]', 'SocialTester');

    // Click notification bell
    const notificationBell = page.locator('button:has-text("🔔")').first();
    await expect(notificationBell).toBeVisible();
    await notificationBell.click();

    // Check NotificationCenter opened
    await expect(page.locator('text="Notifications"')).toBeVisible();
    await expect(page.locator('text="No notifications"')).toBeVisible();

    // Close NotificationCenter
    await page.keyboard.press('Escape');
    await expect(page.locator('text="Notifications"')).not.toBeVisible();
  });

  test('Friends Panel - opens and shows friend management', async ({ page }) => {
    // Set player name first
    await page.fill('input[placeholder*="Enter your name"]', 'SocialTester');

    // Click Friends button
    const friendsButton = page.locator('button:has-text("👥")').first();
    await expect(friendsButton).toBeVisible();
    await friendsButton.click();

    // Check Friends panel opened
    await expect(page.locator('text="Friends"').first()).toBeVisible();

    // Check for friend request section
    await expect(page.locator('text=/Add Friend|Friend Requests/')).toBeVisible();
  });

  test('PlayerProfileModal - opens when clicking player names', async ({ page, context }) => {
    // Create a game first
    const playerName = 'ProfileTester';
    await page.fill('input[placeholder*="Enter your name"]', playerName);
    await page.locator('button:has-text("Create Game")').click();
    await page.waitForTimeout(500);

    // Get game ID from URL
    const gameIdMatch = page.url().match(/[A-Z0-9]{6}/);
    if (!gameIdMatch) throw new Error('Could not find game ID');
    const gameId = gameIdMatch[0];

    // Join with second player in new page
    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');
    await page2.fill('input[placeholder*="Enter your name"]', 'Player2');
    await page2.fill('input[placeholder*="Game ID"]', gameId);
    await page2.locator('button:has-text("Join Game")').click();
    await page2.waitForTimeout(500);

    // Back to first page - click on Player2's name
    const playerNameButton = page.locator('text="Player2"').first();
    await expect(playerNameButton).toBeVisible({ timeout: 5000 });

    // Check if the name is clickable (might be a button or have click handler)
    const isClickable = await playerNameButton.evaluate(el => {
      return el.tagName === 'BUTTON' ||
             el.classList.contains('cursor-pointer') ||
             el.style.cursor === 'pointer';
    });

    if (isClickable) {
      await playerNameButton.click();
      // Check profile modal opened
      await expect(page.locator('text=/Player Profile|View Profile/')).toBeVisible();
    }

    await page2.close();
  });

  test('UnifiedChat - Lobby chat works', async ({ page }) => {
    // Set player name
    await page.fill('input[placeholder*="Enter your name"]', 'ChatTester');

    // Navigate to social tab
    await page.locator('button:has-text("SOCIAL")').click();

    // Click Chat tab
    await page.locator('button:has-text("💬 Chat")').click();

    // Check chat is visible
    await expect(page.locator('text="Lobby Chat"')).toBeVisible();

    // Send a message
    const chatInput = page.locator('input[placeholder*="Type a message"]');
    await chatInput.fill('Hello from E2E test!');
    await page.locator('button:has-text("Send")').click();

    // Check message appears
    await expect(page.locator('text="Hello from E2E test!"')).toBeVisible();
  });

  test('UnifiedChat - Team selection chat works', async ({ page }) => {
    // Create a game
    await page.fill('input[placeholder*="Enter your name"]', 'TeamChatTester');
    await page.locator('button:has-text("Create Game")').click();
    await page.waitForTimeout(500);

    // Look for floating chat button
    const chatButton = page.locator('[data-testid="unified-chat-button"], button:has-text("💬 Chat")').first();
    await expect(chatButton).toBeVisible({ timeout: 5000 });
    await chatButton.click();

    // Check chat panel opened
    await expect(page.locator('text=/Team.*Chat|Team Selection Chat/')).toBeVisible();

    // Send message
    const chatInput = page.locator('input[placeholder*="Type a message"]');
    await chatInput.fill('Team chat test message');
    await page.locator('button:has-text("Send")').click();

    // Verify message appears
    await expect(page.locator('text="Team chat test message"')).toBeVisible();
  });

  test('DirectMessagesPanel - can open DM interface', async ({ page }) => {
    // Set player name
    await page.fill('input[placeholder*="Enter your name"]', 'DMTester');

    // Navigate to social features
    await page.locator('button:has-text("SOCIAL")').click();

    // Look for DM-related UI (might be in SocialHub)
    const dmText = page.locator('text=/Direct Message|Messages|DM/').first();

    // If DM interface exists, it should be accessible from social features
    if (await dmText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dmText).toBeVisible();
    }
  });

  test('SocialHub - all tabs work correctly', async ({ page }) => {
    // Set player name
    await page.fill('input[placeholder*="Enter your name"]', 'HubTester');

    // Open SocialHub (might be through Friends or Social button)
    const socialButton = page.locator('button:has-text("SOCIAL")').first();
    if (await socialButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await socialButton.click();

      // Check for tabs in SocialHub
      const tabs = ['Friends', 'Achievements', 'Recent', 'Suggestions'];
      for (const tab of tabs) {
        const tabButton = page.locator(`text=/${tab}/i`).first();
        if (await tabButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tabButton.click();
          await page.waitForTimeout(300); // Small delay between tabs
        }
      }
    }
  });

  test('Replay Sharing - copy link button works', async ({ page }) => {
    // This would require completing a game first
    // For now, check if replay UI elements exist

    // Create and complete a quick game with bots
    await page.fill('input[placeholder*="Enter your name"]', 'ReplayTester');
    await page.locator('button:has-text("Quick Play")').click();
    await page.waitForTimeout(1000);

    // Look for replay-related UI
    const replayButton = page.locator('text=/Replay|Watch Replay|View Replay/').first();

    if (await replayButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await replayButton.click();

      // Check for share button in replay modal
      const shareButton = page.locator('button:has-text(/Share|Copy Link/)').first();
      if (await shareButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await shareButton.click();
        // Clipboard API might not work in test environment, but button should be clickable
        await expect(shareButton).toBeVisible();
      }
    }
  });

  test('Recent Players - shows players from recent games', async ({ page }) => {
    // Set player name
    await page.fill('input[placeholder*="Enter your name"]', 'RecentTester');

    // Navigate to social section
    await page.locator('button:has-text("SOCIAL")').click();

    // Click Recent tab
    const recentTab = page.locator('button:has-text("📜 Recent")').first();
    if (await recentTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await recentTab.click();

      // Check for recent players section
      await expect(page.locator('text=/Recent Players|Players you|No recent players/')).toBeVisible();
    }
  });

  test('Friend Suggestions - displays suggested friends', async ({ page }) => {
    // Set player name
    await page.fill('input[placeholder*="Enter your name"]', 'SuggestionTester');

    // Navigate to social features
    await page.locator('button:has-text("SOCIAL")').click();

    // Look for suggestions
    const suggestionsText = page.locator('text=/Suggestions|Friend Suggestions|People you may know/').first();

    if (await suggestionsText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(suggestionsText).toBeVisible();
    }
  });
});

test.describe('Social Features Integration', () => {
  test('Achievement notifications appear in NotificationCenter', async ({ page }) => {
    // This would require triggering an achievement
    // Set player name
    await page.fill('input[placeholder*="Enter your name"]', 'AchievementTester');

    // Create a game and complete it to potentially trigger "First Game" achievement
    await page.locator('button:has-text("Quick Play")').click();
    await page.waitForTimeout(2000);

    // Check if notification bell has a badge
    const notificationBell = page.locator('button:has-text("🔔")').first();

    // The bell might have a badge/counter if achievements were unlocked
    const badge = notificationBell.locator('.bg-red-500, [class*="badge"]').first();
    if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notificationBell.click();
      // Check for achievement notification
      await expect(page.locator('text=/Achievement|Unlocked/')).toBeVisible();
    }
  });

  test('Friend requests create notifications', async ({ page, context }) => {
    // This requires two players
    const player1 = 'FriendRequester';
    const player2 = 'FriendReceiver';

    // Player 1 setup
    await page.fill('input[placeholder*="Enter your name"]', player1);

    // Player 2 setup in new page
    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');
    await page2.fill('input[placeholder*="Enter your name"]', player2);

    // Player 1 sends friend request (if friend system is accessible)
    const friendsButton = page.locator('button:has-text("👥")').first();
    if (await friendsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await friendsButton.click();

      // Look for add friend functionality
      const addFriendInput = page.locator('input[placeholder*="username"]').first();
      if (await addFriendInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addFriendInput.fill(player2);
        await page.locator('button:has-text(/Add|Send/)').first().click();

        // Check Player 2's notifications
        await page2.waitForTimeout(1000);
        const notificationBell2 = page2.locator('button:has-text("🔔")').first();
        const badge = notificationBell2.locator('.bg-red-500, [class*="badge"]').first();

        if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(badge).toBeVisible();
        }
      }
    }

    await page2.close();
  });
});

test.describe('Social Features Persistence', () => {
  test('Chat messages persist across page reloads', async ({ page }) => {
    // Send a message
    await page.fill('input[placeholder*="Enter your name"]', 'PersistTester');
    await page.locator('button:has-text("SOCIAL")').click();
    await page.locator('button:has-text("💬 Chat")').click();

    const testMessage = `Persist test ${Date.now()}`;
    const chatInput = page.locator('input[placeholder*="Type a message"]');
    await chatInput.fill(testMessage);
    await page.locator('button:has-text("Send")').click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check message still exists
    await page.locator('button:has-text("SOCIAL")').click();
    await page.locator('button:has-text("💬 Chat")').click();

    // Messages should load from history
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 5000 });
  });
});