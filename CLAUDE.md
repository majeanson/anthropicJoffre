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
'get_player_history': { playerName: string }
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

### Scoring Phase (Between Rounds)
- **Round Summary Panel**: Team-based display with color-coded sections
  - **Team 1** (orange background): Shows total team tricks and points
  - **Team 2** (purple background): Shows total team tricks and points
  - **+Points Badges**: Green badges appear next to team names (not individual players)
  - **Individual Breakdown**: Each team section shows player-by-player stats
  - **Bidder Indicator**: ⭐ star icon marks the player who won the bet
- **Consistent Height**: Top panel waiting badge maintains fixed height regardless of content
  - "Waiting for trick to end..." vs "Waiting for: [name] ⏱️ 60s" have same height
  - Uses `min-h-[2.5rem] md:min-h-[3rem]` for consistent spacing

### General Principles
1. **Proactive Feedback**: Show requirements BEFORE user tries invalid action
2. **Clear Messaging**: Explain WHY action is blocked, not just THAT it's blocked
3. **Visual Hierarchy**: Use color-coded messages (yellow=warning, blue=info, purple=special rule)
4. **Disabled States**: Gray out unavailable options with visual indicators
5. **Contextual Help**: Show relevant rules/constraints for current situation
6. **Consistent Layout**: Fixed heights for dynamic content to prevent UI jumping

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
- **Card Playing** (Strategic AI):
  1. **Always play the highest valid card**, unless it's trump winning on a non-trump color
  2. **Always try to get the red 0** (5-point bonus card) by all means
  3. **Always try to NEVER have the brown 0** (-2 point penalty card)
  4. **If partner is winning**, play the lowest valid card to conserve high cards

### Autoplay Feature
**Access**: Toggle button in top panel during betting and playing phases
- **Betting Phase**: Top-right button shows "🎮 Manual" or "🤖 Auto"
- **Playing Phase**: Compact button in center top panel shows 🎮 or 🤖 (with pulse animation when active)

**Purpose**: Allows human players to temporarily let the bot AI play for them

**Implementation**: `frontend/src/App.tsx:557-594`
- Uses the same `BotPlayer` AI strategy as bot players
- Automatically makes bets and plays cards when it's the player's turn
- Can be toggled on/off at any time during gameplay
- Respects the same strategic rules (high cards, red 0 priority, brown 0 avoidance, partner support)

**Use Cases**:
- Testing full game flows without manual input
- Stepping away briefly while keeping the game moving
- Learning optimal bot strategy by observation
- Quick playtesting of game mechanics

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

### Key Validations by Phase

**Team Selection** (backend/src/index.ts:146-218):
- Game existence check
- Phase verification (prevent changes after start)
- Player membership validation
- Team ID validation (must be 1 or 2)
- Team size enforcement (max 2 per team)
- Self-swap prevention for position changes

**Betting Phase** (backend/src/index.ts:250-383):
- Turn validation (enforce betting order)
- Duplicate bet prevention
- Bet range check (7-12 points)
- Dealer privilege rules (can match, others must raise)
- Skip validation (dealer can't skip if bets exist)

**Playing Phase** (backend/src/index.ts:384-479):
- **Layer 1**: Trick completion check (prevent play during resolution)
- **Layer 2**: Turn validation (enforce turn-based play)
- **Layer 3**: Card data validation (prevent malformed data)
- **Layer 4**: Card ownership validation (prevent cheating)
- **Layer 5**: Duplicate play prevention (race condition protection)
- **Layer 6**: Suit-following validation (enforce game rules)

### Race Condition Solution

**The Problem**: When 4th card completes a trick, there's a 3-second delay before trick clears. During this window, the player who won could click another card.

**The Solution** (4 layers):
1. **Client debounce**: `isPlayingCard` flag prevents rapid clicks
2. **Immediate turn advancement**: Turn changes BEFORE 3-second delay
3. **Trick completion lock**: Server rejects plays when `currentTrick.length >= 4`
4. **Duplicate play check**: Server tracks `hasAlreadyPlayed` per trick

**Implementation**:
```typescript
// Backend: Immediate turn advancement (before setTimeout)
game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

// Backend: Trick completion lock
if (game.currentTrick.length >= 4) {
  socket.emit('invalid_move', { message: 'Please wait for trick to resolve' });
  return;
}

// Frontend: Client debouncing
const [isPlayingCard, setIsPlayingCard] = useState(false);
useEffect(() => {
  if (!isCurrentTurn) setIsPlayingCard(false);
}, [isCurrentTurn]);
```

### Error Message Best Practices

**Clear and Actionable**:
- ✅ "You must follow suit (red) if you have it"
- ❌ "Invalid move"

**Event Types**:
- `'error'` - General errors (game not found, wrong phase)
- `'invalid_bet'` - Betting violations
- `'invalid_move'` - Card playing violations

### Security Implications

**What This Prevents**:
- ✅ Playing cards not in your hand (cheating)
- ✅ Playing multiple cards in one turn (race conditions)
- ✅ Betting out of turn (cheating)
- ✅ Changing teams after game starts (griefing)
- ✅ Starting game without balanced teams (exploitation)

**What This Doesn't Prevent** (Future Work):
- ❌ Slow play / AFK (no timeout system yet)
- ❌ Colluding via external chat (social issue)
- ❌ Intentionally bad plays (can't detect intent)

---

## 🏆 Leaderboard & Round History

### Leaderboard Feature
**Location**: `frontend/src/components/Leaderboard.tsx`

**Access**: Click "🏆 Leaderboard" button during gameplay
- **Betting Phase**: Top-right corner yellow button
- **Playing Phase**: Bottom action bar yellow button

**Features**:
- **Current Standings**: Live team scores with leading team indicator (crown icon)
- **Team Composition**: Shows which players are on each team with tricks won
- **Current Bet**: Displays active bet details (bidder, amount, type)
- **Round History**: Complete history of all finished rounds with detailed stats

### Round History Data Structure

**Backend Type** (backend/src/types/game.ts):
```typescript
export interface RoundHistory {
  roundNumber: number;           // Sequential round counter
  bets: Bet[];                   // All bets placed in betting phase
  highestBet: Bet;               // Winning bet
  offensiveTeam: 1 | 2;          // Team that won the bet
  offensivePoints: number;       // Points earned by offensive team
  defensivePoints: number;       // Points earned by defensive team
  betAmount: number;             // Target points to achieve
  withoutTrump: boolean;         // 2x multiplier if true
  betMade: boolean;              // Did offensive team meet their bet?
  roundScore: {
    team1: number;               // Points gained/lost this round
    team2: number;
  };
  cumulativeScore: {
    team1: number;               // Total score after this round
    team2: number;
  };
}
```

**Implementation** (backend/src/index.ts:634-655):
- Round history populated in `endRound()` function
- Captures complete round state before starting next round
- Synchronized to all clients via `game_updated` event

### UI Components

**Leaderboard Modal**:
- Full-screen modal with semi-transparent backdrop
- Sticky header with round number
- Scrollable content area
- Three sections: Current Standings, Current Bet, Round History

**Visual Design**:
- Team 1: Blue gradient background
- Team 2: Red gradient background
- Leading team: Yellow ring (ring-4 ring-yellow-400)
- Successful bet: Green badge
- Failed bet: Red badge
- Crown icon (👑) on leading team

**Round History Display**:
- Reverse chronological order (newest first)
- Expandable cards with hover effects
- Grid layout showing: Bidder, Bet Details, Points Earned, Round Score
- Color-coded score deltas (+/- indicators)
- Total cumulative scores shown

### Data Synchronization

**Backend**:
```typescript
// Initialize in game creation (backend/src/index.ts:112)
roundHistory: []

// Populate in endRound() (backend/src/index.ts:634-655)
game.roundHistory.push({
  roundNumber: game.roundNumber,
  bets: [...game.currentBets],
  highestBet: game.highestBet,
  // ... all other fields
});

// Emit to all clients
io.to(gameId).emit('game_updated', game);
```

**Frontend**:
```typescript
// Access from gameState prop
gameState.roundHistory.slice().reverse().map(round => {
  // Render round details
})
```

### Integration Points

**Playing Phase** (frontend/src/components/PlayingPhase.tsx:161-176):
```typescript
<button
  onClick={() => setShowLeaderboard(true)}
  className="bg-yellow-500 hover:bg-yellow-600..."
>
  🏆 Leaderboard
</button>

<Leaderboard
  gameState={gameState}
  isOpen={showLeaderboard}
  onClose={() => setShowLeaderboard(false)}
/>
```

### Use Cases

1. **Track Game Progress**: See how the game evolved round by round
2. **Verify Scoring**: Check if bets were made and points calculated correctly
3. **Strategic Analysis**: Review past bets and outcomes to inform strategy
4. **End-Game Summary**: See complete game history before game_over

---

## 👁️ Spectator Mode

### Overview
Spectator mode allows users to watch ongoing games without participating as players. Spectators can observe the game flow, scores, and tricks, but player hands remain hidden to preserve game integrity.

**Purpose**:
- Watch ongoing games to learn strategies
- Wait for the next game while observing current one
- Review friend's games without joining
- Debug and test game flows from observer perspective

### Implementation

**Backend** (backend/src/index.ts:533-583):
```typescript
// Join game as spectator
socket.on('spectate_game', ({ gameId, spectatorName }: { gameId: string; spectatorName?: string }) => {
  const game = games.get(gameId);
  if (!game) {
    socket.emit('error', { message: 'Game not found' });
    return;
  }

  // Join spectator room
  socket.join(`${gameId}-spectators`);

  // Create spectator-safe game state (hide player hands)
  const spectatorGameState = {
    ...game,
    players: game.players.map(player => ({
      ...player,
      hand: []  // Hide hands from spectators
    }))
  };

  socket.emit('spectator_joined', { gameState: spectatorGameState, isSpectator: true });

  // Notify players
  io.to(gameId).emit('spectator_update', {
    message: `${spectatorName || 'A spectator'} is now watching`,
    spectatorCount: io.sockets.adapter.rooms.get(`${gameId}-spectators`)?.size || 0
  });
});

// Leave spectator mode
socket.on('leave_spectate', ({ gameId }) => {
  socket.leave(`${gameId}-spectators`);
  socket.emit('spectator_left', { success: true });
});
```

**Frontend Integration** (frontend/src/App.tsx):
```typescript
// Handle spectate request
const handleSpectateGame = (gameId: string, spectatorName?: string) => {
  if (socket) {
    socket.emit('spectate_game', { gameId, spectatorName });
    setGameId(gameId);
  }
};

// Listen for spectator_joined event
socket.on('spectator_joined', ({ gameState }: { gameState: GameState }) => {
  setIsSpectator(true);
  setGameId(gameState.id);
  setGameState(gameState);
});
```

### Spectator UI Features

**Lobby Integration** (frontend/src/components/Lobby.tsx):
- Orange "👁️ Spectate Game" button in main menu
- Dedicated spectate form with:
  - Game ID input (required)
  - Spectator name input (optional)
  - Info message explaining spectator mode restrictions

**Playing Phase** (frontend/src/components/PlayingPhase.tsx):
- **Spectator Label**: Purple "👁️ Watching" badge shown instead of "Your Turn"
- **Hidden Hands**: Player hand section shows "🔒 Player hands are hidden" message
- **Full Game View**: Spectators can see:
  - Team scores and round number
  - Current trick and cards played
  - Trump suit
  - Player info (tricks won, card count)
  - Previous trick viewer
  - Leaderboard and round history

**What Spectators CAN See**:
- ✅ Team scores
- ✅ Round number and trump suit
- ✅ Cards currently in trick
- ✅ Player names, teams, tricks won
- ✅ Leaderboard and round history
- ✅ Game phase (betting, playing, scoring)

**What Spectators CANNOT See**:
- ❌ Player hands (hidden)
- ❌ Betting controls (not interactive)
- ❌ Card play controls (not interactive)

### Real-time Updates

**Server-Side Broadcasting** (backend/src/index.ts:88-110):
```typescript
function broadcastGameUpdate(gameId: string, event: string, data: any) {
  // Send full data to players
  io.to(gameId).emit(event, data);

  // Send spectator-safe data to spectators (hide player hands)
  if (data && data.players) {
    const spectatorData = {
      ...data,
      players: data.players.map((player: Player) => ({
        ...player,
        hand: []  // Hide hands
      }))
    };
    io.to(`${gameId}-spectators`).emit(event, spectatorData);
  } else {
    io.to(`${gameId}-spectators`).emit(event, data);
  }
}
```

All game events (game_updated, round_started, trick_resolved, etc.) are automatically broadcast to spectators with hands hidden.

### Testing

**E2E Tests** (e2e/tests/14-spectator.spec.ts):
- `should allow joining game as spectator` - Verify spectator can join with game ID
- `should hide player hands from spectators` - Verify hands are hidden and message shown
- `should show game state to spectators` - Verify spectators see scores, tricks, players
- `should update spectator view in real-time` - Verify spectators receive game updates
- `should prevent spectators from playing cards or making bets` - Verify no interactive controls
- `should allow spectators to view leaderboard` - Verify leaderboard access
- `should handle invalid game ID` - Verify error handling
- `should allow anonymous spectators` - Verify optional name field

### Usage Examples

**Spectate an Ongoing Game**:
1. Click "👁️ Spectate Game" from lobby
2. Enter game ID
3. Optionally enter your name
4. Click "Spectate" button
5. Watch game in real-time with hands hidden

**Leave Spectator Mode**:
1. Navigate back to lobby (browser back)
2. Or refresh page
3. Socket automatically leaves spectator room on disconnect

### Security Considerations

**Hand Privacy**:
- Player hands are stripped from game state BEFORE sending to spectators
- Server-side validation ensures spectators cannot see hands
- Both `spectator_joined` and `broadcastGameUpdate` enforce hand hiding

**Interaction Prevention**:
- Frontend: Spectator mode flag (`isSpectator`) disables all interactive elements
- Backend: Spectators are not in player list, so server validation rejects their actions
- Spectators cannot bet, play cards, or modify game state

### Future Enhancements
- [ ] Spectator chat room (separate from players)
- [ ] Spectator count display to players
- [ ] Spectator list modal
- [ ] Ability to follow specific players
- [ ] Replay mode for finished games

---

## 🔗 Quick Copy Game Link

### Overview
Players can easily share games with friends using a one-click shareable link feature. The system generates URLs with embedded game IDs that automatically join players to the correct game.

**Purpose**:
- Simplify multiplayer invitation process
- Enable seamless remote play with friends
- Reduce friction in game joining workflow

### Implementation

**Frontend** (frontend/src/components/TeamSelection.tsx:28-39):
```typescript
const [showCopyToast, setShowCopyToast] = useState(false);

const handleCopyGameLink = async () => {
  const gameUrl = `${window.location.origin}?join=${gameId}`;
  try {
    await navigator.clipboard.writeText(gameUrl);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  } catch (err) {
    console.error('Failed to copy link:', err);
  }
};
```

**URL Parameter Parsing** (frontend/src/App.tsx:269-283):
```typescript
// URL parameter parsing for auto-join from shared links
const [autoJoinGameId, setAutoJoinGameId] = useState<string>('');

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const joinGameId = urlParams.get('join');

  if (joinGameId) {
    console.log('Auto-join game from URL:', joinGameId);
    setAutoJoinGameId(joinGameId);

    // Clean the URL without reloading the page
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

**Lobby Auto-Population** (frontend/src/components/Lobby.tsx:130-133):
```typescript
export function Lobby({ ..., autoJoinGameId }: LobbyProps) {
  const [gameId, setGameId] = useState(autoJoinGameId || '');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'spectate'>(
    autoJoinGameId ? 'join' : 'menu'
  );
  // ...
}
```

### UI Components

**Copy Button** (Team Selection Screen):
- Blue gradient button below Game ID
- 🔗 icon with "Copy Game Link" text
- Full-width, prominent placement
- hover:scale-105 animation

**Toast Notification**:
- Green success banner at top of screen
- ✅ icon with "Game link copied! Share with friends." message
- Auto-disappears after 3 seconds
- Animate-bounce effect for visibility

### User Flow

**Sharing a Game**:
1. Player creates a game and enters team selection
2. Game ID displayed prominently
3. Player clicks "Copy Game Link" button
4. Toast notification confirms successful copy
5. Shareable URL like `https://yourapp.com/?join=ABC123` copied to clipboard

**Joining from Link**:
1. Friend receives link (via text, Discord, etc.)
2. Clicks link, opens app with `?join=ABC123` parameter
3. App automatically navigates to Join Game screen
4. Game ID field pre-populated with `ABC123`
5. Friend enters their name and joins instantly
6. URL cleaned to remove query parameter (prevents accidental re-joins)

### Technical Details

**URL Format**:
```
https://yourapp.com/?join=GAMEID
```

**Query Parameter Handling**:
- Parameter name: `join`
- Value: Game ID (e.g., `ABC123`)
- Automatically parsed on app load
- URL cleaned immediately after parsing using `window.history.replaceState()`
- Prevents accidental multiple joins on page refresh

**Copy to Clipboard**:
- Uses native `navigator.clipboard.writeText()` API
- Graceful error handling with console.error
- Works on all modern browsers
- Requires HTTPS in production

### E2E Testing

**Test Coverage** (e2e/tests/17-share-link.spec.ts):
```typescript
test('should copy shareable game link', async ({ page }) => {
  // Create game
  // Go to team selection
  // Click "Copy Game Link" button
  // Verify toast notification appears
  // Verify clipboard contains correct URL
});

test('should auto-join from URL parameter', async ({ page }) => {
  // Navigate to /?join=TESTGAMEID
  // Verify lobby opens in join mode
  // Verify game ID field is pre-populated
  // Verify URL parameter is removed after parsing
});

test('should not re-join on page refresh', async ({ page }) => {
  // Join game from URL parameter
  // Refresh page
  // Verify player doesn't re-join (URL was cleaned)
});
```

### Security Considerations

**No Sensitive Data**:
- Game IDs are not secret (they're shareable by design)
- No authentication tokens in URL
- Game IDs are short-lived (games expire when empty)

**Validation**:
- Server validates game ID exists before allowing join
- Invalid game IDs show appropriate error messages
- No risk of URL manipulation attacks

### Future Enhancements
- [ ] QR code generation for in-person sharing
- [ ] Share to social media buttons (Discord, WhatsApp)
- [ ] Copy button in game over screen for rematch links
- [ ] Shareable replay links for finished games

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
- `14-spectator.spec.ts` - Spectator mode functionality

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

#### Core Gameplay ✅
✅ Team selection with position swapping
✅ Dealer rotation and betting order
✅ Turn-based betting UI (shows whose turn it is)
✅ Suit-following validation
✅ Led suit vs trump logic
✅ Points vs tricks distinction
✅ "Without trump" bet priority
✅ Skip bet functionality with dealer restrictions
✅ Circular trick layout with previous trick viewer
✅ 3-second pause after trick completion

#### Quality & Security ✅
✅ **Multi-layered validation system** (4-layer defense-in-depth)
✅ **Race condition prevention** (trick completion lock, duplicate play check)
✅ Comprehensive E2E test suite (17+ test files)
✅ Documentation (VALIDATION_SYSTEM.md, BOT_PLAYER_SYSTEM.md, IMPROVEMENT_SUGGESTIONS.md, IMPLEMENTATION_PLAN.md)

#### Multiplayer & Social ✅
✅ **Reconnection support** (15-minute grace period, session management, catch-up modal)
✅ **Spectator mode** (watch games without playing, hands hidden)
✅ **Quick Copy Game Link** (shareable URL with auto-join from URL parameter)
✅ **Recent Players & Online Players** (localStorage + real-time tracking with 5s updates)
✅ **Pre-lobby Chat** (team selection phase, team-colored messages)
✅ **In-game Chat** (betting/playing/scoring phases, persistence across phases)
✅ **Chat Features** (quick emoji reactions, unread counter, 200 char limit)

#### Game Stats & Analytics ✅
✅ **Leaderboard with round history** (comprehensive game stats tracking)
✅ **Round-by-round analytics** (bets, points, outcomes, cumulative scores)
✅ **Round Statistics Panel** (⚡ fastest play, 🎲 aggressive bidder, 👑 trump master, 🍀 lucky player)

#### Bot & Testing Tools ✅
✅ **Bot player AI system** (automated gameplay with strategic decisions)
✅ **Quick Play feature** (1 human + 3 bots instant start)
✅ **Autoplay mode** (manual toggle + auto-enable on 60s timeout)
✅ **Test Panel** (state manipulation for testing)
✅ **4-Player debug view** (all perspectives simultaneously)
✅ **Debug controls** (Test, State, 4-Player toggle)

#### UI/UX Polish ✅
✅ **Sound Effects** (Web Audio API synthesized: card deal, card play, trick won, trick collect, round start, button click, your turn)
✅ **Sound Settings** (toggle on/off, volume control at 30% default)
✅ **Animations** (card slides, trick collection, score pop, points float-up, slideDown/Up, fadeIn)
✅ **Mobile Responsive Design** (breakpoints sm/md/lg/xl, touch-friendly buttons, adaptive layouts)
✅ **Enhanced Reconnection UI** (toast notifications, catch-up modal, non-blocking banner)
✅ **Dark Mode** (Tailwind dark: classes, toggle in GameHeader, localStorage persistence, WCAG compliance)
✅ **Timeout/AFK System** (60s countdown, autoplay activation, TimeoutIndicator/Banner/Countdown components)
✅ **How To Play Modal** (comprehensive game rules, mobile-responsive, accessible from lobby)

#### Advanced Features ✅
✅ **Rematch System** (RematchVoting component, vote_rematch event, real-time vote tracking)
✅ **Lobby Browser** (LobbyBrowser component, /api/games/lobby endpoint, public game listing)
✅ **Global Leaderboard** (GlobalLeaderboard.tsx, /api/leaderboard endpoint, top 100 players)
✅ **Player Statistics** (PlayerStatsModal.tsx, /api/stats/:playerName, win rates, game counts)
✅ **Tier Badge System** (Bronze/Silver/Gold/Platinum/Diamond, based on total games played)
✅ **Bot Difficulty Levels** (Easy/Medium/Hard in botPlayer.ts, strategic AI variations)
✅ **Database Persistence** (PostgreSQL: games, game_players, game_rounds tables, incremental saves)
✅ **Player History** (/api/player-history/:playerName, game outcome tracking)
✅ **Kick Player Feature** (kick_player event, host can remove AFK players)

### Future Enhancements (Priority Order)

#### Medium Priority
- [ ] **Advanced Achievement System** (8-10 hours)
  - More achievements beyond tier badges (Perfect Round, Betting Master, Comeback King, etc.)
  - Achievement notifications and unlocks
  - Display on player profiles
  - **Impact**: Engagement and replayability

- [ ] **Enhanced Bot AI** (6-8 hours)
  - Improve hand strength evaluation for smarter betting
  - Advanced card counting and memory
  - Better partner support strategies
  - Personality variations (aggressive, conservative, balanced)
  - **Impact**: Better single-player experience

#### Low Priority
- [ ] **Private/Password-Protected Games** (4-5 hours)
  - Password entry when joining
  - Visibility toggle in lobby browser
  - **Impact**: More control over multiplayer sessions

- [ ] **Social Features** (10-12 hours)
  - Friend lists
  - Player profiles
  - Game invitations
  - **Impact**: Better social engagement

---

## 📚 Additional Resources

- **Game Rules**: See README.md section "Game Rules"
- **Deployment**: See RAILWAY_DEPLOY.md
- **Quick Start**: See QUICKSTART.md
- **Testing**: See TDD_WORKFLOW.md
- **Contributing**: See CONTRIBUTING.md
- **Validation System**: See VALIDATION_SYSTEM.md (multi-layer validation architecture)
- **Bot Player System**: See BOT_PLAYER_SYSTEM.md (AI decision-making and lifecycle)
- **Improvement Suggestions**: See IMPROVEMENT_SUGGESTIONS.md (future enhancement roadmap)

---

*Last updated: 2025-01-22*
*Project: Trick Card Game (anthropicJoffre)*

**Feature Completion Status**: All planned Priority 1-3 features complete (100%)
**Project Status**: Feature-complete for core gameplay and social features
