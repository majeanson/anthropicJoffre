# Claude AI Development Guide

## Plans
At the end of each plan, give me a list of unresolved questions to answer, or suggestions to consider, if any.
## Project Overview
Multiplayer Trick Card Game - Real-time 4-player, 2-team card game with WebSocket communication.

**Stack**: React + TypeScript, Tailwind CSS, Socket.io, Node.js, PostgreSQL

**Current Status**: Feature-complete for core gameplay and social features (October 2025)
- ✅ 89 unit tests passing
- ✅ E2E test suite
- ✅ Database persistence
- ✅ Game replay system
- ✅ Lobby browser with tabs
- ✅ Bot AI with 3 difficulty levels

---

## 🎯 Core Development Principles

### Architecture Patterns
- **Small atomic components** - Favor new files over agglomeration
- **Event-driven architecture** - Use WebSocket events, NEVER setTimeout for game logic resolution
- **Player Identification** - **CRITICAL**: ALWAYS use player names as identifiers, NEVER socket.ids (socket IDs are volatile and change on reconnection)
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
'spectate_game': { gameId: string; spectatorName?: string }
'leave_spectate': { gameId: string }
'select_team': { gameId: string; teamId: 1 | 2 }
'swap_position': { gameId: string; targetPlayerId: string }
'start_game': { gameId: string }
'place_bet': { gameId: string; amount: number; withoutTrump: boolean }
'play_card': { gameId: string; card: Card }
'player_ready': { gameId: string }
'send_team_selection_chat': { gameId: string; message: string }
'send_game_chat': { gameId: string; message: string }
'reconnect_to_game': { gameId: string; session: PlayerSession }
'vote_rematch': { gameId: string }
'kick_player': { gameId: string; playerIdToKick: string }
'leave_game': { gameId: string }
'get_player_stats': { playerName: string }
'get_leaderboard': (limit?: number)
'get_player_history': { playerName: string; limit?: number }
'get_game_replay': { gameId: string }
'__test_set_scores': { team1: number; team2: number }
```

**Server → Client:**
```typescript
'game_created': { gameId: string; gameState: GameState; session: PlayerSession }
'player_joined': { player: Player; gameState: GameState; session?: PlayerSession }
'spectator_joined': { gameState: SpectatorGameState; isSpectator: true }
'spectator_left': { success: boolean }
'spectator_update': { message: string; spectatorCount: number }
'game_updated': (gameState: GameState)
'round_started': (gameState: GameState)
'trick_resolved': { winnerId: string; points: number; gameState: GameState }
'round_ended': (gameState: GameState)
'game_over': { winningTeam: 1 | 2; gameState: GameState }
'error': { message: string }
'invalid_move': { message: string }
'invalid_bet': { message: string }
'player_left': { playerId: string; gameState: GameState }
'player_kicked': { kickedPlayerId: string; gameState: GameState }
'reconnection_successful': { gameState: GameState; session: PlayerSession }
'reconnection_failed': { message: string }
'player_reconnected': { playerName: string; playerId: string; oldSocketId: string }
'player_disconnected': { playerId: string; waitingForReconnection: boolean }
'team_selection_chat': { playerName: string; message: string; teamId: 1 | 2; timestamp: number }
'game_chat': { playerName: string; message: string; teamId: 1 | 2; timestamp: number }
'rematch_vote_update': { votes: Map<playerId, boolean>; votesNeeded: number }
'rematch_started': { gameId: string; gameState: GameState }
'player_stats': { playerName: string; stats: PlayerStats }
'leaderboard': { players: LeaderboardEntry[] }
'player_history': { playerName: string; games: GameHistoryEntry[] }
'online_players': { players: OnlinePlayer[] }
```

### Adding New Events
1. Define event types in both backend and frontend
2. Add handler in `backend/src/index.ts`
3. Add listener in `frontend/src/App.tsx`
4. Update this documentation
5. Write E2E test for the new event flow

### REST API Endpoints
```typescript
GET /api/health                  // Health check
GET /api/games/lobby             // List active games
GET /api/games/recent            // List recent finished games (for replay)
GET /api/games/:gameId           // Get specific game details
GET /api/games/history           // Get game history (deprecated, use /recent)
GET /api/leaderboard             // Global leaderboard (query: ?limit=100&excludeBots=true)
GET /api/stats/:playerName       // Player statistics (returns 404 if player not found)
GET /api/player-history/:playerName // Player game history
```

**Implementation Notes**:
- `/api/stats/:playerName` - Returns player stats object or 404 error
  ```typescript
  Response: {
    player_name: string;
    games_played: number;
    games_won: number;
    // ... other PlayerStats fields
  }
  ```

- `/api/leaderboard` - Returns top players with optional filters
  ```typescript
  Query params:
    - limit: number (default: 100) - Max players to return
    - excludeBots: boolean (default: true) - Filter out bot players
  Response: {
    players: LeaderboardEntry[];
    total: number;
  }
  ```

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

**Implementation**:
- `backend/src/game/logic.ts` - `isBetHigher()` and `getHighestBet()` helpers
- `backend/src/index.ts` - Betting validation, skip handling, and turn order
- `frontend/src/components/BettingPhase.tsx` - Client-side validation and UI feedback

### Suit-Following Rule
- Players MUST play the led suit if they have it in hand
- First card in trick determines led suit
- Trump can always be played if no led suit in hand

**Implementation**:
- `backend/src/index.ts` - Server-side validation before card play
- `frontend/src/components/PlayingPhase.tsx` - Client-side playable card detection and UI feedback

### Trick Winner Logic
1. Trump always beats non-trump
2. Led suit beats off-suit (when no trump)
3. Highest value wins within same category

**Implementation**: `backend/src/game/logic.ts` - `determineWinner()`

### Points vs Tricks
- **Tricks**: Count of tricks won (tracked for display)
- **Points**: Actual scoring currency (used for betting/scoring)
- Base: 1 point per trick won
- Red 0 card: +5 points (total 6 for that trick)
- Brown 0 card: -2 points (total -1 for that trick)

**Implementation**:
- `backend/src/index.ts` - `resolveTrick()` awards pointsWon
- `backend/src/game/logic.ts` - `calculateRoundScore()` uses pointsWon

### Dealer Rotation
- Dealer rotates clockwise each round
- Initial dealer: Player 1 (index 0)
- `startNewRound()` rotates dealer BEFORE first betting phase
- First round: dealer becomes Player 2 (index 1)
- Affects betting order (player after dealer starts)
- Tracked via `gameState.dealerIndex`

**Important for Testing**: First round betting order is Player 3, 4, 1, 2 (not 1, 2, 3, 4)

---

## 🎨 UI/UX Validation Patterns

All game phases implement validation feedback to guide players:

### Team Selection Phase
- **Disabled State**: Start Game button disabled until 4 players with balanced teams (2v2)
- **Feedback**: Yellow info box explaining requirements
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
6. **Consistent Layout**: Fixed heights for dynamic content to prevent UI jumping

---

## 🛡️ Validation System

The game implements a **4-layer defense-in-depth validation strategy** to prevent cheating, race conditions, and ensure data integrity.

**See**: `VALIDATION_SYSTEM.md` for comprehensive documentation

### Validation Architecture

**Layer 1: Client-Side Validation** (UX Enhancement)
- Immediate feedback to users
- Visual disabled states for invalid actions
- Informational messages explaining constraints
- **Not security** - can be bypassed by malicious clients

**Layer 2: Client-Side Debouncing** (Race Condition Prevention)
- Prevents rapid-fire duplicate actions
- `isPlayingCard` flag prevents double-clicks
- Automatically resets when turn changes or trick completes

**Layer 3: Server-Side State Validation** (Security)
- All critical validation happens server-side
- Verifies game phase, player turn, card ownership
- Checks suit-following rules, bet requirements
- Never trusts client input

**Layer 4: Server-Side Race Condition Protection** (Edge Cases)
- Prevents duplicate actions during async operations
- Trick completion lock (`currentTrick.length >= 4`)
- Duplicate play check (`hasAlreadyPlayed`)
- Immediate turn advancement before trick resolution

### Error Message Best Practices

**Clear and Actionable**:
- ✅ "You must follow suit (red) if you have it"
- ❌ "Invalid move"

**Event Types**:
- `'error'` - General errors (game not found, wrong phase)
- `'invalid_bet'` - Betting violations
- `'invalid_move'` - Card playing violations

---

## 🧪 Testing Strategy

**Status**: ✅ **113 passing backend tests**, E2E infrastructure in place
**Coverage**: >95% of game logic, comprehensive validation testing

### Overview

The project follows a **hybrid testing pyramid** approach:
- **Backend Tests** (113 tests, ~3s): Pure function testing of all game logic
- **E2E Tests** (22 test files, Playwright): User flow validation

**See**: **[docs/technical/TESTING_ARCHITECTURE.md](docs/technical/TESTING_ARCHITECTURE.md)** for comprehensive testing strategy

### Backend Testing (Primary)

**Framework**: Vitest v4.0.2
**Location**: `backend/src/game/*.test.ts`
**Runtime**: ~3 seconds for 113 tests

✅ **What's Tested**:
- Deck operations (8 tests)
- Game logic: winner determination, scoring, betting hierarchy (37 tests)
- Validation: all player actions, suit-following, bet requirements (27 tests)
- State management: transitions, mutations, round flows (47 tests)
- Database operations (18 tests, currently limited by quota)

```bash
cd backend
npm test                  # Run all tests
npm test -- --watch       # Watch mode
npm run test:coverage     # Coverage report
npm test -- logic.test.ts # Specific file
```

**See**: **[docs/technical/BACKEND_TESTING.md](docs/technical/BACKEND_TESTING.md)** for detailed documentation

### E2E Testing (Strategic)

**Framework**: Playwright
**Location**: `e2e/tests/*.spec.ts`
**Runtime**: ~5-10 minutes

⚠️ **Current Status**: Multi-context architecture causes browser crashes after ~60s
**Recommendation**: Refactor to single-browser or hybrid approach

### Test Organization
- `01-lobby.spec.ts` - Game creation and joining
- `02-betting.spec.ts` - Betting phase rules and turn order
- `03-playing.spec.ts` - Card playing mechanics and suit following
- `04-game-flow.spec.ts` - Full round and scoring
- `05-skip-bet.spec.ts` - Skip bet functionality and validation
- `06-validation.spec.ts` - UI validation feedback across all phases
- `14-spectator.spec.ts` - Spectator mode functionality

### Key Testing Patterns

```typescript
// Use data attributes for card selection
const card = handArea.locator('[data-card-value]').first();

// Betting order in tests (Player 2 is first dealer after rotation)
const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2
```

### Running E2E Tests
```bash
cd e2e
npm run test:e2e              # Run all tests
npx playwright test 04-game-flow  # Run specific test file
npx playwright show-report     # View HTML report
```

**See**: **[docs/technical/TDD_WORKFLOW.md](docs/technical/TDD_WORKFLOW.md)** for detailed testing workflow

---

## 📁 File Structure Patterns

### Backend
```
backend/src/
├── db/                 # Database layer
│   ├── index.ts       # Query functions
│   ├── schema.sql     # Table definitions
│   ├── gameState.ts   # Game persistence
│   └── sessions.ts    # Session management
├── game/              # Game logic (pure functions)
│   ├── deck.ts       # Card creation and dealing
│   ├── logic.ts      # Winner determination, scoring
│   ├── state.ts      # State transformations (NEW)
│   └── validation.ts # Input validation (NEW)
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
│   ├── LobbyBrowser.tsx  # Browse active/recent games with tabs
│   ├── TeamSelection.tsx  # Team/position selection
│   ├── BettingPhase.tsx   # Betting UI
│   ├── PlayingPhase.tsx   # Game board with circular trick layout
│   ├── GameReplay.tsx     # Replay viewer with playback controls
│   ├── PlayerStatsModal.tsx  # Player stats and game history
│   ├── GlobalLeaderboard.tsx # Top 100 players
│   ├── BotManagementPanel.tsx # Bot settings and replacement
│   ├── DebugPanel.tsx     # Game state inspector (JSON viewer)
│   ├── DebugMultiPlayerView.tsx  # 4-player simultaneous view
│   └── TestPanel.tsx      # State manipulation for testing
├── utils/            # Utility functions and helpers
│   ├── botPlayer.ts  # AI bot decision-making system
│   ├── sounds.ts     # Web Audio API sound effects
│   └── recentPlayers.ts  # Recent players tracking
├── types/            # TypeScript definitions
│   └── game.ts       # Shared game types (sync with backend)
└── App.tsx           # Main app + Socket.io client setup + bot integration
```

---

## 🐛 Recent Critical Fixes (October 2025)

### Stats Tracking Bug
**Problem**: All special card stats (red zeros, brown zeros, trumps) were returning 0
**Root Cause**: Using volatile `socket.id` instead of stable `player.name`
**Fix**: Changed all stat Maps to use player names as keys consistently
**Files**: `backend/src/index.ts` (lines 1419-1426, 2314-2322, 2567-2569)

### Bot Management Modal Flickering
**Problem**: Modal would close unexpectedly on click
**Fix**: Added `onClick={onClose}` to overlay, `onClick={(e) => e.stopPropagation()}` to content
**File**: `frontend/src/components/BotManagementPanel.tsx` (lines 42-43)

### Lobby Browser UX
**Problem**: Cluttered interface, difficult to find games
**Solution**: Tab navigation (Active/Recent), simplified cards, integrated replay
**File**: `frontend/src/components/LobbyBrowser.tsx` (complete redesign)

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
- `backend/src/index.ts` - `startNewRound()` and `endRound()`

---

## 🎨 UI/UX Patterns

### Tailwind Classes
- Use gradient backgrounds for different phases
- Team colors: Orange (Team 1), Purple (Team 2)
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

## 📚 Additional Resources

**Quick Navigation**: See **[docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)** for complete documentation index

### Core Documentation
- **README.md** - Project overview and setup
- **ROADMAP.md** - Current status and future plans
- **QUICKSTART.md** - Quick setup guide
- **CONTRIBUTING.md** - How to contribute

### Technical Documentation
- **[Features](docs/technical/FEATURES.md)** - Complete feature documentation
- **[Validation System](docs/technical/VALIDATION_SYSTEM.md)** - Multi-layer validation architecture
- **[Bot Player System](docs/technical/BOT_PLAYER_SYSTEM.md)** - AI decision-making and lifecycle
- **[Testing Architecture](docs/technical/TESTING_ARCHITECTURE.md)** - Complete testing strategy overview
- **[Backend Testing](docs/technical/BACKEND_TESTING.md)** - Backend test suite documentation (113 tests)
- **[TDD Workflow](docs/technical/TDD_WORKFLOW.md)** - Testing methodology
- **[Test IDs](docs/technical/TEST_IDS.md)** - Test identifier reference
- **[Accessibility](docs/technical/ACCESSIBILITY.md)** - WCAG compliance

### Design Documentation
- **[Dark Mode Colors](docs/design/DARK_MODE_COLORS.md)** - Dark theme palette
- **[Light Mode Colors](docs/design/LIGHT_MODE_COLORS.md)** - Light theme palette

### Deployment
- **[Railway Deploy](docs/deployment/RAILWAY_DEPLOY.md)** - Production deployment guide

---

*Last updated: 2025-10-24*
*Project: Trick Card Game (anthropicJoffre)*

**Feature Completion Status**: All planned Priority 1-3 features complete (100%)
**Project Status**: Feature-complete for core gameplay and social features
