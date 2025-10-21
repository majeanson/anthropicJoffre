# Light Mode Color System

This document outlines the comprehensive light mode color system used across all components in the Jaffre card game application.

## Design Philosophy

1. **Warm parchment theme** - Uses parchment and umber colors to create a vintage card game aesthetic
2. **Team identity through color** - Orange for Team 1, Purple for Team 2
3. **Clear visual hierarchy** - Darker text on lighter backgrounds for readability
4. **Vibrant interactive elements** - Bold gradient buttons for clear call-to-action

## Color Palette

### Custom Parchment Colors
- **parchment-50**: Very light cream/beige (lightest backgrounds)
- **parchment-100**: Light cream/beige (card backgrounds, panels)
- **parchment-200**: Medium cream/beige (secondary backgrounds)
- **parchment-400**: Darker cream/tan (borders, accents)
- **parchment-500**: Tan (main game board background)

### Custom Umber Colors
- **umber-500**: Medium brown (overlays)
- **umber-600**: Dark brown (headers)
- **umber-700**: Very dark brown (secondary text)
- **umber-800**: Darker brown (primary headings)
- **umber-900**: Darkest brown (primary text, borders)

### Team Colors

**Team 1 (Orange)**
- **orange-50**: Very light orange (backgrounds)
- **orange-100**: Light orange (card backgrounds)
- **orange-200**: Medium-light orange (borders)
- **orange-300**: Medium orange (accents)
- **orange-400**: Vibrant orange (borders, highlights)
- **orange-500**: Strong orange (primary team color)
- **orange-600**: Dark orange (scores, large text)
- **orange-700**: Very dark orange (labels, secondary text)
- **orange-800**: Darkest orange (titles, headings)
- **orange-900**: Ultra-dark orange (player names)

**Team 2 (Purple)**
- **purple-50**: Very light purple (backgrounds)
- **purple-100**: Light purple (card backgrounds)
- **purple-200**: Medium-light purple (borders)
- **purple-300**: Medium purple (accents)
- **purple-400**: Vibrant purple (borders, highlights)
- **purple-500**: Strong purple (primary team color)
- **purple-600**: Dark purple (scores, large text)
- **purple-700**: Very dark purple (labels, secondary text)
- **purple-800**: Darkest purple (titles, headings)
- **purple-900**: Ultra-dark purple (player names)

### Accent Colors

**Blue (Information, Links)**
- **blue-50**: Very light blue (info panels)
- **blue-200**: Light blue (borders)
- **blue-400**: Medium blue (hover states)
- **blue-500**: Strong blue (buttons)
- **blue-600**: Dark blue (primary buttons)
- **blue-700**: Darker blue (button hover)
- **blue-800**: Very dark blue (button borders)

**Green (Success, Ready States)**
- **green-100**: Very light green (success backgrounds)
- **green-300**: Light green (borders)
- **green-500**: Strong green (ready states, positive scores)
- **green-600**: Dark green (success buttons)
- **green-700**: Darker green (button hover)
- **green-800**: Very dark green (button borders)

**Yellow/Amber (Highlights, Warnings)**
- **amber-50**: Very light amber (highlight backgrounds)
- **amber-200**: Light amber (highlight borders)
- **amber-600**: Medium amber (decorative accents)
- **amber-700**: Dark amber (main borders, brown card color)
- **yellow-50**: Very light yellow (highlight backgrounds)
- **yellow-300**: Light yellow (statistic borders)
- **yellow-400**: Vibrant yellow (winner rings)
- **yellow-600**: Dark yellow (star icons)

**Red/Crimson (Errors, Negative States)**
- **red-500**: Strong red (errors, negative scores)
- **red-600**: Dark red (special card effects)
- **crimson-100**: Light crimson (error backgrounds)
- **crimson-600**: Dark crimson (leave button)
- **crimson-700**: Darker crimson (button hover)
- **crimson-800**: Very dark crimson (error text, borders)

**Forest Green (Success, Bet Made)**
- **forest-100**: Light forest green (success backgrounds)
- **forest-400**: Medium forest green (success borders)
- **forest-600**: Dark forest green (previous trick button)
- **forest-700**: Darker forest green (bet made text)
- **forest-800**: Very dark forest green (button hover)

**Sapphire (Special Accents)**
- **sapphire-100**: Light sapphire (info backgrounds)
- **sapphire-300**: Medium sapphire (borders)
- **sapphire-500**: Strong sapphire (sound button)
- **sapphire-800**: Dark sapphire (info text)

## Color Patterns by Element Type

### Main Backgrounds

**Page/Screen Backgrounds**
- `bg-gradient-to-br from-parchment-50 to-parchment-100` - Main modal backgrounds
- `bg-gradient-to-br from-parchment-400 to-parchment-500` - Game board background
- `bg-gradient-to-br from-purple-900 to-pink-900` - Scoring phase background
- `bg-purple-50` - Simple page backgrounds

**Panel/Card Backgrounds**
- `bg-parchment-50` - Light panels, cards
- `bg-parchment-100` - Medium panels, message areas
- `bg-parchment-200` - Secondary panels, inactive tabs
- `bg-white` - Bright panels, stat cards

### Team 1 (Orange) Colors

**Backgrounds**
- `bg-gradient-to-br from-orange-50 to-orange-100` - Team standings cards
- `bg-orange-50` - Team score panels, summary cards
- `bg-orange-100` - Chat messages, bet displays (with /90 opacity)

**Borders**
- `border-orange-200` - Light borders (team cards)
- `border-orange-300` - Medium borders (summary panels)
- `border-orange-400` - Strong borders (highlights, led suit indicators)
- `border-orange-700` - Dark borders (player cards within team)
- `border-orange-800` - Very dark borders (button borders)

**Text**
- `text-orange-500` - Round points display
- `text-orange-600` - Large score numbers, round deltas
- `text-orange-700` - Labels, small text, secondary info
- `text-orange-800` - Section titles, player team labels
- `text-orange-900` - Player names, primary text

**Gradients (Buttons/Interactive)**
- `from-orange-500 to-orange-700` - Player name badges
- `from-orange-500 to-orange-600` - Active turn indicator

### Team 2 (Purple) Colors

**Backgrounds**
- `bg-gradient-to-br from-purple-50 to-purple-100` - Team standings cards
- `bg-purple-50` - Team score panels, summary cards
- `bg-purple-100` - Chat messages, bet displays (with /90 opacity)

**Borders**
- `border-purple-200` - Light borders (team cards)
- `border-purple-300` - Medium borders (summary panels)
- `border-purple-400` - Strong borders (highlights, led suit indicators)
- `border-purple-700` - Dark borders (player cards within team)
- `border-purple-800` - Very dark borders (button borders)

**Text**
- `text-purple-500` - Round points display
- `text-purple-600` - Large score numbers, round deltas
- `text-purple-700` - Labels, small text, secondary info
- `text-purple-800` - Section titles, player team labels
- `text-purple-900` - Player names, primary text

**Gradients (Buttons/Interactive)**
- `from-purple-500 to-purple-700` - Player name badges
- `from-purple-500 to-purple-600` - Active turn indicator

### Neutral/Gray Colors

**Backgrounds**
- `bg-gradient-to-r from-gray-50 to-gray-100` - Round summary container
- `bg-white` - Statistic cards, bright panels

**Borders**
- `border-parchment-400` - Standard borders (modals, panels)
- `border-amber-700` - Main modal borders
- `border-gray-200` - Light neutral borders

**Text**
- `text-gray-600` - Muted text, player stats
- `text-gray-700` - Secondary headings
- `text-gray-800` - Primary headings

### Button Styles

**Primary Actions (Blue)**
- `bg-gradient-to-r from-blue-600 to-blue-700`
- `hover:from-blue-700 hover:to-blue-800`
- `border-blue-800`

**Success Actions (Green)**
- `bg-gradient-to-r from-green-600 to-green-700`
- `hover:from-green-700 hover:to-green-800`
- `border-green-800`

**Ready State**
- `bg-green-500` (disabled/active ready)

**Warning/Danger (Red/Crimson)**
- `bg-gradient-to-br from-crimson-600 to-crimson-700`
- `hover:from-crimson-700 hover:to-crimson-800`

**Special (Purple)**
- `bg-gradient-to-r from-purple-500 to-purple-600`
- Quick Play button uses purple gradient

**Inactive/Secondary**
- `bg-parchment-200`
- `hover:bg-parchment-300`

## Component-Specific Applications

### Lobby.tsx

**Main Menu Modal**
- Background: `from-parchment-50 to-parchment-100`
- Border: `border-amber-700`
- Decorative corners: `border-amber-600`
- Title: `text-umber-900`

**Buttons**
- Create Game: `from-blue-600 to-blue-700`
- Join Game: `from-green-600 to-green-700`
- Spectate: `from-umber-500 to-umber-700` (orange/brown)
- Quick Play: `from-purple-500 to-purple-600`

**Recent/Online Players**
- Tab buttons (inactive): `bg-parchment-200`, `text-umber-700`
- Tab buttons (active): Blue or green gradient
- Panel: `bg-parchment-200`, `border-parchment-400`
- Player cards: `bg-parchment-100`, `border-parchment-400`
- Player names: `text-umber-900`
- Status text: `text-umber-600`

### TeamSelection.tsx

**Main Container**
- Background: `from-parchment-50 to-parchment-100`
- Border: `border-amber-700`

**Game ID Display**
- Background: `from-blue-50 to-purple-50`
- Border: `border-blue-200`
- Text: `text-umber-900`

**Chat Messages**
- Team 1: `bg-orange-100`, `border-orange-400`
- Team 2: `bg-purple-100`, `border-purple-400`
- Neutral: `bg-parchment-200`, `border-parchment-400`
- Text: `text-umber-800`

### PlayingPhase.tsx

**Main Background**
- `bg-gradient-to-br from-parchment-400 to-parchment-500`

**Score Board**
- Background: `bg-umber-900/40` (semi-transparent overlay)
- Border: `border-parchment-400`

**Team Score Displays**
- Team 1: `from-orange-50 to-orange-100/50`, `text-orange-600`
- Team 2: `from-purple-50 to-purple-100/50`, `text-purple-600`
- Round points: `text-orange-500` / `text-purple-500`

**Center Info**
- Round number: `from-parchment-200 to-parchment-100`, `text-umber-800`
- Bet display: `bg-orange-100/90` or `bg-purple-100/90`, `text-orange-800` / `text-purple-800`
- Trump: `bg-parchment-50`, `border-parchment-400`

**Turn Indicator**
- Waiting for trick: `from-umber-500 to-umber-600`, `text-parchment-50`
- Team 1 turn: `from-orange-500 to-orange-600`, `text-white`
- Team 2 turn: `from-purple-500 to-purple-600`, `text-white`

**Trick Layout**
- Container: `bg-umber-900/40`, `border-parchment-400`
- Empty card slots: `border-parchment-400`, `bg-parchment-200`
- Player badges: Team-colored gradients

**Player Hand**
- Container: `bg-umber-900/40`, `border-parchment-400`

**Buttons**
- Leaderboard: `from-umber-500 to-umber-700` (brown)
- Chat: `from-blue-500 to-blue-700`
- Previous Trick (active): `from-forest-600 to-forest-800`
- Previous Trick (inactive): `from-umber-400 to-umber-500`

### ScoringPhase.tsx

**Main Background**
- `bg-gradient-to-br from-purple-900 to-pink-900`

**Main Panel**
- Background: `bg-white`
- Title: `text-gray-800`

**Timer and Ready Status**
- Background: `from-blue-50 to-purple-50`
- Border: `border-blue-200`
- Timer: `text-blue-600`
- Status: `text-gray-600`
- Ready dots: `bg-green-500` (active), `bg-gray-300` (inactive)

**Team Score Cards**
- Team 1: `bg-orange-50`, `border-orange-200`, `text-orange-800` (title), `text-orange-600` (score)
- Team 2: `bg-purple-50`, `border-purple-200`, `text-purple-800` (title), `text-purple-600` (score)

**Round Summary**
- Container: `from-gray-50 to-gray-100`, `border-gray-200`, `text-gray-700`
- Team 1 card: `bg-orange-50`, `border-orange-300`, `text-orange-800`
- Team 2 card: `bg-purple-50`, `border-purple-300`, `text-purple-800`
- Points badge: `bg-green-500`, `border-green-300`
- Player stats: `text-gray-600`

**Round Highlights**
- Container: `from-amber-50 to-yellow-50`, `border-amber-200`
- Stat cards: `bg-white`, various colored borders
- Icons: 3xl emoji
- Title: `text-gray-800`
- Label: `text-gray-600`
- Value: `text-gray-800`

### Leaderboard.tsx

**Modal**
- Background: `bg-parchment-50`
- Border: `border-parchment-400`
- Header: `from-umber-600 to-umber-700`, `text-parchment-50`

**Current Standings**
- Team 1: `from-orange-50 to-orange-100`, `border-orange-200`
- Team 2: `from-purple-50 to-purple-100`, `border-purple-200`
- Leading team: `ring-yellow-400`
- Team titles: `text-orange-800` / `text-purple-800`
- Scores: `text-orange-600` / `text-purple-600`
- Player cards: `bg-parchment-50`, `border-orange-200` / `border-purple-200`

**Current Bet**
- Background: `from-parchment-100 to-parchment-50`
- Border: `border-parchment-400`
- Labels: `text-umber-700`
- Values: `text-umber-900`

**Round History**
- Cards: `bg-parchment-100`, `border-parchment-400`
- Hover: `hover:bg-parchment-200`
- Titles: `text-umber-900`
- Labels: `text-umber-700`
- Values: `text-umber-900`
- Bet Made: `bg-forest-100`, `text-forest-800`, `border-forest-400`
- Bet Failed: `bg-crimson-100`, `text-crimson-800`, `border-crimson-400`

**Trick History (Expanded)**
- Background: `bg-parchment-50`, `border-parchment-400`
- Trick cards: `bg-parchment-100`, `border-parchment-400`
- Winner badge: Team-colored (`bg-orange-500` / `bg-purple-500`)
- Player names: `text-umber-700`

### ChatPanel.tsx

**Panel**
- Background: `bg-parchment-50`
- Border: `border-amber-700`
- Header: `from-amber-700 to-amber-800`, `text-parchment-50`

**Messages Area**
- Background: `bg-parchment-100`
- Empty state: `text-umber-500`

**Messages**
- Team 1: `bg-orange-100`, `border-orange-400`
- Team 2: `bg-purple-100`, `border-purple-400`
- Neutral: `bg-parchment-200`, `border-parchment-400`
- Name: `text-umber-900`
- Text: `text-umber-800`

**Input**
- Background: `bg-parchment-50`
- Border: `border-parchment-400`
- Focus: `ring-umber-500`, `border-umber-500`
- Text: `text-umber-900`
- Send button: `from-blue-600 to-blue-700`

**Quick Emojis**
- Background: `bg-parchment-100`
- Border: `border-parchment-300`
- Hover: `hover:bg-parchment-200`

### RematchVoting.tsx

**Main Panel**
- Background: `from-parchment-50 to-parchment-100`
- Border: `border-amber-700`

**Vote Panel**
- Background: `bg-white`
- Border: `border-amber-600`
- Title: `text-umber-900`
- Count: `text-umber-900`

**Vote Indicators**
- Voted: `bg-forest-100`, `border-forest-400`
- Not voted: `bg-parchment-200`, `border-parchment-400`
- Player dot: `bg-orange-500` / `bg-purple-500`
- Name: `text-umber-900`

**Vote Button**
- `from-green-600 to-green-700`
- `hover:from-green-700 hover:to-green-800`

## Special States

### Hover States
- Parchment elements: `hover:bg-parchment-300`
- Buttons: Darker variant of base gradient
- Cards: Scale transform + border color change

### Focus States
- Input fields: `ring-umber-500`, `border-umber-500`
- Blue focus: `ring-blue-500`

### Disabled States
- Buttons: `from-gray-400 to-gray-500`, `border-gray-600`
- Cards: Grayscale overlay with ✕ mark

### Winner States
- Ring: `ring-yellow-400`
- Shadow: `shadow-yellow-400/50`

### Animation/Transition Colors
- Score pop: Scale animation
- Points float: Green (`bg-green-500`) or red (`bg-red-500`)
- Ready dots: `bg-green-500` with scale

## Testing Checklist

When adding new components or modifying existing ones, verify:

- [ ] Backgrounds use parchment theme for consistency
- [ ] Team colors (orange/purple) are correctly applied
- [ ] Text has sufficient contrast (dark on light)
- [ ] Borders use appropriate parchment or team colors
- [ ] Buttons use vibrant gradients
- [ ] Hover states are defined
- [ ] Focus states are visible
- [ ] Disabled states are grayed out
- [ ] Winner/special states use yellow accents

## Quick Reference Table

| Element Type | Color | Usage |
|--------------|-------|-------|
| Page bg | `parchment-50/100` | Main backgrounds, modals |
| Game board bg | `parchment-400/500` | Playing phase background |
| Team 1 bg | `orange-50/100` | Team cards, messages |
| Team 2 bg | `purple-50/100` | Team cards, messages |
| Team 1 text | `orange-600/800` | Scores, titles |
| Team 2 text | `purple-600/800` | Scores, titles |
| Primary text | `umber-900` | Main text |
| Secondary text | `umber-700` | Labels |
| Muted text | `umber-600` | Stats |
| Borders | `parchment-400` | Standard borders |
| Main borders | `amber-700` | Modal borders |
| Button primary | `blue-600/700` | Primary actions |
| Button success | `green-600/700` | Positive actions |
| Button danger | `crimson-600/700` | Destructive actions |
| Winner accent | `yellow-400` | Winner rings, stars |

---

*Last updated: 2025-01-20*
*Note: All color values use Tailwind CSS class names*
*Companion document: DARK_MODE_COLORS.md*
