# Claude AI Development Guide

## Plans
At the end of each plan, give me a list of unresolved questions to answer, or suggestions to consider, if any.
## Project Overview
Multiplayer Trick Card Game - Real-time 4-player, 2-team card game with WebSocket communication.

**Stack**: React + TypeScript, Tailwind CSS, Socket.io, Node.js, PostgreSQL

**Current Status**: Feature-complete for core gameplay and enhanced social features (November 2025)
- ✅ 150 backend unit tests passing (~1s runtime)
- ✅ 22 E2E test files (Playwright)
- ✅ Database persistence
- ✅ Game replay system with sharing
- ✅ Lobby browser with tabs
- ✅ Bot AI with 3 difficulty levels
- ✅ Direct messaging system
- ✅ Friend suggestions & recent players
- ✅ Player profiles with quick actions
- ✅ Unified social hub

---

## 🎯 Core Development Principle

### Architecture Patterns
- **Small atomic components** - Favor new files over agglomeration
- **Event-driven architecture** - Use WebSocket events, NEVER setTimeout for game logic resolution
- **Player Identification** - **CRITICAL**: ALWAYS use player names as identifiers, NEVER socket.ids (socket IDs are volatile and change on reconnection)
- **Type safety** - All WebSocket actions must be well-definedsorry i, typed, and reusable
- **TDD workflow** - Write tests proactively, follow TDD_WORKFLOW.md
- **Shared types** - Keep backend/src/types/game.ts and frontend/src/types/game.ts in sync

### Component Philosophy
- Keep components focused on single responsibilities
- Extract reusable logic into separate files
- Use composition over large monolithic components
- Example: `Card.tsx`, `BettingPhase.tsx`, `TeamSelection.tsx` - each handles one concern

### React Hooks Safety (Rules of Hooks)

**CRITICAL**: Always follow the Rules of Hooks to prevent "Rendered fewer hooks than expected" errors.

#### ✅ Correct Pattern: Early Returns BEFORE Hooks

```tsx
function Component({ isOpen, currentPlayer }) {
  // ✅ STEP 1: Do early returns FIRST (before any hooks)
  if (!isOpen) return null;
  if (!currentPlayer) return <ErrorView />;

  // ✅ STEP 2: Now call all hooks (always in same order)
  const [state, setState] = useState();
  useEffect(() => {...}, []);
  const memoValue = useMemo(() => {...}, []);

  // ✅ STEP 3: Render logic
  return <div>...</div>;
}
```

#### ❌ VIOLATION: Hooks Before Early Returns

```tsx
function Component({ isOpen, currentPlayer }) {
  // ❌ BAD: Hooks called first
  const [state, setState] = useState();
  const player = useMemo(() => findPlayer(), []);
  useEffect(() => {...}, []);

  // ❌ FATAL: Early return AFTER hooks
  // If this condition changes between renders, React will crash!
  if (!player) return <ErrorView />;

  // More hooks here...
  const [more, setMore] = useState();
  // ⚠️ React Error: "Rendered fewer hooks than expected"
}
```

#### Why This Breaks

React tracks hooks by call order. If you return early after calling some hooks:
1. **First render**: `player` exists → 5 hooks called
2. **Second render**: `player` is null → early return → only 3 hooks called
3. **React crashes**: Expected 5 hooks, got 3!

#### Fixing Components

**Before (BROKEN):**
```tsx
function PlayingPhase({ gameState, currentPlayerId }) {
  const [showTrick, setShowTrick] = useState(false);  // Hook 1
  const [isPlaying, setIsPlaying] = useState(false);  // Hook 2

  const player = useMemo(() =>                        // Hook 3
    gameState.players.find(p => p.id === currentPlayerId),
    [gameState, currentPlayerId]
  );

  if (!player) return <Error />;  // ❌ Early return AFTER hooks 1-3

  useEffect(() => {...}, []);     // Hook 4
  // React error if player becomes null!
}
```

**After (FIXED):**
```tsx
function PlayingPhase({ gameState, currentPlayerId }) {
  // ✅ Check BEFORE any hooks
  const player = gameState.players.find(p => p.id === currentPlayerId);

  // ✅ Early return BEFORE hooks
  if (!player) return <Error />;

  // ✅ NOW safe to call hooks (always called in same order)
  const [showTrick, setShowTrick] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {...}, []);
}
```

#### Checklist Before Committing

- [ ] All hooks called at the top of the component
- [ ] No hooks inside `if`, `for`, or `while` statements
- [ ] All early returns happen BEFORE the first hook
- [ ] Component tested with props that cause early returns

**Reference**: [PlayingPhase.tsx:28-78](frontend/src/components/PlayingPhase.tsx) - Correct implementation

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

// Sprint 16: Direct Messages
'send_direct_message': { recipientUsername: string; messageText: string }
'get_conversation': { otherUsername: string; limit?: number; offset?: number }
'get_conversations': ()
'mark_messages_read': { senderUsername: string }
'get_unread_count': ()
'delete_message': { messageId: number; isSender: boolean }
'delete_conversation': { otherUsername: string }
'search_messages': { searchQuery: string; limit?: number }

// Sprint 16: Social Features
'get_recent_players': { limit?: number }
'get_friend_suggestions': { limit?: number }
'get_mutual_friends': { otherUsername: string }
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
---

## 🎮 Game Rules Implementation

### Betting System
- **Range**: 7-12 points (NOT tricks)
- **Hierarchy**: Higher amount > Same amount with "without trump" > Same amount with trump
- **Skip Option**: Players can skip their bet if no one has bet yet, or if they're not the dealer
- **Dealer rule**:
  - Betting order: Player after dealer → ... → Dealer last
  - Dealer CAN equalize (match highest) or raise, but CANNOT skip if there are no bets
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

### Position Swapping
Players can swap positions with teammates or bots depending in any phase (team selection, betting, playing phase):

**Team Selection Phase:**
- Players can swap positions with any users
- Swap button appears next to all users
- Allows strategic positioning before game starts
- Enforces alternating team pattern (1-2-1-2) after any swap

**Active Gameplay (Betting, Playing, Scoring):**
- Players can swap positions with **ANY PLAYER** (same team OR opposite team)
- Swap buttons (↔) appear next to all users in the circular player layout
- Swapping with a bot is automatic, Swapping with a human prompts a confirmation from the other human user
- Tooltip indicates when swapping will change teams: "Swap positions with BotName (changes teams!)"
- Useful for adjusting turn order mid-game, changing visual layout, or switching teams
- All game data (hand, tricks won, points) is preserved and swapped correctly. This means all cards, played cards, cards in hand, cards in play, previous tricks, scores, tricks, everything should be swapped, just like if they were already like that forever and ever before the swap .

**Implementation:**
- `backend/src/game/validation.ts:255-261` - Dual-phase validation logic (any bot allowed during gameplay)
- `backend/src/game/state.ts:224-296` - Position swap with data preservation
- `frontend/src/components/TeamSelection.tsx:214-220, 313-319` - Team selection swap UI
- `frontend/src/components/PlayingPhase.tsx:583-596, 918-1010` - Gameplay swap UI with cross-team support
- Socket event: `'swap_position': { gameId: string; targetPlayerId: string }`

**Critical Details:**
- Swapping updates player's identity in the positions in the array (affects turn order, i.e I could "swap" infinitely with the next player and play every round for example)
- Player data is correctly swapped (this should be tested)
- Updates references in currentTrick, currentBets, and highestBet and all other pertinent places (this should be checked)
- Team IDs are recalculated based on position (alternating 1-2-1-2 pattern)
- **Position determines team**: After swap, teams are reassigned by position (not by original team)

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

**Status**: ✅ **150 passing backend tests**, E2E infrastructure in place
**Coverage**: >95% of game logic, comprehensive validation testing

### Overview

The project follows a **hybrid testing pyramid** approach:
- **Backend Tests** (150 tests, ~1s): Pure function testing of all game logic
- **E2E Tests** (22 test files, Playwright): User flow validation

**See**: **[docs/technical/TESTING_ARCHITECTURE.md](docs/technical/TESTING_ARCHITECTURE.md)** for comprehensive testing strategy

### Backend Testing (Primary)

**Framework**: Vitest v4.0.2
**Location**: `backend/src/game/*.test.ts` and `backend/src/db/*.test.ts`
**Runtime**: ~1 second for 150 tests

✅ **What's Tested**:
- Deck operations (8 tests) - deck.test.ts
- Game logic: winner determination, scoring, betting hierarchy (37 tests) - logic.test.ts
- Validation: all player actions, suit-following, bet requirements (27 tests) - validation.test.ts
- State management: transitions, mutations, round flows (47 tests) - state.test.ts
- Immutable state transitions (5+ tests) - stateTransitions.test.ts
- Round statistics helpers (8 tests) - roundStatistics.test.ts
- Database operations (18 tests, limited by quota) - db/index.test.ts

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
│   ├── state.ts      # State transformations
│   ├── stateTransitions.ts  # Immutable state functions
│   └── validation.ts # Input validation
├── socketHandlers/    # Socket.io event handlers (modular)
│   ├── lobby.ts      # Game creation, joining, team selection
│   ├── gameplay.ts   # Betting, card playing, ready states
│   ├── chat.ts       # Team selection and in-game chat
│   ├── spectator.ts  # Spectator mode handlers
│   ├── bots.ts       # Bot management (add, replace, difficulty)
│   ├── stats.ts      # Player stats, leaderboard, game history
│   ├── connection.ts # Reconnection and disconnection
│   └── admin.ts      # Kick player, rematch voting, test utils
├── utils/            # Utility functions
│   ├── sessionManager.ts      # Session token management
│   ├── playerHelpers.ts       # Player finding and validation
│   ├── botHelpers.ts          # Bot naming and validation
│   ├── onlinePlayerManager.ts # Online player tracking
│   ├── timeoutManager.ts      # Action timeout management
│   └── formatting.ts          # String formatting (bytes, uptime)
├── api/              # REST API endpoints
│   └── routes.ts     # Health check, lobby list, stats
├── types/            # TypeScript definitions
│   ├── game.ts       # Shared game types
│   ├── events.ts     # Socket.io event types
│   └── result.ts     # Result type for error handling
├── connection/       # Connection management
│   └── ConnectionManager.ts  # Socket.io connection lifecycle
├── middleware/       # Express/Socket middleware
│   ├── errorBoundary.ts   # Error handling wrapper
│   └── rateLimiter.ts     # Rate limiting utilities
└── index.ts          # Main server + orchestration (1,540 lines)
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

### Sprint 5 - Phase 5: E2E Test Refactoring (October 2025)
**Goal**: Achieve 100% test suite health by refactoring or removing all skipped tests

**Problem**: Multiple test suites were skipped due to multi-page/multi-context Playwright architecture causing browser crashes after ~60s runtime. Additionally, some tests were testing non-existent features.

**Solution**:
1. **Marathon Tests** - Created new stable `27-marathon-automated.spec.ts` using Quick Play + Autoplay architecture
   - Single browser page (no multi-page overhead)
   - Server-side bots (more efficient than browser bots)
   - Autoplay for human player (no manual intervention)
   - Memory efficient (runs 60+ minutes without crashes)
   - Tests: 15-round stability, full game to 41+, memory leak detection, performance regression
   - **Removed obsolete files**: `23-game-flow-4-players.spec.ts`, `24-game-flow-1-player-3-bots.spec.ts`, `25-game-flow-2-players-2-bots.spec.ts`, `26-game-flow-full-length.spec.ts`

2. **Non-Applicable Tests** - Removed tests for features that don't exist in current UI
   - **03-playing.spec.ts**: Removed "should show player info (cards left, tricks won)" - UI shows team scores instead
   - **20-chat-system.spec.ts**: Removed 4 tests:
     - Chat panel toggle (team selection has inline chat)
     - Unread counter (not applicable to always-visible chat)
     - Quick emoji reactions (not in team selection UI)
     - Message persistence across phases (separate chat systems by design)

3. **Remaining Skipped Tests** (for future refactoring):
   - **14-spectator.spec.ts**: Entire suite (3 tests) - needs Quick Play + separate browser approach
   - **15-timeout-system.spec.ts**: Entire suite (3+ tests) - consider backend unit tests instead
   - **19-timeout-autoplay.spec.ts**: Entire suite (5+ tests) - consider backend unit tests instead
   - **20-chat-system.spec.ts**: 2 tests remaining:
     - "should show chat in betting phase" - needs Quick Play refactor
     - "should handle rapid message sending" - needs better wait strategies

**Key Architectural Decision**: Always use Quick Play + Autoplay for marathon/long-running tests. Multi-page architecture is only acceptable for short (<30s) focused tests.

**Files**: See `docs/sprints/sprint5-phase5-summary.md` for complete refactoring plan and rationale

**Helper Functions**:
- `createQuickPlayGame()` - Stable single-player tests with 3 server bots
- `createAutomatedMarathonGame()` - Marathon tests with autoplay enabled
- `monitorMarathonGame()` - Metrics collection over extended gameplay

**Results**:
- ✅ Removed 8 test files/suites (4 marathon files + 5 non-applicable tests)
- ✅ Created stable marathon test architecture
- 🔲 4 test suites remaining for future refactoring (spectator, timeout, chat)

## 📧 Email Service Architecture (Sprint 3)

### Why Resend Instead of SMTP?

**Problem**: Railway (and most hosting platforms) block outbound SMTP ports (587, 465) to prevent spam.

**Solution**: HTTP-based transactional email API (Resend)

### Implementation Pattern

**Location**: `backend/src/utils/emailService.ts`

```typescript
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Jaffre <onboarding@resend.dev>';

// Singleton pattern
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) {
    console.warn('⚠️  Email service not configured');
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }

  return resendClient;
}

export async function sendVerificationEmail(...): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    // Dev mode: Log to console instead
    console.log(`[DEV MODE] Email would be sent to ${email}`);
    return false;
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: '...',
    html: '...' // Full HTML template
  });

  // Never block user flow if email fails
  return !error;
}
```

### Production Considerations

**Free Tier Limitation**: Can only send to email address used for Resend signup

**Solutions**:
1. **Development**: Use `onboarding@resend.dev` + send to your own email for testing
2. **Production**: Verify a custom domain ($10-15/year) to send to any user

**See**: `docs/deployment/EMAIL_SETUP.md` for domain verification guide

---

## 🔐 Authentication Architecture (Sprint 3)

### System Overview

**Components**:
- `backend/src/db/users.ts` - User CRUD operations
- `backend/src/api/auth.ts` - REST endpoints (register, login, verify, reset)
- `frontend/src/contexts/AuthContext.tsx` - Global auth state
- `frontend/src/components/*Modal.tsx` - Login, Register, Password Reset UIs

### Authentication Flow

```
1. User Registration
   └─> POST /api/auth/register
       ├─> Create user in DB (password hashed with bcrypt)
       ├─> Create email_verification_tokens entry
       ├─> Send verification email (Resend API)
       └─> Return { success, message }

2. Email Verification
   └─> GET /api/auth/verify-email?token=...
       ├─> Validate token + expiration (24 hours)
       ├─> Update users.email_verified = true
       ├─> Delete token
       └─> Redirect to login

3. User Login
   └─> POST /api/auth/login
       ├─> Find user by email
       ├─> Compare password (bcrypt)
       ├─> Generate JWT token (7 days)
       └─> Return { user, token }

4. Password Reset
   └─> POST /api/auth/forgot-password
       ├─> Create password_reset_tokens entry
       ├─> Send reset email (1 hour expiration)
       └─> POST /api/auth/reset-password?token=...
           ├─> Validate token
           ├─> Hash new password
           ├─> Update user
           └─> Delete token
```

### Integration with Game

**Pattern**: Guest mode vs. Authenticated mode

```typescript
// In App.tsx or Lobby.tsx
const { user, isAuthenticated } = useAuth();

const playerName = isAuthenticated
  ? user.username
  : localStorage.getItem('playerName') || 'Guest';

// Ranked games require authentication
if (gameMode === 'ranked' && !isAuthenticated) {
  showAuthModal();
  return;
}
```

**Key Principle**: Never block gameplay with authentication. Guest players can play, but miss features like:
- Profile customization
- Friends list
- Achievements tracking
- Match history persistence

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
