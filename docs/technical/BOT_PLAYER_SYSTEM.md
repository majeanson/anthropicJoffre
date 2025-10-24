# Bot Player System Documentation

## Overview
The bot player system enables automated gameplay for testing and single-player experiences. Bots use separate WebSocket connections to simulate real players and make autonomous decisions during all game phases.

---

## Architecture

### Core Components

#### 1. Bot AI Logic
**Location**: `frontend/src/utils/botPlayer.ts`

The `BotPlayer` class provides static methods for all bot decision-making:
- `selectTeam()` - Choose team assignment
- `makeBet()` - Calculate bet amount and type
- `playCard()` - Select which card to play
- `getActionDelay()` - Randomized timing for natural feel

#### 2. Bot Management
**Location**: `frontend/src/App.tsx:120-235`

The main app manages bot lifecycles:
- Creating bot socket connections
- Listening to game state updates
- Triggering bot actions at appropriate times
- Cleaning up bot timeouts

#### 3. Quick Play Feature
**Location**: `frontend/src/components/Lobby.tsx`

Purple "QuickPlay" button that:
- Creates a new game
- Spawns 3 bot players
- Automatically starts when all bots join

---

## Bot AI Decision Making

### Team Selection
```typescript
static selectTeam(playerIndex: number): 1 | 2 {
  return (playerIndex % 2 === 0 ? 1 : 2) as 1 | 2;
}
```
**Strategy**: Alternate teams based on player index
- Player 0 → Team 1
- Player 1 → Team 2
- Player 2 → Team 1
- Player 3 → Team 2

**Result**: Automatically balanced 2v2 teams

### Betting Logic
**Location**: `frontend/src/utils/botPlayer.ts:17-70`

#### Decision Tree
```
1. Are we the dealer?
   └─ Yes → Must we bet? (no valid bets exist)
      └─ Yes → Bet 7 (minimum)
      └─ No → Continue to step 2
   └─ No → Continue to step 2

2. Should we skip? (30% chance)
   └─ Yes → Skip bet
   └─ No → Continue to step 3

3. Is there a highest bet?
   └─ Yes → Must raise (or match if dealer)
      └─ Can we? (bet < 12)
         └─ Yes → Bet between min and 12
         └─ No → Skip
   └─ No → Bet between 7-10

4. Without trump? (15-20% chance)
```

#### Implementation
```typescript
static makeBet(
  gameState: GameState,
  playerId: string
): { amount: number; withoutTrump: boolean; skipped: boolean } {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  const isDealer = playerIndex === gameState.dealerIndex;
  const currentBets = gameState.currentBets;

  // Check if there are any valid bets
  const hasValidBets = currentBets.some(b => !b.skipped);

  // Dealer must bet if no one else has
  if (isDealer && !hasValidBets) {
    return { amount: 7, withoutTrump: false, skipped: false };
  }

  // 30% chance to skip if allowed
  if (!isDealer && Math.random() < 0.3) {
    return { amount: 7, withoutTrump: false, skipped: true };
  }

  // Find highest bet
  const validBets = currentBets.filter(b => !b.skipped);
  const highestBet = validBets.length > 0
    ? validBets.reduce((highest, current) => {
        if (current.amount > highest.amount) return current;
        if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) return current;
        return highest;
      })
    : null;

  // If there's a highest bet, must raise (or dealer can match)
  if (highestBet) {
    const minBet = isDealer ? highestBet.amount : highestBet.amount + 1;
    const maxBet = 12;

    if (minBet > maxBet) {
      // Can't raise, skip
      return { amount: 7, withoutTrump: false, skipped: true };
    }

    // Pick random bet between min and max
    const amount = Math.floor(Math.random() * (maxBet - minBet + 1)) + minBet;
    const withoutTrump = Math.random() < 0.2; // 20% chance for without trump

    return { amount, withoutTrump, skipped: false };
  }

  // No bets yet, make random bet between 7-10
  const amount = Math.floor(Math.random() * 4) + 7; // 7-10
  const withoutTrump = Math.random() < 0.15; // 15% chance for without trump

  return { amount, withoutTrump, skipped: false };
}
```

**Probabilities**:
- Skip chance: 30% (if allowed)
- Without trump (with bet): 15-20%
- Initial bet range: 7-10
- Raise amount: Random between minimum and 12

### Card Playing Logic
**Location**: `frontend/src/utils/botPlayer.ts:75-88`

#### Strategy
```typescript
static playCard(gameState: GameState, playerId: string): Card | null {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || player.hand.length === 0) return null;

  // Get playable cards
  const playableCards = this.getPlayableCards(gameState, player.hand);

  if (playableCards.length === 0) return null;

  // Simple strategy: random playable card
  const randomIndex = Math.floor(Math.random() * playableCards.length);
  return playableCards[randomIndex];
}
```

**Current Strategy**: **Random Legal Move**
- Get all legal cards (suit-following rules applied)
- Pick one at random

**Future Improvements**: See section below

#### Playable Card Determination
```typescript
private static getPlayableCards(gameState: GameState, hand: Card[]): Card[] {
  // If no cards in trick, all cards are playable
  if (gameState.currentTrick.length === 0) return hand;

  // Get led suit
  const ledSuit = gameState.currentTrick[0].card.color;
  const cardsInLedSuit = hand.filter(c => c.color === ledSuit);

  // If player has led suit, they must play it
  if (cardsInLedSuit.length > 0) {
    return cardsInLedSuit;
  }

  // Otherwise, all cards are playable
  return hand;
}
```

**Follows game rules**:
1. If leading, any card is playable
2. If following, must match led suit if possible
3. If can't match led suit, any card is playable

---

## Bot Lifecycle Management

### Quick Play Sequence

#### 1. User Clicks QuickPlay
```typescript
const handleQuickPlay = () => {
  if (!socket) return;

  // Listen for game creation
  const gameCreatedHandler = ({ gameId: createdGameId }) => {
    setTimeout(() => {
      // Spawn 3 bots after 500ms delay
      for (let i = 0; i < 3; i++) {
        createBot(i, createdGameId);
      }
    }, 500);
    socket.off('game_created', gameCreatedHandler);
  };

  socket.on('game_created', gameCreatedHandler);
  socket.emit('create_game', 'You');
};
```

**Why the delay?** Ensures game state is fully initialized before bots join

#### 2. Bot Creation
```typescript
const botSocket = io(SOCKET_URL);
const botName = `Bot ${i + 1}`;

botSocket.on('connect', () => {
  botSocket.emit('join_game', { gameId: createdGameId, playerName: botName });
});
```

**Each bot**:
- Gets its own WebSocket connection
- Has a unique name (`Bot 1`, `Bot 2`, `Bot 3`)
- Joins the same game as the player

#### 3. Bot Event Listeners
```typescript
botSocket.on('player_joined', ({ gameState }) => {
  handleBotAction(botSocket, gameState, botSocket.id || '');
});
botSocket.on('game_updated', (state) => {
  handleBotAction(botSocket, state, botSocket.id || '');
});
botSocket.on('round_started', (state) => {
  handleBotAction(botSocket, state, botSocket.id || '');
});
botSocket.on('trick_resolved', ({ gameState }) => {
  handleBotAction(botSocket, state, botSocket.id || '');
});
botSocket.on('round_ended', (state) => {
  handleBotAction(botSocket, state, botSocket.id || '');
});
```

**Bot reacts to**:
- Player joining (might be another bot)
- Game state updates
- Round starts
- Trick resolutions
- Round endings

### Bot Action Handler

```typescript
const handleBotAction = (botSocket: Socket, state: GameState, botId: string) => {
  // Clear existing timeout for THIS bot only
  const existingTimeout = botTimeoutsRef.current.get(botId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    botTimeoutsRef.current.delete(botId);
  }

  const botPlayer = state.players.find(p => p.id === botSocket.id);
  if (!botPlayer) return;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isBotTurn = currentPlayer?.id === botSocket.id;

  if (!isBotTurn) return;

  // Perform appropriate action based on phase
  const timeout = setTimeout(() => {
    if (state.phase === 'team_selection') {
      const playerIndex = state.players.findIndex(p => p.id === botSocket.id);
      const teamId = BotPlayer.selectTeam(playerIndex);
      botSocket.emit('select_team', { gameId: state.id, teamId });

      // Auto-start when all 4 players are ready
      if (state.players.length === 4) {
        setTimeout(() => {
          botSocket.emit('start_game', { gameId: state.id });
        }, 500);
      }
    } else if (state.phase === 'betting') {
      const decision = BotPlayer.makeBet(state, botSocket.id || '');
      botSocket.emit('place_bet', {
        gameId: state.id,
        amount: decision.amount,
        withoutTrump: decision.withoutTrump,
        skipped: decision.skipped
      });
    } else if (state.phase === 'playing') {
      const card = BotPlayer.playCard(state, botSocket.id || '');
      if (card) {
        botSocket.emit('play_card', { gameId: state.id, card });
      }
    }

    botTimeoutsRef.current.delete(botId);
  }, BotPlayer.getActionDelay());

  botTimeoutsRef.current.set(botId, timeout);
};
```

**Key points**:
- Uses per-bot timeout tracking (prevents bots from interfering with each other)
- Only acts on bot's turn
- Adds randomized delay for natural feel
- Auto-starts game when all players ready

---

## Timeout Management

### The Problem
Initially, there was a shared `botTimeoutRef` that all bots used:
```typescript
// ❌ BAD - Shared timeout
const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Bot 1 sets timeout
botTimeoutRef.current = setTimeout(...);

// Bot 2 clears Bot 1's timeout!
clearTimeout(botTimeoutRef.current);
```

**Result**: Bots would cancel each other's timeouts, causing some bots to never take their turn

### The Solution
Use a Map to track timeouts per bot:
```typescript
// ✅ GOOD - Per-bot timeouts
const botTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

// Each bot has its own timeout
const timeout = setTimeout(() => {
  // Bot action
  botTimeoutsRef.current.delete(botId);
}, delay);

botTimeoutsRef.current.set(botId, timeout);
```

**Benefits**:
- Each bot's timeout is independent
- Bots don't interfere with each other
- Timeouts are properly cleaned up

---

## Natural Timing

### Action Delay
```typescript
static getActionDelay(): number {
  // Random delay between 500-1500ms
  return Math.floor(Math.random() * 1000) + 500;
}
```

**Why randomize?**
- Makes bot behavior feel more human
- Prevents all bots from acting simultaneously
- Creates natural game flow

**Timing breakdown**:
- Minimum: 500ms (fast bot)
- Maximum: 1500ms (thinking bot)
- Average: 1000ms (1 second)

---

## Testing with Bots

### Quick Play Benefits
1. **Instant Testing** - No need to open multiple browser windows
2. **Full Game Flow** - Bots play through entire games
3. **Edge Case Testing** - Bots make random decisions, hitting edge cases
4. **Performance Testing** - See how game handles multiple players
5. **Visual Testing** - Watch UI updates in real-time

### What Bots Test
✅ Turn-based betting
✅ Bet escalation rules
✅ Dealer privilege
✅ Skip betting
✅ Without trump betting
✅ Card playing
✅ Suit-following rules
✅ Trick resolution
✅ Round scoring
✅ Multiple rounds
✅ Game completion

### What Bots Don't Test
❌ UI interactions (clicking buttons)
❌ Client-side validation feedback
❌ Human decision-making quality
❌ Strategic gameplay
❌ Edge cases humans wouldn't trigger

---

## Current Limitations

### 1. No Strategic Intelligence
Bots play randomly among legal moves. They don't:
- Track which cards have been played
- Remember trump suit
- Try to win tricks
- Coordinate with partners
- Set or defend bets strategically

### 2. Betting is Random
Bots don't consider:
- Hand strength
- Trump cards available
- Partner's position
- Score differential

### 3. No Learning
Bots don't:
- Improve over time
- Adapt to opponents
- Remember previous rounds

---

## Future Improvements

### Beginner Bot (Easy)
```typescript
// Already implemented - random legal moves
static playCardBeginner(gameState: GameState, playerId: string): Card {
  const playableCards = this.getPlayableCards(gameState, player.hand);
  return playableCards[Math.floor(Math.random() * playableCards.length)];
}
```

### Intermediate Bot (Medium)
```typescript
static playCardIntermediate(gameState: GameState, playerId: string): Card {
  const playableCards = this.getPlayableCards(gameState, player.hand);
  const ledSuit = gameState.currentTrick[0]?.card.color;
  const trump = gameState.trump;

  // If leading, play low card
  if (gameState.currentTrick.length === 0) {
    return playableCards.reduce((lowest, card) =>
      card.value < lowest.value ? card : lowest
    );
  }

  // If following, try to win with lowest winning card
  const winningCards = playableCards.filter(card =>
    canWinTrick(card, gameState.currentTrick, trump)
  );

  if (winningCards.length > 0) {
    return winningCards.reduce((lowest, card) =>
      card.value < lowest.value ? card : lowest
    );
  }

  // Can't win, play lowest card
  return playableCards.reduce((lowest, card) =>
    card.value < lowest.value ? card : lowest
  );
}
```

**Strategy**:
- Lead with low cards
- Win tricks with lowest winning card
- Dump low cards when can't win

### Advanced Bot (Hard)
```typescript
static playCardAdvanced(gameState: GameState, playerId: string): Card {
  const player = gameState.players.find(p => p.id === playerId);
  const partner = gameState.players.find(p =>
    p.teamId === player.teamId && p.id !== player.id
  );

  // Track cards played
  const playedCards = getPlayedCards(gameState);

  // Is partner winning?
  const isPartnerWinning = isPartnerWinningTrick(gameState, playerId);

  if (isPartnerWinning) {
    // Partner winning - dump low card
    return playableCards.reduce((lowest, card) =>
      card.value < lowest.value ? card : lowest
    );
  }

  // Calculate point cards in trick
  const pointsInTrick = calculateTrickPoints(gameState.currentTrick);

  if (pointsInTrick >= 5) {
    // High value trick - try to win
    return tryToWinTrick(playableCards, gameState);
  }

  // Normal trick - play strategically
  return playStrategic(playableCards, gameState, playedCards);
}
```

**Strategy**:
- Track played cards
- Help partner win
- Capture valuable tricks
- Avoid giving points to opponents

### Betting Intelligence
```typescript
static makeBetSmart(gameState: GameState, playerId: string): Bet {
  const player = gameState.players.find(p => p.id === playerId);
  const handStrength = evaluateHand(player.hand, gameState);

  // Count trump cards
  const trumpCards = player.hand.filter(c => c.color === predictTrump(player.hand));

  // Count high cards
  const highCards = player.hand.filter(c => c.value >= 5);

  // Estimate tricks
  const estimatedTricks = trumpCards.length + Math.floor(highCards.length / 2);

  // Bet based on hand strength
  if (estimatedTricks >= 8) {
    return { amount: 10, withoutTrump: false, skipped: false };
  } else if (estimatedTricks >= 6) {
    return { amount: 8, withoutTrump: false, skipped: false };
  } else {
    // Weak hand - skip or bet minimum
    return Math.random() < 0.7
      ? { amount: 7, withoutTrump: false, skipped: true }
      : { amount: 7, withoutTrump: false, skipped: false };
  }
}
```

---

## Debugging Bots

### Console Logs
```typescript
console.log(`Bot ${botName} joining game ${gameId}`);
console.log(`Bot ${botId} betting: ${amount}${withoutTrump ? ' (without trump)' : ''}`);
console.log(`Bot ${botId} playing: ${card.color} ${card.value}`);
```

### Common Issues

#### 1. Bot Not Taking Turn
**Symptoms**: Game stuck waiting for bot
**Causes**:
- Timeout was cleared by another bot
- Bot disconnected
- Bot didn't receive game state update

**Solution**: Check `botTimeoutsRef` is using Map, not single value

#### 2. Bot Playing Out of Turn
**Symptoms**: "It is not your turn" errors
**Causes**:
- Game state not synchronized
- Timeout fired too early

**Solution**: Verify `isBotTurn` check in `handleBotAction`

#### 3. Multiple Bots Betting Simultaneously
**Symptoms**: Multiple "already placed bet" errors
**Causes**:
- Shared timeout reference
- No turn checking

**Solution**: Use per-bot timeout Map

---

## Architecture Decisions

### Why Frontend Bots?
**Pros**:
- Easy to implement
- Uses existing game logic
- Tests real player flow
- No server changes needed

**Cons**:
- Bots require client connection
- Can't run on server only
- Limited to development/testing

**Alternative**: Backend bots
- Would live on server
- Could run headless games
- More complex to implement
- Requires separate AI service

### Why Separate Sockets?
**Pros**:
- Bots are real players from server perspective
- No special bot handling needed server-side
- Tests actual multiplayer flow
- Easy to debug

**Cons**:
- More connections to server
- Slightly more overhead

**Alternative**: Single socket with bot commands
- Would require server bot support
- More complex protocol
- Less realistic testing

---

## Key Takeaways

1. **Bots use real player flow** - They connect, join, and play like humans
2. **Each bot is independent** - Separate sockets, separate timeouts
3. **Simple AI for now** - Random legal moves, basic betting
4. **Great for testing** - QuickPlay enables instant full-game testing
5. **Room for improvement** - Can add strategic intelligence later
6. **Timeout management is critical** - Per-bot Map prevents interference
7. **Natural timing** - Randomized delays make bots feel human

---

*Last Updated: 2025-10-09*
*Related Files: frontend/src/utils/botPlayer.ts, frontend/src/App.tsx, frontend/src/components/Lobby.tsx*
