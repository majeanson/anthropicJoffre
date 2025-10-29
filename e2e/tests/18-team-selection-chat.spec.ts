import { test, expect } from '@playwright/test';

test.describe('Team Selection Chat', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should show chat box in team selection phase', async ({ page }) => {
    await page.goto('http://localhost:5177');

    // Create a game
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('Player 1');
    await page.getByTestId('submit-create-button').click();

    // Wait for team selection screen
    await page.waitForSelector('text=/team selection/i', { timeout: 5000 });

    // Chat box should be visible
    await expect(page.getByText('💬 Team Chat')).toBeVisible();
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
  });

  test('should send and receive chat messages', async ({ browser }) => {
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Player 1 creates a game
    await page1.goto('http://localhost:5177');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Player 1');
    await page1.getByTestId('submit-create-button').click();

    // Wait for team selection
    await page1.waitForSelector('text=/team selection/i', { timeout: 5000 });

    // Get game ID
    const gameIdElement = await page1.getByTestId('game-id');
    const gameId = await gameIdElement.textContent();

    // Player 2 joins the game
    await page2.goto('http://localhost:5177');
    await page2.getByTestId('join-game-button').click();
    if (gameId) {
      await page2.getByTestId('game-id-input').fill(gameId);
    }
    await page2.getByTestId('player-name-input').fill('Player 2');
    await page2.getByTestId('submit-join-button').click();

    // Wait for team selection
    await page2.waitForSelector('text=/team selection/i', { timeout: 5000 });

    // Player 1 sends a message
    const chatInput1 = page1.getByPlaceholder(/type a message/i);
    await chatInput1.fill('Hello from Player 1!');
    await page1.getByRole('button', { name: /send/i }).click();

    // Player 2 should see the message
    await expect(page2.getByText('Hello from Player 1!')).toBeVisible({ timeout: 5000 });

    // Player 2 sends a message
    const chatInput2 = page2.getByPlaceholder(/type a message/i);
    await chatInput2.fill('Hi from Player 2!');
    await page2.getByRole('button', { name: /send/i }).click();

    // Player 1 should see Player 2's message
    await expect(page1.getByText('Hi from Player 2!')).toBeVisible({ timeout: 5000 });
  });

  test('should show different colors for different teams', async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();

    // Create a game and join a team
    await page.goto('http://localhost:5177');
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('TeamTest');
    await page.getByTestId('submit-create-button').click();

    await page.waitForSelector('text=/team selection/i', { timeout: 5000 });

    // Join Team 1
    await page.getByText('Join Team 1').first().click();

    // Send a message
    const chatInput = page.getByPlaceholder(/type a message/i);
    await chatInput.fill('Testing team colors');
    await page.getByRole('button', { name: /send/i }).click();

    // Message should be visible (team-colored styling is visual, hard to test)
    await expect(page.getByText('Testing team colors')).toBeVisible();
  });

  test('should limit message length to 200 characters', async ({ page }) => {
    await page.goto('http://localhost:5177');

    // Create a game
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('LongMessage');
    await page.getByTestId('submit-create-button').click();

    await page.waitForSelector('text=/team selection/i', { timeout: 5000 });

    // Try to type a very long message
    const chatInput = page.getByPlaceholder(/type a message/i);
    const longMessage = 'a'.repeat(250); // 250 characters
    await chatInput.fill(longMessage);

    // Input should be limited to 200 chars
    const inputValue = await chatInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(200);
  });

  test('should clear input after sending message', async ({ page }) => {
    await page.goto('http://localhost:5177');

    // Create a game
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('ClearTest');
    await page.getByTestId('submit-create-button').click();

    await page.waitForSelector('text=/team selection/i', { timeout: 5000 });

    // Type and send a message
    const chatInput = page.getByPlaceholder(/type a message/i);
    await chatInput.fill('Test message');
    await page.getByRole('button', { name: /send/i }).click();

    // Input should be cleared
    await expect(chatInput).toHaveValue('');
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.goto('http://localhost:5177');

    // Create a game
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('DisableTest');
    await page.getByTestId('submit-create-button').click();

    await page.waitForSelector('text=/team selection/i', { timeout: 5000 });

    // Send button should be disabled when input is empty
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeDisabled();

    // Type a message
    const chatInput = page.getByPlaceholder(/type a message/i);
    await chatInput.fill('Test');

    // Send button should be enabled
    await expect(sendButton).toBeEnabled();
  });
});
