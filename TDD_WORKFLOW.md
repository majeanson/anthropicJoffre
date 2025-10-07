# Test-Driven Development Workflow

This guide documents how to develop new features and improvements using a test-driven iterative approach.

## Philosophy

Write tests first, then implement features to pass those tests. This ensures:
- Clear requirements before coding
- Confidence that features work as expected
- Easy regression testing
- Better code design

## Workflow Steps

### 1. Write the Test First

Before implementing a feature, write a Playwright test that describes the desired behavior.

**Example: Adding a "Ready" button in the waiting room**

```typescript
// e2e/tests/01-lobby.spec.ts
test('should allow players to mark themselves as ready', async ({ browser }) => {
  const { context, pages } = await createGameWith4Players(browser);

  // All players click "Ready"
  for (const page of pages) {
    await page.getByRole('button', { name: /ready/i }).click();
    await expect(page.getByText(/ready/i)).toBeVisible();
  }

  await context.close();
});
```

### 2. Run the Test (It Should Fail)

```bash
cd e2e
npm run test:e2e
```

The test will fail because the feature doesn't exist yet. This is expected and confirms the test is working.

### 3. Implement the Minimum Code to Pass

Add only the code necessary to pass the test.

**Backend (add to GameState type):**
```typescript
// backend/src/types/game.ts
export interface Player {
  id: string;
  name: string;
  teamId: 1 | 2;
  hand: Card[];
  tricksWon: number;
  isReady: boolean; // NEW
}
```

**Backend (add Socket.io handler):**
```typescript
// backend/src/index.ts
socket.on('player_ready', ({ gameId }) => {
  const game = games.get(gameId);
  if (!game) return;

  const player = game.players.find(p => p.id === socket.id);
  if (player) {
    player.isReady = true;
    io.to(gameId).emit('game_state', game);
  }
});
```

**Frontend (add UI):**
```typescript
// frontend/src/components/WaitingRoom.tsx
<button
  onClick={() => socket.emit('player_ready', { gameId })}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  Ready
</button>
```

### 4. Run the Test Again

```bash
npm run test:e2e
```

The test should now pass. If it doesn't, iterate on the implementation.

### 5. Refactor If Needed

Improve code quality without breaking the test:
- Extract reusable components
- Add type safety
- Improve naming
- Remove duplication

### 6. Add More Test Cases

Test edge cases and variations:

```typescript
test('should show ready status to all players', async ({ browser }) => {
  const { context, pages } = await createGameWith4Players(browser);

  // Player 1 clicks ready
  await pages[0].getByRole('button', { name: /ready/i }).click();

  // All players should see Player 1 is ready
  for (const page of pages) {
    await expect(page.getByText(/player 1.*ready/i)).toBeVisible();
  }

  await context.close();
});
```

## Common Test Patterns

### Multi-Player Game Setup

Use the helper function from `helpers.ts`:

```typescript
const { context, pages, gameId } = await createGameWith4Players(browser);
```

### Simulating Game Flow

```typescript
// Place bets for all players
await placeAllBets(pages, [7, 8, 9, 10]);

// Play a full trick
await playFullTrick(pages);

// Play entire round (8 tricks)
await playFullRound(pages);
```

### Finding Current Player

```typescript
const currentPlayerIndex = await findCurrentPlayerIndex(pages);
const currentPage = pages[currentPlayerIndex];
```

### Custom Bets and Options

```typescript
// Different bets per player
await placeAllBets(pages, [7, 12, 8, 10]);

// With "without trump" option
await placeAllBets(pages, [7, 7, 7, 7], [true, false, false, false]);
```

## Running Tests

### Run All Tests
```bash
cd e2e
npm run test:e2e
```

### Run Specific Test File
```bash
npm run test:e2e -- 01-lobby.spec.ts
```

### Run in UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Debug Mode (Step Through Tests)
```bash
npm run test:e2e:debug
```

## Example: Adding a Chat Feature

### Step 1: Write Test

```typescript
// e2e/tests/05-chat.spec.ts
import { test, expect } from '@playwright/test';
import { createGameWith4Players } from './helpers';

test.describe('Chat Feature', () => {
  test('should allow players to send messages', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Player 1 sends a message
    await pages[0].getByPlaceholder(/type a message/i).fill('Hello everyone!');
    await pages[0].getByRole('button', { name: /send/i }).click();

    // All players should see the message
    for (const page of pages) {
      await expect(page.getByText(/player 1.*hello everyone/i)).toBeVisible();
    }

    await context.close();
  });
});
```

### Step 2: Run Test (Fails)

```bash
npm run test:e2e -- 05-chat.spec.ts
# Expected to fail - chat doesn't exist yet
```

### Step 3: Implement Backend

```typescript
// backend/src/types/game.ts
export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface GameState {
  // ... existing fields
  chatMessages: ChatMessage[]; // NEW
}
```

```typescript
// backend/src/index.ts
socket.on('send_message', ({ gameId, text }: { gameId: string; text: string }) => {
  const game = games.get(gameId);
  if (!game) return;

  const player = game.players.find(p => p.id === socket.id);
  if (!player) return;

  const message: ChatMessage = {
    playerId: player.id,
    playerName: player.name,
    text,
    timestamp: Date.now(),
  };

  game.chatMessages.push(message);
  io.to(gameId).emit('game_state', game);
});
```

### Step 4: Implement Frontend

```typescript
// frontend/src/components/Chat.tsx
export const Chat = ({ gameState, socket }: ChatProps) => {
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit('send_message', { gameId: gameState.id, text: message });
    setMessage('');
  };

  return (
    <div className="bg-gray-800 p-4 rounded">
      <div className="h-48 overflow-y-auto mb-2">
        {gameState.chatMessages.map((msg, i) => (
          <div key={i} className="text-sm text-gray-300">
            <span className="font-bold">{msg.playerName}:</span> {msg.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-2 py-1 rounded bg-gray-700 text-white"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 px-4 py-1 rounded text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
};
```

### Step 5: Run Test Again (Passes)

```bash
npm run test:e2e -- 05-chat.spec.ts
# Should pass now
```

### Step 6: Add Edge Cases

```typescript
test('should not send empty messages', async ({ browser }) => {
  const { context, pages } = await createGameWith4Players(browser);

  const initialMessages = await pages[0].locator('[class*="chat"]').count();

  // Try to send empty message
  await pages[0].getByRole('button', { name: /send/i }).click();

  // Message count should not increase
  const finalMessages = await pages[0].locator('[class*="chat"]').count();
  expect(finalMessages).toBe(initialMessages);

  await context.close();
});
```

## Best Practices

### Test Structure
- **Arrange**: Set up the game state
- **Act**: Perform the action
- **Assert**: Verify the result

### Test Independence
Each test should be independent and not rely on other tests.

### Timeouts
Use reasonable timeouts for async operations:
```typescript
await expect(element).toBeVisible({ timeout: 5000 });
```

### Cleanup
Always close browser contexts:
```typescript
await context.close();
```

### Helper Functions
Extract common setup into helpers.ts to keep tests readable.

## Integration with CONTRIBUTING.md

This workflow complements the [CONTRIBUTING.md](./CONTRIBUTING.md) guide:
1. **TDD_WORKFLOW.md** (this file): Write tests first, implement features
2. **CONTRIBUTING.md**: General development patterns and best practices

Use both guides together for a complete development workflow.

## Troubleshooting

### Test Hangs or Timeouts
- Check if servers are running (`npm run dev` in both frontend and backend)
- Increase timeout values
- Use `test:e2e:debug` to step through

### Test Passes Locally but Fails in CI
- Check for timing issues (add waitForTimeout where needed)
- Ensure consistent browser setup

### WebSocket Connection Issues
- Verify backend is running on correct port
- Check CORS configuration
- Look for connection errors in browser console (use `test:e2e:ui`)

## Next Steps

1. Run existing tests: `cd e2e && npm run test:e2e`
2. Identify features to add or improve
3. Write tests first
4. Implement features
5. Iterate based on test feedback
