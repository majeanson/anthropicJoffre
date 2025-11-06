# Feature Documentation

Complete documentation of all implemented features in the Trick Card Game.

**Last Updated**: 2025-01-22

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
**Access**: Toggle button in GameHeader during betting and playing phases

**Purpose**: Allows human players to temporarily let the bot AI play for them

**Implementation**: `frontend/src/App.tsx`
- Uses the same `BotPlayer` AI strategy as bot players
- Automatically makes bets and plays cards when it's the player's turn
- Can be toggled on/off at any time during gameplay
- Auto-enables after 60s timeout

**Use Cases**:
- Testing full game flows without manual input
- Stepping away briefly while keeping the game moving
- Learning optimal bot strategy by observation
- Quick playtesting of game mechanics

### Quick Play Feature
**Location**: Lobby screen (purple button with ⚡ icon)

**Usage**: Click "Quick Play (1 Player + 3 Bots)" to instantly create a 4-player game

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

### Debug Controls Overview
**Location**: Top-right corner of game screen (always available)

1. **🧪 Test** - Opens Test Panel for state manipulation
2. **🔍 State** - Opens Debug Panel to inspect full game state JSON

### Development Testing Workflow

**Recommended approach for rapid iteration**:

1. **Quick Play** - Start game with bots instantly
2. **4-Player View** - Switch to multi-perspective view
3. **Test Panel** - Manipulate scores to test specific scenarios
4. **State Panel** - Inspect game state when debugging issues

**Benefits over 4-browser testing**:
- ✅ Single screen, single browser tab
- ✅ Faster iteration (no manual clicks in 4 windows)
- ✅ Automated bot actions (betting, card playing)
- ✅ State manipulation for edge case testing
- ✅ Full visibility of all players simultaneously

---

## 🏆 Leaderboard & Round History

### Leaderboard Feature
**Location**: `frontend/src/components/Leaderboard.tsx`

**Access**: Click "🏆 Stats" button in GameHeader

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

**Implementation**: Populated in `endRound()` function, synchronized to all clients via `game_updated` event

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

**Backend** (backend/src/index.ts):
- Join spectator room via `spectate_game` event
- Create spectator-safe game state (hide player hands)
- Notify players of spectator joining
- Leave spectator mode via `leave_spectate` event

### Spectator UI Features

**Lobby Integration**: Orange "👁️ Spectate Game" button in main menu

**Playing Phase**:
- **Spectator Label**: Purple "👁️ Watching" badge shown instead of "Your Turn"
- **Hidden Hands**: Player hand section shows "🔒 Player hands are hidden" message
- **Full Game View**: Spectators can see team scores, current trick, trump suit, player info, leaderboard

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

All game events (game_updated, round_started, trick_resolved, etc.) are automatically broadcast to spectators with hands hidden via `broadcastGameUpdate()` function.

### Security Considerations

**Hand Privacy**:
- Player hands are stripped from game state BEFORE sending to spectators
- Server-side validation ensures spectators cannot see hands
- Both `spectator_joined` and `broadcastGameUpdate` enforce hand hiding

**Interaction Prevention**:
- Frontend: Spectator mode flag (`isSpectator`) disables all interactive elements
- Backend: Spectators are not in player list, so server validation rejects their actions
- Spectators cannot bet, play cards, or modify game state

---

## 🔗 Quick Copy Game Link

### Overview
Players can easily share games with friends using a one-click shareable link feature. The system generates URLs with embedded game IDs that automatically join players to the correct game.

**Purpose**:
- Simplify multiplayer invitation process
- Enable seamless remote play with friends
- Reduce friction in game joining workflow

### Implementation

**URL Format**: `https://yourapp.com/?join=GAMEID`

**Components**:
1. **Copy Button** (Team Selection Screen): Blue gradient button below Game ID
2. **Toast Notification**: Green success banner confirms copy
3. **URL Parameter Parsing**: Auto-joins from ?join= parameter
4. **Lobby Auto-Population**: Pre-fills game ID field

### User Flow

**Sharing a Game**:
1. Player creates a game and enters team selection
2. Game ID displayed prominently
3. Player clicks "Copy Game Link" button
4. Toast notification confirms successful copy
5. Shareable URL copied to clipboard

**Joining from Link**:
1. Friend receives link (via text, Discord, etc.)
2. Clicks link, opens app with `?join=ABC123` parameter
3. App automatically navigates to Join Game screen
4. Game ID field pre-populated with `ABC123`
5. Friend enters their name and joins instantly
6. URL cleaned to remove query parameter (prevents accidental re-joins)

### Technical Details

**Copy to Clipboard**:
- Uses native `navigator.clipboard.writeText()` API
- Graceful error handling with console.error
- Works on all modern browsers
- Requires HTTPS in production

**Security Considerations**:
- Game IDs are not secret (they're shareable by design)
- No authentication tokens in URL
- Game IDs are short-lived (games expire when empty)
- Server validates game ID exists before allowing join

---

## Current Implementation Status

### Core Gameplay ✅
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

### Quality & Security ✅
✅ Multi-layered validation system (4-layer defense-in-depth)
✅ Race condition prevention (trick completion lock, duplicate play check)
✅ Comprehensive E2E test suite (17+ test files)
✅ Documentation (VALIDATION_SYSTEM.md, BOT_PLAYER_SYSTEM.md, IMPROVEMENT_SUGGESTIONS.md, IMPLEMENTATION_PLAN.md)

### Multiplayer & Social ✅
✅ Reconnection support (15-minute grace period, session management, catch-up modal)
✅ Spectator mode (watch games without playing, hands hidden)
✅ Quick Copy Game Link (shareable URL with auto-join from URL parameter)
✅ Recent Players & Online Players (localStorage + real-time tracking with 5s updates)
✅ Pre-lobby Chat (team selection phase, team-colored messages)
✅ In-game Chat (betting/playing/scoring phases, persistence across phases)
✅ Chat Features (quick emoji reactions, unread counter, 200 char limit)

### Game Stats & Analytics ✅
✅ Leaderboard with round history (comprehensive game stats tracking)
✅ Round-by-round analytics (bets, points, outcomes, cumulative scores)
✅ Round Statistics Panel (⚡ fastest play, 🎲 aggressive bidder, 👑 trump master, 🍀 lucky player)
✅ Global Leaderboard (top 100 players, /api/leaderboard endpoint)
✅ Player Statistics (win rates, game counts, /api/stats/:playerName)
✅ Tier Badge System (Bronze/Silver/Gold/Platinum/Diamond based on games played)
✅ Player History (/api/player-history/:playerName endpoint)

### Bot & Testing Tools ✅
✅ Bot player AI system (automated gameplay with strategic decisions)
✅ Bot Difficulty Levels (Easy/Medium/Hard in botPlayer.ts, strategic AI variations)
✅ Quick Play feature (1 human + 3 bots instant start)
✅ Autoplay mode (manual toggle + auto-enable on 60s timeout)
✅ Test Panel (state manipulation for testing)
✅ 4-Player debug view (all perspectives simultaneously)
✅ Debug controls (Test, State, 4-Player toggle)

### UI/UX Polish ✅
✅ Sound Effects (Web Audio API synthesized: card deal, card play, trick won, trick collect, round start, button click, your turn)
✅ Sound Settings (toggle on/off, volume control at 30% default)
✅ Animations (card slides, trick collection, score pop, points float-up, slideDown/Up, fadeIn)
✅ Mobile Responsive Design (breakpoints sm/md/lg/xl, touch-friendly buttons, adaptive layouts)
✅ Enhanced Reconnection UI (toast notifications, catch-up modal, non-blocking banner)
✅ Dark Mode (Tailwind dark: classes, toggle in GameHeader, localStorage persistence, WCAG compliance)
✅ Timeout/AFK System (60s countdown, autoplay activation, TimeoutIndicator/Banner/Countdown components)
✅ How To Play Modal (comprehensive game rules, mobile-responsive, accessible from lobby)

### Advanced Features ✅
✅ Rematch System (RematchVoting component, vote_rematch event, real-time vote tracking)
✅ Lobby Browser (LobbyBrowser component, /api/games/lobby endpoint, public game listing)
✅ Database Persistence (PostgreSQL: games, game_players, game_rounds tables, incremental saves)
✅ Kick Player Feature (kick_player event, host can remove AFK players)

---

*Last updated: 2025-01-22*
*Project: Trick Card Game (anthropicJoffre)*

**Feature Completion Status**: All planned Priority 1-3 features complete (100%)
**Project Status**: Feature-complete for core gameplay and social features
