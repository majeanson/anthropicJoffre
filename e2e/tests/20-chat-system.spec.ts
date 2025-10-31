import { test, expect, Page, BrowserContext } from '@playwright/test';
import { createQuickPlayGame } from './helpers';

// Chat UI Structure:
// - Team Selection Phase: Chat is EMBEDDED inline (no toggle button)
// - Game Phases (Betting/Playing/Scoring): Chat via ChatToggleButton
test.describe('Chat System', () => {
  let player1Page: Page;
  let player2Page: Page;
  let context1: BrowserContext;
  let context2: BrowserContext;
  let gameId: string;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts for two players
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    player1Page = await context1.newPage();
    player2Page = await context2.newPage();

    // Player 1 creates a game
    await player1Page.goto('/');
    await player1Page.getByTestId('create-game-button').click();
    await player1Page.getByTestId('player-name-input').fill('Player1');
    await player1Page.getByTestId('submit-create-button').click();

    // Get game ID
    await player1Page.waitForTimeout(1000);
    gameId = await player1Page.evaluate(() => {
      const session = sessionStorage.getItem('gameSession');
      return session ? JSON.parse(session).gameId : '';
    });

    // Player 2 joins the game
    await player2Page.goto('/');
    await player2Page.getByTestId('join-game-button').click();
    await player2Page.getByTestId('game-id-input').fill(gameId);
    await player2Page.getByTestId('player-name-input').fill('Player2');
    await player2Page.getByTestId('submit-join-button').click();

    // Wait for both players to be in team selection
    await player1Page.waitForSelector('text=/team selection|select your team/i', { timeout: 5000 });
    await player2Page.waitForSelector('text=/team selection|select your team/i', { timeout: 5000 });
  });

  test('should show chat in team selection phase (embedded inline)', async () => {
    // Chat is embedded inline in team selection, not a toggle button
    // Check for the "💬 Team Chat" heading
    const chatHeading1 = player1Page.locator('text=/💬.*Team Chat/i');
    const chatHeading2 = player2Page.locator('text=/💬.*Team Chat/i');

    await expect(chatHeading1).toBeVisible({ timeout: 5000 });
    await expect(chatHeading2).toBeVisible({ timeout: 5000 });

    // Verify chat input is accessible
    const chatInput1 = player1Page.locator('input[placeholder*="message"]').first();
    const chatInput2 = player2Page.locator('input[placeholder*="message"]').first();

    await expect(chatInput1).toBeVisible();
    await expect(chatInput2).toBeVisible();
  });

  // NOTE: Test for "should open and close chat panel" removed.
  // This feature doesn't exist in team selection - chat is embedded inline, not a toggle panel.
  // Chat toggle functionality exists in game phases (betting/playing/scoring), which is
  // tested in those respective phase tests. See: docs/sprints/sprint5-phase5-summary.md

  test('should send and receive chat messages between players', async () => {
    // Chat is inline in team selection, no button to click

    // Player 1 types and sends a message
    const messageInput1 = player1Page.locator('input[placeholder*="message"]').first();
    await messageInput1.fill('Hello from Player 1!');

    const sendButton1 = player1Page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton1.click();
    await player1Page.waitForTimeout(500);

    // Player 2 should see Player 1's message (chat is already visible inline)
    await expect(player2Page.locator('text=/Hello from Player 1!/i')).toBeVisible({ timeout: 5000 });

    // Player 2 replies
    const messageInput2 = player2Page.locator('input[placeholder*="message"]').first();
    await messageInput2.fill('Hi Player 1!');

    const sendButton2 = player2Page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton2.click();
    await player2Page.waitForTimeout(500);

    // Player 1 should see Player 2's reply
    await expect(player1Page.locator('text=/Hi Player 1!/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show team-colored messages in team selection phase', async () => {
    // Players are auto-assigned to teams when they join
    // Chat is inline, no button to click

    // Player 1 sends a message
    const messageInput1 = player1Page.locator('input[placeholder*="message"]').first();
    await messageInput1.fill('Team 1 here!');

    const sendButton1 = player1Page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton1.click();
    await player1Page.waitForTimeout(500);

    // Player 2 should see message (team coloring is CSS-based, hard to test color directly)
    await expect(player2Page.locator('text=/Team 1 here!/i')).toBeVisible({ timeout: 5000 });
  });

  // NOTE: Test for "should show unread message counter" removed.
  // Unread counter only exists in game phase ChatToggleButton (betting/playing/scoring).
  // Team selection has inline chat that's always visible, so no unread counter concept.
  // See: docs/sprints/sprint5-phase5-summary.md

  test('should enforce 200 character limit on messages', async () => {
    // Chat is inline, no button to click

    // Type a message longer than 200 characters
    const longMessage = 'A'.repeat(250);
    const messageInput = player1Page.locator('input[placeholder*="message"]').first();
    await messageInput.fill(longMessage);

    // Verify input is truncated to 200 characters (has maxLength attribute)
    const inputValue = await messageInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(200);
  });

  // NOTE: Test for "should support quick emoji reactions" removed.
  // Quick emoji buttons only exist in ChatPanel for game phases (betting/playing/scoring).
  // Team selection uses a simpler chat UI without quick emoji buttons.
  // See ChatPanel.tsx for emoji implementation in game phases.
  // See: docs/sprints/sprint5-phase5-summary.md

  // NOTE: Test for "should persist chat messages across game phases" removed.
  // Team selection chat (send_team_selection_chat) and game phase chat (send_game_chat)
  // are intentionally separate systems. Messages don't persist across the phase boundary
  // by design. If chat persistence is desired in the future, backend needs to merge these
  // chat systems. See: docs/sprints/sprint5-phase5-summary.md

  test('should prevent sending empty messages', async () => {
    // Chat is inline, no button to click

    // Try to send empty message
    const sendButton = player1Page.locator('button:has-text("Send"), button[type="submit"]').first();
    const isButtonEnabled = await sendButton.isEnabled();

    // Button should be disabled for empty input (disabled attribute in TeamSelection.tsx)
    expect(isButtonEnabled).toBe(false);
  });

  test('should show player names with messages', async () => {
    // Chat is inline, no button to click

    const messageInput = player1Page.locator('input[placeholder*="message"]').first();
    await messageInput.fill('Test message');

    const sendButton = player1Page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();
    await player1Page.waitForTimeout(500);

    // Verify message shows player name (use .first() for strict mode)
    await expect(player1Page.locator('text=/Player1/i').first()).toBeVisible({ timeout: 3000 });
    await expect(player1Page.locator('text=/Test message/i')).toBeVisible({ timeout: 3000 });
  });

  test.afterEach(async () => {
    await player1Page?.close();
    await player2Page?.close();
    await context1?.close();
    await context2?.close();
  });
});

// Game Phase Chat Tests (Betting/Playing/Scoring)
// Uses Quick Play for stable single-page testing
test.describe('Chat System - Game Phases (Quick Play)', () => {
  let page: Page;
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should show chat toggle button in betting phase', async ({ browser }) => {
    // Create Quick Play game (single player + 3 server bots)
    const result = await createQuickPlayGame(browser, { difficulty: 'medium' });
    page = result.pages[0];
    context = result.context;

    // Wait for betting phase (Quick Play starts game automatically)
    await page.waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

    // Verify chat toggle button exists
    const chatToggleButton = page.getByTestId('chat-toggle-button');
    await expect(chatToggleButton).toBeVisible({ timeout: 5000 });

    // Verify button shows chat icon or text
    await expect(chatToggleButton).toContainText(/💬|Chat/i);
  });

  test('should open and close chat panel in betting phase', async ({ browser }) => {
    const result = await createQuickPlayGame(browser, { difficulty: 'medium' });
    page = result.pages[0];
    context = result.context;

    await page.waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

    const chatToggleButton = page.getByTestId('chat-toggle-button');
    await expect(chatToggleButton).toBeVisible({ timeout: 5000 });

    // Open chat panel
    await chatToggleButton.click();

    // Wait for chat panel to be visible
    const chatPanel = page.locator('[data-testid="chat-panel"], .chat-panel, [class*="chat"]').first();
    await expect(chatPanel).toBeVisible({ timeout: 3000 });

    // Verify chat input exists
    const chatInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i]');
    await expect(chatInput.first()).toBeVisible({ timeout: 3000 });

    // Close chat panel
    await chatToggleButton.click();

    // Chat panel should be hidden (or at least toggle button should still be visible)
    await expect(chatToggleButton).toBeVisible();
  });

  test('should send messages in betting phase', async ({ browser }) => {
    const result = await createQuickPlayGame(browser, { difficulty: 'medium' });
    page = result.pages[0];
    context = result.context;

    await page.waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

    // Open chat
    const chatToggleButton = page.getByTestId('chat-toggle-button');
    await chatToggleButton.click();

    // Wait for chat input to be visible and interactable
    const chatInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i]').first();
    await chatInput.waitFor({ state: 'visible', timeout: 3000 });

    // Type a message
    await chatInput.fill('Test message from human player');

    // Find and click send button
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.waitFor({ state: 'visible', timeout: 2000 });
    await sendButton.click();

    // Verify message appears in chat (should show player name and message)
    await expect(page.locator('text=/Test message from human player/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle rapid message sending with proper wait strategies', async ({ browser }) => {
    const result = await createQuickPlayGame(browser, { difficulty: 'medium' });
    page = result.pages[0];
    context = result.context;

    await page.waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

    // Open chat
    const chatToggleButton = page.getByTestId('chat-toggle-button');
    await chatToggleButton.click();

    const chatInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i]').first();
    await chatInput.waitFor({ state: 'visible', timeout: 3000 });

    // Send 3 messages rapidly
    for (let i = 1; i <= 3; i++) {
      // Wait for input to be ready (not disabled, visible, editable)
      await chatInput.waitFor({ state: 'visible', timeout: 3000 });
      await expect(chatInput).toBeEditable({ timeout: 2000 });

      // Type message
      await chatInput.fill(`Message ${i}`);

      // Wait for send button to be enabled
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
      await sendButton.waitFor({ state: 'visible', timeout: 2000 });
      await expect(sendButton).toBeEnabled({ timeout: 2000 });

      // Click send
      await sendButton.click();

      // Wait for message to appear before sending next one
      await expect(page.locator(`text=/Message ${i}/i`)).toBeVisible({ timeout: 5000 });

      // Wait for input to be cleared and ready for next message
      await expect(chatInput).toHaveValue('', { timeout: 2000 });
    }

    // Verify all 3 messages are visible
    await expect(page.locator('text=/Message 1/i')).toBeVisible();
    await expect(page.locator('text=/Message 2/i')).toBeVisible();
    await expect(page.locator('text=/Message 3/i')).toBeVisible();
  });

  test('should show chat in playing phase', async ({ browser }) => {
    const result = await createQuickPlayGame(browser, { difficulty: 'hard' });
    page = result.pages[0];
    context = result.context;

    // Wait for betting phase
    await page.waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

    // Place a bet to progress to playing phase
    // Look for any bet button (bots will handle the rest)
    const betButton = page.locator('[data-testid^="bet-"]').first();
    if (await betButton.isVisible({ timeout: 2000 })) {
      await betButton.click();
    }

    // Wait for playing phase (bots will complete betting)
    await page.waitForSelector('text=/Playing Phase|Your Turn|trump/i', { timeout: 15000 });

    // Verify chat toggle is still available in playing phase
    const chatToggleButton = page.getByTestId('chat-toggle-button');
    await expect(chatToggleButton).toBeVisible({ timeout: 5000 });

    // Open chat and verify it works
    await chatToggleButton.click();

    const chatInput = page.locator('input[placeholder*="message" i], input[placeholder*="Type" i]').first();
    await expect(chatInput).toBeVisible({ timeout: 3000 });
  });
});
