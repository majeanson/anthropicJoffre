# Feature Plan: Side Bets, Card Animations & Themed Environments

## Overview

This plan covers three interconnected feature sets:
1. **Side Betting System** - Players and spectators can bet coins on game outcomes
2. **Card Animations** - Enhanced visual feedback for card plays
3. **Themed Environments** - Immersive table backgrounds with ambient effects

---

## 1. SIDE BETTING SYSTEM

### Concept
Players and spectators can place coin bets on various game outcomes. Bets can be:
- **Preset bets** (auto-resolved): "Who wins red 0?", "Final score over/under X", "Player wins X+ tricks"
- **Custom bets** (manually resolved): Free-text bets like "Marc plays trump first trick"

### Database Schema

```sql
CREATE TABLE side_bets (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    bet_type VARCHAR(50) NOT NULL,  -- 'preset' or 'custom'
    preset_type VARCHAR(50),         -- 'red_zero_winner', 'total_score', 'tricks_won', etc.
    custom_description TEXT,         -- For custom bets
    creator_name VARCHAR(255) NOT NULL,
    acceptor_name VARCHAR(255),      -- NULL until accepted
    amount INT NOT NULL,
    prediction VARCHAR(255),         -- The bet prediction value
    target_player VARCHAR(255),      -- Who the bet is about (if applicable)
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'active', 'resolved', 'cancelled'
    result BOOLEAN,                  -- NULL until resolved
    resolved_by VARCHAR(20),         -- 'auto' or 'manual'
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);
```

### Preset Bet Types (Auto-Resolved)

| Type | Description | Resolution Trigger |
|------|-------------|-------------------|
| `red_zero_winner` | Which team wins the red 0 | Trick containing red 0 resolves |
| `brown_zero_victim` | Which team takes brown 0 | Trick containing brown 0 resolves |
| `tricks_over_under` | Player wins ≥X tricks | Round end |
| `team_score_over_under` | Team scores ≥X points | Round end |
| `bet_made` | Betting team makes their bet | Round end |
| `without_trump_success` | "Without trump" bet succeeds | Round end |
| `first_trump_played` | Who plays first trump card | First trump played |

### Socket Events

```typescript
// Client → Server
'create_side_bet': { gameId, betType, presetType?, customDescription?, amount, prediction?, targetPlayer? }
'accept_side_bet': { gameId, betId }
'cancel_side_bet': { gameId, betId }
'resolve_custom_bet': { gameId, betId, creatorWon: boolean }  // For manual resolution

// Server → Client
'side_bet_created': { bet: SideBet }
'side_bet_accepted': { betId, acceptorName }
'side_bet_resolved': { betId, result, winnerName, coinsAwarded }
'side_bet_cancelled': { betId }
'side_bets_list': { bets: SideBet[] }  // On join/reconnect
```

### UI Components

1. **Side Bets Panel** (collapsible, right side of game area)
   - "Create Bet" button opens modal
   - List of open bets (can accept)
   - List of active bets (waiting for resolution)
   - Coin balance display

2. **Create Bet Modal**
   - Toggle: Preset / Custom
   - Preset: Dropdown of bet types, amount slider
   - Custom: Text input for description, amount slider

3. **Bet Resolution Toast**
   - Shows when bet resolves with coin animation
   - Green/red based on win/loss

### Implementation Steps

1. Create database table and migration
2. Add `SideBet` types to `backend/src/types/game.ts`
3. Create `backend/src/socketHandlers/sideBets.ts` with handlers
4. Add coin balance update logic (use transaction pattern from quests.ts)
5. Create `frontend/src/components/SideBetsPanel.tsx`
6. Create `frontend/src/components/CreateBetModal.tsx`
7. Add bet resolution logic to `trick_resolved` and `round_ended` handlers
8. Add spectator subscription to side bet events

---

## 2. CARD ANIMATIONS

### Phase 1: Card Play Animation

**Current**: Cards appear instantly in trick area
**Enhanced**: Cards animate from player hand to trick position

```css
@keyframes card-fly-to-trick {
  0% {
    transform: translate(var(--start-x), var(--start-y)) rotate(var(--start-rotation)) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
}
```

**Implementation**:
- Track card source position on play
- Apply animation class with CSS custom properties
- Duration: `var(--duration-normal)` (350ms default)

### Phase 2: Trick Collection Animation

**Current**: Trick disappears, cards reset
**Enhanced**: Cards slide toward winner, then fade/shrink

```css
@keyframes trick-collect {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  70% {
    transform: translate(var(--winner-x), var(--winner-y)) scale(0.6);
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--winner-x), var(--winner-y)) scale(0);
    opacity: 0;
  }
}
```

### Phase 3: Special Card Effects

| Card | Effect |
|------|--------|
| **Red 0** | Golden glow + sparkle particles on play |
| **Brown 0** | Dark aura + subtle shake |
| **Trump 7** | Crown icon flash above card |
| **Any trump** | Subtle colored border pulse |

### Phase 4: Deal Animation

**On round start**: Cards fly from deck position to hand one-by-one

```css
@keyframes card-deal-to-hand {
  0% {
    transform: translate(var(--deck-x), var(--deck-y)) rotateY(180deg) scale(0.5);
    opacity: 0;
  }
  100% {
    transform: translate(0, 0) rotateY(0deg) scale(1);
    opacity: 1;
  }
}
```

**Staggered timing**: Each card delayed by 80ms

### Implementation Steps

1. Add new keyframes to `index.css`
2. Create `useCardAnimation` hook for position tracking
3. Modify `PlayingPhase.tsx` to use animation classes
4. Add particle effect component (CSS-based or Canvas)
5. Add sounds.ts integration for animation sync
6. Respect `prefers-reduced-motion` and settings toggle

---

## 3. THEMED ENVIRONMENTS

### Concept
Each UI skin gets an optional "environment" - an animated background that creates atmosphere beyond just colors.

### Environment Types

| Skin | Environment | Effects |
|------|-------------|---------|
| **Midnight Alchemy** | Wizard's study | Floating candles, drifting dust particles, occasional magic sparkle |
| **Tavern Noir** | Smoky bar | Slow smoke wisps, distant rain on windows, candlelight flicker |
| **Luxury Casino** | VIP room | Subtle gold sparkles, velvet curtain sway, chandelier light |
| **Cyberpunk Neon** | Hacker den | Rain on glass, neon sign flicker, data streams |
| **Classic Parchment** | Library | Dust motes, page flutter shadows, warm sunbeam |

### Technical Approach

**Option A: CSS-Only (Recommended for v1)**
- Use `::before` and `::after` pseudo-elements on game container
- Animated gradients for ambient lighting
- CSS particles using multiple box-shadows
- Keyframe animations for movement

```css
[data-skin="midnight-alchemy"] .game-environment::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 30%),
    radial-gradient(circle at 80% 20%, rgba(139, 90, 43, 0.1) 0%, transparent 30%);
  animation: ambient-glow 8s ease-in-out infinite;
  pointer-events: none;
}
```

**Option B: Canvas Layer (For complex effects)**
- Particle system using requestAnimationFrame
- More control over particle behavior
- Higher performance cost

### Implementation Steps

1. Add `.game-environment` wrapper div to PlayingPhase
2. Create environment CSS per skin in `index.css`
3. Add `environmentEnabled` toggle to settings
4. Create particle pseudo-elements with staggered animations
5. Add ambient sound option (rain, fire crackle, etc.)
6. Test performance on mobile

---

## Priority Order

### Sprint A: Foundation (1-2 days)
1. ✅ Database table for side bets
2. ✅ Basic socket events for create/accept/cancel
3. ✅ Coin balance checks and updates
4. ✅ Simple side bets UI panel

### Sprint B: Side Bets Complete (2-3 days)
1. Preset bet auto-resolution logic
2. Custom bet manual resolution UI
3. Spectator betting support
4. Bet history in player stats

### Sprint C: Card Animations (2-3 days)
1. Card play fly animation
2. Trick collection animation
3. Special card effects (red 0, brown 0)
4. Deal animation sequence

### Sprint D: Environments (1-2 days)
1. CSS-based ambient effects per skin
2. Settings toggle for environments
3. Performance optimization
4. Optional ambient sounds

---

## Questions to Resolve

1. **Bet limits**: Min 1 coin, max 100 coins per bet? Or percentage of balance?
2. **Spectator betting**: Same pool as players, or separate "spectator pot"?
3. **Custom bet disputes**: If creator and acceptor disagree, refund both?
4. **Animation toggle**: Single "animations" setting, or granular (cards/environment/particles)?
5. **Mobile performance**: Disable environments on mobile by default?

---

## Files to Create/Modify

### New Files
- `backend/src/db/sideBets.ts`
- `backend/src/socketHandlers/sideBets.ts`
- `frontend/src/components/SideBetsPanel.tsx`
- `frontend/src/components/CreateBetModal.tsx`
- `frontend/src/hooks/useCardAnimation.ts`

### Modified Files
- `backend/src/db/schema.sql` - Add side_bets table
- `backend/src/index.ts` - Register sideBets handlers
- `backend/src/types/game.ts` - Add SideBet types
- `frontend/src/index.css` - Add new animations
- `frontend/src/components/PlayingPhase.tsx` - Animation integration
- `frontend/src/config/skins.ts` - Add environment config per skin
- `frontend/src/contexts/SettingsContext.tsx` - Environment toggle
