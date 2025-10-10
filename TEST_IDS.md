# Test ID Reference

This document lists all `data-testid` attributes added to UI components for reliable E2E testing.

## Lobby Component (`frontend/src/components/Lobby.tsx`)

### Main Menu
- `create-game-button` - Button to navigate to create game form
- `join-game-button` - Button to navigate to join game form
- `spectate-game-button` - Button to navigate to spectate game form
- `quick-play-button` - Button to start Quick Play (1 player + 3 bots)

### Create Game Form
- `player-name-input` - Input field for player name
- `back-button` - Button to return to main menu
- `submit-create-button` - Button to create the game

### Join Game Form
- `game-id-input` - Input field for game ID
- `player-name-input` - Input field for player name
- `back-button` - Button to return to main menu
- `submit-join-button` - Button to join the game

## Team Selection Component (`frontend/src/components/TeamSelection.tsx`)

### Game Info
- `game-id` - Display element showing the game ID
- `player-count` - Display element showing current player count

### Teams
- `team-1-container` - Container for Team 1 (blue team)
- `team-2-container` - Container for Team 2 (red team)

### Actions
- `start-game-button` - Button to start the game (enabled when ready)
- `start-game-button-disabled` - Button to start game (disabled state)
- `start-game-message` - Message explaining why game can't start

## Betting Phase Component (`frontend/src/components/BettingPhase.tsx`)

### Betting Actions
- `skip-bet-button` - Button to skip betting turn
- `bet-{amount}-with-trump` - Button to bet amount (7-12) with trump (e.g., `bet-7-with-trump`)
- `bet-{amount}-without-trump` - Button to bet amount (7-12) without trump (e.g., `bet-9-without-trump`)

**Example usage in tests:**
```typescript
// Place a bet of 9 with trump
await page.getByTestId('bet-9-with-trump').click();

// Place a bet of 12 without trump
await page.getByTestId('bet-12-without-trump').click();

// Skip the bet
await page.getByTestId('skip-bet-button').click();
```

## Playing Phase Component (`frontend/src/components/PlayingPhase.tsx`)

Cards use existing `data-card-value` and `data-card-color` attributes inherited from the Card component.

## Best Practices for Using Test IDs

### 1. Always use `getByTestId` for critical UI elements
```typescript
// Good - reliable and semantic
const gameId = await page.getByTestId('game-id').textContent();

// Avoid - fragile, depends on text content
const gameId = await page.locator('text=/game id:/i').textContent();
```

### 2. Use descriptive test IDs
Test IDs should clearly indicate what element they identify:
- ✅ `start-game-button`
- ✅ `bet-9-without-trump`
- ❌ `btn-1`
- ❌ `element-x`

### 3. Combine with role-based selectors when appropriate
```typescript
// Use test ID for specific betting button
await page.getByTestId('bet-7-with-trump').click();

// Use role for generic buttons
await page.getByRole('button', { name: /back/i }).click();
```

### 4. Test ID naming conventions
- Use kebab-case: `player-name-input`
- Be specific: `submit-create-button` not just `submit-button`
- Include state if needed: `start-game-button-disabled`

## Updating Tests to Use Test IDs

### Before (fragile)
```typescript
const gameIdElement = await page.locator('text=/game id:/i').textContent();
const gameId = gameIdElement?.replace(/game id:\s*/i, '').trim() || '';
```

### After (reliable)
```typescript
const gameId = await page.getByTestId('game-id').textContent() || '';
```

### Before (fragile)
```typescript
await page.getByRole('button', { name: /quick play/i }).click();
```

### After (reliable)
```typescript
await page.getByTestId('quick-play-button').click();
```

---

*Last updated: 2025-10-09*
*Related: E2E tests in `e2e/tests/`*
