# Claude AI Development Guide

## Project Overview
Multiplayer Trick Card Game - Real-time 4-player, 2-team card game with WebSocket communication.

**Stack**: React + TypeScript, Tailwind CSS, Socket.io, Node.js, PostgreSQL

---

## 🎯 Core Development Principles

### Architecture Patterns
- **Small atomic components** - Favor new files over agglomeration
- **Event-driven architecture** - Use WebSocket events, NEVER setTimeout for game logic resolution
- **Type safety** - All WebSocket actions must be well-defined, typed, and reusable
- **TDD workflow** - Write tests proactively, follow TDD_WORKFLOW.md
- **Shared types** - Keep backend/src/types/game.ts and frontend/src/types/game.ts in sync

### Component Philosophy
- Keep components focused on single responsibilities
- Extract reusable logic into separate files
- Use composition over large monolithic components
- Example: `Card.tsx`, `BettingPhase.tsx`, `TeamSelection.tsx` - each handles one concern

---

## 🔌 WebSocket Event System

### Current Socket.io Events

**Client → Server:**
```typescript
'create_game': (playerName: string)
'join_game': { gameId: string; playerName: string }
'select_team': { gameId: string; teamId: 1 | 2 }
'swap_position': { gameId: string; targetPlayerId: string }
'start_game': { gameId: string }
'place_bet': { gameId: string; amount: number; withoutTrump: boolean }
'play_card': { gameId: string; card: Card }
```

**Server → Client:**
```typescript
'game_created': { gameId: string; gameState: GameState }
'player_joined': { player: Player; gameState: GameState }
'game_updated': (gameState: GameState)
'round_started': (gameState: GameState)
'trick_resolved': { winnerId: string; points: number; gameState: GameState }
'round_ended': (gameState: GameState)
'game_over': { winningTeam: 1 | 2; gameState: GameState }
'error': { message: string }
'invalid_move': { message: string }
'invalid_bet': { message: string }
'player_left': { playerId: string; gameState: GameState }
```

### Adding New Events
1. Define event types in both backend and frontend
2. Add handler in `backend/src/index.ts`
3. Add listener in `frontend/src/App.tsx`
4. Update this documentation
5. Write E2E test for the new event flow

---

## 🎮 Game Rules Implementation

### Betting System
- **Range**: 7-12 points (NOT tricks)
- **Hierarchy**: Higher amount > Same amount with "without trump" > Same amount with trump
- **Skip Option**: Players can skip their bet if no one has bet yet, or if they're not the dealer
- **Dealer rule**:
  - Betting order: Player after dealer → ... → Dealer last
  - Non-dealers MUST raise (beat current highest) OR skip (if no bets yet)
  - Dealer CAN equalize (match highest) or raise, but CANNOT skip if there are bets
  - If all 4 players skip, betting restarts from player after dealer

**UI Validation**:
- Place Bet button disabled when bet is too low
- Yellow warning message explains why bet is invalid
- Skip button only shown when skip is allowed
- Dealer privilege message shown to dealer
- Skipped bets shown with gray "Skipped" badge

**Implementation**:
- `backend/src/game/logic.ts:75-94` - `isBetHigher()` and `getHighestBet()` helpers
- `backend/src/index.ts:194-288` - Betting validation, skip handling, and turn order
- `frontend/src/components/BettingPhase.tsx` - Client-side validation and UI feedback

### Suit-Following Rule
- Players MUST play the led suit if they have it in hand
- First card in trick determines led suit
- Trump can always be played if no led suit in hand

**UI Validation**:
- Unplayable cards visually disabled with gray overlay and ✕ mark
- Blue info box shows led suit and requirement
- Yellow warning message when trying to play wrong suit
- "Waiting for [Player]..." message shown when not your turn

**Implementation**:
- `backend/src/index.ts:297-309` - Validation before card play
- `frontend/src/components/PlayingPhase.tsx` - Client-side playable card detection and UI feedback

### Trick Winner Logic
1. Trump always beats non-trump
2. Led suit beats off-suit (when no trump)
3. Highest value wins within same category

**Implementation**: `backend/src/game/logic.ts:10-54` - `determineWinner()`

### Points vs Tricks
- **Tricks**: Count of tricks won (tracked for display)
- **Points**: Actual scoring currency (used for betting/scoring)
- Base: 1 point per trick won
- Red 0 card: +5 points (total 6 for that trick)
- Brown 0 card: -2 points (total -1 for that trick)

**Implementation**:
- `backend/src/index.ts:294-321` - `resolveTrick()` awards pointsWon
- `backend/src/game/logic.ts:60-73` - `calculateRoundScore()` uses pointsWon

### Dealer Rotation
- Dealer rotates clockwise each round
- Initial dealer: Player 1 (index 0)
- `startNewRound()` rotates dealer BEFORE first betting phase
- First round: dealer becomes Player 2 (index 1)
- Affects betting order (player after dealer starts)
- Tracked via `gameState.dealerIndex`

**Implementation**: `backend/src/index.ts:330` - Dealer rotation in `startNewRound()`

**Important for Testing**: First round betting order is Player 3, 4, 1, 2 (not 1, 2, 3, 4)

---

## 🎨 UI/UX Validation Patterns

All game phases implement validation feedback to guide players:

### Team Selection Phase
- **Disabled State**: Start Game button disabled until 4 players with balanced teams (2v2)
- **Feedback**: Yellow info box explaining "Waiting for X more player(s)" or "Teams must have 2 players each"
- **Visual**: Gray disabled button vs green enabled button

### Betting Phase
- **Disabled State**: Place Bet button disabled when bet doesn't meet requirements
- **Feedback**:
  - Yellow warning: "You must raise the bet. Minimum: X"
  - Purple info: "Dealer Privilege: You can match or raise" (shown to dealer)
  - Gray "Skipped" badge for skipped bets
- **Visual**: Skip button only shown when allowed
- **Validation**: Real-time validation as slider/checkbox changes

### Playing Phase
- **Disabled State**: Unplayable cards have gray overlay with ✕ mark
- **Feedback**:
  - Blue info: "Led suit: [Color] - You must play [color]"
  - Yellow warning: "You must follow suit ([color]) if you have it"
  - Gray text: "Waiting for [PlayerName]..."
- **Visual**: Your turn indicated with green "(Your Turn)" text

### General Principles
1. **Proactive Feedback**: Show requirements BEFORE user tries invalid action
2. **Clear Messaging**: Explain WHY action is blocked, not just THAT it's blocked
3. **Visual Hierarchy**: Use color-coded messages (yellow=warning, blue=info, purple=special rule)
4. **Disabled States**: Gray out unavailable options with visual indicators
5. **Contextual Help**: Show relevant rules/constraints for current situation

---

## 🤖 Bot Players & Testing Tools

### Bot Player System
The game includes an AI bot system for single-screen testing without needing 4 browser windows.

**Implementation**: `frontend/src/utils/botPlayer.ts`

```typescript
class BotPlayer {
  // Alternates bots between Team 1 and Team 2
  static selectTeam(playerIndex: number): 1 | 2

  // Makes betting decisions (30% skip, 7-12 range, 20% without trump)
  static makeBet(gameState: GameState, playerId: string): { amount, withoutTrump, skipped }

  // Selects valid card following suit-following rules
  static playCard(gameState: GameState, playerId: string): Card | null

  // Returns 500-1500ms delay for natural gameplay feel
  static getActionDelay(): number
}
```

**Bot Decision Logic**:
- **Team Selection**: Alternates between teams (even index → Team 1, odd → Team 2)
- **Betting**:
  - 30% chance to skip (if allowed)
  - Random bet amount between 7-12
  - 20% chance for "without trump" modifier
  - Dealer always bets if no one else has
- **Card Playing**:
  - Follows suit-following rules strictly
  - Random selection among valid playable cards
  - Respects trump and led suit requirements

### Quick Play Feature
**Location**: Lobby screen (purple button with ⚡ icon)

**Usage**: Click "Quick Play (1 Player + 3 Bots)" to instantly create a 4-player game

**Implementation**: `frontend/src/App.tsx:120-151`
```typescript
const handleQuickPlay = () => {
  socket.emit('create_game', 'You');

  // After 500ms, spawn 3 bot players
  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      const botSocket = io(SOCKET_URL);
      const botName = `Bot ${i + 1}`;

      // Bot connects and joins game
      // Bot listens for game_updated, round_started, trick_resolved
      // Bot takes automated actions via handleBotAction()
    }
  }, 500);
}
```

**How it works**:
1. Creates game with human player named "You"
2. Spawns 3 separate socket connections for Bot 1, Bot 2, Bot 3
3. Bots join the game automatically
4. Bots listen for game state updates and take actions
5. Each bot has natural 500-1500ms delay between actions

### Test Panel
**Access**: Click "🧪 Test" button in top-right debug controls

**Location**: `frontend/src/components/TestPanel.tsx`

**Features**:
- **Set Team Scores**: Manually adjust Team 1 and Team 2 scores
- **Quick Actions**:
  - Team 1 Near Win (40-0)
  - Team 2 Near Win (0-40)
  - Close Game (35-35)
  - Reset Scores (0-0)
- **Apply Scores**: Changes affect all connected players immediately

**Usage Scenarios**:
- Test end-game scenarios without playing full rounds
- Verify game_over transitions at 41+ points
- Test scoring display at different score levels
- Quickly reset game state during development

**Server Integration** (TODO):
Currently emits test events, but backend handlers need implementation:
```typescript
socket.emit('__test_set_scores', { team1: 40, team2: 35 });
```

### Debug Controls Overview
**Location**: Top-right corner of game screen (always available)

1. **🧪 Test** - Opens Test Panel for state manipulation
2. **🔍 State** - Opens Debug Panel to inspect full game state JSON
3. **🐛 4-Player** - Toggles 4-player debug view (shows all perspectives)

**4-Player Debug View**:
- Shows all 4 players' hands and perspectives simultaneously
- Each player's section includes their hand, bet controls, and card play
- Perfect for testing with bot players on single screen
- Compatible with bot system (bots appear as regular players)

**Implementation**: `frontend/src/components/DebugMultiPlayerView.tsx`

### Development Testing Workflow

**Recommended approach for rapid iteration**:

1. **Quick Play** - Start game with bots instantly
2. **4-Player View** - Switch to multi-perspective view
3. **Test Panel** - Manipulate scores to test specific scenarios
4. **State Panel** - Inspect game state when debugging issues

**Example workflow**:
```bash
# Terminal 1: Run dev server
npm run dev

# Browser: http://localhost:5173
1. Click "Quick Play (1 Player + 3 Bots)"
2. Click "🐛 4-Player" to see all perspectives
3. Click "🧪 Test" to manipulate state as needed
4. Play through game or test specific scenarios
```

**Benefits over 4-browser testing**:
- ✅ Single screen, single browser tab
- ✅ Faster iteration (no manual clicks in 4 windows)
- ✅ Automated bot actions (betting, card playing)
- ✅ State manipulation for edge case testing
- ✅ Full visibility of all players simultaneously

---

## 🧪 Testing Strategy

### E2E Testing with Playwright
- **Location**: `e2e/tests/`
- **Helpers**: `e2e/tests/helpers.ts` - Reusable game automation
- **Config**: `e2e/playwright.config.ts`

### Key Testing Patterns
```typescript
// Use data attributes for card selection
const card = handArea.locator('[data-card-value]').first();

// Use { force: true } for rapid re-renders
await card.click({ force: true });

// Wait for multiple pages with Promise.race
await Promise.race(
  pages.map(page => page.waitForSelector('text=/your turn/i'))
);

// Betting order in tests (Player 2 is first dealer after rotation)
const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2
// Bets must escalate (non-dealers) or match (dealer)
const validBets = [9, 9, 7, 8]; // In player order: P1=9, P2=9, P3=7, P4=8

// Wait for turn-based actions
await page.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
```

### Test Organization
- `01-lobby.spec.ts` - Game creation and joining
- `02-betting.spec.ts` - Betting phase rules and turn order
- `03-playing.spec.ts` - Card playing mechanics and suit following
- `04-game-flow.spec.ts` - Full round and scoring
- `05-skip-bet.spec.ts` - Skip bet functionality and validation
- `06-validation.spec.ts` - UI validation feedback across all phases

### Running Tests
```bash
cd e2e
npm run test:e2e              # Run all tests
npx playwright test 04-game-flow  # Run specific test file
npx playwright show-report     # View HTML report
```

**See**: `TDD_WORKFLOW.md` for detailed testing workflow

---

## 📁 File Structure Patterns

### Backend
```
backend/src/
├── db/                 # Database layer
│   ├── index.ts       # Query functions
│   └── schema.sql     # Table definitions
├── game/              # Game logic (pure functions)
│   ├── deck.ts       # Card creation and dealing
│   └── logic.ts      # Winner determination, scoring
├── types/            # TypeScript definitions
│   └── game.ts       # Shared game types
└── index.ts          # Socket.io event handlers (orchestration)
```

### Frontend
```
frontend/src/
├── components/        # UI components (one per file)
│   ├── Card.tsx      # Single card display
│   ├── Lobby.tsx     # Game creation/joining (includes QuickPlay)
│   ├── TeamSelection.tsx  # Team/position selection
│   ├── BettingPhase.tsx   # Betting UI
│   ├── PlayingPhase.tsx   # Game board with circular trick layout
│   ├── DebugPanel.tsx     # Game state inspector (JSON viewer)
│   ├── DebugMultiPlayerView.tsx  # 4-player simultaneous view
│   └── TestPanel.tsx      # State manipulation for testing
├── utils/            # Utility functions and helpers
│   └── botPlayer.ts  # AI bot decision-making system
├── types/            # TypeScript definitions
│   └── game.ts       # Shared game types (sync with backend)
└── App.tsx           # Main app + Socket.io client setup + bot integration
```

---

## 🚨 Common Pitfalls

### ❌ DON'T
```typescript
// Don't use setTimeout for game logic
setTimeout(() => {
  resolveTrick(gameId);
}, 500);

// Don't create monolithic components
function GameBoard() {
  // 500 lines of mixed concerns...
}

// Don't use regex for test selectors
const card = page.locator('button').filter({ hasText: /^[0-7]$/ });
```

### ✅ DO
```typescript
// Use event-driven flow
io.to(gameId).emit('game_updated', game);
resolveTrick(gameId); // Immediate

// Split into focused components
<TeamSelection />
<BettingPhase />
<PlayingPhase />

// Use semantic data attributes
const card = page.locator('[data-card-value]');
```

---

## 🔄 State Management

### GameState Flow
1. Server maintains single source of truth in `Map<string, GameState>`
2. All state changes happen server-side
3. Server emits `game_updated` or specific events
4. Clients receive and render new state

### Phase Transitions
```
team_selection → betting → playing → scoring → betting → ...
                                                ↓
                                          game_over (if team >= 41 pts)
```

**Implementation**:
- `backend/src/index.ts:233-291` - `startNewRound()`
- `backend/src/index.ts:323-377` - `endRound()`

---

## 🎨 UI/UX Patterns

### Tailwind Classes
- Use gradient backgrounds for different phases
- Team colors: Blue (Team 1), Red (Team 2)
- Status indicators: Green (your turn), Gray (waiting)

### Component Data Flow
```typescript
// Props down, events up pattern
<BettingPhase
  players={gameState.players}
  currentBets={gameState.currentBets}
  onPlaceBet={handlePlaceBet}  // Emits socket event
/>
```

---

## 📝 Documentation Standards

When making significant changes:
1. Update this CLAUDE.md with new patterns
2. Update README.md if user-facing features change
3. Update TDD_WORKFLOW.md if test patterns change
4. Document WebSocket events in this file
5. Keep type definitions synchronized between backend/frontend

---

## 🔧 Development Workflow

### Starting Development
```bash
npm run dev          # Start both frontend and backend
npm run test:e2e     # Run E2E tests
```

### Making Changes
1. Read relevant section of this document
2. Check existing patterns in codebase
3. Write test first (TDD)
4. Implement feature
5. Verify test passes
6. Update documentation

### Before Committing
- [ ] All tests pass (`npm run test:e2e`)
- [ ] Types are synchronized (backend/frontend)
- [ ] No setTimeout used for game logic
- [ ] New components are atomic and focused
- [ ] WebSocket events are documented
- [ ] CLAUDE.md updated if patterns changed

---

## 🎯 Next Steps / Known Issues

### Current Implementation Status
✅ Team selection with position swapping
✅ Dealer rotation and betting order
✅ Turn-based betting UI (shows whose turn it is)
✅ Suit-following validation
✅ Led suit vs trump logic
✅ Points vs tricks distinction
✅ "Without trump" bet priority
✅ Circular trick layout with previous trick viewer
✅ 3-second pause after trick completion
✅ Bot player AI system for automated gameplay
✅ Quick Play feature (1 human + 3 bots)
✅ Test Panel for state manipulation
✅ 4-Player debug view (all perspectives simultaneously)
✅ Debug controls (Test, State, 4-Player toggle)
✅ E2E test suite (27/35 tests passing - 77%)

### Future Enhancements
- [ ] Backend handlers for Test Panel state manipulation
- [ ] Spectator mode
- [ ] Game replay functionality
- [ ] Player statistics tracking
- [ ] Tournament mode
- [ ] Mobile responsive improvements
- [ ] Sound effects and animations
- [ ] Bot AI improvements (smarter betting/playing strategy)
- [ ] Adjustable bot difficulty levels

---

## 📚 Additional Resources

- **Game Rules**: See README.md section "Game Rules"
- **Deployment**: See RAILWAY_DEPLOY.md
- **Quick Start**: See QUICKSTART.md
- **Testing**: See TDD_WORKFLOW.md
- **Contributing**: See CONTRIBUTING.md

---

*Last updated: 2025-10-08*
*Project: Trick Card Game (anthropicJoffre)*
