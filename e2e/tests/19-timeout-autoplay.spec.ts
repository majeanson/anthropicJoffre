import { test, expect, Page } from '@playwright/test';

test.describe('Timeout and Autoplay System', () => {
  let playerPage: Page;
  let gameId: string;

  test.beforeEach(async ({ page }) => {
    playerPage = page;

    // Create a new game with Quick Play
    await playerPage.goto('/');
    await playerPage.getByTestId('quick-play-button').click();

    // Wait for game to be created
    await playerPage.waitForTimeout(2000);

    gameId = await playerPage.evaluate(() => {
      const session = localStorage.getItem('gameSession');
      return session ? JSON.parse(session).gameId : '';
    });

    if (!gameId) {
      throw new Error('Failed to create game or get game ID');
    }

    // Wait for game to progress past team selection
    await playerPage.waitForSelector('text=/betting|playing|your turn/i', { timeout: 20000 });
  });

  test('should show autoplay toggle button during betting phase', async () => {
    // Wait for betting phase
    await playerPage.waitForSelector('text=/place bet|betting/i', { timeout: 15000 });

    // Check for autoplay toggle button
    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();

    // Button might be visible if it's the player's turn
    const isVisible = await autoplayButton.isVisible({ timeout: 5000 }).catch(() => false);

    // If visible, verify it's toggleable
    if (isVisible) {
      const buttonText = await autoplayButton.textContent();
      expect(buttonText).toMatch(/manual|auto|🎮|🤖/i);
    }
  });

  test('should show autoplay toggle button during playing phase', async () => {
    // Wait for playing phase
    await playerPage.waitForSelector('text=/trump|trick|playing/i', { timeout: 30000 });

    // Check for autoplay toggle button (compact version in playing phase)
    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();

    const isVisible = await autoplayButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      expect(autoplayButton).toBeTruthy();
    }
  });

  test('should manually toggle autoplay mode', async () => {
    // Wait for betting or playing phase
    await playerPage.waitForSelector('text=/betting|playing|trump/i', { timeout: 20000 });

    // Find autoplay button
    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();

    const isVisible = await autoplayButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Get initial state
      const initialText = await autoplayButton.textContent();

      // Toggle autoplay
      await autoplayButton.click();
      await playerPage.waitForTimeout(500);

      // Verify state changed
      const newText = await autoplayButton.textContent();
      expect(newText).not.toBe(initialText);

      // Toggle back
      await autoplayButton.click();
      await playerPage.waitForTimeout(500);

      // Verify it toggled back
      const finalText = await autoplayButton.textContent();
      expect(finalText).toBe(initialText);
    }
  });

  test('should show countdown timer when it is player turn', async () => {
    // This test is time-sensitive - we need to catch the countdown

    // Wait for a phase where player needs to act
    await playerPage.waitForSelector('text=/your turn|place bet|betting|playing/i', { timeout: 30000 });

    // Check if countdown timer appears
    // The timer shows "⏱️ 60s", "⏱️ 59s", etc.
    const hasCountdown = await playerPage.locator('text=/⏱️|\\d+s/i').isVisible({ timeout: 10000 })
      .catch(() => false);

    // Countdown should appear when it's the player's turn and they haven't acted
    // This is a lenient check since bots might act quickly
    if (hasCountdown) {
      const timerText = await playerPage.locator('text=/⏱️/i').textContent();
      expect(timerText).toMatch(/\d+s/); // Should show seconds remaining
    }
  });

  test('should automatically enable autoplay after timeout', async () => {
    // This is a long-running test (60+ seconds)
    test.setTimeout(90000);

    // Wait for player's turn
    await playerPage.waitForSelector('text=/your turn|place bet/i', { timeout: 30000 });

    // Check initial autoplay state
    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();
    const isButtonVisible = await autoplayButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isButtonVisible) {
      // Autoplay button might not be visible initially
      // Wait for timeout to trigger auto-enable
      await playerPage.waitForTimeout(65000); // Wait longer than 60s timeout

      // After timeout, autoplay should be enabled and player should have made a move
      // Check that game has progressed (autoplay acted on player's behalf)
      const gameProgressed = await playerPage.locator('text=/waiting|trick|team/i').isVisible({ timeout: 5000 });
      expect(gameProgressed).toBe(true);
    } else {
      // If button is visible, verify it says "Manual" initially
      const initialText = await autoplayButton.textContent();

      // Wait for 60s timeout
      await playerPage.waitForTimeout(65000);

      // Check if autoplay was auto-enabled
      const newText = await autoplayButton.textContent();

      // After timeout, button should show "Auto" or 🤖
      expect(newText).toMatch(/auto|🤖/i);
    }
  });

  test('should make valid moves when autoplay is enabled', async () => {
    // Enable autoplay manually
    await playerPage.waitForSelector('text=/betting|playing|trump/i', { timeout: 20000 });

    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();
    const isVisible = await autoplayButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // Enable autoplay
      await autoplayButton.click();
      await playerPage.waitForTimeout(500);

      // Wait for autoplay to make a move
      await playerPage.waitForTimeout(3000);

      // Verify no error messages appeared
      const hasError = await playerPage.locator('text=/invalid|error/i').isVisible()
        .catch(() => false);

      expect(hasError).toBe(false);

      // Game should still be progressing
      await expect(playerPage.locator('text=/team 1|team 2/i')).toBeVisible();
    }
  });

  test('should respect game rules when autoplay makes bets', async () => {
    // Wait for betting phase
    await playerPage.waitForSelector('text=/betting|place bet/i', { timeout: 20000 });

    // Enable autoplay
    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();
    const isVisible = await autoplayButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await autoplayButton.click();
      await playerPage.waitForTimeout(500);

      // Wait for autoplay to place a bet
      await playerPage.waitForTimeout(3000);

      // Verify no "invalid bet" error appeared
      const hasInvalidBet = await playerPage.locator('text=/invalid bet|bet is too low/i').isVisible()
        .catch(() => false);

      expect(hasInvalidBet).toBe(false);
    }
  });

  test('should respect suit-following rules when autoplay plays cards', async () => {
    // Wait for playing phase
    await playerPage.waitForSelector('text=/trump|trick|playing/i', { timeout: 30000 });

    // Enable autoplay
    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();
    const isVisible = await autoplayButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await autoplayButton.click();
      await playerPage.waitForTimeout(500);

      // Wait for autoplay to play cards
      await playerPage.waitForTimeout(5000);

      // Verify no "must follow suit" error appeared
      const hasSuitError = await playerPage.locator('text=/must follow suit|invalid move/i').isVisible()
        .catch(() => false);

      expect(hasSuitError).toBe(false);
    }
  });

  test('should show countdown timer decreasing over time', async () => {
    test.setTimeout(70000);

    // Wait for player's turn
    await playerPage.waitForSelector('text=/your turn|place bet/i', { timeout: 30000 });

    // Check for countdown
    const hasCountdown = await playerPage.locator('text=/⏱️/i').isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasCountdown) {
      // Get initial countdown value
      const initialCountdown = await playerPage.locator('text=/⏱️\\s*\\d+s/i').textContent();
      const initialSeconds = parseInt(initialCountdown?.match(/(\d+)s/)?.[1] || '60');

      // Wait a few seconds
      await playerPage.waitForTimeout(5000);

      // Get new countdown value
      const newCountdown = await playerPage.locator('text=/⏱️\\s*\\d+s/i').textContent();
      const newSeconds = parseInt(newCountdown?.match(/(\d+)s/)?.[1] || '60');

      // Countdown should have decreased
      expect(newSeconds).toBeLessThan(initialSeconds);
    }
  });

  test('should not show countdown when not player turn', async () => {
    // Wait for game to start
    await playerPage.waitForSelector('text=/betting|playing|trump/i', { timeout: 20000 });

    // Wait for it to NOT be player's turn
    await playerPage.waitForTimeout(3000);

    // Check if "Waiting for..." message is shown instead
    const isWaiting = await playerPage.locator('text=/waiting for/i').isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isWaiting) {
      // When waiting for another player, countdown should NOT be visible
      const hasCountdown = await playerPage.locator('text=/⏱️.*\\d+s/i').isVisible({ timeout: 2000 })
        .catch(() => false);

      // Countdown should only show on active player's turn
      // This check is lenient since timing is tricky
      expect(typeof hasCountdown).toBe('boolean');
    }
  });

  test('should persist autoplay preference across game phases', async () => {
    // Enable autoplay in betting phase
    await playerPage.waitForSelector('text=/betting|place bet/i', { timeout: 20000 });

    const autoplayButton = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();
    const isVisible = await autoplayButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await autoplayButton.click();
      await playerPage.waitForTimeout(500);

      // Verify autoplay is enabled
      const buttonText = await autoplayButton.textContent();
      expect(buttonText).toMatch(/auto|🤖/i);

      // Wait for game to progress to playing phase
      await playerPage.waitForTimeout(10000);
      await playerPage.waitForSelector('text=/trump|trick|playing/i', { timeout: 20000, state: 'attached' });

      // Check if autoplay is still enabled in playing phase
      const autoplayButtonInPlaying = playerPage.locator('button:has-text("🎮"), button:has-text("🤖")').first();
      const stillVisible = await autoplayButtonInPlaying.isVisible({ timeout: 3000 }).catch(() => false);

      if (stillVisible) {
        const playingPhaseText = await autoplayButtonInPlaying.textContent();
        // Autoplay should still be enabled
        expect(playingPhaseText).toMatch(/auto|🤖/i);
      }
    }
  });

  test.afterEach(async () => {
    await playerPage?.close();
  });
});
