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
- **Dealer rule**:
  - Betting order: Player after dealer → ... → Dealer last
  - Non-dealers MUST raise (beat current highest)
  - Dealer CAN equalize (match highest) or raise

**Implementation**:
- `backend/src/game/logic.ts:75-81` - `isBetHigher()` helper
- `backend/src/index.ts:193-245` - Betting validation and turn order

### Suit-Following Rule
- Players MUST play the led suit if they have it in hand
- First card in trick determines led suit
- Trump can always be played if no led suit in hand

**Implementation**: `backend/src/index.ts:177-189` - Validation before card play

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
- `02-betting.spec.ts` - Betting phase validation
- `03-playing.spec.ts` - Card playing mechanics
- `04-game-flow.spec.ts` - Full round and scoring

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
│   ├── Lobby.tsx     # Game creation/joining
│   ├── TeamSelection.tsx  # Team/position selection
│   ├── BettingPhase.tsx   # Betting UI
│   └── PlayingPhase.tsx   # Game board
├── types/            # TypeScript definitions
│   └── game.ts       # Shared game types (sync with backend)
└── App.tsx           # Main app + Socket.io client setup
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
✅ E2E test suite (27/35 tests passing - 77%)

### Future Enhancements
- [ ] Spectator mode
- [ ] Game replay functionality
- [ ] Player statistics tracking
- [ ] Tournament mode
- [ ] Mobile responsive improvements
- [ ] Sound effects and animations

---

## 📚 Additional Resources

- **Game Rules**: See README.md section "Game Rules"
- **Deployment**: See RAILWAY_DEPLOY.md
- **Quick Start**: See QUICKSTART.md
- **Testing**: See TDD_WORKFLOW.md
- **Contributing**: See CONTRIBUTING.md

---

*Last updated: 2025-10-07*
*Project: Trick Card Game (anthropicJoffre)*
