# UI Component System Documentation

**Version**: 1.0.0
**Created**: Sprint 19A - UI Unification Foundation
**Status**: ✅ Ready for Use

---

## Overview

The UI Component System provides a unified, reusable set of components for building consistent interfaces across the application. All components support dark mode, accessibility features, and mobile optimization out of the box.

### Core Principles

1. **Consistency** - Same visual language everywhere
2. **Accessibility** - WCAG 2.1 AA compliant by default
3. **Reusability** - Build once, use everywhere
4. **Dark Mode** - Full support, no extra work
5. **Mobile First** - Responsive by default

---

## Quick Start

### Installation

Components are already available in the project. No installation needed!

### Basic Import

```tsx
import { Modal, Button, IconButton } from '@/components/ui';
```

### Example Usage

```tsx
function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setShowModal(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Welcome"
        theme="parchment"
        size="md"
      >
        <p>This is a modal using the unified UI system!</p>
      </Modal>
    </>
  );
}
```

---

## Components

### Modal

Unified modal system for all dialog and overlay needs.

#### Props

```tsx
interface ModalProps {
  // Required
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  // Header
  title?: string;
  subtitle?: string;
  icon?: ReactNode;

  // Appearance
  theme?: 'parchment' | 'blue' | 'purple' | 'green' | 'red' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Layout
  footer?: ReactNode;

  // Behavior
  showCloseButton?: boolean;        // Default: true
  closeOnBackdrop?: boolean;        // Default: true
  closeOnEscape?: boolean;          // Default: true
  preventBodyScroll?: boolean;      // Default: true
  mobileFullScreen?: boolean;       // Default: true

  // Advanced
  stackLevel?: number;              // For nested modals
  customZIndex?: number;
}
```

#### Examples

**Basic Modal**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Player Stats"
>
  <p>Your stats go here</p>
</Modal>
```

**Modal with Footer**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Delete"
  theme="red"
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={onDelete}>Delete</Button>
    </>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>
```

**Modal with Icon and Subtitle**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="New Achievement"
  subtitle="You've unlocked a rare achievement!"
  icon={<TrophyIcon />}
  theme="purple"
  size="lg"
>
  <AchievementDetails />
</Modal>
```

**Nested Modals**
```tsx
{/* Base modal */}
<Modal
  isOpen={showProfile}
  onClose={() => setShowProfile(false)}
  title="Player Profile"
  stackLevel={0}
>
  <Button onClick={() => setShowStats(true)}>View Stats</Button>
</Modal>

{/* Nested modal (appears on top) */}
<Modal
  isOpen={showStats}
  onClose={() => setShowStats(false)}
  title="Detailed Stats"
  stackLevel={1}
>
  <StatsTable />
</Modal>
```

#### Theme Variants

| Theme | Use Case | Example |
|-------|----------|---------|
| `parchment` | Default, game-related modals | Team selection, game lobby |
| `blue` | Stats, information, analytics | Player stats, leaderboards |
| `purple` | Achievements, premium features | Achievement unlocks, special events |
| `green` | Success, confirmations | Game won, save successful |
| `red` | Warnings, destructive actions | Delete account, kick player |
| `dark` | Debug, developer tools | Debug panel, settings |

#### Size Guide

| Size | Width | Best For |
|------|-------|----------|
| `sm` | 384px | Simple confirmations, small forms |
| `md` | 672px | Standard modals, most use cases |
| `lg` | 896px | Content-heavy modals, tables |
| `xl` | 1152px | Complex interfaces, multi-column |
| `full` | 1280px | Maximum space (replays, galleries) |

---

### Button

Versatile button component with multiple variants and states.

#### Props

```tsx
interface ButtonProps {
  // Content
  children?: ReactNode;

  // Appearance
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // Icons
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  // States
  loading?: boolean;
  disabled?: boolean;

  // Layout
  fullWidth?: boolean;

  // Standard button props
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

#### Examples

**Primary Button**
```tsx
<Button variant="primary" onClick={handleStart}>
  Start Game
</Button>
```

**Button with Icon**
```tsx
<Button
  variant="danger"
  leftIcon={<TrashIcon />}
  onClick={handleDelete}
>
  Delete Account
</Button>
```

**Loading Button**
```tsx
<Button
  variant="primary"
  loading={isSaving}
  onClick={handleSave}
>
  Save Changes
</Button>
```

**Full Width Button**
```tsx
<Button variant="primary" fullWidth>
  Join Game
</Button>
```

#### Variant Guide

| Variant | Use Case | Example |
|---------|----------|---------|
| `primary` | Main actions, CTAs | Start Game, Submit Form |
| `secondary` | Secondary actions, cancel | Cancel, Go Back |
| `danger` | Destructive actions | Delete, Kick Player |
| `ghost` | Subtle actions, tertiary | More Options, Collapse |
| `link` | Navigation, inline actions | View Profile, Learn More |

---

### IconButton

Icon-only buttons for close buttons and small actions.

#### Props

```tsx
interface IconButtonProps {
  // Required
  icon: ReactNode;
  ariaLabel: string;          // For accessibility

  // Appearance
  variant?: 'circular' | 'square' | 'minimal';
  size?: 'sm' | 'md' | 'lg';

  // States
  disabled?: boolean;

  // Standard button props
  onClick?: () => void;
}
```

#### Examples

**Close Button (Circular)**
```tsx
<IconButton
  icon={<>✕</>}
  variant="circular"
  ariaLabel="Close modal"
  onClick={onClose}
/>
```

**Action Button (Square)**
```tsx
<IconButton
  icon={<TrashIcon />}
  variant="square"
  size="lg"
  ariaLabel="Delete item"
  onClick={handleDelete}
/>
```

**Minimal Button**
```tsx
<IconButton
  icon={<SettingsIcon />}
  variant="minimal"
  ariaLabel="Open settings"
  onClick={() => setShowSettings(true)}
/>
```

---

## Configuration

### Theme System

Centralized color themes in `frontend/src/config/themes.ts`.

```tsx
import { themes, getTheme } from '@/config/themes';

// Use in components
const theme = getTheme('parchment');
console.log(theme.bg); // 'from-parchment-50 to-parchment-100 dark:from-gray-800...'
```

#### Adding a New Theme

```tsx
export const themes = {
  // ... existing themes ...

  // New custom theme
  custom: {
    name: 'Custom',
    bg: 'from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900',
    header: 'from-teal-700 to-cyan-700 dark:from-gray-700 dark:to-gray-800',
    border: 'border-teal-700 dark:border-gray-600',
    text: 'text-teal-900 dark:text-gray-100',
    textMuted: 'text-teal-600 dark:text-gray-400',
    backdrop: 'bg-black/60 dark:bg-black/80',
  },
};
```

### Z-Index Scale

Prevent stacking context issues with centralized z-index values.

```tsx
import { zIndex, getModalZIndex } from '@/config/zIndex';

// Standard z-index
<div style={{ zIndex: zIndex.modal }}>...</div>

// Nested modal z-index
const modalZIndex = getModalZIndex(1); // 60 (50 + 10)
```

**Scale**:
- `base: 0` - Normal document flow
- `dropdown: 10` - Dropdowns, selects
- `sticky: 20` - Sticky headers
- `floating: 30` - FABs, chat
- `tooltip: 40` - Tooltips, popovers
- `modal: 50` - Base modal layer
- `toast: 80` - Toast notifications
- `overlay: 90` - Loading overlays
- `max: 100` - Emergency overrides

### Layout Constants

Consistent spacing and sizing in `frontend/src/config/layout.ts`.

```tsx
import { spacing, sizes, animations } from '@/config/layout';

// Use spacing
<div className={spacing.modal.padding}>...</div>

// Use sizes
<div className={sizes.modal.lg}>...</div>
```

---

## Migration Guide

### Migrating an Existing Modal

**Before** (Custom inline modal):
```tsx
function MyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 rounded-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 p-6 flex justify-between">
          <h2 className="text-2xl font-bold text-white">My Modal</h2>
          <button onClick={onClose} className="bg-red-600 text-white w-10 h-10 rounded-full">✕</button>
        </div>
        <div className="p-6">
          <p>Modal content</p>
        </div>
      </div>
    </div>
  );
}
```

**After** (Using UI system):
```tsx
import { Modal } from '@/components/ui';

function MyModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Modal"
      theme="parchment"
      size="md"
    >
      <p>Modal content</p>
    </Modal>
  );
}
```

**Result**: ~40 lines → ~15 lines (-63%)

### Migrating Buttons

**Before**:
```tsx
<button
  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-lg text-white font-bold transition-all"
  onClick={handleClick}
>
  Click Me
</button>
```

**After**:
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

---

## Best Practices

### 1. Always Use Themes

❌ **Don't** hardcode colors:
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Title"
  // No theme specified - will use default, but be explicit
>
```

✅ **Do** specify themes explicitly:
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Title"
  theme="parchment"  // ✅ Explicit
>
```

### 2. Use Semantic Variants

❌ **Don't** use primary for destructive actions:
```tsx
<Button variant="primary" onClick={handleDelete}>
  Delete Account
</Button>
```

✅ **Do** use semantic variants:
```tsx
<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>
```

### 3. Provide Accessibility Labels

❌ **Don't** skip aria-labels:
```tsx
<IconButton icon={<>✕</>} onClick={onClose} />
```

✅ **Do** always include aria-label:
```tsx
<IconButton
  icon={<>✕</>}
  ariaLabel="Close modal"  // ✅ Required for screen readers
  onClick={onClose}
/>
```

### 4. Use Footer for Actions

❌ **Don't** put buttons in content:
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Confirm">
  <p>Are you sure?</p>
  <div>
    <Button onClick={onCancel}>Cancel</Button>
    <Button onClick={onConfirm}>Confirm</Button>
  </div>
</Modal>
```

✅ **Do** use footer prop:
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm"
  footer={
    <>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button variant="primary" onClick={onConfirm}>Confirm</Button>
    </>
  }
>
  <p>Are you sure?</p>
</Modal>
```

### 5. Test Dark Mode

Always test components in both light and dark mode:
- Toggle dark mode in browser dev tools
- Check contrast ratios
- Verify all text is readable

---

## Accessibility Checklist

When using UI components, ensure:

- [ ] All modals have descriptive titles or aria-labels
- [ ] IconButtons have aria-labels
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] Focus management is correct
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Touch targets are 44x44px minimum
- [ ] Screen readers announce correctly

---

## Testing

### Manual Testing Checklist

For each component migration:

**Desktop Light Mode:**
- [ ] Normal state
- [ ] Hover state
- [ ] Active state
- [ ] Disabled state

**Desktop Dark Mode:**
- [ ] Normal state
- [ ] Hover state
- [ ] Active state
- [ ] Disabled state

**Mobile:**
- [ ] Portrait mode (light & dark)
- [ ] Landscape mode (light & dark)

**Keyboard:**
- [ ] Tab order correct
- [ ] ESC closes modals
- [ ] Enter submits forms

**Screen Reader:**
- [ ] Announces correctly
- [ ] Focus management works

---

## Storybook Integration (Sprint 20)

Storybook will be added in Sprint 20 to provide:
- Interactive component documentation
- Visual testing of all variants
- Dark mode toggle
- Responsive viewport testing
- Accessibility audits

**Preview**: Stories will be generated for all UI components automatically.

---

## Troubleshooting

### Modal Not Closing on ESC

Check that `closeOnEscape` prop is `true` (default) and no other component is capturing keyboard events.

### Buttons Look Squished on Mobile

Ensure you're using appropriate size (`sm` or `md`) and consider `fullWidth` prop for mobile.

### Z-Index Issues

Use `stackLevel` prop for nested modals instead of custom z-index values.

### Dark Mode Not Working

Verify your root HTML element has `class="dark"` applied when dark mode is active.

---

## Future Enhancements

Planned for future sprints:

- [ ] Additional components (Badge, Tooltip, Tabs, Toggle)
- [ ] Animation customization
- [ ] Custom theme builder
- [ ] A11y automated testing
- [ ] Visual regression testing with Chromatic

---

## Support

For questions or issues:
1. Check this documentation
2. Review component source code in `frontend/src/components/ui/`
3. Check Storybook (available Sprint 20+)
4. Ask in team chat

---

**Last Updated**: Sprint 19A Foundation
**Next Review**: Sprint 20 (Storybook setup)
