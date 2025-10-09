# Validation System Documentation

## Overview
The game implements a multi-layered validation system to ensure data integrity and prevent race conditions across all game phases. This document details the validation architecture implemented to create a robust, cheat-proof gaming experience.

---

## Architecture Philosophy

### Defense in Depth Strategy
The validation system uses **4 layers of protection**:
1. **Client-Side Validation** - Immediate feedback and basic checks
2. **Client-Side Debouncing** - Prevent rapid-fire actions
3. **Server-Side State Validation** - Verify game state consistency
4. **Server-Side Race Condition Protection** - Prevent duplicate actions

### Key Principles
- **Never trust the client** - All critical validation happens server-side
- **Provide clear feedback** - Users understand why actions are rejected
- **Fail safely** - Invalid requests are logged but don't crash the system
- **Early returns** - Stop processing invalid requests immediately
- **Detailed logging** - Debug issues quickly with comprehensive console logs

---

## Phase 1: Team Selection

### Location
`backend/src/index.ts:146-178`

### Validations Implemented

#### 1. Game Existence
```typescript
if (!game) {
  socket.emit('error', { message: 'Game not found' });
  return;
}
```
**Purpose**: Prevent operations on non-existent games

#### 2. Phase Check
```typescript
if (game.phase !== 'team_selection') {
  socket.emit('error', { message: 'Cannot select team - game has already started' });
  return;
}
```
**Purpose**: Prevent team changes after game starts

#### 3. Player Membership
```typescript
const player = game.players.find(p => p.id === socket.id);
if (!player) {
  socket.emit('error', { message: 'You are not in this game' });
  return;
}
```
**Purpose**: Ensure player is actually in the game

#### 4. Team ID Validation
```typescript
if (teamId !== 1 && teamId !== 2) {
  socket.emit('error', { message: 'Invalid team ID' });
  return;
}
```
**Purpose**: Prevent invalid team selections

#### 5. Team Size Enforcement
```typescript
const teamCount = game.players.filter(p => p.teamId === teamId).length;
if (teamCount >= 2 && player.teamId !== teamId) {
  socket.emit('error', { message: 'Team is full' });
  return;
}
```
**Purpose**: Maintain balanced teams (max 2 per team)

---

## Phase 2: Position Swapping

### Location
`backend/src/index.ts:181-218`

### Validations Implemented

#### 1. Game and Phase Validation
```typescript
if (!game) {
  socket.emit('error', { message: 'Game not found' });
  return;
}

if (game.phase !== 'team_selection') {
  socket.emit('error', { message: 'Cannot swap positions - game has already started' });
  return;
}
```

#### 2. Player Existence
```typescript
if (!currentPlayer) {
  socket.emit('error', { message: 'You are not in this game' });
  return;
}

if (!targetPlayer) {
  socket.emit('error', { message: 'Target player not found' });
  return;
}
```

#### 3. Self-Swap Prevention
```typescript
if (currentPlayer.id === targetPlayer.id) {
  socket.emit('error', { message: 'Cannot swap with yourself' });
  return;
}
```
**Purpose**: Prevent meaningless operations

---

## Phase 3: Game Start

### Location
`backend/src/index.ts:221-248`

### Validations Implemented

#### 1. Player Count
```typescript
if (game.players.length !== 4) {
  socket.emit('error', { message: 'Need exactly 4 players to start' });
  return;
}
```

#### 2. Team Balance
```typescript
const team1Count = game.players.filter(p => p.teamId === 1).length;
const team2Count = game.players.filter(p => p.teamId === 2).length;

if (team1Count !== 2 || team2Count !== 2) {
  socket.emit('error', { message: 'Teams must be balanced (2 players per team)' });
  return;
}
```
**Purpose**: Ensure fair 2v2 gameplay

---

## Phase 4: Betting

### Location
`backend/src/index.ts:250-383`

### Validations Implemented

#### 1. Turn Validation
```typescript
const currentPlayer = game.players[game.currentPlayerIndex];
if (currentPlayer.id !== socket.id) {
  socket.emit('invalid_bet', {
    message: 'It is not your turn to bet'
  });
  return;
}
```
**Purpose**: Enforce turn-based betting

#### 2. Duplicate Bet Prevention
```typescript
const hasAlreadyBet = game.currentBets.some(b => b.playerId === socket.id);
if (hasAlreadyBet) {
  console.log(`Player ${socket.id} attempted to bet multiple times`);
  socket.emit('invalid_bet', {
    message: 'You have already placed your bet'
  });
  return;
}
```
**Purpose**: Prevent players from betting twice

#### 3. Bet Range Validation
```typescript
if (!skipped && (amount < 7 || amount > 12)) {
  socket.emit('invalid_bet', {
    message: 'Bet amount must be between 7 and 12'
  });
  return;
}
```
**Purpose**: Enforce game rules for bet amounts

#### 4. Dealer Privilege Rules
```typescript
const isDealer = game.currentPlayerIndex === game.dealerIndex;

// Dealer cannot skip if no bets exist
if (isDealer && !hasValidBets) {
  socket.emit('invalid_bet', {
    message: 'As dealer, you must bet at least 7 points when no one has bet.'
  });
  return;
}

// Dealer can match, others must raise
if (isDealer) {
  if (amount < currentHighest.amount) {
    socket.emit('invalid_bet', {
      message: 'As dealer, you can match the highest bet or raise'
    });
    return;
  }
} else {
  if (!isBetHigher(newBet, currentHighest)) {
    socket.emit('invalid_bet', {
      message: 'You must bid higher than the current highest bet'
    });
    return;
  }
}
```
**Purpose**: Implement dealer privilege and bet escalation rules

---

## Phase 5: Playing Cards

### Location
`backend/src/index.ts:384-479`

### Validations Implemented (4 Layers)

#### Layer 1: Trick Completion Check
```typescript
// FIRST CHECK - Prevent playing during trick resolution
if (game.currentTrick.length >= 4) {
  console.log(`Player ${socket.id} attempted to play while trick is being resolved`);
  socket.emit('invalid_move', {
    message: 'Please wait for the current trick to be resolved'
  });
  return;
}
```
**Purpose**: Prevent race condition when trick is complete
**Added**: To fix issue where 4th card player could play again during 3-second delay

#### Layer 2: Turn Validation
```typescript
const currentPlayer = game.players[game.currentPlayerIndex];
if (currentPlayer.id !== socket.id) {
  socket.emit('invalid_move', {
    message: 'It is not your turn'
  });
  return;
}
```
**Purpose**: Enforce turn-based play

#### Layer 3: Card Data Validation
```typescript
if (!card || !card.color || card.value === undefined) {
  console.log(`Player ${socket.id} sent invalid card data:`, card);
  socket.emit('invalid_move', {
    message: 'Invalid card data'
  });
  return;
}
```
**Purpose**: Prevent malformed card data from crashing server

#### Layer 4: Card Ownership Validation
```typescript
const cardInHand = currentPlayer.hand.find(
  c => c.color === card.color && c.value === card.value
);
if (!cardInHand) {
  console.log(`Player ${socket.id} attempted to play card not in hand:`, card);
  socket.emit('invalid_move', {
    message: 'You do not have that card in your hand'
  });
  return;
}
```
**Purpose**: Prevent players from playing cards they don't have
**Critical**: This catches cheating attempts

#### Layer 5: Duplicate Play Prevention
```typescript
const hasAlreadyPlayed = game.currentTrick.some(tc => tc.playerId === socket.id);
if (hasAlreadyPlayed) {
  console.log(`Player ${socket.id} attempted to play multiple cards in same trick`);
  socket.emit('invalid_move', {
    message: 'You have already played a card this turn'
  });
  return;
}
```
**Purpose**: Prevent players from playing multiple cards in same trick
**Added**: To fix race condition from rapid clicking

#### Layer 6: Suit-Following Validation
```typescript
if (game.currentTrick.length > 0) {
  const ledSuit = game.currentTrick[0].card.color;
  const hasLedSuit = currentPlayer.hand.some((c) => c.color === ledSuit);

  if (hasLedSuit && card.color !== ledSuit) {
    socket.emit('invalid_move', {
      message: 'You must follow suit if you have it in your hand'
    });
    return;
  }
}
```
**Purpose**: Enforce suit-following game rule

---

## Client-Side Validation

### Location
`frontend/src/components/PlayingPhase.tsx:77-98`

### Debouncing Implementation

```typescript
const [isPlayingCard, setIsPlayingCard] = useState<boolean>(false);

// Reset when turn changes
useEffect(() => {
  if (!isCurrentTurn) {
    setIsPlayingCard(false);
  }
}, [isCurrentTurn]);

// Reset when trick length changes
useEffect(() => {
  setIsPlayingCard(false);
}, [gameState.currentTrick.length]);

const handleCardClick = (card: CardType) => {
  // FIRST CHECK: Prevent rapid clicks
  if (isPlayingCard) {
    return;
  }

  // ... other validations ...

  setValidationMessage('');
  setIsPlayingCard(true); // Set flag to prevent duplicate clicks
  onPlayCard(card);
};
```

**Purpose**: Prevent UI spam and accidental double-clicks
**Important**: This is UX enhancement, NOT security - server still validates

---

## Race Condition Prevention

### The Problem
When a player played the 4th card to complete a trick:
1. Card is added to `currentTrick`
2. Turn advances immediately to next player (might be same player if they won)
3. 3-second `setTimeout` delay before trick is cleared
4. During this 3-second window, player could click another card
5. Server would accept it because turn had advanced

### The Solution
**Immediate Turn Advancement** (backend/src/index.ts:464-466)
```typescript
// Move to next player IMMEDIATELY (before resolving trick)
const previousIndex = game.currentPlayerIndex;
game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
```

**Trick Completion Lock** (backend/src/index.ts:389-395)
```typescript
// Prevent playing when trick is complete (4 cards already played)
if (game.currentTrick.length >= 4) {
  console.log(`Player ${socket.id} attempted to play while trick is being resolved`);
  socket.emit('invalid_move', {
    message: 'Please wait for the current trick to be resolved'
  });
  return;
}
```

**Client-Side Debouncing** (frontend)
```typescript
const [isPlayingCard, setIsPlayingCard] = useState<boolean>(false);
// Prevents rapid clicks from even reaching server
```

### Result
**4-Layer Protection Against Race Conditions:**
1. Client prevents rapid clicks with `isPlayingCard` flag
2. Turn advances immediately, so `isCurrentTurn` becomes false on client
3. Server checks `currentTrick.length >= 4` to prevent plays during resolution
4. Server checks `hasAlreadyPlayed` to prevent duplicate plays

---

## Validation Event Flow

### Invalid Action Sequence
```
1. Client: User clicks invalid action
2. Client: Check isPlayingCard flag (if applicable)
3. Client: Send request to server
4. Server: Receive request
5. Server: Check game exists
6. Server: Check phase is correct
7. Server: Check player permissions
8. Server: Check action-specific validations
9. Server: Validation FAILS
10. Server: Log error to console
11. Server: Emit 'invalid_move' or 'invalid_bet' or 'error' to client
12. Client: Receive error event
13. Client: Display error message to user
14. Client: No state change occurs
```

### Valid Action Sequence
```
1. Client: User clicks valid action
2. Client: Set debounce flag (if applicable)
3. Client: Send request to server
4. Server: All validations PASS
5. Server: Update game state
6. Server: Emit 'game_updated' to all players in room
7. All Clients: Receive updated state
8. All Clients: Re-render UI with new state
9. Client: Reset debounce flag (on state change)
```

---

## Error Message Best Practices

### Clear and Actionable
✅ **Good**: "You must follow suit (red) if you have it"
❌ **Bad**: "Invalid move"

✅ **Good**: "As dealer, you can match the highest bet or raise"
❌ **Bad**: "Bet too low"

### Error Types
- `'error'` - General game errors (game not found, wrong phase)
- `'invalid_bet'` - Betting violations
- `'invalid_move'` - Card playing violations

---

## Testing the Validation System

### Manual Test Cases

#### 1. Double-Click Card Play
- **Test**: Rapidly click same card twice
- **Expected**: Only one card is played
- **Validation**: Client debouncing + server duplicate check

#### 2. Play Out of Turn
- **Test**: Try to play when it's not your turn
- **Expected**: "It is not your turn" error
- **Validation**: Server turn check

#### 3. Play Card Not in Hand
- **Test**: Modify client to send fake card
- **Expected**: "You do not have that card in your hand"
- **Validation**: Server ownership check

#### 4. Play During Trick Resolution
- **Test**: Play 4th card, immediately try to play 5th during 3-second delay
- **Expected**: "Please wait for the current trick to be resolved"
- **Validation**: Trick completion check

#### 5. Wrong Suit
- **Test**: Play off-suit when you have led suit
- **Expected**: "You must follow suit (color) if you have it"
- **Validation**: Suit-following check

#### 6. Bet Out of Turn
- **Test**: Try to bet when it's not your turn
- **Expected**: "It is not your turn to bet"
- **Validation**: Betting turn check

#### 7. Double Bet
- **Test**: Try to bet twice in same round
- **Expected**: "You have already placed your bet"
- **Validation**: Duplicate bet check

---

## Performance Considerations

### Why Immediate Validation?
- **Fast Feedback**: Users see errors instantly
- **Reduced Load**: Invalid requests rejected early
- **Clean Code**: Early returns keep functions simple

### Logging Strategy
```typescript
console.log(`Player ${socket.id} attempted to play multiple cards in same trick`);
```
- All validation failures are logged
- Helps identify cheating attempts
- Useful for debugging

### No Timeouts in Validation
❌ **Never Do This**:
```typescript
setTimeout(() => {
  validateMove();
}, 100);
```
✅ **Always Validate Immediately**:
```typescript
if (!isValid) {
  socket.emit('invalid_move', { message: 'Error' });
  return;
}
```

---

## Security Implications

### What This Prevents
✅ Playing cards not in your hand (cheating)
✅ Playing multiple cards in one turn (cheating)
✅ Betting out of turn (cheating)
✅ Changing teams after game starts (griefing)
✅ Swapping positions during game (griefing)
✅ Starting game without balanced teams (bug exploitation)

### What This Doesn't Prevent (Future Work)
❌ Slow play / AFK (no timeout system)
❌ Colluding with teammates via external chat (social)
❌ Intentionally bad plays (can't detect intent)

---

## Key Takeaways

1. **Never trust client** - All security validation is server-side
2. **Client validation is UX** - Makes UI feel responsive but isn't security
3. **Multiple layers** - Defense in depth protects against edge cases
4. **Clear messages** - Users understand why actions fail
5. **Early returns** - Stop processing invalid requests immediately
6. **Comprehensive logging** - Debug and detect cheating attempts
7. **Race conditions matter** - Think about timing and async operations

---

*Last Updated: 2025-10-09*
*Related Files: backend/src/index.ts, frontend/src/components/PlayingPhase.tsx*
