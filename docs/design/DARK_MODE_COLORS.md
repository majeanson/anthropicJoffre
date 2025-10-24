# Dark Mode Color System

This document outlines the comprehensive dark mode color system used across all components in the Jaffre card game application.

## Design Philosophy

1. **Semi-transparent team colors** - Use `/40` or `/70` opacity for team-colored elements to maintain visual identity while reducing brightness
2. **Lighter text on dark backgrounds** - Use 200-300 range colors for readability (e.g., `orange-200`, `purple-300`)
3. **Consistent grays** - Use gray-600 to gray-900 range for dark mode backgrounds and borders
4. **Preserve interactive elements** - Keep button gradients (blue, green, etc.) at full opacity for clear call-to-action

## Color Patterns by Element Type

### Main Backgrounds

**Light Mode → Dark Mode**
- `from-parchment-50 to-parchment-100` → `dark:from-gray-800 dark:to-gray-900`
- `from-parchment-400 to-parchment-500` → `dark:from-gray-800 dark:to-gray-900`
- `bg-parchment-50` → `dark:bg-gray-800`
- `bg-parchment-100` → `dark:bg-gray-700`
- `bg-parchment-200` → `dark:bg-gray-700`
- `bg-white` → `dark:bg-gray-800`

### Team 1 (Orange) Colors

**Backgrounds**
- `bg-orange-50` → `dark:bg-orange-900/40`
- `bg-orange-100` → `dark:bg-orange-900/40`
- `from-orange-50 to-orange-100` → `dark:from-orange-900/40 dark:to-orange-800/40`
- `bg-orange-100/90` (bet display) → `dark:bg-orange-900/70`

**Borders**
- `border-orange-200` → `dark:border-orange-600`
- `border-orange-300` → `dark:border-orange-600`
- `border-orange-400` → `dark:border-orange-600` or `dark:border-orange-700`

**Text**
- `text-orange-800` (titles) → `dark:text-orange-200`
- `text-orange-700` (labels) → `dark:text-orange-300`
- `text-orange-600` (scores) → `dark:text-orange-300`
- `text-orange-900` (player names) → `dark:text-orange-200`
- `text-orange-800` (bet display) → `dark:text-orange-200`

### Team 2 (Purple) Colors

**Backgrounds**
- `bg-purple-50` → `dark:bg-purple-900/40`
- `bg-purple-100` → `dark:bg-purple-900/40`
- `from-purple-50 to-purple-100` → `dark:from-purple-900/40 dark:to-purple-800/40`
- `bg-purple-100/90` (bet display) → `dark:bg-purple-900/70`

**Borders**
- `border-purple-200` → `dark:border-purple-600`
- `border-purple-300` → `dark:border-purple-600`
- `border-purple-400` → `dark:border-purple-600` or `dark:border-purple-700`

**Text**
- `text-purple-800` (titles) → `dark:text-purple-200`
- `text-purple-700` (labels) → `dark:text-purple-300`
- `text-purple-600` (scores) → `dark:text-purple-300`
- `text-purple-900` (player names) → `dark:text-purple-200`
- `text-purple-800` (bet display) → `dark:text-purple-200`

### Neutral/Gray Colors

**Backgrounds**
- `from-gray-50 to-gray-100` → `dark:from-gray-700 dark:to-gray-800`
- `bg-parchment-50` → `dark:bg-gray-700` or `dark:bg-gray-800`

**Borders**
- `border-parchment-400` → `dark:border-gray-600` or `dark:border-gray-500`
- `border-gray-200` → `dark:border-gray-600`
- `border-amber-700` → `dark:border-gray-600` (main modal borders)

**Text**
- `text-umber-900` (primary) → `dark:text-gray-100`
- `text-umber-800` (secondary) → `dark:text-gray-200`
- `text-umber-700` (tertiary) → `dark:text-gray-300`
- `text-umber-600` (muted) → `dark:text-gray-400`
- `text-gray-800` → `dark:text-gray-200`
- `text-gray-700` → `dark:text-gray-300`
- `text-gray-600` → `dark:text-gray-400`

### Special Accent Colors

**Blue/Info**
- `from-blue-50 to-purple-50` → `dark:from-blue-900/40 dark:to-purple-900/40`
- `text-blue-600` → `dark:text-blue-300`
- `border-blue-200` → `dark:border-blue-600`

**Amber/Yellow (Highlights)**
- `from-amber-50 to-yellow-50` → `dark:from-amber-900/40 dark:to-yellow-900/40`
- `border-amber-200` → `dark:border-amber-600`

**Chat Panel**
- `bg-parchment-50` (panel) → `dark:bg-gray-800`
- `bg-parchment-100` (messages area) → `dark:bg-gray-700`
- `from-amber-700 to-amber-800` (header) → `dark:from-gray-700 dark:to-gray-900`
- `border-amber-700` → `dark:border-gray-600`

### Interactive Elements (Buttons)

**Primary Actions** - Keep full opacity for visibility:
- Blue gradient buttons: No dark mode change (remain vibrant)
- Green gradient buttons: No dark mode change
- Purple gradient buttons: No dark mode change

**Secondary/Inactive Buttons**:
- `bg-parchment-200` → `dark:bg-gray-700`
- `hover:bg-parchment-300` → `dark:hover:bg-gray-600`

## Component-Specific Applications

### Lobby.tsx
- Main modal: `dark:from-gray-800 dark:to-gray-900`, `dark:border-gray-600`
- Decorative corners: `dark:border-gray-500`
- Tab buttons (inactive): `dark:bg-gray-700`
- Tab content panel: `dark:bg-gray-700`, `dark:border-gray-600`
- Recent/Online player cards: `dark:bg-gray-700`, `dark:border-gray-500`

### TeamSelection.tsx
- Main container: `dark:from-gray-800 dark:to-gray-900`
- Chat messages (Team 1): `dark:bg-orange-900/40`, `dark:border-orange-600`
- Chat messages (Team 2): `dark:bg-purple-900/40`, `dark:border-purple-600`

### PlayingPhase.tsx
- Main background: `dark:from-gray-800 dark:to-gray-900`
- Bet display badges: `dark:bg-orange-900/70` or `dark:bg-purple-900/70`
- Bet display text: `dark:text-orange-200` or `dark:text-purple-200`

### ScoringPhase.tsx
- Timer panel: `dark:from-blue-900/40 dark:to-purple-900/40`
- Team score cards: `dark:bg-orange-900/40` and `dark:bg-purple-900/40`
- Round summary: `dark:from-gray-700 dark:to-gray-800`
- Team summary cards: `dark:bg-orange-900/40` and `dark:bg-purple-900/40`
- Round highlights: `dark:from-amber-900/40 dark:to-yellow-900/40`

### Leaderboard.tsx
- Modal background: `dark:bg-gray-800`
- Team standings: `dark:from-orange-900/40 dark:to-orange-800/40` and `dark:from-purple-900/40 dark:to-purple-800/40`
- Player cards within teams: `dark:bg-gray-700`
- Current bet section: `dark:from-gray-700 dark:to-gray-800`
- Round history cards: `dark:bg-gray-700`
- Trick history: `dark:bg-gray-800`

### ChatPanel.tsx
- Panel background: `dark:bg-gray-800`
- Header: `dark:from-gray-700 dark:to-gray-900`
- Messages area: `dark:bg-gray-700`
- Team messages: `dark:bg-orange-900/40` or `dark:bg-purple-900/40`
- Input field: `dark:bg-gray-800`, `dark:border-gray-500`

### RematchVoting.tsx
- Main panel: `dark:from-gray-800 dark:to-gray-900`

## Testing Checklist

When adding new components or modifying existing ones, verify:

- [ ] Main background has dark variant
- [ ] All borders have dark variants
- [ ] All text has sufficient contrast (200-300 range for colored text)
- [ ] Team colors use semi-transparent backgrounds (/40 or /70)
- [ ] Interactive elements (buttons) remain visible
- [ ] Hover states work in dark mode
- [ ] Empty states have readable text

## Quick Reference Table

| Element Type | Light Mode | Dark Mode | Opacity |
|--------------|-----------|-----------|---------|
| Main bg | `parchment-50/100` | `gray-800/900` | Solid |
| Team 1 bg | `orange-50/100` | `orange-900/800` | /40 |
| Team 2 bg | `purple-50/100` | `purple-900/800` | /40 |
| Team 1 text | `orange-800/700` | `orange-200/300` | Solid |
| Team 2 text | `purple-800/700` | `purple-200/300` | Solid |
| Borders | `parchment-400` | `gray-600` | Solid |
| Primary text | `umber-900` | `gray-100` | Solid |
| Secondary text | `umber-700` | `gray-300` | Solid |

---

*Last updated: 2025-01-20*
*Note: All color values use Tailwind CSS class names*
