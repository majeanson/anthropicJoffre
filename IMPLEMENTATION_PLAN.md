# Implementation Plan

## Project Focus
**Target Audience**: Casual remote multiplayer between friends
**Platform**: Mobile & Desktop
**Deployment**: Continuous deployment
**Monetization**: None
**AI Role**: Testing and handling AFKs

---

## ✅ Completed Features

### Quick Copy Game Link
- **Date**: 2025-01-20
- **Files**: TeamSelection.tsx, App.tsx, Lobby.tsx
- **Features**:
  - 🔗 Copy button with shareable URL (`?join=GAMEID`)
  - ✅ Toast notification on successful copy
  - 🔄 Auto-join from URL parameter
  - 🧹 URL cleanup after parsing

### Autoplay Mode
- **Date**: 2025-01-19
- **Files**: App.tsx, PlayingPhase.tsx, BettingPhase.tsx
- **Features**:
  - 🤖 Manual toggle for bot mode
  - ⏱️ Auto-enable on 60s timeout
  - 🎮 Works in betting and playing phases

### Leaderboard & Round History
- **Date**: 2025-01-18
- **Files**: Leaderboard.tsx, backend/src/index.ts
- **Features**:
  - 🏆 Current standings with team composition
  - 📜 Complete round history with detailed stats
  - 📊 Bet success tracking

### Spectator Mode
- **Date**: 2025-01-17
- **Files**: backend/src/index.ts, PlayingPhase.tsx, Lobby.tsx
- **Features**:
  - 👁️ Watch games without playing
  - 🔒 Player hands hidden for fairness
  - 🎮 Full game visibility (scores, tricks, trump)

### Reconnection Support
- **Date**: 2025-01-16
- **Files**: backend/src/index.ts, App.tsx
- **Features**:
  - 🔄 2-minute grace period
  - 💾 Session token persistence in localStorage
  - 🔌 Auto-reconnect on page refresh

### Recent Players & Online Players
- **Date**: 2025-01-20
- **Files**: backend/src/index.ts, App.tsx, Lobby.tsx, recentPlayers.ts
- **Features**:
  - 📝 Recent players saved to localStorage (max 20)
  - 🟢 Real-time online players tracking (5s updates)
  - 📊 Status indicators (in_lobby, in_game, in_team_selection)
  - 📋 Copy invite link from online players
  - 🎯 Tab interface for Recent/Online switching

### Pre-lobby Chat
- **Date**: 2025-01-20
- **Files**: backend/src/index.ts, TeamSelection.tsx, App.tsx
- **Features**:
  - 💬 Real-time chat during team selection
  - 🎨 Team-colored message bubbles (Orange/Purple)
  - 📏 200 character limit
  - ✨ Auto-scroll to latest messages
  - 🚫 Input validation and sanitization

### In-game Chat
- **Date**: 2025-01-20
- **Files**: backend/src/index.ts, ChatPanel.tsx, PlayingPhase.tsx, ScoringPhase.tsx, App.tsx
- **Features**:
  - 💬 Floating chat panel during gameplay
  - 😊 Quick emoji reactions (👍 👎 🔥 😂 GG)
  - 🔴 Unread message counter
  - 🎨 Team-colored messages
  - 📱 Responsive design (mobile & desktop)
  - 💾 Chat persistence across game phases (betting, playing, scoring)

### Sound Effects
- **Date**: 2025-01-20
- **Files**: sounds.ts, PlayingPhase.tsx
- **Features**:
  - 🔊 Web Audio API synthesized sounds (no files needed)
  - 🎵 Card deal, card play, trick won, trick collect sounds
  - 🎶 Round start, button click, your turn notification sounds
  - 🔇 Toggle on/off with settings button
  - 🎚️ Volume control (default 30%)

### Animations
- **Date**: 2025-01-20
- **Files**: tailwind.config.js, PlayingPhase.tsx, ScoringPhase.tsx
- **Features**:
  - 🎬 Card slide animations (from-bottom, from-top, from-left, from-right)
  - 🎬 Trick collection animations (collect-to-bottom, collect-to-top, etc.)
  - 🎬 Score pop animation when points change
  - 🎬 Points float-up animation
  - 🎬 Smooth transitions with Tailwind custom animations

### Mobile Responsive Design
- **Date**: 2025-01-20
- **Files**: PlayingPhase.tsx, BettingPhase.tsx, Lobby.tsx, all components
- **Features**:
  - 📱 Responsive breakpoints (sm, md, lg, xl)
  - 👆 Touch-friendly buttons (min-h-[44px] for iOS)
  - 📐 Adaptive layouts (grid on mobile, circular on desktop)
  - 🎴 Responsive card sizes (w-16 h-24 → w-20 h-28)
  - 📏 Flexible spacing and padding for all screen sizes

### Round Statistics Panel
- **Date**: 2025-01-20
- **Files**: backend/src/index.ts, ScoringPhase.tsx, game.ts
- **Features**:
  - ⚡ Fastest Play tracking with average play time
  - 🎲 Most Aggressive Bidder highlight
  - 👑 Trump Master (player who played most trumps)
  - 🍀 Lucky Player (won tricks with lowest card values)
  - 🎨 Beautiful stat cards with color-coded borders

### Player Timeout/AFK Detection
- **Date**: 2025-01-21
- **Files**: backend/src/index.ts, TimeoutCountdown.tsx, App.tsx
- **Features**:
  - ⏰ 60-second countdown timer for betting and playing
  - 🔔 Warning notifications at 15 seconds
  - 🤖 Auto-action after timeout (auto-bet or auto-play)
  - 📢 Toast notifications for timeout events
  - 🎨 Visual countdown with color-coded urgency (blue → yellow → red)
  - ✨ Pulse animation when time is critical

### Rematch Voting System
- **Date**: 2025-01-21
- **Files**: backend/src/index.ts, RematchVoting.tsx, App.tsx
- **Features**:
  - 🗳️ Vote for rematch on game over screen
  - 👥 Visual vote tracking for all 4 players
  - ✅ Team-colored vote indicators
  - 🎉 Automatic game restart when all vote
  - 🔄 Session management for rematch games

---

## ✅ Priority #1: Social Features (Week 1-2) - COMPLETED

### 1.1 Recent Players List / All Online Players ✅
**Priority**: HIGH
**Effort**: Medium (6-8 hours)
**Status**: COMPLETED (2025-01-20)

**Purpose**: Make it easy to play with the same friends repeatedly

**Implementation**:

**Backend** (3 hours):
```typescript
// Track online players
interface OnlinePlayer {
  socketId: string;
  playerName: string;
  status: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity: number;
}

const onlinePlayers = new Map<string, OnlinePlayer>();

// Update player status
socket.on('update_status', ({ status }) => {
  const player = onlinePlayers.get(socket.id);
  if (player) {
    player.status = status;
    player.lastActivity = Date.now();
  }
});

// Emit online players list every 5 seconds
setInterval(() => {
  const active = Array.from(onlinePlayers.values())
    .filter(p => Date.now() - p.lastActivity < 30000);
  io.emit('online_players_update', active);
}, 5000);
```

**Frontend** (3-4 hours):
```typescript
// Store recent players in localStorage
interface RecentPlayer {
  name: string;
  lastPlayed: number;
  gamesPlayed: number;
}

// Add tab in Lobby component
<div className="tabs">
  <button onClick={() => setTab('recent')}>Recent Players</button>
  <button onClick={() => setTab('online')}>Online Now</button>
</div>

{tab === 'recent' && (
  <div className="recent-players">
    {recentPlayers.map(player => (
      <div key={player.name} className="player-card">
        <span>{player.name}</span>
        <span className="games-count">{player.gamesPlayed} games</span>
        <button onClick={() => copyInviteLink()}>📋 Invite</button>
      </div>
    ))}
  </div>
)}

{tab === 'online' && (
  <div className="online-players">
    {onlinePlayers.map(player => (
      <div key={player.socketId} className="player-card">
        <span className="online-indicator">🟢</span>
        <span>{player.name}</span>
        <span className="status">{player.status}</span>
        {player.status === 'in_game' && player.gameId && (
          <button onClick={() => spectateGame(player.gameId)}>👁️ Watch</button>
        )}
      </div>
    ))}
  </div>
)}
```

**E2E Tests** (1 hour):
```typescript
test('should track recent players after game', async ({ page }) => {
  // Create game with 4 players
  // Complete game
  // Go to lobby
  // Verify recent players list shows 3 other players
});

test('should show online players in real-time', async () => {
  const [page1, page2] = await Promise.all([
    context.newPage(),
    context.newPage(),
  ]);

  // Page 1 joins lobby
  // Verify page 2 sees page 1 in online list
  // Page 1 creates game
  // Verify page 2 sees "in_game" status
});
```

---

### 1.2 Pre-lobby Chat (Team Selection Phase) ✅
**Priority**: HIGH
**Effort**: Low (3-4 hours)
**Status**: COMPLETED (2025-01-20)

**Purpose**: Allow banter and coordination while waiting for players

**Implementation**:

**Backend** (1 hour):
```typescript
socket.on('send_team_selection_chat', ({ gameId, message }) => {
  const game = games.get(gameId);
  const player = game.players.find(p => p.id === socket.id);

  if (!player || game.phase !== 'team_selection') return;

  io.to(gameId).emit('team_selection_chat_message', {
    playerId: socket.id,
    playerName: player.name,
    teamId: player.teamId,
    message: message.trim().substring(0, 200), // Max 200 chars
    timestamp: Date.now()
  });
});
```

**Frontend** (2-3 hours):
```typescript
// Add to TeamSelection.tsx
<div className="chat-box">
  <div className="messages max-h-40 overflow-y-auto">
    {messages.map(msg => (
      <div key={msg.timestamp} className={`message ${msg.teamId ? `team-${msg.teamId}` : ''}`}>
        <strong>{msg.playerName}:</strong> {msg.message}
      </div>
    ))}
  </div>
  <input
    type="text"
    placeholder="Type a message..."
    value={chatInput}
    onChange={e => setChatInput(e.target.value)}
    onKeyPress={e => e.key === 'Enter' && sendMessage()}
    maxLength={200}
  />
</div>
```

**E2E Tests** (30 min):
```typescript
test('should send and receive team selection chat', async () => {
  // Create game with 2 players
  // Player 1 sends message
  // Verify Player 2 receives it
});
```

---

### 1.3 In-game Chat ✅
**Priority**: MEDIUM
**Effort**: Low (2-3 hours)
**Status**: COMPLETED (2025-01-20)

**Purpose**: Communication during gameplay

**Implementation**:
- Same backend logic as pre-lobby chat
- Available in betting and playing phases
- Collapsible sidebar (desktop) or bottom sheet (mobile)
- Quick emoji reactions: 👍 👎 🔥 😂 GG

**UI**:
```typescript
// Add chat icon in top panel
<button onClick={() => setChatOpen(!chatOpen)} className="relative">
  💬
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4">
      {unreadCount}
    </span>
  )}
</button>

// Slide-out panel
{chatOpen && (
  <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
    {/* Chat messages */}
  </div>
)}
```

---

## ✅ Priority #2: Game Stats After Each Round - COMPLETED

### 2.1 Round Statistics Panel ✅
**Priority**: MEDIUM
**Effort**: Medium (5-6 hours)
**Status**: COMPLETED (2025-01-20)

**Purpose**: Make each round more engaging with fun stats

**Completed Features**:
- ⚡ Fastest Play tracking
- 🎲 Most Aggressive Bidder
- 👑 Trump Master (most trumps played)
- 🍀 Lucky Player (best trick wins with low card values)
- Integrated into ScoringPhase with beautiful stat cards
- Full backend tracking of play times and statistics

**Implementation (Completed)**:

**Backend** (2 hours):
```typescript
interface RoundStatistics {
  fastestPlay: { playerId: string; playerName: string; timeMs: number };
  mostAggressiveBidder: { playerId: string; playerName: string; bidAmount: number };
  trumpMaster: { playerId: string; playerName: string; trumpsPlayed: number };
  luckyPlayer: { playerId: string; playerName: string; reason: string };
}

// Track card play times
const cardPlayTimes = new Map<string, number>(); // playerId -> timestamp of trick start

socket.on('play_card', ({ gameId, card }) => {
  // ... existing logic ...

  // Track play time
  const playTime = Date.now() - (cardPlayTimes.get(socket.id) || Date.now());
  // Store for statistics
});

// In endRound(), calculate statistics
function calculateRoundStats(game: GameState): RoundStatistics {
  // Find fastest player
  // Find most aggressive bidder
  // Count trump cards played per player
  // Determine "lucky" player (won with lowest average card value)
}
```

**Frontend** (3-4 hours):
```typescript
// Add to round summary screen
<div className="round-stats mt-6">
  <h3 className="text-xl font-bold mb-4">Round Highlights</h3>
  <div className="grid grid-cols-2 gap-4">
    <div className="stat-card bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
      <div className="text-3xl mb-2">⚡</div>
      <p className="text-sm text-gray-600">Fastest Play</p>
      <p className="font-bold text-lg">{stats.fastestPlay.playerName}</p>
      <p className="text-xs text-gray-500">{(stats.fastestPlay.timeMs / 1000).toFixed(1)}s</p>
    </div>

    <div className="stat-card bg-red-50 border-2 border-red-300 rounded-lg p-4">
      <div className="text-3xl mb-2">🎲</div>
      <p className="text-sm text-gray-600">Most Aggressive</p>
      <p className="font-bold text-lg">{stats.mostAggressiveBidder.playerName}</p>
      <p className="text-xs text-gray-500">{stats.mostAggressiveBidder.bidAmount} pts</p>
    </div>

    <div className="stat-card bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
      <div className="text-3xl mb-2">👑</div>
      <p className="text-sm text-gray-600">Trump Master</p>
      <p className="font-bold text-lg">{stats.trumpMaster.playerName}</p>
      <p className="text-xs text-gray-500">{stats.trumpMaster.trumpsPlayed} trumps</p>
    </div>

    <div className="stat-card bg-green-50 border-2 border-green-300 rounded-lg p-4">
      <div className="text-3xl mb-2">🍀</div>
      <p className="text-sm text-gray-600">Lucky Player</p>
      <p className="font-bold text-lg">{stats.luckyPlayer.playerName}</p>
      <p className="text-xs text-gray-500">{stats.luckyPlayer.reason}</p>
    </div>
  </div>
</div>
```

**E2E Tests** (1 hour):
```typescript
test('should display round statistics after round ends', async ({ page }) => {
  // Play through full round
  // Wait for round summary
  // Verify stats panel appears
  // Verify all 4 stats are shown
});

test('should calculate fastest play correctly', async ({ page }) => {
  // Track timestamps of card plays
  // Verify correct player is awarded "fastest play"
});
```

---

## ✅ Priority #3: Smart Game Recovery & Resume - COMPLETED

### 3.1 Enhanced Reconnection UI ✅
**Priority**: MEDIUM
**Effort**: Low (3-4 hours)
**Status**: COMPLETED (2025-01-20)

**Completed Features**:
- Non-blocking reconnecting banner with animated spinner
- Catch-up modal showing game state after reconnection
- Toast notifications for player connect/disconnect
- Beautiful animations (slideDown, slideUp, fadeIn)
- Shows current round, phase, team scores, and "It's your turn!" indicator

**Implementation (Completed)**:

**Frontend** (3-4 hours):
```typescript
// Show reconnecting banner
{reconnecting && (
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
      <span className="font-bold">Reconnecting to game...</span>
    </div>
  </div>
)}

// After successful reconnect
socket.on('reconnection_successful', ({ gameState }) => {
  setReconnecting(false);
  setGameState(gameState);

  // Show catch-up modal
  showCatchUpModal({
    currentRound: gameState.roundNumber,
    currentPhase: gameState.phase,
    teamScores: gameState.teamScores,
    yourTurn: gameState.players[gameState.currentPlayerIndex].id === socket.id,
    leadingTeam: gameState.teamScores.team1 > gameState.teamScores.team2 ? 1 : 2
  });
});

// Catch-up modal
<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
  <div className="bg-parchment-50 rounded-xl p-6 max-w-md border-4 border-amber-700">
    <h2 className="text-2xl font-bold mb-4 text-umber-900">Welcome Back!</h2>
    <div className="space-y-3 text-umber-800">
      <p>📍 <strong>Round {catchUp.currentRound}</strong> - {catchUp.currentPhase} phase</p>
      <p>🏆 <strong>Team {catchUp.leadingTeam} is leading!</strong></p>
      <div className="flex gap-4 bg-parchment-100 rounded-lg p-3">
        <div className="flex-1">
          <p className="text-sm text-orange-600">Team 1</p>
          <p className="text-2xl font-bold">{catchUp.teamScores.team1}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-purple-600">Team 2</p>
          <p className="text-2xl font-bold">{catchUp.teamScores.team2}</p>
        </div>
      </div>
      {catchUp.yourTurn && (
        <p className="text-green-600 font-bold bg-green-50 border-2 border-green-300 rounded-lg p-2">
          ✨ It's your turn!
        </p>
      )}
    </div>
    <button
      onClick={() => setCatchUpModalOpen(false)}
      className="w-full mt-4 bg-forest-600 text-white py-3 rounded-lg font-bold hover:bg-forest-700"
    >
      Continue Playing
    </button>
  </div>
</div>

// Show toast when other players reconnect
socket.on('player_reconnected', ({ playerName }) => {
  showToast(`${playerName} reconnected`, 'success');
});
```

**E2E Tests** (30 min):
```typescript
test('should show reconnecting banner', async ({ page }) => {
  // Create game
  // Simulate disconnect
  // Verify banner appears
  // Verify reconnection successful
});

test('should show catch-up summary after reconnect', async ({ page }) => {
  // Create game, play a few rounds
  // Disconnect
  // Reconnect
  // Verify modal shows current round, scores, phase
});
```

---

## ✅ Priority #4: Quick Rematch & Lobby Persistence (Week 4-5) - COMPLETED

### 4.1 Rematch System ✅
**Priority**: MEDIUM
**Effort**: Medium (4-5 hours)
**Status**: COMPLETED (2025-01-21)

**Purpose**: Keep same group of friends playing together

**Implementation**:

**Backend** (2-3 hours):
```typescript
const rematchVotes = new Map<string, Set<string>>(); // gameId -> playerIds

socket.on('vote_rematch', ({ gameId }) => {
  if (!rematchVotes.has(gameId)) {
    rematchVotes.set(gameId, new Set());
  }

  const votes = rematchVotes.get(gameId);
  votes.add(socket.id);

  io.to(gameId).emit('rematch_vote_update', {
    votes: votes.size,
    required: 4
  });

  if (votes.size === 4) {
    const oldGame = games.get(gameId);
    const newGameId = generateGameId();

    const newGame = createNewGame(newGameId, oldGame.players);
    games.set(newGameId, newGame);

    // Move all players to new game
    oldGame.players.forEach(p => {
      const playerSocket = io.sockets.sockets.get(p.id);
      if (playerSocket) {
        playerSocket.leave(gameId);
        playerSocket.join(newGameId);
      }
    });

    io.to(newGameId).emit('rematch_started', { gameState: newGame });
    rematchVotes.delete(gameId);
    games.delete(gameId);
  }
});
```

**Frontend** (2 hours):
```typescript
// Add to game_over screen
<div className="mt-6 bg-parchment-100 rounded-lg p-4 border-2 border-parchment-400">
  <h3 className="text-lg font-bold mb-3 text-umber-900">Play Again?</h3>
  <div className="flex flex-col gap-3">
    <button
      onClick={() => socket.emit('vote_rematch', { gameId })}
      className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
      disabled={hasVotedRematch}
    >
      {hasVotedRematch ? '✓ Ready for Rematch' : '🔄 Vote for Rematch'}
    </button>
    <div className="flex items-center justify-center gap-2 text-sm text-umber-600">
      <span>{rematchVotes}/4 players ready</span>
      {rematchVotes < 4 && (
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < rematchVotes ? 'bg-green-500' : 'bg-gray-300'}`} />
          ))}
        </div>
      )}
    </div>
  </div>
  <p className="text-xs text-umber-500 mt-2 text-center">
    Game will start when all 4 players are ready
  </p>
</div>
```

---

## ❌ Out of Scope

### Not Planned (Keeps Project Simple)
- ❌ User accounts / authentication
- ❌ Friend system (use recent players instead)
- ❌ Persistent database for game history
- ❌ Monetization features
- ❌ Advanced bot AI improvements
- ❌ Tournament mode
- ❌ Achievements/badges

---

## Timeline Estimate

**Week 1-2: Social Features**
- Recent Players / Online Players: 6-8 hours
- Pre-lobby Chat: 3-4 hours
- In-game Chat: 2-3 hours
- **Total**: 11-15 hours

**Week 2-3: Game Polish**
- Round Statistics: 5-6 hours
- Enhanced Reconnection UI: 3-4 hours
- **Total**: 8-10 hours

**Week 3-4: Retention**
- Rematch System: 4-5 hours
- Best of 3/5 Series: 3-4 hours
- **Total**: 7-9 hours

**Overall**: 26-34 hours (~5-7 work days)

---

## Next Steps

### ✅ Completed (All Priority 1-4 Features)
1. ✅ Quick Copy Game Link
2. ✅ Recent Players List / Online Players
3. ✅ Pre-lobby Chat
4. ✅ In-game Chat + Chat Persistence
5. ✅ Round Statistics
6. ✅ Enhanced Reconnection UI
7. ✅ Sound Effects
8. ✅ Animations
9. ✅ Mobile Responsive Design
10. ✅ Player Timeout/AFK Detection
11. ✅ Rematch Voting System

### 🎯 Remaining Features (Priority #4+)
1. **Dark Mode** (Low effort - 2-3 hours)
   - Tailwind dark mode classes
   - Toggle button with persistence
   - **Impact**: Better accessibility

4. **Game Replay** (Medium effort - 6-8 hours)
   - Record all game actions
   - Step through game history
   - **Impact**: Learn from games, share highlights

5. **Improved Bot AI** (Medium effort - 6-8 hours)
   - Difficulty levels (Easy/Medium/Hard)
   - Smarter betting based on hand strength
   - Card counting and tracking

6. **Lobby Browser** (High effort - 10-12 hours)
   - List public games
   - Join games in progress
   - Private/password games

---

*Last Updated: 2025-01-20*
*Project: J⋀ffre Trick Card Game*
