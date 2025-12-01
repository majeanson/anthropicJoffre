# Storybook UI Migration Plan

## Current Status

### Story Coverage
- **63 story files** created across all component categories
- **7 theme skins** fully supported with CSS variables
- **504+ visual screenshots** captured for visual regression testing

### Component Categories with Stories

#### UI Primitives (Foundation Layer)
| Component | Story | Status |
|-----------|-------|--------|
| Button | ✅ Button.stories.tsx | Complete |
| Input | ✅ Input.stories.tsx | Complete |
| Select | ✅ Select.stories.tsx | Complete |
| Checkbox | ✅ Checkbox.stories.tsx | Complete |
| UICard | ✅ UICard.stories.tsx | Complete |
| UIBadge | ✅ UIBadge.stories.tsx | Complete |
| UIDivider | ✅ UIDivider.stories.tsx | Complete |
| UIDropdownMenu | ✅ UIDropdownMenu.stories.tsx | Complete |
| UISlider | ✅ UISlider.stories.tsx | Complete |
| UIToggle | ✅ UIToggle.stories.tsx | Complete |
| Modal | ✅ Modal.stories.tsx | Complete |
| Tabs | ✅ Tabs.stories.tsx | Complete |
| Tooltip | ✅ Tooltip.stories.tsx | Complete |
| Toast | ✅ Toast.stories.tsx | Complete |
| Spinner | ✅ Spinner.stories.tsx | Complete |
| Skeleton | ✅ Skeleton.stories.tsx | Complete |
| ProgressBar | ✅ ProgressBar.stories.tsx | Complete |
| Alert | ✅ Alert.stories.tsx | Complete |
| IconButton | ✅ IconButton.stories.tsx | Complete |

#### Player & Avatar Components
| Component | Story | Status |
|-----------|-------|--------|
| Avatar | ✅ Avatar.stories.tsx | Complete |
| AvatarSelector | ✅ AvatarSelector.stories.tsx | Complete |
| PlayerAvatar | ✅ PlayerAvatar.stories.tsx | Complete |
| PlayerBadge | ✅ PlayerBadge.stories.tsx | Complete |
| PlayerNameButton | ✅ PlayerNameButton.stories.tsx | Complete |
| OnlineStatusBadge | ✅ OnlineStatusBadge.stories.tsx | Complete |
| ConnectionQualityIndicator | ✅ ConnectionQualityIndicator.stories.tsx | Complete |

#### Game Components
| Component | Story | Status |
|-----------|-------|--------|
| Card | ✅ Card.stories.tsx | Complete |
| TrickHistory | ✅ TrickHistory.stories.tsx | Complete |
| TrickWinnerBanner | ✅ TrickWinnerBanner.stories.tsx | Complete |
| BettingHistory | ✅ BettingHistory.stories.tsx | Complete |
| InlineBetStatus | ✅ InlineBetStatus.stories.tsx | Complete |
| RematchVoting | ✅ RematchVoting.stories.tsx | Complete |
| RoundSummary | ✅ RoundSummary.stories.tsx | Complete |
| TimeoutCountdown | ✅ TimeoutCountdown.stories.tsx | Complete |
| TimeoutIndicator | ✅ TimeoutIndicator.stories.tsx | Complete |
| TimeoutBanner | ✅ TimeoutBanner.stories.tsx | Complete |
| SmartValidationMessage | ✅ SmartValidationMessage.stories.tsx | Complete |
| GameHeader | ✅ GameHeader.stories.tsx | Complete |
| TeamCard | ✅ TeamCard.stories.tsx | Complete |
| SwapConfirmationModal | ✅ SwapConfirmationModal.stories.tsx | Complete |
| BotThinkingIndicator | ✅ BotThinkingIndicator.stories.tsx | Complete |
| MoveSuggestionButton | ✅ MoveSuggestionButton.stories.tsx | Complete |
| CatchUpModal | ✅ CatchUpModal.stories.tsx | Complete |
| BeginnerTutorial | ✅ BeginnerTutorial.stories.tsx | Complete |
| StateDisplay | ✅ StateDisplay.stories.tsx | Complete |
| GameTooltip | ✅ GameTooltip.stories.tsx | Complete |

#### Social & Messaging Components
| Component | Story | Status |
|-----------|-------|--------|
| DirectMessagesPanel | ✅ DirectMessagesPanel.stories.tsx | Complete |
| ConversationItem | ✅ ConversationItem.stories.tsx | Complete |
| MessageBubble | ✅ MessageBubble.stories.tsx | Complete |
| EmojiPicker | ✅ EmojiPicker.stories.tsx | Complete |
| FriendsPanel | ✅ FriendsPanel.stories.tsx | Complete |
| SocialListItem | ✅ SocialListItem.stories.tsx | Complete |
| UnreadBadge | ✅ UnreadBadge.stories.tsx | Complete |
| NotificationCenter | ✅ NotificationCenter.stories.tsx | Complete |

#### Stats & Leaderboard Components
| Component | Story | Status |
|-----------|-------|--------|
| GlobalLeaderboard | ✅ GlobalLeaderboard.stories.tsx | Complete |
| MatchCard | ✅ MatchCard.stories.tsx | Complete |
| HeaderActionButton | ✅ HeaderActionButton.stories.tsx | Complete |

#### Achievements & Rewards Components
| Component | Story | Status |
|-----------|-------|--------|
| AchievementsPanel | ✅ AchievementsPanel.stories.tsx | Complete |
| AchievementUnlocked | ✅ AchievementUnlocked.stories.tsx | Complete |
| DailyQuestsPanel | ✅ DailyQuestsPanel.stories.tsx | Complete |
| RewardsCalendar | ✅ RewardsCalendar.stories.tsx | Complete |
| LoginStreakBadge | ✅ LoginStreakBadge.stories.tsx | Complete |

#### Settings Components
| Component | Story | Status |
|-----------|-------|--------|
| SkinSelector | ✅ SkinSelector.stories.tsx | Complete |

---

## Migration Strategy

### Phase 1: CSS Variable Standardization (Complete)
All components now use CSS variables from the design system:
- `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
- `--color-border-primary`, `--color-border-secondary`
- `--color-team1-*`, `--color-team2-*`
- `--color-success`, `--color-warning`, `--color-error`, `--color-info`

### Phase 2: Component Consolidation
Replace scattered Tailwind classes with reusable UI components:

#### High Priority Replacements
1. **Buttons**: Replace all custom button styles with `<Button variant="..." size="...">`
2. **Cards**: Replace `<div className="p-4 rounded-lg bg-...">` with `<UICard>`
3. **Badges**: Replace inline badge styles with `<UIBadge color="..." variant="...">`
4. **Modals**: Ensure all modals use the unified `<Modal>` component
5. **Inputs**: Replace raw `<input>` with `<Input>` component

#### Medium Priority Replacements
1. **Tooltips**: Use `<Tooltip>` component instead of `title` attributes
2. **Loading States**: Use `<Skeleton>` and `<Spinner>` components
3. **Dividers**: Replace `<hr>` and border dividers with `<UIDivider>`
4. **Progress**: Use `<ProgressBar>` for all progress indicators

### Phase 3: Page-Level Refactoring
These larger components need refactoring to use Storybook primitives:

| Component | Priority | Notes |
|-----------|----------|-------|
| Lobby.tsx | High | Uses custom styles, should use UICard, Button |
| LobbyBrowser.tsx | High | Tab navigation, should use Tabs component |
| BettingPhase.tsx | High | Complex, but mostly uses UI components now |
| PlayingPhase.tsx | Medium | Large file, needs incremental refactoring |
| TeamSelection.tsx | Medium | Uses TeamCard component |
| GameReplay.tsx | Medium | Mostly data-driven |
| SettingsPanel.tsx | Low | Uses SkinSelector |
| PersonalHub.tsx | Low | Mostly layout |

### Phase 4: Visual Regression Testing
1. Use the screenshot tests to verify no visual regressions
2. Run `npm run test:storybook-screenshots` after each migration batch
3. Review diffs for unintended changes

---

## Component Usage Cheatsheet

### Buttons
```tsx
// Primary action
<Button variant="primary" size="md">Save</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Danger action
<Button variant="danger">Delete</Button>

// Ghost/link style
<Button variant="ghost">Learn more</Button>
```

### Cards
```tsx
// Basic card
<UICard variant="bordered" size="md">Content</UICard>

// Elevated card
<UICard variant="elevated">Content</UICard>

// Team-colored card
<UICard gradient="team1">Team 1 Content</UICard>
```

### Badges
```tsx
// Status badges
<UIBadge variant="solid" color="success">Active</UIBadge>
<UIBadge variant="subtle" color="warning">Pending</UIBadge>
<UIBadge variant="outline" color="error">Error</UIBadge>

// Team badges
<UIBadge color="team1">Team 1</UIBadge>
<UIBadge color="team2">Team 2</UIBadge>
```

### Modals
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  icon="🎮"
  theme="purple"
  size="lg"
>
  Modal content
</Modal>
```

### Form Controls
```tsx
<Input
  label="Username"
  placeholder="Enter username"
  value={value}
  onChange={onChange}
  error={error}
/>

<Select
  label="Difficulty"
  options={[
    { value: 'easy', label: 'Easy' },
    { value: 'hard', label: 'Hard' }
  ]}
  value={difficulty}
  onChange={setDifficulty}
/>

<Checkbox
  label="Enable sounds"
  checked={checked}
  onChange={onChange}
/>
```

### Loading States
```tsx
// Spinner
<Spinner size="md" label="Loading..." />

// Skeleton for content placeholders
<ListSkeleton count={5} hasAvatar />
<TableSkeleton rows={10} columns={5} />
<CardSkeleton count={3} />
```

---

## Testing Commands

```bash
# Run Storybook locally
npm run storybook

# Take screenshots across all skins
cd e2e && npx playwright test storybook-screenshots.spec.ts

# Check for visual regressions
# (Screenshots are saved to e2e/storybook-screenshots/{skin}/{story}.png)
```

---

## Remaining Components Without Stories

### Low Priority (Complex Page Components)
These are full page components that are harder to document in isolation:
- Lobby.tsx
- LobbyBrowser.tsx
- BettingPhase.tsx
- PlayingPhase.tsx
- TeamSelection.tsx
- GameReplay.tsx
- PersonalHub.tsx
- SettingsPanel.tsx
- SocialHub.tsx
- SocialPanel.tsx
- StatsPanel.tsx
- BotManagementPanel.tsx
- ScoringPhase.tsx
- ContextualGameInfo.tsx
- PlayerStatsModal.tsx
- DebugPanel.tsx
- TestPanel.tsx

These components are typically:
1. Complex with multiple sub-sections
2. Dependent on Socket.io or gameState
3. Better tested via E2E tests than Storybook

---

## Success Metrics

1. **All UI primitives in Storybook**: 100% ✅
2. **All game components in Storybook**: 100% ✅
3. **All social components in Storybook**: 100% ✅
4. **Theme/skin compatibility**: 7 skins tested ✅
5. **Visual regression baseline**: 504+ screenshots captured ✅

---

*Last updated: November 2025*
