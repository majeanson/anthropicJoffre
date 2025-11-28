# Quest System Integration Guide
**Sprint 19: Daily Engagement System**

## Backend Setup (Complete ✅)

1. **Run Database Migration**:
   ```bash
   cd backend
   npm run db:migrate
   ```

   This will create:
   - `quest_templates` table with 10 default quests
   - `player_daily_quests` table
   - `login_streaks` table
   - `daily_rewards_calendar` table (30 days)
   - `player_calendar_progress` table
   - `quest_progress_events` table
   - XP columns in `player_stats` (total_xp, current_level, cosmetic_currency)

2. **Backend Integration** (Already Complete):
   - ✅ Quest game logic (`backend/src/game/quests.ts`)
   - ✅ Quest database operations (`backend/src/db/quests.ts`)
   - ✅ Quest socket handlers (`backend/src/socketHandlers/quests.ts`)
   - ✅ Integrated into game completion flow (`backend/src/index.ts`)
   - ✅ 48 backend tests passing

## Frontend Integration (Components Ready)

### Step 1: Add Imports to `frontend/src/App.tsx`

Add after other component imports (around line 25):

```typescript
// Sprint 19: Quest system components
const DailyQuestsPanel = lazy(() => import('./components/DailyQuestsPanel').then(m => ({ default: m.DailyQuestsPanel })));
const LoginStreakBadge = lazy(() => import('./components/LoginStreakBadge').then(m => ({ default: m.LoginStreakBadge })));
const RewardsCalendar = lazy(() => import('./components/RewardsCalendar').then(m => ({ default: m.RewardsCalendar })));
```

### Step 2: Add State to `frontend/src/App.tsx`

Add after other UI state (around line 150):

```typescript
// Sprint 19: Quest system state
const [showQuestsPanel, setShowQuestsPanel] = useState(false);
const [showRewardsCalendar, setShowRewardsCalendar] = useState(false);
```

### Step 3: Update Login Streak on Connection

Add to the socket connection `useEffect` (search for `socket.on('connect'`):

```typescript
// Update login streak when player connects
if (currentPlayerName && socket) {
  socket.emit('update_login_streak', { playerName: currentPlayerName });
}
```

### Step 4: Add UI Buttons to Lobby

In `frontend/src/components/Lobby.tsx`, add quest buttons to the header or sidebar:

```tsx
{/* Quest System Buttons */}
<div className="flex gap-2">
  <button
    onClick={() => setShowQuestsPanel(true)}
    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all"
  >
    📋 Daily Quests
  </button>

  <button
    onClick={() => setShowRewardsCalendar(true)}
    className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white px-4 py-2 rounded-lg font-semibold transition-all"
  >
    🎁 Rewards Calendar
  </button>
</div>

{/* Login Streak Badge */}
<LoginStreakBadge
  socket={socket}
  playerName={currentPlayerName}
  onClick={() => setShowRewardsCalendar(true)}
/>
```

### Step 5: Add Modals to GlobalUI

In `frontend/src/components/GlobalUI.tsx`:

**A. Add props to interface** (around line 54):

```typescript
interface GlobalUIProps {
  // ... existing props ...
  showQuestsPanel: boolean;
  setShowQuestsPanel: (show: boolean) => void;
  showRewardsCalendar: boolean;
  setShowRewardsCalendar: (show: boolean) => void;
  currentPlayerName: string;
}
```

**B. Add to component props** (around line 77):

```typescript
const GlobalUI: React.FC<GlobalUIProps> = ({
  // ... existing props ...
  showQuestsPanel,
  setShowQuestsPanel,
  showRewardsCalendar,
  setShowRewardsCalendar,
  currentPlayerName,
}) => {
```

**C. Add modals to JSX** (around line 180, after other modals):

```tsx
{/* Sprint 19: Quest System Modals */}
{showQuestsPanel && (
  <Suspense fallback={<div>Loading...</div>}>
    <DailyQuestsPanel
      socket={socket}
      playerName={currentPlayerName}
      isOpen={showQuestsPanel}
      onClose={() => setShowQuestsPanel(false)}
    />
  </Suspense>
)}

{showRewardsCalendar && (
  <Suspense fallback={<div>Loading...</div>}>
    <RewardsCalendar
      socket={socket}
      playerName={currentPlayerName}
      isOpen={showRewardsCalendar}
      onClose={() => setShowRewardsCalendar(false)}
    />
  </Suspense>
)}
```

### Step 6: Pass Props from App.tsx to GlobalUI

In `App.tsx`, find where `<GlobalUI>` is rendered and add the new props:

```tsx
<GlobalUI
  // ... existing props ...
  showQuestsPanel={showQuestsPanel}
  setShowQuestsPanel={setShowQuestsPanel}
  showRewardsCalendar={showRewardsCalendar}
  setShowRewardsCalendar={setShowRewardsCalendar}
  currentPlayerName={currentPlayerName}
/>
```

## Socket Events Reference

### Client → Server

- `get_daily_quests` - Fetch player's daily quests
- `claim_quest_reward` - Claim completed quest reward
- `update_login_streak` - Update streak (call on login)
- `get_login_streak` - Get streak info
- `get_daily_calendar` - Fetch 30-day calendar
- `claim_calendar_reward` - Claim calendar reward
- `get_quest_stats` - Get quest statistics

### Server → Client

- `daily_quests` - Quest data response
- `quest_progress_update` - Real-time progress updates
- `quest_reward_claimed` - Reward claimed confirmation
- `login_streak` - Streak data
- `login_streak_updated` - Streak updated
- `streak_freeze_used` - Freeze notification
- `daily_calendar` - Calendar data
- `calendar_reward_claimed` - Calendar reward confirmation

## Testing

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Quest Flow**:
   - Create game and finish a round
   - Check "Daily Quests" panel - progress should update
   - Complete quest and claim reward
   - Check XP and currency in player stats

4. **Test Login Streak**:
   - Login on consecutive days
   - Check streak badge increments
   - Test freeze mechanic (miss a day)

5. **Test Rewards Calendar**:
   - Open calendar
   - Claim current day reward
   - Check special milestones (days 7, 14, 21, 30)

## Summary

**Backend**: ✅ Complete (1,313 lines + 48 tests)
- Quest game logic with 7 objective types
- PostgreSQL-based persistence (Railway free tier compatible)
- Automatic quest progress tracking
- XP leveling system with exponential curve
- Login streaks with freeze mechanic
- 30-day rewards calendar

**Frontend**: ✅ Components Ready (3 components, 950 lines)
- DailyQuestsPanel - Quest tracking and claiming
- LoginStreakBadge - Streak display with tooltip
- RewardsCalendar - 30-day reward grid

**Integration**: ⏳ Follow steps above to wire up components in App.tsx and GlobalUI.tsx

**Estimated Integration Time**: 15-30 minutes
