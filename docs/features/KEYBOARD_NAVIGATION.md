# Keyboard Navigation - Game Boy Style Controls

**Task 10 - Phase 2: Accessibility Improvements**

The entire application can be controlled using only the keyboard, providing a Game Boy-style experience for all game phases and UI interactions.

## Overview

- **Complete keyboard-only control** - No mouse required
- **Visual focus indicators** - Always know what's selected
- **Contextual shortcuts** - Different shortcuts for each game phase
- **Help modal** - Press `?` anywhere to view all shortcuts
- **Sound feedback** - Audio cues for navigation actions

## Global Shortcuts

Available everywhere in the application:

| Key | Action | Context |
|-----|--------|---------|
| `?` | Show keyboard shortcuts help modal | All phases |
| `Escape` | Close modals / Go back / Clear focus | All phases |
| `Tab` | Navigate forward through interactive elements | All phases |
| `Shift` + `Tab` | Navigate backward through interactive elements | All phases |

## Lobby Phase

### Tab Navigation

| Key | Action |
|-----|--------|
| `←` Arrow Left | Switch to previous tab (Settings → Stats → Social → Play) |
| `→` Arrow Right | Switch to next tab (Play → Social → Stats → Settings) |

### Button Navigation

| Key | Action |
|-----|--------|
| `↑` Arrow Up | Navigate to previous button in current tab |
| `↓` Arrow Down | Navigate to next button in current tab |
| `Enter` | Activate the focused button |
| `Escape` | Clear button focus |

### Tab-Specific Shortcuts

**Play Tab:**
- Quick navigation to:
  - Rejoin Game (if available)
  - Create Game
  - Browse Games
  - Quick Play

**Social Tab:**
- Navigate between sub-tabs:
  - Online Players
  - Lobby Chat
  - Recent Players
- Navigate to "Join" buttons for online players

**Stats Tab:**
- Navigate to:
  - My Stats
  - Leaderboard
  - Recent Games

**Settings Tab:**
- Navigate to:
  - How to Play
  - Debug Panel

## Team Selection Phase

| Key | Action |
|-----|--------|
| `1` | Select Team 1 (Orange) |
| `2` | Select Team 2 (Purple) |
| `←` Arrow Left | Navigate to previous player |
| `→` Arrow Right | Navigate to next player |
| `Space` | Swap positions with selected player |
| `s` | Start game (when all players ready) |

**ARIA Support:**
- Swap buttons include descriptive labels
- Kick buttons include player names
- Team change warnings for cross-team swaps

## Betting Phase

| Key | Action |
|-----|--------|
| `↑` Arrow Up | Increase bet amount |
| `↓` Arrow Down | Decrease bet amount |
| `←` Arrow Left | Toggle "without trump" option |
| `→` Arrow Right | Toggle "without trump" option |
| `t` | Toggle "without trump" option |
| `Enter` | Place bet |
| `s` | Skip bet (when allowed) |
| `Escape` | Skip bet (when allowed) |

**Smart Validation:**
- Visual feedback for invalid bets
- Real-time bet comparison with current highest
- Dealer privilege indicators

## Playing Phase - Game Boy Style!

### Card Selection

| Key | Action |
|-----|--------|
| `←` Arrow Left | Select previous card in hand |
| `→` Arrow Right | Select next card in hand |
| `↑` Arrow Up | Highlight selected card (visual lift) |
| `Tab` | Cycle through playable cards |

### Card Playing

| Key | Action |
|-----|--------|
| `Enter` | Play the selected card |
| `Space` | Play the selected card (alternative) |

### Quick Play (Number Keys)

| Key | Action |
|-----|--------|
| `1` | Play 1st card in hand |
| `2` | Play 2nd card in hand |
| `3` | Play 3rd card in hand |
| `4` | Play 4th card in hand |
| `5` | Play 5th card in hand |
| `6` | Play 6th card in hand |
| `7` | Play 7th card in hand |
| `8` | Play 8th card in hand |

### Other Actions

| Key | Action |
|-----|--------|
| `p` | Toggle previous trick view |
| `Escape` | Clear card selection |

**Visual Indicators:**
- Selected card: Blue ring + lift animation
- Playable cards: Normal state
- Unplayable cards: Gray overlay with ✕ mark
- Current turn: Green "(Your Turn)" text

## Implementation Details

### Architecture

**Hook:** `frontend/src/hooks/useKeyboardNavigation.ts`
- Context-aware shortcut registration
- Automatic cleanup on unmount
- Focus index management
- List navigation helpers

**Modal:** `frontend/src/components/KeyboardShortcutsModal.tsx`
- Press `?` to open
- Phase-aware highlighting
- Organized by game phase
- Pro tips section

**Integration:** `frontend/src/App.tsx`
- Global `?` key listener
- Lazy-loaded modal
- Error boundary wrapped

### Phase-Specific Implementations

**Lobby:** `frontend/src/components/Lobby.tsx:114-186`
```typescript
// Tab navigation with Arrow Left/Right
// Button navigation with Arrow Up/Down
// Activate with Enter
// Clear focus with Escape
```

**Playing:** `frontend/src/components/PlayingPhase/PlayerHand.tsx:148-223`
```typescript
// Arrow Left/Right: navigate cards
// Tab: cycle through playable cards
// Enter/Space: play selected card
// 1-9: quick play card by position
// Escape: clear selection
```

**Betting:** `frontend/src/components/BettingPhase.tsx:114-153`
```typescript
// Arrow Up/Down: adjust bet amount
// Arrow Left/Right: toggle without trump
// Enter: place bet
// S/Escape: skip bet
```

### Accessibility Features

1. **Input Protection:**
   - Shortcuts disabled when typing in input fields
   - Checks for `INPUT`, `TEXTAREA`, `contentEditable`

2. **Visual Feedback:**
   - Focus rings on selected elements
   - Lift animations for cards
   - Color-coded state indicators

3. **Sound Effects:**
   - Button click sounds for navigation
   - Card deal sounds for selection
   - Card play sounds for actions

4. **Screen Reader Support:**
   - ARIA labels on all interactive elements
   - Descriptive button text
   - Contextual warnings (team changes, etc.)

## Best Practices

### For Developers

1. **Always prevent default** for keyboard shortcuts:
   ```typescript
   if (e.key === 'ArrowUp') {
     e.preventDefault(); // Prevent page scroll
     // Handle action
   }
   ```

2. **Check input context** before handling shortcuts:
   ```typescript
   const target = e.target as HTMLElement;
   if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
     return; // Don't intercept typing
   }
   ```

3. **Provide visual feedback** for all keyboard actions:
   ```typescript
   // Play sound
   sounds.buttonClick();

   // Update visual state
   setFocusIndex(newIndex);
   ```

4. **Clean up event listeners:**
   ```typescript
   useEffect(() => {
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [handleKeyDown]);
   ```

### For Users

1. **Press `?` anytime** to see all available shortcuts
2. **Use Tab/Shift+Tab** for standard navigation
3. **Use arrow keys** for Game Boy-style control
4. **Use number keys** for quick actions
5. **Press Escape** to go back or clear selections

## Testing

### Manual Testing Checklist

- [ ] Can navigate all lobby tabs with arrow keys
- [ ] Can navigate all buttons with arrow keys
- [ ] Can activate buttons with Enter
- [ ] Can select cards with arrow keys in playing phase
- [ ] Can play cards with Enter/Space
- [ ] Can quick-play cards with number keys
- [ ] Can adjust bets with arrow keys
- [ ] Can skip bets with S/Escape
- [ ] Can open help modal with `?`
- [ ] Can close modals with Escape
- [ ] Shortcuts don't interfere with input fields
- [ ] Visual feedback appears for all actions
- [ ] Sound effects play for navigation

### E2E Testing

See `e2e/tests/` for keyboard navigation test suites:
- Lobby keyboard navigation
- Playing phase keyboard navigation
- Betting phase keyboard navigation
- Modal keyboard shortcuts

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (on-screen keyboard)

**Note:** Some shortcuts may conflict with browser shortcuts (e.g., `Ctrl+T`). Always test in target browsers.

## Future Enhancements

Potential improvements for future sprints:

1. **Custom keybindings** - Allow users to configure their own shortcuts
2. **Vim mode** - Optional hjkl navigation
3. **Gamepad support** - Real Game Boy controller support
4. **Voice commands** - Accessibility for users who can't use keyboard
5. **Touch gestures** - Swipe controls for mobile

## Resources

- **Keyboard Navigation Hook:** `frontend/src/hooks/useKeyboardNavigation.ts`
- **Shortcuts Modal:** `frontend/src/components/KeyboardShortcutsModal.tsx`
- **Implementation Examples:**
  - Lobby: `frontend/src/components/Lobby.tsx:114-186`
  - Playing: `frontend/src/components/PlayingPhase/PlayerHand.tsx:148-223`
  - Betting: `frontend/src/components/BettingPhase.tsx:114-153`

---

**Last Updated:** November 2025
**Task:** Task 10 - Phase 2: Keyboard Navigation
**Status:** ✅ Complete
