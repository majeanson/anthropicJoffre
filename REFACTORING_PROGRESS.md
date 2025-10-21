# Refactoring Progress

## ✅ Completed (Phase 1)

### Context Providers Created
1. **SocketContext** (`contexts/SocketContext.tsx`)
   - Manages WebSocket connection
   - Provides `useSocket()` hook
   - Handles reconnection state

2. **GameContext** (`contexts/GameContext.tsx`)
   - Manages game state, gameId, isSpectator
   - Provides `useGame()` hook
   - Centralizes game-related state

3. **SettingsContext** (`contexts/SettingsContext.tsx`)
   - Manages sound, dark mode, autoplay, debug settings
   - Provides `useSettings()` hook
   - Persists to localStorage
   - **Dark mode ready!**

### Configuration
- ✅ Tailwind dark mode enabled (`darkMode: 'class'`)
- ✅ All contexts build successfully

---

## 🚧 Remaining Work

### Phase 2: Extract Components & Hooks (Next Steps)

**Step 1: Wrap App.tsx with Providers**
```tsx
// In main.tsx or App.tsx
<SocketProvider>
  <GameProvider>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </GameProvider>
</SocketProvider>
```

**Step 2: Replace App.tsx state with context hooks**
- Replace `socket` state → `const { socket } = useSocket()`
- Replace `gameState` → `const { gameState, setGameState } = useGame()`
- Replace settings → `const { darkMode, soundEnabled, etc } = useSettings()`

**Step 3: Extract Components**
- Extract GlobalUI (ReconnectingBanner, Toast, CatchUpModal)
- Extract DebugControls (debug menu, test panel, state panel)

**Step 4: Create Hooks**
- `useBotPlayers.ts` - Bot management logic
- `useSocketEvents.ts` - Socket event listeners
- `useTimeout.ts` - Timeout countdown logic

**Step 5: Integrate New Features**
- Add TimeoutIndicator component
- Add RematchVoting component
- Add DarkModeToggle button

---

## 📝 Implementation Guide

### Quick Integration (2-3 hours)

**Option 1: Minimal Integration**
Just wrap providers and use hooks in existing components:
- Update `main.tsx` to wrap with providers
- Replace state with hooks in App.tsx
- Add DarkModeToggle to settings
- Done!

**Option 2: Full Refactoring** (8-12 hours)
- Complete all extraction from REFACTORING_PLAN.md
- Create all custom hooks
- Reduce App.tsx from 1126 → 400 lines
- Reduce PlayingPhase from 806 → 300 lines

### New Features (After Integration)

1. **Timeout UI** (30 min)
   - Create TimeoutIndicator component
   - Listen to timeout events from backend
   - Display countdown with warnings

2. **Rematch System** (4 hours)
   - Backend: Vote tracking
   - Frontend: Rematch UI on game over
   - Socket events: vote_rematch, rematch_started

3. **Dark Mode Toggle** (30 min)
   - Button in settings/debug menu
   - Uses SettingsContext (already done!)
   - Add dark: classes to components

---

## 🎯 Recommended Next Step

**QUICK WIN: Add Dark Mode Toggle (30 min)**

Since SettingsContext is ready with dark mode support:

1. Add toggle button anywhere (e.g., in Lobby or debug menu):
```tsx
const { darkMode, setDarkMode } = useSettings();

<button onClick={() => setDarkMode(!darkMode)}>
  {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
</button>
```

2. Start adding `dark:` classes to components:
```tsx
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
```

That's it! Dark mode will work immediately.

---

## 📊 Status Summary

**Completed**: Context providers, Tailwind dark mode config, Backend timeout system  
**Ready**: Dark mode toggle, Settings persistence  
**Next**: Wrap App with providers OR add dark mode toggle  
**Remaining**: Full component extraction (optional, 8-12 hours)

