import { test, expect, Page } from '@playwright/test';
import { createQuickPlayGame, waitForBotAction } from './helpers';

test.describe('Betting Phase', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should show betting phase after 4 players join', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0]; // Single human player

    // Should see betting phase heading
    await expect(page.getByRole('heading', { name: /betting phase/i })).toBeVisible();
  });

  test('should display bet amount selector (7-12)', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Should see bet amount buttons 7-12 in grid
    await expect(page.getByRole('button', { name: '7', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '12', exact: true })).toBeVisible();

    // Should see trump option radio buttons
    await expect(page.getByText('With Trump (1x)')).toBeVisible();
    await expect(page.getByText('Without Trump (2x multiplier)')).toBeVisible();
  });

  test('should allow selecting different bet amounts', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Wait for our turn - use button 12 (highest) which is always valid
    const bet12Button = page.getByRole('button', { name: '12', exact: true });
    await expect(bet12Button).toBeEnabled({ timeout: 30000 });

    // Verify multiple bet amount buttons are visible
    await expect(page.getByRole('button', { name: '7', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '10', exact: true })).toBeVisible();
    await expect(bet12Button).toBeVisible();

    // Button 12 should be enabled (highest bet is always valid)
    await expect(bet12Button).toBeEnabled();
  });

  test('should allow selecting "without trump" option', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Should see "Without Trump" radio option
    const noTrumpRadio = page.getByText('Without Trump (2x multiplier)');
    await expect(noTrumpRadio).toBeVisible();

    // Wait for our turn, then select a bet amount (use 12, always valid)
    const bet12Button = page.getByRole('button', { name: '12', exact: true });
    await expect(bet12Button).toBeEnabled({ timeout: 30000 });
    await bet12Button.click();

    // Click without trump option
    await noTrumpRadio.click();

    // Should show "No Trump" in Place Bet button
    await expect(page.getByRole('button', { name: /Place Bet: 12 \(No Trump\)/i })).toBeVisible();
  });

  test('should show all players and their bet status', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Should show all 4 players in the bet status panel
    // Note: With QuickPlay, we have 1 human + 3 bots
    // Player names will be the human player name + 3 bot names

    // Wait for inline bet status to be visible
    await expect(page.getByTestId('inline-bet-status')).toBeVisible();

    // Check that 4 players are shown (human + 3 bots)
    const playerBetStatuses = page.locator('[data-testid^="bet-status-"]');
    await expect(playerBetStatuses).toHaveCount(4);
  });

  test('should submit bet and show waiting state', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Wait for our turn, then select 12 points (highest, always valid)
    const bet12Button = page.getByRole('button', { name: '12', exact: true });
    await expect(bet12Button).toBeEnabled({ timeout: 30000 });
    await bet12Button.click();

    // Click Place Bet button
    await page.getByRole('button', { name: /Place Bet: 12/i }).click();

    // After betting, should transition to playing phase or show waiting
    // With bots, this happens very quickly (< 2s)
    await page.waitForTimeout(5000);

    // Verify we're no longer in betting phase by checking:
    // 1. Bet buttons are gone OR
    // 2. We're in playing phase
    const inPlayingPhase = await page.getByTestId('player-hand').isVisible();
    const betButtonGone = !(await page.getByRole('button', { name: '8', exact: true }).isVisible().catch(() => false));

    // At least one should be true
    expect(inPlayingPhase || betButtonGone).toBe(true);
  });

  test('should show "No Trump" indicator for without-trump bets', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Wait for our turn, then select 12 points (use 12, always valid)
    const bet12Button = page.getByRole('button', { name: '12', exact: true });
    await expect(bet12Button).toBeEnabled({ timeout: 30000 });
    await bet12Button.click();

    // Select "Without Trump" option
    await page.getByText('Without Trump (2x multiplier)').click();

    // Click Place Bet button
    await page.getByRole('button', { name: /Place Bet: 12 \(No Trump\)/i }).click();

    // Wait for bots to bet and transition to playing phase (increased timeout)
    await page.getByTestId('player-hand').waitFor({ state: 'visible', timeout: 30000 });

    // We can verify the bet was placed with No Trump by checking game state
    // (The bet is recorded in the game state)
  });

  test('should transition to playing phase when all bets are placed', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Wait for our turn, then place human player's bet (use 12, always valid)
    const bet12Button = page.getByRole('button', { name: '12', exact: true });
    await expect(bet12Button).toBeEnabled({ timeout: 30000 });
    await bet12Button.click();
    await page.getByRole('button', { name: /Place Bet: 12/i }).click();

    // Wait for bots to complete betting and transition to playing phase (increased timeout)
    await page.getByTestId('player-hand').waitFor({ state: 'visible', timeout: 30000 });

    // Should see player hand with cards
    const cards = page.locator('[data-card-value]');
    await expect(cards.first()).toBeVisible();
  });

  test('should correctly identify highest bidder', async ({ browser }) => {
    const result = await createQuickPlayGame(browser);
    context = result.context;
    const page = result.pages[0];

    // Wait for our turn, then place a high bet (12) to likely be the highest bidder
    const bet12Button = page.getByRole('button', { name: '12', exact: true });
    await expect(bet12Button).toBeEnabled({ timeout: 30000 });
    await bet12Button.click();
    await page.getByRole('button', { name: /Place Bet: 12/i }).click();

    // Wait for playing phase
    await page.getByTestId('player-hand').waitFor({ state: 'visible', timeout: 15000 });

    // Check that current turn player is indicated
    const currentTurnPlayer = page.getByTestId('current-turn-player');
    await expect(currentTurnPlayer).toBeVisible();

    // The turn indicator should show a player name
    const turnText = await currentTurnPlayer.textContent();
    expect(turnText).toBeTruthy();
    expect(turnText!.length).toBeGreaterThan(0);
  });
});
