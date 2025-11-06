# App.tsx Refactoring Strategy

**Current Status**: 1,142 lines (needs splitting)
**Target**: ~300 lines (orchestration only)
**Complexity**: HIGH - Many interconnected state variables and effects
**Risk Level**: MEDIUM-HIGH (core application file)

---

## 📊 Current Structure Analysis

### File Statistics
- **Total Lines**: 1,142
- **Imports**: 36 lines
- **State Variables**: ~25 useState hooks
- **Socket Listeners**: 13 event handlers
- **Socket Emitters**: 19 emit calls
- **useEffect Hooks**: ~15 effects
- **Callbacks**: ~10 useCallback functions

### Concerns Handled in App.tsx

1. **Socket Connection** (partially extracted to `useSocketConnection`)
2. **Game State Management** (partially extracted to `useGameState`)
3. **Bot AI Integration** (partially extracted to `useBotManagement`)
4. **Chat Messages** (extracted to `useChatMessages`)
5. **Authentication** (uses `useAuth`)
6. **Notifications** (uses `useNotifications`)
7. **Toast Messages** (extracted to `useToast`)
8. **Audio/Sound Effects** ⚠️ Needs extraction
9. **Autoplay Mode** ⚠️ Needs extraction
10. **Debug Mode** ⚠️ Needs extraction
11. **UI State** (modals, panels) ⚠️ Needs consolidation
12. **URL Parameters** (auto-join) ⚠️ Needs extraction
13. **Achievement Notifications** ⚠️ Partially handled
14. **Friend Requests** ⚠️ Partially handled
15. **Spectator Mode** ⚠️ Needs extraction

---

## 🎯 Refactoring Goals

### Phase 1: Low-Risk Extractions (Completed Partially)

✅ **useAudioManager** (completed in this session)
- Sound on/off toggle
- Game over sound
- Error sound
- LocalStorage persistence

🔲 **useAutoplay** (future)
- Autoplay toggle
- Bot decision making when enabled
- Turn detection
- Auto-action timeouts

🔲 **useDebugMode** (future)
- Debug panel state
- Test panel state
- Debug menu state
- Debug controls

### Phase 2: Medium-Risk Extractions

🔲 **useSocketEventHandlers** (future)
- Consolidate all socket.on listeners
- Provide clean handler registration
- Automatic cleanup on unmount

```typescript
// Target API
const handlers = useSocketEventHandlers({
  onAchievementUnlocked: (data) => { /* ... */ },
  onFriendRequest: (data) => { /* ... */ },
  onError: (error) => { /* ... */ },
  // ... 10+ more handlers
});

// Auto-registers and cleans up
```

🔲 **useGameEmitters** (future)
- Wrapper for all socket.emit calls
- Type-safe emitters
- Loading states

```typescript
const emitters = useGameEmitters(socket, gameId);

// Usage
emitters.placeBet(amount, withoutTrump);
emitters.playCard(card);
emitters.startGame();
```

### Phase 3: High-Risk Extractions

🔲 **useGameOrchestration** (future, complex)
- Coordinate between hooks
- Handle interdependencies
- Manage complex state transitions

**Warning**: This is the hardest part - many state variables depend on each other

---

## 🛠️ Implementation Plan

### Step 1: Create useAutoplay Hook (2-3 hours)

**Extract**:
```typescript
// From App.tsx lines ~550-635
const [autoplayEnabled, setAutoplayEnabled] = useState(false);
const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const lastAutoActionRef = useRef<{ message: string; timestamp: number } | null>(null);

useEffect(() => {
  // Autoplay logic when it's player's turn
}, [phase, currentPlayerIndex, currentPlayerId, autoplayEnabled]);
```

**To**: `hooks/useAutoplay.ts`
```typescript
export function useAutoplay({
  enabled,
  gameState,
  socket,
  playerId,
  onAction
}: UseAutoplayProps): UseAutoplayReturn {
  // Encapsulate all autoplay logic
  return {
    autoplayEnabled,
    toggleAutoplay,
    isAutoplayActive,
  };
}
```

---

### Step 2: Create useDebugMode Hook (1-2 hours)

**Extract**:
```typescript
// From App.tsx lines ~72-77
const [debugMode] = useState<boolean>(false);
const [debugPanelOpen, setDebugPanelOpen] = useState<boolean>(false);
const [testPanelOpen, setTestPanelOpen] = useState<boolean>(false);
const [debugMenuOpen, setDebugMenuOpen] = useState<boolean>(false);
```

**To**: `hooks/useDebugMode.ts`
```typescript
export function useDebugMode(): UseDebugModeReturn {
  return {
    debugMode: false, // Always false in production
    debugPanelOpen,
    testPanelOpen,
    debugMenuOpen,
    toggleDebugPanel,
    toggleTestPanel,
    toggleDebugMenu,
  };
}
```

---

### Step 3: Consolidate UI State (2-3 hours)

**Current**: Scattered across App.tsx
- `showBotManagement`
- `showFriendsPanel`
- `showAchievementsPanel`
- `showReplayModal`
- `showCatchUpModal`
- `debugInfoOpen`
- `botTakeoverModal`

**Target**: `hooks/useUIState.ts`
```typescript
export function useUIState(): UseUIStateReturn {
  const [panels, setPanels] = useState({
    botManagement: false,
    friends: false,
    achievements: false,
    replay: false,
    catchUp: false,
    debugInfo: false,
    botTakeover: null,
  });

  return {
    panels,
    openPanel: (name: keyof typeof panels) => { /* ... */ },
    closePanel: (name: keyof typeof panels) => { /* ... */ },
    togglePanel: (name: keyof typeof panels) => { /* ... */ },
  };
}
```

---

### Step 4: Extract Socket Event Handlers (3-4 hours)

**Current**: 13 handlers inline in useEffect
```typescript
useEffect(() => {
  if (!socket) return;

  socket.on('achievement_unlocked', handleAchievementUnlocked);
  socket.on('friend_request_received', handleFriendRequestReceived);
  // ... 11 more handlers

  return () => {
    socket.off('achievement_unlocked', handleAchievementUnlocked);
    socket.off('friend_request_received', handleFriendRequestReceived);
    // ... 11 more cleanup calls
  };
}, [socket, /* dependencies */]);
```

**Target**: `hooks/useSocketEventHandlers.ts`
```typescript
export function useSocketEventHandlers({
  socket,
  handlers,
}: UseSocketEventHandlersProps) {
  useEffect(() => {
    if (!socket) return;

    // Auto-register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Auto-cleanup
    return () => {
      Object.keys(handlers).forEach(event => {
        socket.off(event);
      });
    };
  }, [socket, handlers]);
}
```

---

### Step 5: Extract Socket Emitters (2-3 hours)

**Current**: 19 inline emit calls
```typescript
const handlePlaceBet = (amount: number, withoutTrump: boolean) => {
  if (!socket || !gameId) return;
  socket.emit('place_bet', { gameId, amount, withoutTrump, skipped: false });
};
```

**Target**: `hooks/useGameEmitters.ts`
```typescript
export function useGameEmitters(socket: Socket | null, gameId: string | null) {
  return useMemo(() => ({
    placeBet: (amount: number, withoutTrump: boolean, skipped = false) => {
      if (!socket || !gameId) return;
      socket.emit('place_bet', { gameId, amount, withoutTrump, skipped });
    },
    playCard: (card: Card) => {
      if (!socket || !gameId) return;
      socket.emit('play_card', { gameId, card });
    },
    // ... 17 more emitters
  }), [socket, gameId]);
}
```

---

### Step 6: Final App.tsx Structure (Target)

**After all extractions** (~300 lines):

```typescript
function AppContent() {
  // 1. Authentication
  const { user, isAuthenticated } = useAuth();

  // 2. Socket connection
  const { socket, reconnecting, error } = useSocketConnection();

  // 3. Core game state
  const { gameState, gameId } = useGameState({ socket });

  // 4. Feature hooks
  const audio = useAudioManager({ gameState });
  const autoplay = useAutoplay({ gameState, socket });
  const debug = useDebugMode();
  const ui = useUIState();
  const bots = useBotManagement(socket, gameId, gameState);
  const chat = useChatMessages({ socket });
  const notifications = useNotifications();

  // 5. Socket events (auto-registered)
  useSocketEventHandlers({
    socket,
    handlers: {
      achievement_unlocked: handleAchievement,
      friend_request_received: handleFriendRequest,
      // ... all handlers
    },
  });

  // 6. Game emitters
  const game = useGameEmitters(socket, gameId);

  // 7. Render
  return (
    <ErrorBoundary>
      {/* Simplified JSX */}
    </ErrorBoundary>
  );
}
```

---

## ⚠️ Risks and Mitigation

### Risk 1: State Dependencies

**Problem**: Many state variables depend on each other

**Example**:
```typescript
// gameState affects autoplay
// autoplay affects bot spawning
// bot spawning affects gameState
// Circular dependency!
```

**Mitigation**:
- Extract one hook at a time
- Test thoroughly after each extraction
- Use clear prop drilling if needed
- Document dependencies

---

### Risk 2: Breaking Autoplay

**Problem**: Autoplay has complex timing and turn detection logic

**Mitigation**:
- Create comprehensive tests first
- Keep original code commented out
- Test with Quick Play (1 human + 3 bots)
- Monitor for double-actions or missed actions

---

### Risk 3: Socket Listener Cleanup

**Problem**: Missing cleanup can cause memory leaks

**Mitigation**:
- Use TypeScript to enforce cleanup
- Add ESLint rule for useEffect cleanup
- Test with React DevTools Profiler
- Monitor for duplicate event handlers

---

## 📝 Testing Checklist

After each extraction:

- [ ] Full game play through (local)
- [ ] Quick Play with 3 bots
- [ ] Autoplay mode (if affected)
- [ ] Reconnection flow
- [ ] Sound effects
- [ ] Debug mode (if affected)
- [ ] Mobile responsiveness
- [ ] Memory leak check (DevTools)
- [ ] E2E test: `04-game-flow.spec.ts`

---

## 🔄 Rollback Strategy

If refactoring introduces bugs:

1. **Immediate**: Revert commit
2. **Investigation**: Identify broken hook
3. **Fix Forward**: Patch the hook
4. **Future**: Extract smaller pieces

**Always commit each hook extraction separately**

---

## 📅 Recommended Timeline

### Sprint 4: Audio & Autoplay (5-6 hours)
- [x] useAudioManager (completed this session)
- [ ] useAutoplay
- [ ] useDebugMode

### Sprint 5: Socket Management (5-6 hours)
- [ ] useSocketEventHandlers
- [ ] useGameEmitters
- [ ] Consolidate error handling

### Sprint 6: UI State & Final Cleanup (3-4 hours)
- [ ] useUIState
- [ ] Clean up App.tsx to ~300 lines
- [ ] Update documentation
- [ ] Comprehensive testing

**Total Estimated Time**: 13-16 hours

---

## 🎯 Success Criteria

- [x] App.tsx under 400 lines (currently 1,142)
- [ ] All hooks under 200 lines
- [ ] Zero duplicate event listeners
- [ ] No memory leaks
- [ ] All E2E tests passing
- [ ] Performance unchanged or improved
- [ ] Bundle size same or smaller

---

## 📚 References

- **Current App.tsx**: `frontend/src/App.tsx` (1,142 lines)
- **Existing Hooks**: `frontend/src/hooks/`
  - ✅ `useSocketConnection.ts` (147 lines)
  - ✅ `useGameState.ts` (274 lines)
  - ✅ `useBotManagement.ts` (387 lines)
  - ✅ `useChatMessages.ts` (45 lines)
  - ✅ `useToast.ts` (48 lines)
  - ✅ `useNotifications.ts` (100 lines)
  - ✅ `useConnectionQuality.ts` (112 lines)
  - ✅ `useAuth.ts` (from AuthContext)
  - ✅ `useAudioManager.ts` (NEW - 80 lines)

---

## 💡 Key Learnings

1. **Don't rush large refactorings** - App.tsx is complex for a reason
2. **Extract incrementally** - One hook at a time, test thoroughly
3. **Keep original working** - Comment out, don't delete
4. **Dependencies matter** - Map them before extracting
5. **Test autoplay heavily** - It's the most fragile system

---

*Created: 2025-11-06*
*Status: Strategy Documented, useAudioManager Complete*
*Next: useAutoplay extraction (Sprint 4)*
