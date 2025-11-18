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

## 💬 Social Features (Sprint 16)

### Direct Messaging System
**Location**: `frontend/src/components/DirectMessagesPanel.tsx`

**Access**: Click "Messages" icon in GlobalUI or from player profiles

**Features**:
- **1-on-1 Messaging**: Private conversations between players
- **Conversation Threads**: Organized message history with timestamps
- **Read Receipts**: Track unread messages with counters
- **Real-time Delivery**: Instant message delivery via WebSocket
- **Search Messages**: Full-text search across all conversations
- **Message Management**: Soft delete for both sender and recipient
- **Notifications**: Automatic notifications for new messages

**Database Design**:
```sql
CREATE TABLE direct_messages (
  message_id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(user_id),
  recipient_id INTEGER REFERENCES users(user_id),
  message_text TEXT CHECK (LENGTH(message_text) <= 2000),
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Backend Operations** (`backend/src/db/directMessages.ts`):
- `sendDirectMessage()` - Send new message
- `getConversation()` - Load message thread
- `getConversations()` - List all conversations with unread counts
- `markMessagesRead()` - Update read status
- `deleteMessage()` - Soft delete for user
- `deleteConversation()` - Remove entire conversation
- `searchMessages()` - Full-text search

**Socket Events**:
- `send_direct_message` - Send message to recipient
- `get_conversation` - Load conversation history
- `get_conversations` - List all conversations
- `mark_messages_read` - Mark messages as read
- `get_unread_count` - Get total unread count
- `delete_message` - Delete single message
- `delete_conversation` - Delete entire conversation
- `search_messages` - Search across all messages

**Real-time Events**:
- `direct_message_received` - New message notification (recipient)
- `message_read` - Read receipt (sender)
- `conversation_deleted` - Conversation removed

### Player Profiles
**Components**:
- `PlayerProfileModal.tsx` - Quick profile viewer
- `PlayerNameButton.tsx` - Clickable player names
- `PlayerAvatar.tsx` - Player display with indicators

**PlayerProfileModal Features**:
- **Quick Stats**: ELO rating, tier badge, games played/won, win rate
- **Friend Actions**: Add/Remove friend, Send message (auth-gated)
- **View Full Stats**: Link to comprehensive statistics modal
- **Avatar Display**: Visual player identifier
- **Keyboard Accessible**: ESC to close, button focus management

**PlayerNameButton Variants**:
- `inline` - Text link style (e.g., in chat messages)
- `badge` - Pill-style button (e.g., in player lists)
- `plain` - Minimal styling (e.g., in compact displays)

**PlayerAvatar Indicators**:
- **Online Status**: Green dot (online) / Gray dot (offline)
- **Bot Indicator**: 🤖 emoji for bot players
- **Dealer Badge**: ♦️ emoji for current dealer
- **Current Turn**: Visual highlight when active
- **Team Colors**: Orange (Team 1) / Purple (Team 2)
- **Size Variants**: `sm`, `md`, `lg` for different contexts

**Integration Points**:
- Chat messages (clickable names)
- Leaderboard entries
- Game player lists
- Recent players tab
- Friend suggestions
- Spectator lists

### Replay Sharing
**Location**: Post-game modal, GameReplay component

**Features**:
- **Deep Linking**: `?replay=gameId` URL parameter support
- **One-click Copy**: Clipboard integration with sound feedback
- **Social Media Sharing**: Twitter and Facebook integration
- **Post-game Prompts**: Victory celebration modal with share options
- **Quick Stats Summary**: Final score and winning team display

**URL Format**: `https://yourapp.com/?replay=ABC123`

**User Flow**:
1. Game finishes with winner
2. ShareReplayPrompt modal appears automatically
3. Player can:
   - Copy replay link to clipboard
   - Share to Twitter with pre-filled text
   - Share to Facebook
   - View replay immediately
   - Close and continue playing

**Share Button Locations**:
- Post-game victory modal (ShareReplayPrompt)
- Replay viewer header (GameReplay)
- Game history entries

**Technical Implementation**:
- `App.tsx` - URL parameter parsing and session storage
- `GameReplay.tsx` - Share button in header
- `ShareReplayPrompt.tsx` - Post-game modal with social sharing

**Security**:
- Replay IDs are public (shareable by design)
- No authentication tokens in URLs
- Server validates replay exists before loading
- Read-only access (no game modification)

### Social Hub
**Location**: `frontend/src/components/SocialHub.tsx`

**Access**: Click "Social" button in GlobalUI (requires authentication)

**Tabs**:
1. **Friends** - Friend list with online status
2. **Achievements** - Unlocked achievements gallery
3. **Recent Players** - Players from last 20 games
4. **Suggestions** - Friend suggestions based on gameplay

**Recent Players Features**:
- **Tracking**: Players from finished games (excludes current user)
- **Metrics**: Last played date, total games together
- **Friend Status**: Shows if already friends
- **Quick Actions**: View profile, Send message, Add friend
- **Real-time Updates**: Refreshes when new games finish

**Backend Implementation** (`backend/src/utils/socialHelpers.ts`):
```typescript
export async function getRecentPlayers(
  username: string,
  limit: number = 20
): Promise<RecentPlayer[]> {
  // Query game_history table
  // Unnest player_names array
  // Filter out current user
  // Check friend status
  // Sort by last_played_at DESC
  // Return with games_together count
}
```

**Friend Suggestions Algorithm**:

**Scoring System** (multi-factor):
1. **Games Together** (+10 points per game) - Players you've played with 3+ times
2. **Mutual Friends** (+20 points per mutual friend) - Friends of your friends (2+ mutual required)
3. **Similar Skill** (+5 points) - Players within 100 ELO points with 5+ games played

**Implementation**:
```typescript
export async function getFriendSuggestions(
  username: string,
  limit: number = 10
): Promise<FriendSuggestion[]> {
  const suggestions: FriendSuggestion[] = [];

  // 1. Get players you've played with (not friends)
  // HAVING COUNT(*) >= 3

  // 2. Get players with mutual friends
  // Self-join friendships table
  // HAVING COUNT(*) >= 2

  // 3. Get players with similar ELO
  // ABS(elo_rating difference) <= 100
  // games_played >= 5

  // Combine and enhance existing suggestions
  // Sort by score DESC
  // Return top N
}
```

**Suggestion Display**:
- **Player Name**: Clickable to view profile
- **Reason**: Why they're suggested (e.g., "Played together 5 times • 3 mutual friends")
- **Score**: Internal relevance score (not shown to user)
- **Quick Actions**: Add Friend, Send Message, View Profile

**Mutual Friends Feature**:
```typescript
export async function getMutualFriends(
  username1: string,
  username2: string
): Promise<string[]> {
  // Find common friends between two players
  // Used to enhance friend suggestions
  // Displayed in player profiles
}
```

**Socket Events**:
- `get_recent_players` - Fetch recent players list
- `get_friend_suggestions` - Fetch friend suggestions
- `get_mutual_friends` - Get mutual friends with another player

**Real-time Events**:
- `recent_players` - Recent players data (server → client)
- `friend_suggestions` - Suggestions data (server → client)
- `mutual_friends` - Mutual friends list (server → client)

**Database Queries**:
- **Recent Players**: Uses `unnest()` on `game_history.player_names` array
- **Friend Suggestions**: Complex query joining game_history and friendships tables
- **Mutual Friends**: Self-join on friendships table

**Authentication Required**:
- Social Hub requires authenticated user (not available for guests)
- Guest users see login prompt when clicking Social button
- All social features tied to user accounts (not temporary player names)

### Unified Chat Component
**Location**: `frontend/src/components/UnifiedChat.tsx`

**Purpose**: Consolidates 3 separate chat systems (team selection, game chat, DMs) into one reusable component

**Display Modes**:
- `panel` - Sidebar panel (e.g., team selection)
- `floating` - Collapsible floating window (e.g., in-game)
- `embedded` - Inline chat area (e.g., lobby)
- `modal` - Full-screen modal (e.g., DM conversations)

**Chat Contexts**:
- `team` - Team selection chat (color-coded by team)
- `game` - In-game chat (betting, playing, scoring)
- `lobby` - Pre-game lobby chat
- `dm` - Direct messages (1-on-1)

**Features**:
- **Quick Emojis**: One-click emoji reactions (👍, 👎, 🔥, 😂, GG, ✨)
- **Emoji Picker**: Full emoji selector (optional)
- **Unread Counter**: Badge showing unread message count
- **Clickable Player Names**: All player names are clickable to view profile
- **Auto-scroll**: Automatically scrolls to latest message
- **Timestamps**: Relative time display (e.g., "2 minutes ago")
- **Character Limit**: 200 character maximum per message
- **Sound Feedback**: Plays sound on message send

**Usage Example**:
```typescript
<UnifiedChat
  mode="floating"
  context="game"
  socket={socket}
  gameId={gameId}
  currentPlayerId={currentPlayerId}
  messages={messages}
  onSendMessage={handleSendMessage}
  onPlayerClick={openPlayerProfile}
  showQuickEmojis={true}
  showEmojiPicker={true}
/>
```

**Integration Status**:
- ✅ Created UnifiedChat component (358 lines)
- 🔲 Refactor TeamSelection to use UnifiedChat
- 🔲 Refactor PlayingPhase to use UnifiedChat for game chat
- 🔲 Consolidate backend chat socket events

### Notification System Integration
**Enhanced in Sprint 16**: Wired achievements and friend requests to notification system

**Achievement Notifications**:
- **Trigger**: When achievement unlocks (`emitAchievementUnlocked()`)
- **Type**: `achievement_unlocked`
- **Title**: "Achievement Unlocked: [Name]"
- **Message**: Achievement description
- **Data**: `{ achievement_id, achievement_name, achievement_description, rarity }`
- **Expiration**: 30 days

**Friend Request Notifications**:
- **Send Notification**:
  - **Trigger**: When friend request sent
  - **Type**: `friend_request`
  - **Title**: "New Friend Request"
  - **Message**: "[PlayerName] sent you a friend request"
  - **Data**: `{ request_id, from_player }`
  - **Expiration**: 30 days

- **Accept Notification**:
  - **Trigger**: When friend request accepted
  - **Type**: `friend_request_accepted`
  - **Title**: "Friend Request Accepted"
  - **Message**: "[PlayerName] accepted your friend request"
  - **Data**: `{ friendship_id, friend_name }`
  - **Expiration**: 7 days

**Implementation**:
- `backend/src/socketHandlers/achievements.ts` - Added `createNotification()` call in `emitAchievementUnlocked()`
- `backend/src/socketHandlers/friends.ts` - Added `createNotification()` calls for send and accept

**Guest User Handling**:
- Notifications only created for authenticated users (have user_id)
- Guest players gracefully skip notification creation (console log only)
- No errors thrown for guest users

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
✅ **Direct Messaging** (1-on-1 conversations, read receipts, soft delete, search, notifications)
✅ **Player Profiles** (quick stats modal, clickable names, avatar system with status indicators)
✅ **Replay Sharing** (deep linking, one-click copy, social media sharing, post-game prompts)
✅ **Social Hub** (unified tabs: friends, achievements, recent players, friend suggestions)
✅ **Friend Suggestions** (multi-factor algorithm: games together, mutual friends, similar ELO)
✅ **Unified Chat Component** (4 modes, 4 contexts, reusable architecture)

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
