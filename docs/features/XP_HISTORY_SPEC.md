# XP History/Log Feature Specification

## Status: Planned (Not Yet Implemented)

## Overview
Track and display XP earning history for players, showing when and how they earned XP.

## Database Changes Required

### New Table: `xp_history`
```sql
CREATE TABLE xp_history (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,  -- 'game_won', 'round_won', 'trick_won', etc.
  xp_amount INTEGER NOT NULL,
  currency_amount INTEGER DEFAULT 0,
  game_id UUID,                      -- Optional link to game
  round_number INTEGER,              -- Optional round context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (player_name) REFERENCES player_stats(player_name),
  INDEX idx_xp_history_player (player_name),
  INDEX idx_xp_history_date (created_at)
);
```

## Backend Changes

### 1. Update `awardGameEventReward()` in `skins.ts`
- After awarding XP, insert record into `xp_history`

### 2. New API Endpoint
```typescript
GET /api/xp-history/:playerName
Query params:
  - limit (default: 50)
  - offset (default: 0)
  - startDate (optional)
  - endDate (optional)

Response:
{
  history: [
    {
      id: number,
      eventType: string,
      xpAmount: number,
      currencyAmount: number,
      gameId: string | null,
      roundNumber: number | null,
      createdAt: string
    }
  ],
  total: number,
  hasMore: boolean
}
```

### 3. Socket Event (Optional)
```typescript
// Emit to player when XP is earned
socket.emit('xp_earned', {
  eventType: 'round_won',
  xpAmount: 25,
  currencyAmount: 2,
  timestamp: Date.now()
});
```

## Frontend Changes

### 1. XP History Component
- Display in player profile modal
- Show recent XP earnings with icons
- Filter by date range
- Pagination support

### 2. UI Design
```
╭──────────────────────────────────────╮
│ XP History                    View All│
├──────────────────────────────────────┤
│ ✨ +25 XP   Round Won     2 min ago  │
│ 🎯 +5 XP    Trick Won     3 min ago  │
│ 🎯 +5 XP    Trick Won     3 min ago  │
│ 🏆 +150 XP  Game Won      1 hour ago │
│ 💎 +15 XP   Red Zero      1 hour ago │
╰──────────────────────────────────────╯
```

## Implementation Priority
- Low priority - nice-to-have feature
- Can be implemented after core XP system is stable

## Dependencies
- Database migration system
- Player profile modal (already exists)
- XP reward system (already exists)
