# Implementation Plan

## Overview
This document outlines the systematic implementation of improvements from IMPROVEMENT_SUGGESTIONS.md, following a test-driven development approach. Each feature will be implemented with accompanying E2E tests before moving to the next.

**Guiding Principles**:
1. **TDD First** - Write E2E tests before implementing features
2. **Incremental Progress** - Complete one feature fully before moving to next
3. **Test Maintenance** - Keep test suite passing at all times
4. **Documentation** - Update docs as features are added
5. **Git Discipline** - Commit after each completed feature

---

## Phase 1: Critical Issues (Priority 1)

### 1.1 Player Timeout / AFK Detection
**Estimated Time**: 4-6 hours
**Test Coverage Required**: 95%+

#### Implementation Steps

**Step 1: Backend Types & Infrastructure** (30 min)
- [ ] Add `PlayerTimeout` interface to `backend/src/types/game.ts`
- [ ] Add `timeoutsEnabled: boolean` to GameState (for testing control)
- [ ] Add `currentPlayerTimeout` to GameState
- [ ] Update frontend types to match

**Step 2: Backend Timeout Logic** (1.5 hours)
- [ ] Create `playerTimeouts` Map in `backend/src/index.ts`
- [ ] Implement `startPlayerTimeout(gameId, playerId)` function
- [ ] Implement `clearPlayerTimeout(playerId)` function
- [ ] Implement `handlePlayerTimeout(gameId, playerId)` function
- [ ] Add timeout start/clear to all action handlers (bet, play_card)
- [ ] Add new socket events: `'player_timeout_update'`, `'player_timeout'`

**Step 3: Frontend UI Components** (1 hour)
- [ ] Add timeout display to BettingPhase component (above current player)
- [ ] Add timeout display to PlayingPhase component (above current player)
- [ ] Style with urgent colors (yellow at 30s, red at 10s)
- [ ] Add countdown animation

**Step 4: E2E Tests** (1.5 hours)
```typescript
// e2e/tests/08-timeouts.spec.ts

test('should show timeout countdown for current player', async ({ page }) => {
  // Create game with bots
  // Wait for betting phase
  // Verify timeout appears with 60s countdown
  // Verify countdown decrements
});

test('should auto-skip bet when player times out', async ({ page }) => {
  // Create game, don't place bet
  // Wait for 60+ seconds
  // Verify bet was auto-skipped
  // Verify turn advanced
});

test('should auto-play random card when player times out', async ({ page }) => {
  // Create game, reach playing phase
  // Don't play card
  // Wait for 60+ seconds
  // Verify random card was played
  // Verify turn advanced
});

test('should clear timeout when action is taken', async ({ page }) => {
  // Start timeout countdown
  // Place bet before timeout
  // Verify timeout cleared
  // Verify no auto-action taken
});

test('should emit timeout event to all players', async () => {
  // Create 4-player game
  // Let one player timeout
  // Verify all players receive 'player_timeout' event
  // Verify UI shows timeout notification
});
```

**Step 5: Documentation** (30 min)
- [ ] Update CLAUDE.md with timeout system documentation
- [ ] Add timeout configuration section
- [ ] Document timeout events in WebSocket section

**Git Commit**: `feat: Add player timeout/AFK detection system`

---

### 1.2 Reconnection Support
**Estimated Time**: 6-8 hours
**Test Coverage Required**: 90%+

#### Implementation Steps

**Step 1: Backend Session Management** (2 hours)
- [ ] Add `PlayerCredential` interface to types
- [ ] Create `playerSessions` Map to track credentials
- [ ] Implement `generateSessionToken()` function
- [ ] Implement `validateSessionToken()` function
- [ ] Store player sessions on `join_game`
- [ ] Add 2-minute grace period on disconnect
- [ ] Add `'reconnect_to_game'` socket event handler

**Step 2: Frontend Session Storage** (1 hour)
- [ ] Save session token to localStorage on join
- [ ] Check for existing session on app load
- [ ] Implement auto-reconnect on app mount
- [ ] Add manual "Reconnect" button on disconnect
- [ ] Show "Reconnecting..." UI state

**Step 3: Game State Sync** (1.5 hours)
- [ ] On reconnect, emit full game state to player
- [ ] Update player's socket ID in game
- [ ] Notify other players of reconnection
- [ ] Handle edge cases (game ended, player was kicked)

**Step 4: E2E Tests** (2 hours)
```typescript
// e2e/tests/09-reconnection.spec.ts

test('should allow player to reconnect after disconnect', async ({ page, context }) => {
  // Create game, join as player
  // Store session token from localStorage
  // Simulate disconnect (close connection)
  // Reload page
  // Verify auto-reconnection
  // Verify game state restored
});

test('should update socket ID on reconnection', async () => {
  // Create game with 4 players
  // Player 2 disconnects
  // Player 2 reconnects with new socket
  // Verify player 2 can take actions
  // Verify other players see player 2's actions
});

test('should notify other players of reconnection', async () => {
  // 4-player game
  // Player 3 disconnects
  // Other players see "Player 3 disconnected"
  // Player 3 reconnects
  // Other players see "Player 3 reconnected"
});

test('should handle expired session token', async ({ page }) => {
  // Create game
  // Wait 3+ minutes (past grace period)
  // Try to reconnect
  // Verify rejection with appropriate error
});

test('should prevent reconnection to finished game', async ({ page }) => {
  // Create game, play to completion
  // Disconnect
  // Try to reconnect
  // Verify rejection or redirect to lobby
});

test('should clear session on explicit leave', async ({ page }) => {
  // Create game
  // Click "Leave Game" button
  // Verify session cleared from localStorage
  // Verify cannot auto-reconnect
});
```

**Step 5: UI Polish** (1 hour)
- [ ] Add connection status indicator (green/yellow/red dot)
- [ ] Show "Player X disconnected" toast notifications
- [ ] Show "Player X reconnected" toast notifications
- [ ] Add reconnection progress bar

**Step 6: Documentation** (30 min)
- [ ] Update CLAUDE.md with reconnection system
- [ ] Document session management
- [ ] Document reconnection flow diagram

**Git Commit**: `feat: Add reconnection support with session management`

---

## Phase 2: Gameplay Enhancements (Priority 2-3)

### 2.1 Improve Bot AI Intelligence
**Estimated Time**: 5-7 hours
**Test Coverage Required**: 85%+

#### Implementation Steps

**Step 1: Create AI Difficulty System** (1 hour)
- [ ] Add `BotDifficulty` enum: Easy, Medium, Hard
- [ ] Add difficulty parameter to bot spawning
- [ ] Create separate strategy classes for each difficulty
- [ ] Update Quick Play to allow difficulty selection

**Step 2: Implement Medium AI** (2 hours)
- [ ] **Betting**: Evaluate hand strength (count high cards)
- [ ] **Card Playing**: Win tricks with lowest winning card
- [ ] **Card Playing**: Dump low cards when can't win
- [ ] Add tests for medium bot behavior

**Step 3: Implement Hard AI** (2.5 hours)
- [ ] **Card Tracking**: Track which cards have been played
- [ ] **Card Playing**: Deduce which suits other players lack
- [ ] **Card Playing**: Help partner win tricks
- [ ] **Betting**: Account for partner's likely hand strength
- [ ] Add tests for hard bot behavior

**Step 4: E2E Tests** (1.5 hours)
```typescript
// e2e/tests/10-bot-ai.spec.ts

test('easy bot should make random decisions', async ({ page }) => {
  // Create game with Easy bot
  // Verify bot makes random bets (no pattern)
  // Verify bot plays random valid cards
});

test('medium bot should try to win tricks efficiently', async ({ page }) => {
  // Create game with Medium bot
  // Track bot's card plays
  // Verify bot uses lowest winning card
  // Verify bot dumps low cards when losing
});

test('hard bot should track cards and help partner', async ({ page }) => {
  // Create game with Hard bot
  // Bot's partner leads a suit
  // Verify bot plays high card to help partner win
  // Verify bot avoids winning when partner is winning
});

test('should allow difficulty selection in Quick Play', async ({ page }) => {
  // Open Quick Play dialog
  // Select "Hard" difficulty
  // Start game
  // Verify bots behave according to hard strategy
});

test('bots should still follow game rules regardless of difficulty', async ({ page }) => {
  // Create games with each difficulty
  // Verify all bots follow suit-following rules
  // Verify all bots make valid bets
  // Verify no invalid moves
});
```

**Step 5: Documentation** (30 min)
- [ ] Update BOT_PLAYER_SYSTEM.md with new AI strategies
- [ ] Add decision flowcharts for each difficulty
- [ ] Document AI limitations and future improvements

**Git Commit**: `feat: Add difficulty levels to bot AI (Easy/Medium/Hard)`

---

### 3.1 Add Animations
**Estimated Time**: 4-6 hours
**Test Coverage Required**: 70%+

#### Implementation Steps

**Step 1: Install Framer Motion** (15 min)
```bash
cd frontend
npm install framer-motion
```

**Step 2: Card Play Animations** (2 hours)
- [ ] Animate cards flying from hand to center
- [ ] Add stagger effect for multiple cards
- [ ] Animate trick collection (cards flying to winner)
- [ ] Add scale/rotate effects on hover

**Step 3: Score Update Animations** (1 hour)
- [ ] Animate score numbers changing (count-up effect)
- [ ] Add floating "+X" text above score
- [ ] Pulse effect on score gain/loss

**Step 4: Phase Transition Animations** (1 hour)
- [ ] Fade in/out between phases
- [ ] Slide in betting phase controls
- [ ] Animate trump reveal

**Step 5: E2E Tests** (1 hour)
```typescript
// e2e/tests/11-animations.spec.ts

test('cards should animate when played', async ({ page }) => {
  // Create game with Quick Play
  // Play a card
  // Verify card animates to center
  // Verify animation completes before next action
});

test('score should animate when updated', async ({ page }) => {
  // Complete a round
  // Verify score counts up with animation
  // Verify "+X" floating text appears
});

test('animations should not block game flow', async ({ page }) => {
  // Play through full round with animations
  // Verify no delays in game progression
  // Verify all animations complete properly
});

test('animations should be performant', async ({ page }) => {
  // Measure FPS during animations
  // Verify no significant frame drops
  // Verify animations are smooth
});
```

**Step 6: Add Animation Settings** (30 min)
- [ ] Add "Reduce motion" toggle in settings
- [ ] Respect `prefers-reduced-motion` media query
- [ ] Disable animations if user prefers

**Step 7: Documentation** (30 min)
- [ ] Update CLAUDE.md with animation documentation
- [ ] Document animation library choice
- [ ] Document performance considerations

**Git Commit**: `feat: Add animations using Framer Motion`

---

### 3.2 Mobile Responsive Design
**Estimated Time**: 6-8 hours
**Test Coverage Required**: 80%+

#### Implementation Steps

**Step 1: Update Circular Card Layout** (2.5 hours)
- [ ] Convert to grid layout on mobile
- [ ] Keep circular layout on desktop (md: breakpoint)
- [ ] Test on various screen sizes (iPhone SE, iPhone 14, iPad)
- [ ] Ensure cards are readable on small screens

**Step 2: Touch-Friendly Controls** (2 hours)
- [ ] Increase button sizes on mobile (min-h-[44px])
- [ ] Add larger tap targets for cards
- [ ] Implement swipeable hand (horizontal scroll)
- [ ] Add pull-to-refresh for game state

**Step 3: Mobile Navigation** (1 hour)
- [ ] Collapse debug controls into hamburger menu on mobile
- [ ] Make leaderboard full-screen on mobile
- [ ] Add bottom navigation for common actions

**Step 4: E2E Tests** (2 hours)
```typescript
// e2e/tests/12-mobile-responsive.spec.ts

test('should display cards in grid on mobile', async ({ page }) => {
  // Set mobile viewport (375x667)
  await page.setViewportSize({ width: 375, height: 667 });

  // Create game with Quick Play
  // Verify cards in 2x2 grid
  // Verify readable card sizes
});

test('should have touch-friendly buttons', async ({ page }) => {
  // Set mobile viewport
  // Verify all buttons >= 44px height
  // Verify tap targets don't overlap
});

test('should allow horizontal scrolling of hand', async ({ page }) => {
  // Set mobile viewport
  // Verify hand scrolls horizontally
  // Verify all cards accessible via scroll
});

test('should collapse debug controls on mobile', async ({ page }) => {
  // Set mobile viewport
  // Verify debug buttons in hamburger menu
  // Verify menu opens/closes properly
});

test('should maintain functionality on tablet', async ({ page }) => {
  // Set tablet viewport (768x1024)
  // Verify hybrid layout (some mobile, some desktop features)
  // Verify all features accessible
});

test('should work in landscape orientation', async ({ page }) => {
  // Set mobile landscape (667x375)
  // Verify layout adapts
  // Verify game is playable
});
```

**Step 5: Documentation** (30 min)
- [ ] Update CLAUDE.md with responsive design patterns
- [ ] Document breakpoints used
- [ ] Add screenshots of mobile layouts

**Git Commit**: `feat: Add mobile responsive design`

---

### 4.2 Add Chat System
**Estimated Time**: 4-5 hours
**Test Coverage Required**: 85%+

#### Implementation Steps

**Step 1: Backend Chat Infrastructure** (1.5 hours)
- [ ] Add `ChatMessage` interface to types
- [ ] Add `'send_chat'` socket event handler
- [ ] Add message validation (length, rate limiting)
- [ ] Broadcast messages to all players in game
- [ ] Store last 50 messages per game (in memory)

**Step 2: Frontend Chat Component** (2 hours)
- [ ] Create `ChatBox.tsx` component
- [ ] Add message input with Enter key support
- [ ] Display messages with player names and timestamps
- [ ] Auto-scroll to bottom on new messages
- [ ] Add unread message indicator

**Step 3: Chat UI Integration** (1 hour)
- [ ] Add chat toggle button to game UI
- [ ] Make chat collapsible/expandable
- [ ] Position chat on side of game board (desktop)
- [ ] Position chat as bottom sheet (mobile)

**Step 4: E2E Tests** (1.5 hours)
```typescript
// e2e/tests/13-chat.spec.ts

test('should send and receive chat messages', async () => {
  // Create 4-player game (2 humans, 2 bots)
  const [player1, player2] = pages;

  // Player 1 sends message
  await player1.fill('[data-testid="chat-input"]', 'Hello!');
  await player1.press('[data-testid="chat-input"]', 'Enter');

  // Verify Player 2 receives message
  await expect(player2.getByText('Player 1: Hello!')).toBeVisible();
});

test('should show player names with messages', async ({ page }) => {
  // Create game
  // Send message
  // Verify format: "Player Name: Message"
  // Verify timestamp shown
});

test('should auto-scroll to new messages', async ({ page }) => {
  // Create game
  // Send 20+ messages (overflow chat)
  // Verify scroll is at bottom
  // Verify newest message visible
});

test('should prevent empty messages', async ({ page }) => {
  // Try to send empty message
  // Verify message not sent
  // Verify no error shown
});

test('should limit message length', async ({ page }) => {
  // Try to send 500+ character message
  // Verify message truncated or rejected
  // Verify appropriate feedback
});

test('should rate limit chat messages', async ({ page }) => {
  // Send 10+ messages rapidly
  // Verify rate limit kicks in
  // Verify error message shown
});

test('should show unread message indicator', async () => {
  const [player1, player2] = pages;

  // Player 1 sends message
  // Player 2 has chat closed
  // Verify unread badge appears
  // Player 2 opens chat
  // Verify badge disappears
});

test('chat should work on mobile', async ({ page }) => {
  // Set mobile viewport
  // Verify chat opens as bottom sheet
  // Verify keyboard doesn't cover input
  // Verify messages readable
});
```

**Step 5: Chat Enhancements** (1 hour)
- [ ] Add emoji picker
- [ ] Add @mention support
- [ ] Add team-only chat option
- [ ] Add chat history persistence (localStorage)

**Step 6: Documentation** (30 min)
- [ ] Update CLAUDE.md with chat system
- [ ] Document chat events
- [ ] Document rate limiting rules

**Git Commit**: `feat: Add real-time chat system`

---

## Phase 3: Code Quality & Testing

### Test Suite Maintenance (Ongoing)

**After Each Feature**:
1. Run full E2E test suite: `npm run test:e2e`
2. Fix any broken tests
3. Update test snapshots if needed
4. Document test coverage in CLAUDE.md

**E2E Test Organization**:
```
e2e/tests/
├── 01-lobby.spec.ts           # ✅ Existing
├── 02-betting.spec.ts          # ✅ Existing
├── 03-playing.spec.ts          # ✅ Existing
├── 04-game-flow.spec.ts        # ✅ Existing
├── 05-skip-bet.spec.ts         # ✅ Existing
├── 06-validation.spec.ts       # ✅ Existing
├── 07-full-game.spec.ts        # ✅ Existing
├── 08-timeouts.spec.ts         # 🆕 Timeout/AFK tests
├── 09-reconnection.spec.ts     # 🆕 Reconnection tests
├── 10-bot-ai.spec.ts           # 🆕 Bot AI difficulty tests
├── 11-animations.spec.ts       # 🆕 Animation tests
├── 12-mobile-responsive.spec.ts # 🆕 Mobile/responsive tests
└── 13-chat.spec.ts             # 🆕 Chat system tests
```

---

## Success Criteria

### Each Feature Must:
- ✅ Have E2E tests with >80% coverage
- ✅ Pass all existing tests
- ✅ Be documented in CLAUDE.md
- ✅ Follow existing code patterns
- ✅ Have no TypeScript errors
- ✅ Work in both dev and production builds

### Phase Completion:
- ✅ All features implemented
- ✅ All tests passing (target: 95%+ suite-wide)
- ✅ Documentation updated
- ✅ Git commits are clean and descriptive
- ✅ No regression bugs introduced

---

## Timeline Estimate

**Phase 1 (Critical)**: 10-14 hours (~2 work days)
- 1.1 Timeout/AFK: 4-6 hours
- 1.2 Reconnection: 6-8 hours

**Phase 2 (Enhancements)**: 19-26 hours (~4 work days)
- 2.1 Bot AI: 5-7 hours
- 3.1 Animations: 4-6 hours
- 3.2 Mobile: 6-8 hours
- 4.2 Chat: 4-5 hours

**Total**: 29-40 hours (~6 work days)

---

## Next Steps

1. ✅ Create this plan
2. Start with Priority 1.1 (Player Timeout/AFK Detection)
3. Follow TDD approach: Write tests → Implement → Pass tests
4. Move incrementally through each feature
5. Update this plan as progress is made

---

*Created: 2025-10-08*
*Status: In Progress*
