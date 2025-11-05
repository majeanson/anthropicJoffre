# 3-Sprint Major Feature Implementation Plan
**Created**: 2025-11-05
**Status**: Ready to implement
**Estimated Timeline**: 50-62 hours across 7 weeks

---

## 🎯 Overview

This document outlines the implementation plan for 3 major feature sprints, carefully designed to **enhance existing features** rather than duplicate them.

### Key Principle: No Duplication
After auditing the codebase, we identified many features already exist. This plan **adapts and enhances** existing components instead of creating duplicates.

---

## ✅ EXISTING FEATURES AUDIT (Do NOT Duplicate)

### Already Implemented - Enhance These Instead:

1. **Social Tab** ✅ - `Lobby.tsx` (lines 39-40: mainTab, socialTab with 'recent'|'online'|'chat')
2. **Global Chat** ✅ - `LobbyChat.tsx` (full implementation with persistence, 200 char limit)
3. **Player Names** ✅ - Tracked and displayed throughout
4. **Player Stats System** ✅ - `PlayerStatsModal.tsx` with 50+ metrics
5. **Leaderboard** ✅ - `GlobalLeaderboard.tsx` with top 100 players, tier badges
6. **Settings System** ✅ - `SettingsContext.tsx` + `SettingsPanel.tsx` (dark mode, sound, autoplay)
7. **Dark Mode** ✅ - Fully implemented with localStorage persistence
8. **Sound System** ✅ - 8 sounds in `sounds.ts`
9. **Online Players** ✅ - Tracked in `App.tsx` (lines 91-97)
10. **Recent Players** ✅ - `recentPlayers.ts` utility

---

## 📋 SPRINT 1: ENHANCED VISUAL FEEDBACK (12-15 hours)

### Goal
Polish the game experience with advanced animations and visual feedback

### Phases

#### Phase 1.1: Advanced Card Hover Effects (2-3 hours)
**Files to Modify:**
- `frontend/src/components/Card.tsx` - Add hover state, lift animation, glow
- `frontend/src/components/PlayingPhase.tsx` - Playable card highlighting
- `frontend/tailwind.config.js` - New animations: `card-glow-pulse`, `card-preview-zoom`, `selection-ring`

**New Components:**
- `frontend/src/components/CardPreview.tsx` - Enlarged card preview on hover

**Features:**
- Hover state tracking with 500ms delay before preview
- Lift animation on hover (scale + translateY)
- Subtle glow for playable cards
- Enlarged card preview popup
- Keyboard navigation visual feedback

**Animation Classes:**
```css
'card-glow-pulse': {
  '0%, 100%': { boxShadow: '0 0 10px rgba(74, 222, 128, 0.4)' },
  '50%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.7)' }
}
```

---

#### Phase 1.2: Play Confirmation Visual (2 hours)
**Files to Modify:**
- `frontend/src/components/PlayingPhase.tsx` - Play confirmation overlay, ghost effect
- `frontend/src/utils/sounds.ts` - Add `playCardConfirm()` with pitch variation
- `frontend/tailwind.config.js` - Animations: `card-play-confirm`, `particle-burst`

**New Components:**
- `frontend/src/components/CardPlayEffect.tsx` - Particle burst effect

**Features:**
- Play confirmation overlay (quick flash)
- Card ghost effect (fading copy remains briefly)
- Particle effects on card play
- Pitch variation based on card value

---

#### Phase 1.3: Trick Winner Celebration (3 hours)
**Files to Modify:**
- `frontend/src/components/PlayingPhase.tsx` - Winner celebration overlay
- `frontend/src/utils/sounds.ts` - Enhance `playTrickWon()`, team-specific sounds
- `frontend/tailwind.config.js` - Animations: `confetti-fall`, `crown-bounce`, `screen-flash`, `trophy-rotate`

**New Components:**
- `frontend/src/components/ConfettiEffect.tsx` - Canvas-based confetti animation
- `frontend/src/components/TrickWinnerBanner.tsx` - Winner announcement banner

**Features:**
- Confetti effect for trick winner (team-colored)
- Crown icon animation
- Screen flash effect
- Winner announcement banner (2s duration)
- Team-specific sound chords

---

#### Phase 1.4: Score Change Animations (2 hours)
**Files to Modify:**
- `frontend/src/components/GameHeader.tsx` - Score change tracking, number counter animation

**New Components:**
- `frontend/src/hooks/useCountUp.ts` - Number counter animation hook

**Features:**
- Number rolling animation (count up/down over 500ms)
- Color flash on score change (green/red)
- Floating +/- indicator
- Previous score tracking with useRef

**Animation Classes:**
```css
'score-counter': number rolling
'score-flash-green': positive change
'score-flash-red': negative change
'plus-minus-float': floating indicator
```

---

#### Phase 1.5: Enhanced Turn Indicators (1.5 hours)
**Files to Modify:**
- `frontend/src/components/PlayingPhase.tsx` - Player spotlight, turn arrow, pulsing border
- `frontend/src/components/BettingPhase.tsx` - Same turn indicator enhancements
- `frontend/tailwind.config.js` - Animations: `turn-pulse`, `spotlight`, `arrow-bounce`

**Features:**
- Player spotlight effect (radial gradient)
- Turn arrow indicator (bouncing)
- Pulsing border around current player
- Sound notification on turn change (yourTurn sound)
- Spotlight shows for 2s when turn starts

---

#### Phase 1.6: Sound Effect Integration Points (1.5 hours)
**Files to Modify:**
- `frontend/src/utils/sounds.ts` - Add 6 new sounds
- `frontend/src/components/BettingPhase.tsx` - Bet placed, skip sounds
- `frontend/src/components/TeamSelection.tsx` - Team switch, start game sounds
- `frontend/src/components/PlayingPhase.tsx` - Invalid card sound
- `frontend/src/components/RoundSummary.tsx` - Round end sound
- `frontend/src/App.tsx` - Game over fanfare

**New Sounds:**
- `betPlaced()` - Coin clink sound
- `betSkipped()` - Skip sound
- `teamSwitch()` - Team selection sound
- `gameStart()` - Game start fanfare
- `gameOver()` - Game end sound
- `error()` - Error/invalid action sound (descending tone)

---

### Testing Strategy for Sprint 1
1. **Manual Testing**: Test all animations in browser (Chrome, Firefox, Safari)
2. **Performance Testing**: Chrome DevTools Performance tab, ensure 60 FPS
3. **Accessibility Testing**: Verify `prefers-reduced-motion` respected
4. **Cross-browser Testing**: Test in Chrome, Firefox, Safari
5. **E2E Tests**: Add visual regression tests for key animations

### Success Metrics
- ✅ Animation frame rate > 60 FPS on desktop, > 30 FPS on mobile
- ✅ No accessibility violations (WCAG AA)
- ✅ No increase in bundle size > 50KB
- ✅ Respects `prefers-reduced-motion`

---

## 🎮 SPRINT 2: SOCIAL GAME FEATURES (10-12 hours)

### Goal
Add achievement system and friends list to increase engagement

---

### Phase 2.1: Achievement System (5-6 hours)

#### Database Changes
```sql
-- New migration: 010_achievements.sql
CREATE TABLE achievements (
  achievement_id SERIAL PRIMARY KEY,
  achievement_key VARCHAR(50) UNIQUE NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL, -- Emoji
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points INTEGER DEFAULT 10,
  is_secret BOOLEAN DEFAULT FALSE
);

CREATE TABLE player_achievements (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  achievement_id INTEGER REFERENCES achievements(achievement_id),
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INTEGER DEFAULT 0, -- For incremental achievements
  UNIQUE(player_name, achievement_id)
);
```

#### Achievement Examples
```typescript
const ACHIEVEMENTS = [
  {
    key: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    tier: 'bronze',
    points: 10
  },
  {
    key: 'perfect_bet',
    name: 'Perfect Prediction',
    description: 'Win a bet with exact points predicted',
    icon: '🎯',
    tier: 'silver',
    points: 25
  },
  {
    key: 'no_trump_master',
    name: 'No Trump Master',
    description: 'Win 10 no-trump bets',
    icon: '👑',
    tier: 'gold',
    points: 50
  },
  {
    key: 'red_zero_hunter',
    name: 'Red Zero Hunter',
    description: 'Collect 50 red zeros',
    icon: '🎯',
    tier: 'silver',
    points: 30
  },
  {
    key: 'comeback_king',
    name: 'Comeback King',
    description: 'Win a game after being down 30+ points',
    icon: '🔥',
    tier: 'platinum',
    points: 100
  }
];
```

#### Files to Create

**Backend:**
- `backend/src/db/migrations/010_achievements.sql` - Database tables
- `backend/src/types/achievements.ts` - TypeScript types
- `backend/src/utils/achievementChecker.ts` - Achievement unlock logic
- `backend/src/db/achievements.ts` - Database queries
- `backend/src/socketHandlers/achievements.ts` - Socket handlers

**Frontend:**
- `frontend/src/types/achievements.ts` - TypeScript types
- `frontend/src/components/AchievementUnlocked.tsx` - Popup notification
- `frontend/src/components/AchievementsPanel.tsx` - Browse achievements
- `frontend/src/components/AchievementCard.tsx` - Individual achievement display

#### WebSocket Events
```typescript
// Server → Client
achievement_unlocked: {
  playerName: string;
  achievement: Achievement;
};

// Client → Server
get_achievements: (playerName: string) => void;
```

#### Features
- 50+ predefined achievements (bronze, silver, gold, platinum tiers)
- Automatic unlock checking on game events
- Animated popup notification with sound
- Achievement showcase in player profile (top 6)
- Progress tracking for incremental achievements
- Secret achievements (hidden until unlocked)

---

### Phase 2.2: Friends List System (4-5 hours)

#### Database Changes
```sql
-- New migration: 011_friends_system.sql
CREATE TABLE friendships (
  friendship_id SERIAL PRIMARY KEY,
  player1_name VARCHAR(255) NOT NULL,
  player2_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  UNIQUE(player1_name, player2_name),
  CHECK (player1_name < player2_name) -- Prevent duplicate entries
);

CREATE TABLE game_invitations (
  invitation_id SERIAL PRIMARY KEY,
  game_id VARCHAR(255) NOT NULL,
  from_player VARCHAR(255) NOT NULL,
  to_player VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 minutes'
);
```

#### Files to Create

**Backend:**
- `backend/src/db/migrations/011_friends_system.sql` - Database tables
- `backend/src/types/social.ts` - TypeScript types
- `backend/src/db/friends.ts` - Database queries
- `backend/src/socketHandlers/friends.ts` - Socket handlers

**Frontend:**
- `frontend/src/types/social.ts` - TypeScript types
- `frontend/src/components/FriendsPanel.tsx` - Friends list sidebar
- `frontend/src/components/FriendRequestNotification.tsx` - Popup notification
- `frontend/src/components/GameInvitationModal.tsx` - Invite friends to game
- `frontend/src/components/InvitationToast.tsx` - Game invitation notification

#### WebSocket Events
```typescript
// Client → Server
send_friend_request: (data: { fromPlayer: string; toPlayer: string }) => void;
accept_friend_request: (data: { friendshipId: number }) => void;
send_game_invitation: (data: { gameId: string; fromPlayer: string; toPlayer: string }) => void;
get_friends_list: (playerName: string) => void;

// Server → Client
friend_request_received: { fromPlayer: string; friendshipId: number };
friend_request_accepted: { playerName: string };
game_invitation_received: { gameId: string; fromPlayer: string; invitationId: number };
friends_list: { friends: string[]; onlineFriends: OnlinePlayer[] };
```

#### Features
- Send/accept friend requests
- View friends list with online status (green dot)
- Invite friends to active games
- Game invitation toasts with "Join" button
- Friend count displayed in social tab
- Block/remove friends

---

### Testing Strategy for Sprint 2
1. **Unit Tests**:
   - Test achievement unlock conditions
   - Test friend request lifecycle
2. **Integration Tests**:
   - Test achievement unlock across multiple games
   - Test friend invitation flow
3. **E2E Tests**:
   - Test achievement unlock and display
   - Test friend request and game invitation

### Success Metrics
- ✅ 80% of players unlock at least one achievement
- ✅ Average 3+ friends per active user
- ✅ Achievement unlock response time < 500ms
- ✅ Friend request delivery < 1 second

---

## 👥 SPRINT 3: ENHANCED SOCIAL & PERSISTENCE (28-35 hours)

### Goal
Add user accounts, enhance existing profile/chat/settings systems

### Key Strategy: ENHANCE EXISTING COMPONENTS
- **PlayerStatsModal** → Add avatars, profile editing
- **LobbyChat** → Add mentions, reactions, moderation
- **SettingsContext/Panel** → Add more granular options

---

### Phase 3.1: User Authentication System (8-10 hours)

#### Database Changes
```sql
-- New migration: 012_user_authentication.sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]{3,50}$')
);

CREATE TABLE password_resets (
  reset_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  reset_token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_verifications (
  verification_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  verification_token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upgrade existing sessions table
ALTER TABLE game_sessions ADD COLUMN user_id INTEGER REFERENCES users(user_id);
ALTER TABLE game_sessions ADD COLUMN refresh_token VARCHAR(255);
ALTER TABLE game_sessions ADD COLUMN expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days';
```

#### Dependencies to Add
```json
// backend/package.json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.7",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/nodemailer": "^6.4.14"
  }
}
```

#### Files to Create

**Backend:**
- `backend/src/db/migrations/012_user_authentication.sql`
- `backend/src/types/auth.ts` - User, AuthTokens types
- `backend/src/utils/authHelpers.ts` - Password hashing, JWT generation
- `backend/src/db/users.ts` - User CRUD operations
- `backend/src/socketHandlers/auth.ts` - Auth socket handlers
- `backend/src/api/auth.ts` - REST auth endpoints

**REST Endpoints:**
```typescript
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
POST /api/auth/logout - Logout user
POST /api/auth/refresh - Refresh access token
POST /api/auth/verify-email - Verify email with token
POST /api/auth/request-password-reset - Request password reset
POST /api/auth/reset-password - Reset password with token
GET /api/auth/me - Get current user info
```

**Frontend:**
- `frontend/src/types/auth.ts`
- `frontend/src/contexts/AuthContext.tsx` - Auth state management
- `frontend/src/components/LoginModal.tsx`
- `frontend/src/components/RegisterModal.tsx`
- `frontend/src/components/PasswordResetModal.tsx`
- `frontend/src/components/EmailVerificationBanner.tsx`

#### Security Features
- ✅ bcrypt password hashing (10 salt rounds)
- ✅ JWT tokens (15min access + 7day refresh)
- ✅ Email verification required
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ Password requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CSRF protection for REST endpoints

#### Authentication Flow
1. Register → email verification sent
2. Verify email → account activated
3. Login → access token + refresh token stored
4. Auto-refresh before expiry
5. Logout → clear tokens

---

### Phase 3.2: Enhance Player Profiles (5-6 hours)

**Strategy**: ENHANCE EXISTING `PlayerStatsModal.tsx` component

#### Database Changes
```sql
-- New migration: 013_user_profiles.sql
CREATE TABLE user_profiles (
  profile_id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(user_id),
  bio TEXT,
  country VARCHAR(2), -- ISO country code
  favorite_team INTEGER CHECK (favorite_team IN (1, 2)),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only', 'private')),
  show_online_status BOOLEAN DEFAULT TRUE,
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
  preference_id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(user_id),
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_volume DECIMAL(3,2) DEFAULT 0.30,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Avatar System (Option B - Simpler)
- Use pre-designed avatars (50+ emoji-based or illustrated)
- Store avatar URL to CDN or local `/avatars` folder
- No upload/processing needed
- Categories: Animals, Objects, Abstract, Characters

#### Files to Modify
- `frontend/src/components/PlayerStatsModal.tsx` - Add profile editing tab
- `backend/src/db/profiles.ts` - NEW FILE - Profile queries

#### Files to Create
- `frontend/src/components/AvatarSelector.tsx` - Avatar grid selector
- `frontend/src/components/ProfileEditor.tsx` - Edit profile form
- `frontend/public/avatars/` - 50+ avatar images (64x64 PNG)

#### Enhanced PlayerStatsModal Tabs
1. **Stats Tab** (existing) - Keep as is
2. **Achievements Tab** (new) - Top achievements showcase
3. **Profile Tab** (new) - Edit bio, avatar, country, favorite team
4. **History Tab** (enhanced) - Better game history UI (see Phase 3.3)

#### Profile Features
- Avatar selector (grid of 50 avatars)
- Bio (max 200 chars)
- Country dropdown
- Favorite team selector (1 or 2)
- Privacy settings (public, friends only, private)
- Show online status toggle
- Allow friend requests toggle

---

### Phase 3.3: Enhance Match History UI (3-4 hours)

**Strategy**: ENHANCE EXISTING `PlayerStatsModal.tsx` history tab

#### Files to Modify
- `frontend/src/components/PlayerStatsModal.tsx` - Enhance history tab

#### Files to Create
- `frontend/src/components/MatchCard.tsx` - Individual match card
- `frontend/src/components/MatchStatsModal.tsx` - Detailed match stats
- `frontend/src/hooks/useMatchHistory.ts` - Match history hook

#### Enhanced History Tab Features
- **Match Cards**: Visual cards showing win/loss, score, teams, date
- **Filters**: Win/Loss, Date range, Game mode
- **Sort**: Date, Score, Duration
- **Infinite Scroll**: Load 20 at a time
- **Click Match**: Open detailed stats modal
- **View Replay**: Button to open GameReplay component

#### Match Card Design
```tsx
<div className="match-card">
  <div className="header">
    {isWin ? '✓ WIN' : '✕ LOSS'}
    <span>{formatDate(created_at)}</span>
  </div>

  <div className="teams">
    <div>Team 1: {team1_score}</div>
    <div>VS</div>
    <div>Team 2: {team2_score}</div>
  </div>

  <div className="stats">
    <span>Rounds: {rounds}</span>
    <span>Tricks: {tricks_won}</span>
    <span>Points: {points_earned}</span>
  </div>

  <button>View Replay</button>
</div>
```

---

### Phase 3.4: Enhance Lobby Chat (4-5 hours)

**Strategy**: ENHANCE EXISTING `LobbyChat.tsx` component

#### Database Changes
```sql
-- New migration: 014_global_chat.sql
-- Add index for global chat
CREATE INDEX IF NOT EXISTS idx_chat_global ON chat_messages(room_type, created_at DESC)
WHERE room_type = 'lobby';

-- Chat moderation
CREATE TABLE chat_bans (
  ban_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  banned_by_user_id INTEGER REFERENCES users(user_id),
  reason TEXT,
  banned_until TIMESTAMP,
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Files to Modify
- `frontend/src/components/LobbyChat.tsx` - Add mentions, reactions, links
- `backend/src/socketHandlers/chat.ts` - Add profanity filter, rate limiting

#### New Features to Add
1. **User Mentions**: @username highlighting
2. **Emoji Reactions**: React to messages with 👍👎❤️😂
3. **Message Links**: Clickable URLs
4. **Profanity Filter**: Backend filter for inappropriate words
5. **Report/Block**: Right-click message to report
6. **Unread Counter**: Show unread count badge
7. **Message Timestamps**: Better time formatting
8. **Online Status**: Green dot next to online users in chat

#### Enhanced UI
```tsx
// Message with reactions
<div className="message">
  <div className="content">
    <span className="username">{playerName}</span>
    <span className="message-text">{parseMessage(message)}</span> {/* Parse @mentions and links */}
  </div>
  <div className="reactions">
    <button>👍 2</button>
    <button>❤️ 1</button>
    <button className="add-reaction">+</button>
  </div>
</div>
```

---

### Phase 3.5: Notification System (5-6 hours)

#### Database Changes
```sql
-- New migration: 015_notifications.sql
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link_url VARCHAR(500), -- Optional link
  icon VARCHAR(10), -- Emoji
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

#### Notification Types
```typescript
type NotificationType =
  | 'friend_request'      // Someone sent you a friend request
  | 'friend_accepted'     // Someone accepted your friend request
  | 'game_invitation'     // Friend invited you to a game
  | 'achievement_unlocked' // You unlocked an achievement
  | 'level_up'           // ELO tier changed
  | 'system';            // System announcement
```

#### Files to Create

**Backend:**
- `backend/src/db/migrations/015_notifications.sql`
- `backend/src/db/notifications.ts` - Notification CRUD
- `backend/src/utils/notificationHelpers.ts` - Send notifications

**Frontend:**
- `frontend/src/contexts/NotificationContext.tsx` - Notification state
- `frontend/src/components/NotificationBell.tsx` - Bell icon with badge
- `frontend/src/components/NotificationDropdown.tsx` - Dropdown list
- `frontend/src/components/NotificationItem.tsx` - Single notification

#### Features
- Real-time notifications via Socket.io
- Toast popup for new notifications
- Notification center dropdown (bell icon in header)
- Unread badge counter
- Mark as read on click
- "Mark all as read" button
- Filter by type
- Optional email notifications

#### NotificationBell Component
```tsx
<button onClick={() => setIsOpen(!isOpen)}>
  <BellIcon />
  {unreadCount > 0 && (
    <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
  )}
</button>
```

---

### Phase 3.6: Enhance Settings System (3-4 hours)

**Strategy**: ENHANCE EXISTING `SettingsContext.tsx` + `SettingsPanel.tsx`

#### Files to Modify
- `frontend/src/contexts/SettingsContext.tsx` - Add more settings
- `frontend/src/components/SettingsPanel.tsx` - Expand to tabbed interface

#### New Settings to Add

**General Tab:**
- ✅ Dark Mode (already exists)
- Language selector (en, es, fr)
- Reduce Motion toggle
- Timezone selector

**Audio Tab:**
- ✅ Sound Enabled (already exists)
- Master Volume slider (0-100%)
- Music toggle (for future background music)
- Chat notification sounds toggle

**Notifications Tab:**
- Enable notifications toggle
- Email notifications toggle
- Friend request notifications
- Game invitation notifications
- Achievement notifications

**Privacy Tab:**
- Profile visibility (public, friends only, private)
- Show online status
- Allow friend requests

**Gameplay Tab:**
- ✅ Autoplay (already exists)
- Auto-ready (ready up after round ends)
- Show card tips
- Confirm card play
- Keyboard shortcuts enabled

#### Enhanced SettingsPanel UI
```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="audio">Audio</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
    <TabsTrigger value="privacy">Privacy</TabsTrigger>
    <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
  </TabsList>

  <TabsContent value="general">
    {/* Settings items */}
  </TabsContent>
</Tabs>
```

#### Persistence Strategy
1. **Logged Out**: Settings saved to localStorage only
2. **Logged In**: Settings synced to database + localStorage
3. **On Login**: Merge localStorage with database (database wins)
4. **On Change**: Update localStorage (instant) + database (debounced 500ms)

---

### Testing Strategy for Sprint 3
1. **Security Testing**:
   - Test password hashing
   - Test JWT token expiry/refresh
   - Test SQL injection attempts
   - Test XSS attacks in chat
2. **Integration Tests**:
   - Test auth flow (register → verify → login → refresh)
   - Test notification delivery across sessions
   - Test settings sync across devices
3. **E2E Tests**:
   - Test complete user journey
   - Test global chat enhancements
   - Test profile editing

### Success Metrics
- ✅ Authentication: 95% success rate on login/register
- ✅ Profiles: 70% of users customize their profile
- ✅ Notifications: 90% delivered within 1 second
- ✅ Settings: 80% of users change at least one setting

---

## 📊 IMPLEMENTATION ORDER & TIMELINE

### Week 1-2: Sprint 1 (Visual Polish)
1. Card hover effects (2-3h)
2. Play confirmations (2h)
3. Trick celebrations (3h)
4. Score animations (2h)
5. Turn indicators (1.5h)
6. Sound integration (1.5h)

### Week 3: Sprint 2 (Social Features)
1. Achievement system (5-6h)
2. Friends list (4-5h)

### Week 4-7: Sprint 3 (Authentication & Enhancements)
1. User authentication (8-10h) - MUST BE FIRST
2. Enhance PlayerStatsModal profiles (5-6h)
3. Enhance PlayerStatsModal history (3-4h)
4. Enhance LobbyChat (4-5h)
5. Notification system (5-6h)
6. Enhance SettingsContext/Panel (3-4h)

**Total: 50-62 hours across 7 weeks**

---

## 🚀 CODE QUALITY CHECKLIST

Before marking each phase complete:
- [ ] TypeScript types defined for all new structures
- [ ] Backend and frontend types synchronized
- [ ] Database migrations versioned and tested
- [ ] Socket.io events documented in CLAUDE.md
- [ ] Unit tests written for backend logic
- [ ] E2E tests cover critical user flows
- [ ] Accessibility tested (keyboard, screen readers)
- [ ] Performance tested (no lag, smooth animations)
- [ ] Code follows existing patterns (see CLAUDE.md)
- [ ] No console errors in browser

---

## 🎨 UI/UX DESIGN PRINCIPLES

Following existing codebase patterns:

1. **Color Palette**: Use existing Tailwind colors (parchment, crimson, umber, forest, sapphire)
2. **Animations**: Use existing keyframes in `tailwind.config.js`
3. **Modal Pattern**: Use `UnifiedModal` or `ModalContainer` components
4. **Toast Pattern**: Use existing `Toast` component
5. **Dark Mode**: Always support both light and dark modes
6. **Responsive**: Mobile-first design, test all screen sizes
7. **Accessibility**: Test IDs, aria labels, keyboard navigation
8. **Component Size**: Keep components < 300 lines
9. **Memoization**: Use `useMemo` for expensive calculations
10. **Custom Hooks**: Extract reusable logic into hooks

---

## 🛡️ RISK ASSESSMENT

### High-Risk Items
1. **User Authentication Security** - Use proven libraries, security audit
2. **Animation Performance** - Respect prefers-reduced-motion, GPU-accelerated CSS
3. **Database Migrations** - Backup before migrations, rollback plan

### Medium-Risk Items
4. **Settings Sync Conflicts** - Database is source of truth
5. **Chat Moderation** - Rate limiting, profanity filter, ban system
6. **Notification Delivery** - Socket.io acknowledgements, database fallback

---

## 📝 NOTES

- **User accounts are optional**: Players can still play without registering (current behavior preserved)
- **All enhancements are additive**: No breaking changes to existing functionality
- **Progressive enhancement**: Features gracefully degrade if auth not available
- **Mobile-first**: All new features work on mobile devices

---

## ✅ NEXT STEPS

1. Begin Sprint 1 Phase 1: Advanced Card Hover Effects
2. Create feature branch: `git checkout -b sprint1-visual-feedback`
3. Follow TDD workflow from `docs/technical/TDD_WORKFLOW.md`
4. Update this document as implementation progresses

---

**Last Updated**: 2025-11-05
**Document Version**: 1.0
**Status**: ✅ Ready for implementation
