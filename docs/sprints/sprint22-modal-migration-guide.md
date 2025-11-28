# Sprint 22: Modal Migration Guide

**Date**: 2025-11-28
**Status**: 6/15 modals migrated (40% complete)
**Goal**: Migrate all custom modal implementations to Storybook Modal component

---

## Overview

This guide documents the process of migrating custom modal implementations to use the Storybook Modal and Button components for consistency, maintainability, and better UX.

---

## Why Migrate?

### Before Migration
- **87 components** with custom `<button>` implementations
- **15 modal files**, **0%** using Storybook Modal
- **36 components** with custom modal overlays (`fixed inset-0`)
- Inconsistent styling, keyboard handling, and accessibility

### After Migration (Current Progress)
- **6 modals** migrated to Storybook Modal (40%)
- **173 lines** of code removed
- Consistent UX across all migrated modals
- Built-in accessibility features

---

## Migration Progress

### ✅ Completed (P0-P1)

**P0: Authentication Modals** (3 components)
- ✅ LoginModal.tsx (-14.4%, 27 lines)
- ✅ RegisterModal.tsx (-5.9%, 20 lines)
- ✅ PasswordResetModal.tsx (-9.0%, 15 lines)

**P1: Game Flow Modals** (3 components)
- ✅ SwapConfirmationModal.tsx (-22.1%, 32 lines)
- ✅ BotTakeoverModal.tsx (-19.8%, 25 lines)
- ✅ CatchUpModal.tsx (-28.4%, 54 lines)

**Total Reduction**: 173 lines (-15.0% average)

### 🔄 In Progress (P2)

**P2: Feature Modals** (0/4 components)
- ⏸️ PlayerProfileModal.tsx
- ⏸️ KeyboardShortcutsModal.tsx
- ⏸️ ProfileEditorModal.tsx
- ⏸️ TutorialProgressModal.tsx

### 📋 Planned (P3-P4)

**P3: Complex Modals** (0/5 components)
- ⏸️ PlayerStatsModal.tsx
- ⏸️ MatchStatsModal.tsx
- ⏸️ GlobalLeaderboard.tsx (if modal)
- ⏸️ BotManagementPanel.tsx
- ⏸️ UnifiedModal.tsx

**P4: Debug Modals** (0/3 components)
- ⏸️ GlobalDebugModal.tsx
- ⏸️ UnifiedDebugModal.tsx
- ⏸️ Other debug modals

---

## Storybook Components

### Modal Component

**Location**: `frontend/src/components/ui/Modal.tsx`

**Import**:
```tsx
import { Modal } from './ui/Modal';
// or
import { Modal } from './ui';
```

**Props Interface**:
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  theme?: 'parchment' | 'blue' | 'purple' | 'green' | 'red' | 'dark' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  className?: string;
}
```

**Features**:
- 5 size variants (sm, md, lg, xl, full)
- 7 theme presets with gradients
- Mobile full-screen optimization
- Keyboard handling (ESC to close, focus trap)
- Body scroll lock
- Nested modal support (z-index stacking)
- Accessibility (ARIA labels, focus management)

### Button Component

**Location**: `frontend/src/components/ui/Button.tsx`

**Import**:
```tsx
import { Button } from './ui/Button';
// or
import { Button } from './ui';
```

**Props Interface**:
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
}
```

**Features**:
- 7 style variants
- 5 size options
- Icon support (left/right)
- Loading state with spinner
- Full width option
- Dark mode support
- Design token integration

---

## Migration Pattern

### Step-by-Step Process

#### 1. **Read the Component**
```bash
# Understand current implementation
cat frontend/src/components/YourModal.tsx
```

#### 2. **Identify Patterns**

**Custom Modal Pattern** (to remove):
```tsx
// ❌ BEFORE - Custom implementation
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md">
    <div className="p-6 border-b flex justify-between">
      <h2>Modal Title</h2>
      <button onClick={onClose}>×</button>
    </div>
    <div className="p-6">
      {/* Content */}
    </div>
    <div className="p-6 border-t flex gap-4">
      <button onClick={handleCancel}>Cancel</button>
      <button onClick={handleConfirm}>Confirm</button>
    </div>
  </div>
</div>
```

**Storybook Pattern** (to use):
```tsx
// ✅ AFTER - Storybook components
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  icon="🔐"
  theme="blue"
  size="sm"
  footer={
    <>
      <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
      <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  {/* Content */}
</Modal>
```

#### 3. **Replace Components**

**Modal Wrapper**:
```tsx
// Remove these patterns:
- <div className="fixed inset-0 bg-black/...">
- <div ref={containerRef} role="dialog">
- Custom close button
- useFocusTrap hook
- useEffect for body scroll lock

// Add:
import { Modal } from './ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="..."
  theme="..."
  size="..."
>
```

**Buttons**:
```tsx
// Replace <button> with <Button>
import { Button } from './ui/Button';

// Submit buttons
<button type="submit" className="bg-blue-600...">
  ↓
<Button type="submit" variant="primary" loading={isLoading}>

// Cancel/secondary actions
<button onClick={onCancel} className="bg-gray-600...">
  ↓
<Button variant="secondary" onClick={onCancel}>

// Link-style buttons
<button onClick={switchModal} className="text-blue-500...">
  ↓
<Button variant="link" onClick={switchModal}>

// Dangerous actions
<button onClick={handleDelete} className="bg-red-600...">
  ↓
<Button variant="danger" onClick={handleDelete}>
```

#### 4. **Map Themes**

Choose appropriate Modal theme based on purpose:

| Use Case | Theme | Rationale |
|----------|-------|-----------|
| Login/Auth | `blue` | Trust, security |
| Registration | `purple` | Differentiate from login |
| Success/Welcome | `green` | Positive sentiment |
| Warning/Caution | `red` | Attention, danger |
| Info/Help | `blue` | Neutral information |
| Settings/Profile | `parchment` | Neutral, classic |
| Dark UI | `dark` | High contrast |

#### 5. **Choose Size**

| Content Type | Size | Max Width |
|--------------|------|-----------|
| Auth forms | `sm` | 28rem (448px) |
| Simple confirmations | `sm` | 28rem |
| Feature modals | `md` | 32rem (512px) |
| Data-heavy content | `lg` | 48rem (768px) |
| Complex layouts | `xl` | 64rem (1024px) |
| Full-screen | `full` | 100vw |

#### 6. **Preserve Business Logic**

**DO NOT CHANGE**:
- Form validation logic
- API calls
- State management
- Event handlers
- Props and interfaces
- Callbacks

**ONLY CHANGE**:
- Modal wrapper (replace with `<Modal>`)
- Button elements (replace with `<Button>`)
- Custom styling (remove, use component props)

#### 7. **Test Thoroughly**

```tsx
// Manual testing checklist:
✓ Modal opens and closes
✓ ESC key closes modal
✓ Backdrop click closes modal (if enabled)
✓ Form submission works
✓ Loading states display correctly
✓ Error messages show
✓ Success flows complete
✓ Mobile responsiveness
✓ Dark mode works
✓ Keyboard navigation (Tab, Enter, ESC)
```

---

## Common Patterns

### Pattern 1: Simple Confirmation Modal

**Before**:
```tsx
return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg">
      <h2>Are you sure?</h2>
      <p>This action cannot be undone.</p>
      <div className="flex gap-4 mt-4">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
);
```

**After**:
```tsx
return (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title="Are you sure?"
    icon="⚠️"
    theme="red"
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Confirm</Button>
      </>
    }
  >
    <p>This action cannot be undone.</p>
  </Modal>
);
```

### Pattern 2: Form Modal with Loading State

**Before**:
```tsx
return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" value={username} onChange={...} />
        <input type="password" value={password} onChange={...} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  </div>
);
```

**After**:
```tsx
return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Login"
    icon="🔐"
    theme="blue"
    size="sm"
  >
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" value={username} onChange={...} />
      <input type="password" value={password} onChange={...} />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
        disabled={!username || !password}
      >
        Login
      </Button>
    </form>
  </Modal>
);
```

### Pattern 3: Modal with Dynamic Subtitle

**Before**:
```tsx
return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg">
      <div className="flex justify-between">
        <h2>Swap Request</h2>
        <span>{timeLeft}s</span>
      </div>
      {/* content */}
    </div>
  </div>
);
```

**After**:
```tsx
return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Swap Request"
    subtitle={`${timeLeft}s remaining`}
    icon="🔄"
    theme="blue"
    size="sm"
  >
    {/* content */}
  </Modal>
);
```

### Pattern 4: Modal with Multiple Sections

**Before**:
```tsx
return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-2xl">
      <h2>Player Stats</h2>
      <section>
        <h3>Overview</h3>
        {/* stats */}
      </section>
      <section>
        <h3>Match History</h3>
        {/* history */}
      </section>
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);
```

**After**:
```tsx
return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Player Stats"
    icon="📊"
    theme="blue"
    size="lg"  // Larger for multiple sections
    footer={
      <Button variant="secondary" onClick={onClose} fullWidth>
        Close
      </Button>
    }
  >
    <section className="mb-6">
      <h3 className="text-xl font-bold mb-4">Overview</h3>
      {/* stats */}
    </section>
    <section>
      <h3 className="text-xl font-bold mb-4">Match History</h3>
      {/* history */}
    </section>
  </Modal>
);
```

---

## Button Variant Selection Guide

### When to Use Each Variant

| Variant | Use Case | Example |
|---------|----------|---------|
| **primary** | Main action, submit forms | Login, Save, Create Account |
| **secondary** | Cancel, alternative actions | Cancel, Back, Dismiss |
| **success** | Positive confirmation | Continue, Resume, Accept |
| **warning** | Caution actions | Reset Password, Change Settings |
| **danger** | Destructive actions | Delete, Remove, Kick Player |
| **ghost** | Subtle actions, icons | Toolbar buttons, icon buttons |
| **link** | Navigation, modal switching | "Forgot password?", "Register here" |

### Button Size Guidelines

| Size | Use Case | Padding |
|------|----------|---------|
| **xs** | Icon buttons, badges | px-2 py-1 |
| **sm** | Secondary actions, links | px-3 py-1.5 |
| **md** | Default size | px-4 py-2 |
| **lg** | Primary CTAs, forms | px-6 py-3 |
| **xl** | Hero CTAs, emphasis | px-8 py-4 |

---

## Common Issues & Solutions

### Issue 1: Legacy Color References

**Problem**: Components reference `colors.warning.start`, `colors.team1.border`, etc., which don't exist in design system.

**Solution**: Replace with Tailwind utilities:
```tsx
// ❌ Before
style={{ background: `linear-gradient(to right, ${colors.warning.start}, ${colors.warning.end})` }}

// ✅ After
className="bg-gradient-to-r from-yellow-600 to-orange-600"
```

### Issue 2: Custom z-index Management

**Problem**: Modals have custom z-index values that may conflict.

**Solution**: Modal component handles z-index automatically. Remove custom values:
```tsx
// ❌ Before
<div className="fixed inset-0 z-[9999]">

// ✅ After
<Modal isOpen={isOpen}> {/* z-index handled internally */}
```

### Issue 3: Focus Trap Conflicts

**Problem**: Component uses `useFocusTrap` hook alongside Modal.

**Solution**: Remove custom focus trap, Modal handles it:
```tsx
// ❌ Before
const containerRef = useFocusTrap(isOpen);
<div ref={containerRef}>

// ✅ After
<Modal isOpen={isOpen}> {/* Focus trap built-in */}
```

### Issue 4: Body Scroll Lock

**Problem**: Custom `useEffect` to lock body scroll.

**Solution**: Modal handles scroll lock automatically. Remove:
```tsx
// ❌ Before
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}, [isOpen]);

// ✅ After
{/* Modal handles scroll lock */}
```

### Issue 5: Loading State Display

**Problem**: Manual loading text in button.

**Solution**: Use Button's `loading` prop:
```tsx
// ❌ Before
<button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// ✅ After
<Button loading={isLoading}>Submit</Button>
```

---

## Migration Checklist

Use this checklist for each modal migration:

### Pre-Migration
- [ ] Read component file
- [ ] Identify all custom buttons
- [ ] Note business logic (to preserve)
- [ ] Check for custom hooks (focus trap, scroll lock)
- [ ] Review prop interfaces

### Migration
- [ ] Import Modal and Button from `./ui`
- [ ] Replace modal wrapper with `<Modal>`
- [ ] Choose appropriate theme and size
- [ ] Replace all `<button>` with `<Button>`
- [ ] Map button styling to variants
- [ ] Move action buttons to `footer` prop
- [ ] Add subtitle if needed
- [ ] Remove custom close button
- [ ] Remove custom hooks (focus, scroll)
- [ ] Update color references to Tailwind

### Testing
- [ ] TypeScript compiles without errors
- [ ] Modal opens and closes
- [ ] ESC key works
- [ ] Backdrop click works (if enabled)
- [ ] Form submission works
- [ ] Loading states display
- [ ] Error messages show
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Keyboard navigation works

### Documentation
- [ ] Update component comments
- [ ] Note any special considerations
- [ ] Add to migration tracking doc

---

## Results Summary

### Completed Migrations (6 components)

| Component | Lines Before | Lines After | Reduction | Theme | Size |
|-----------|--------------|-------------|-----------|-------|------|
| LoginModal | 188 | 161 | -14.4% | blue | sm |
| RegisterModal | 339 | 319 | -5.9% | purple | sm |
| PasswordResetModal | 167 | 152 | -9.0% | blue | sm |
| SwapConfirmationModal | 145 | 113 | -22.1% | blue | sm |
| BotTakeoverModal | 126 | 101 | -19.8% | blue | md |
| CatchUpModal | 190 | 136 | -28.4% | green | lg |
| **TOTAL** | **1,155** | **982** | **-15.0%** | — | — |

### Benefits Achieved

✅ **Code Quality**:
- 173 lines removed
- Cleaner, more maintainable code
- Single source of truth for modal/button styling

✅ **Consistency**:
- Uniform modal behavior (ESC, backdrop, animations)
- Standardized button variants
- Predictable UX across all modals

✅ **Accessibility**:
- Built-in focus trap
- Proper ARIA attributes
- Keyboard navigation
- Screen reader friendly

✅ **UX Improvements**:
- Mobile full-screen optimization
- Loading spinners on buttons
- Smooth animations
- Body scroll lock

---

## Next Steps

### Immediate (Sprint 22)
1. ✅ Complete P0-P1 migrations (6/6 done)
2. 📝 Create migration guide (this document)
3. 🔄 Begin P2 migrations (feature modals)

### Short-term (Sprint 23)
4. Migrate P2: PlayerProfileModal, KeyboardShortcutsModal, ProfileEditorModal, TutorialProgressModal
5. Update Storybook stories for migrated modals
6. Create visual regression tests

### Long-term (Sprint 24+)
7. Migrate P3: Complex modals (stats, leaderboard)
8. Migrate P4: Debug modals
9. Audit remaining custom buttons across codebase
10. Create automated migration script (AST-based)

---

## References

- **Storybook Modal**: `frontend/src/components/ui/Modal.tsx`
- **Storybook Button**: `frontend/src/components/ui/Button.tsx`
- **Migration Commits**:
  - Auth modals: `e485e80`
  - Game flow modals: `1981708`

---

**Last Updated**: 2025-11-28
**Progress**: 6/15 modals (40%)
**Code Reduction**: 173 lines (-15.0%)
**Status**: ✅ P0-P1 Complete, 🔄 P2 In Progress
