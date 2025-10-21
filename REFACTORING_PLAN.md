# Refactoring Plan

## Analysis
**Largest Components:**
1. App.tsx (1126 lines) - Socket logic, state, handlers
2. PlayingPhase.tsx (806 lines) - Game board, cards, UI
3. Lobby.tsx (541 lines) - Lobby, tabs, forms
4. TeamSelection.tsx (387 lines) - Team selection

## Refactoring Strategy

### Phase 1: Create Context Providers (2-3 hours)

**1. SocketContext**
- Location: `frontend/src/contexts/SocketContext.tsx`
- Provides: socket, reconnecting state
- Benefits: Remove socket prop drilling

**2. GameContext**  
- Location: `frontend/src/contexts/GameContext.tsx`
- Provides: gameState, gameId, isSpectator
- Benefits: Centralize game state

**3. SettingsContext**
- Location: `frontend/src/contexts/SettingsContext.tsx`
- Provides: soundEnabled, darkMode, autoplay
- Benefits: User preferences in one place

### Phase 2: Extract Components from App.tsx (2-3 hours)

**Extract:**
- GlobalUI → `components/GlobalUI.tsx` (reconnecting banner, toast, catch-up modal)
- DebugControls → `components/DebugControls.tsx`
- Bot management logic → `hooks/useBotPlayers.ts`
- Socket event listeners → `hooks/useSocketEvents.ts`

**Result:** App.tsx reduced from 1126 → ~400 lines

### Phase 3: Extract Components from PlayingPhase.tsx (2 hours)

**Extract:**
- GameBoard → `components/GameBoard.tsx` (circular card layout)
- PlayerHand → `components/PlayerHand.tsx` (player's cards)
- ScoreDisplay → `components/ScoreDisplay.tsx` (team scores panel)
- TrickArea → `components/TrickArea.tsx` (center trick cards)
- ActionBar → `components/ActionBar.tsx` (buttons at bottom)

**Result:** PlayingPhase.tsx reduced from 806 → ~300 lines

### Phase 4: Extract Components from Lobby.tsx (1 hour)

**Extract:**
- RecentPlayersTab → `components/RecentPlayersTab.tsx`
- OnlinePlayersTab → `components/OnlinePlayersTab.tsx`
- LobbyForms → Split into CreateGameForm, JoinGameForm, SpectateGameForm

**Result:** Lobby.tsx reduced from 541 → ~250 lines

### Phase 5: Add New Features (4-6 hours)

After refactoring, add:
1. AFK/Timeout Detection UI
2. Rematch System
3. Dark Mode

## Implementation Order

1. ✅ Create contexts (SocketContext, GameContext, SettingsContext)
2. ✅ Create hooks (useBotPlayers, useSocketEvents)
3. ✅ Extract App.tsx components
4. ✅ Extract PlayingPhase components
5. ✅ Extract Lobby components  
6. ✅ Add TimeoutIndicator
7. ✅ Add RematchVoting
8. ✅ Add DarkModeToggle
9. ✅ Test all functionality
10. ✅ Run E2E tests

## Testing Strategy

- After each refactor step, run `npm run build`
- After all refactoring, run full E2E test suite
- Verify no logic changes, only structure
- All tests must pass

