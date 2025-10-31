# Backend Refactoring Plan
## Sprint 3 - Code Organization & Maintainability

**Status**: 🚧 In Progress (Phase 1)
**Goal**: Split `backend/src/index.ts` (3,755 lines) into maintainable modules
**Target**: No file > 500 lines

---

## Current State Analysis

**`backend/src/index.ts` Breakdown**:
- **Total Lines**: 3,755
- **REST Endpoints**: 14
- **Socket.io Handlers**: 26
- **Helper Functions**: ~30

**Problems**:
1. **Cognitive Overload**: Single 3,755-line file is unmaintainable
2. **Merge Conflicts**: High risk with multiple developers
3. **Testing Difficulty**: Hard to test individual handlers
4. **Code Discovery**: Difficult to find specific functionality

---

## Refactoring Strategy

### Phase 1: Extract REST API Routes ✅ (Current)
**Target File**: `backend/src/api/routes.ts`
**Lines**: ~600
**Endpoints**: 14 REST endpoints

### Phase 2: Extract Socket.io Handlers
Create `backend/src/socketHandlers/` with logical grouping:

#### 2a. Lobby & Setup (`lobby.ts`)
**Lines**: ~350
**Handlers**: 6
- `create_game` - Create new game session
- `join_game` - Join existing game
- `select_team` - Choose team (1 or 2)
- `swap_position` - Swap seats with another player
- `start_game` - Start game from team selection
- `leave_game` - Leave current game

#### 2b. Gameplay (`gameplay.ts`)
**Lines**: ~300
**Handlers**: 3
- `place_bet` - Place betting phase bet
- `play_card` - Play card during playing phase
- `player_ready` - Mark ready for next round

#### 2c. Chat (`chat.ts`)
**Lines**: ~150
**Handlers**: 2
- `send_team_selection_chat` - Team selection lobby chat
- `send_game_chat` - In-game team chat

#### 2d. Spectator (`spectator.ts`)
**Lines**: ~100
**Handlers**: 2
- `spectate_game` - Start spectating a game
- `leave_spectate` - Stop spectating

#### 2e. Bot Management (`bots.ts`)
**Lines**: ~400
**Handlers**: 3
- `replace_with_bot` - Replace disconnected/left player with bot
- `take_over_bot` - Human takes over bot position
- `change_bot_difficulty` - Adjust bot AI difficulty

#### 2f. Stats & Leaderboard (`stats.ts`)
**Lines**: ~200
**Handlers**: 5
- `get_player_stats` - Fetch player statistics
- `get_leaderboard` - Global leaderboard
- `get_player_history` - Player game history
- `get_game_replay` - Fetch game replay data
- `get_all_finished_games` - Browse finished games

#### 2g. Connection Management (`connection.ts`)
**Lines**: ~500
**Handlers**: 3
- `reconnect_to_game` - Reconnect with session token
- `vote_rematch` - Vote for rematch after game over
- `disconnect` - Handle socket disconnection

#### 2h. Admin & Testing (`admin.ts`)
**Lines**: ~100
**Handlers**: 2
- `kick_player` - Kick player from game (admin)
- `__test_set_scores` - Test-only score manipulation

### Phase 3: Extract Core Logic
**Target**: `backend/src/core/`

#### 3a. Game Lifecycle (`core/lifecycle.ts`)
- `startNewRound()` - Initialize new round
- `endRound()` - Complete round and calculate scores
- `startGame()` - Begin game from team selection
- `endGame()` - Finalize game and save stats

#### 3b. State Emitters (`core/emitters.ts`)
- `emitGameUpdate()` - Broadcast game state changes
- `emitToTeam()` - Send message to team members only
- `emitError()` - Send error to specific player

#### 3c. Helper Functions (`core/helpers.ts`)
- `getGame()` - Get game by ID with error handling
- `getPlayer()` - Get player from game
- `validatePlayer()` - Check player is in game
- `formatUptime()` - Format server uptime
- `formatBytes()` - Format memory usage

---

## Module Structure

### Dependency Flow
```
index.ts (main)
├── api/routes.ts (REST endpoints)
│   └── Uses: db/, game/, types/
├── socketHandlers/ (Socket.io)
│   ├── lobby.ts
│   ├── gameplay.ts
│   ├── chat.ts
│   ├── spectator.ts
│   ├── bots.ts
│   ├── stats.ts
│   ├── connection.ts
│   └── admin.ts
│   └── All use: core/*, game/*, db/, types/
└── core/ (shared logic)
    ├── lifecycle.ts
    ├── emitters.ts
    └── helpers.ts
    └── Uses: game/, db/, types/
```

### Shared Dependencies
All modules will import from:
- `types/game.ts` - Type definitions
- `game/` - Pure game logic (deck, logic, validation, state)
- `db/` - Database operations
- `utils/` - Utilities (logger, cache, rate limiter)

---

## Module Template

Each Socket.io handler module follows this pattern:

```typescript
import { Socket } from 'socket.io';
import { GameState } from '../types/game';
import { games, io } from '../index'; // Shared state
import { errorBoundaries } from '../middleware/errorBoundaries';
import { /* database functions */ } from '../db';
import { /* game logic functions */ } from '../game/*';
import { emitGameUpdate } from '../core/emitters';

/**
 * Register [category] socket handlers
 */
export function register[Category]Handlers(socket: Socket) {
  socket.on('handler_name', errorBoundaries.gameAction('handler_name')((payload) => {
    // Handler implementation
  }));

  // ... more handlers
}
```

**`backend/src/index.ts` then imports all**:
```typescript
import { registerLobbyHandlers } from './socketHandlers/lobby';
import { registerGameplayHandlers } from './socketHandlers/gameplay';
// ... etc

io.on('connection', (socket) => {
  registerLobbyHandlers(socket);
  registerGameplayHandlers(socket);
  // ... etc
});
```

---

## Extraction Checklist

For each handler being extracted:

- [ ] Copy handler to new module file
- [ ] Add necessary imports (types, db functions, game logic)
- [ ] Update references to shared state (`games`, `io`, etc.)
- [ ] Add JSDoc comments
- [ ] Verify no breaking changes with tests
- [ ] Remove from index.ts
- [ ] Update index.ts to call new module

---

## Testing Strategy

After each extraction:
1. Run `npm run build` - TypeScript compilation
2. Run `npm test` - 113 backend tests must pass
3. Manual smoke test - Create game, play round
4. E2E test (if available for that handler)

---

## Benefits

**Before**:
- 1 file: 3,755 lines
- Difficult to navigate
- High merge conflict risk
- Hard to test in isolation

**After**:
- ~15 files: avg 200-400 lines each
- Clear separation of concerns
- Easy to find functionality
- Testable in isolation
- Better code ownership

---

## Implementation Progress

### Phase 1: REST API Extraction
- [x] Create `backend/src/api/` directory
- [ ] Extract all 14 REST endpoints to `api/routes.ts`
- [ ] Update index.ts to import routes
- [ ] Verify tests pass

### Phase 2a: Lobby Handlers
- [x] Create `backend/src/socketHandlers/` directory
- [ ] Extract 6 lobby handlers to `lobby.ts`
- [ ] Update index.ts registration
- [ ] Verify tests pass

### Phase 2b-h: Remaining Handlers
- [ ] Extract gameplay handlers (gameplay.ts)
- [ ] Extract chat handlers (chat.ts)
- [ ] Extract spectator handlers (spectator.ts)
- [ ] Extract bot handlers (bots.ts)
- [ ] Extract stats handlers (stats.ts)
- [ ] Extract connection handlers (connection.ts)
- [ ] Extract admin handlers (admin.ts)

### Phase 3: Core Logic
- [ ] Create `backend/src/core/` directory
- [ ] Extract lifecycle functions
- [ ] Extract emitters
- [ ] Extract helpers

---

## Estimated Timeline

- **Phase 1** (REST API): 1-2 hours
- **Phase 2** (Socket Handlers): 3-4 hours
- **Phase 3** (Core Logic): 1-2 hours
- **Total**: 6-8 hours

**Recommendation**: Do incrementally over multiple sessions, testing after each extraction.

---

## Next Steps

1. Complete Phase 1 (REST API extraction)
2. Commit and push
3. Extract lobby handlers as Phase 2a example
4. Document pattern
5. Continue with remaining phases incrementally

---

**Last Updated**: 2025-10-31 (Sprint 3)
**Status**: Phase 1 in progress
