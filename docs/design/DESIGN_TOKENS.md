# Design Token System

**Sprint 21**: Standardized design system for UI consistency
**Status**: ✅ Phase 1 Complete
**Location**: `frontend/src/design-system/`

---

## 📁 File Structure

```
frontend/src/design-system/
├── colors.ts          # Color palette and gradients
├── typography.ts      # Typography scale
├── spacing.ts         # Spacing scale
├── shadows.ts         # Shadow definitions
├── breakpoints.ts     # Responsive breakpoints
└── index.ts           # Main export file
```

---

## 🎨 Colors (`colors.ts`)

### Usage

```typescript
import { colors, getGradient, getTeamColor } from '@/design-system';

// Use color values
const primaryColor = colors.primary[600]; // '#2563eb'

// Use gradient classes
className={`bg-gradient-to-r ${colors.gradients.primary}`}

// Use helper function
className={getGradient('primary', true)} // Includes hover
```

### Color Palette

#### Brand Colors
- **Primary** (Blue): `colors.primary[50-900]`
  - Main: `#2563eb` (600)
- **Secondary** (Purple): `colors.secondary[50-900]`
  - Main: `#9333ea` (600)

#### Semantic Colors
- **Success** (Green): `colors.success[50-900]`
- **Warning** (Yellow): `colors.warning[50-900]`
- **Error** (Red): `colors.error[50-900]`
- **Info** (Blue): `colors.info[50-900]`

#### Team Colors
- **Team 1** (Orange): `colors.team1[50-900]`
- **Team 2** (Purple): `colors.team2[50-900]`

#### Parchment Theme (Light Mode)
- **Parchment**: `colors.parchment[50-900]`
- **Umber**: `colors.umber[50-900]`

### Standardized Gradients

#### Primary Gradients
```typescript
colors.gradients.primary           // from-blue-600 to-purple-600
colors.gradients.primaryHover      // from-blue-700 to-purple-700
colors.gradients.primaryDark       // from-blue-700 to-purple-800
colors.gradients.primaryDarkHover  // from-blue-600 to-purple-700
```

#### Semantic Gradients
```typescript
colors.gradients.success    // from-green-600 to-emerald-600
colors.gradients.warning    // from-yellow-600 to-orange-600
colors.gradients.error      // from-red-600 to-rose-600
colors.gradients.info       // from-blue-600 to-cyan-600
```

#### Team Gradients
```typescript
colors.gradients.team1       // from-orange-600 to-amber-600
colors.gradients.team1Hover  // from-orange-700 to-amber-700
colors.gradients.team2       // from-purple-600 to-indigo-600
colors.gradients.team2Hover  // from-purple-700 to-indigo-700
```

#### Quest System Gradients
```typescript
colors.gradients.questDaily         // from-blue-600 to-purple-600
colors.gradients.questDailyHover    // from-blue-700 to-purple-700
colors.gradients.questRewards       // from-pink-600 to-orange-600
colors.gradients.questRewardsHover  // from-pink-700 to-orange-700
```

#### Stats Gradients
```typescript
// Light mode
colors.gradients.statsMain              // from-umber-700 to-amber-800
colors.gradients.statsLeaderboard       // from-amber-700 to-orange-700
colors.gradients.statsRecent            // from-purple-600 to-pink-600

// Dark mode
colors.gradients.statsMainDark          // from-blue-700 to-blue-800
colors.gradients.statsLeaderboardDark   // from-indigo-700 to-indigo-800
colors.gradients.statsRecentDark        // from-purple-700 to-pink-800
```

### Helper Functions

```typescript
// Get gradient with hover
getGradient('primary', true)
// Returns: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'

// Get team color by ID
getTeamColor(1, 600)  // Returns: colors.team1[600] (orange)
getTeamColor(2, 600)  // Returns: colors.team2[600] (purple)

// Get semantic color
getSemanticColor('success', 600)  // Returns: colors.success[600] (green)
```

---

## ✍️ Typography (`typography.ts`)

### Usage

```typescript
import { typography, getHeading, getResponsiveHeading } from '@/design-system';

// Use typography classes
className={typography.h1}  // 'text-4xl font-bold leading-tight'

// Use helper functions
className={getHeading('h1', 'text-gray-900 dark:text-white')}
className={getResponsiveHeading('h1')}  // Responsive heading
```

### Typography Scale

#### Headings
```typescript
typography.h1  // text-4xl font-bold leading-tight
typography.h2  // text-3xl font-bold leading-tight
typography.h3  // text-2xl font-bold leading-snug
typography.h4  // text-xl font-bold leading-snug
typography.h5  // text-lg font-semibold leading-normal
typography.h6  // text-base font-semibold leading-normal
```

#### Body Text
```typescript
typography.body       // text-base leading-relaxed
typography.bodyLarge  // text-lg leading-relaxed
typography.bodySmall  // text-sm leading-relaxed
```

#### Caption and Labels
```typescript
typography.caption      // text-xs leading-normal
typography.captionBold  // text-xs font-semibold leading-normal
typography.label        // text-sm font-medium leading-normal
typography.labelSmall   // text-xs font-medium leading-normal
```

#### Display (Hero Text)
```typescript
typography.display1  // text-5xl font-bold leading-tight
typography.display2  // text-6xl font-bold leading-tight
```

### Responsive Headings

Automatically adjust size based on screen width:

```typescript
typography.responsive.h1  // text-2xl md:text-3xl lg:text-4xl font-bold
typography.responsive.h2  // text-xl md:text-2xl lg:text-3xl font-bold
typography.responsive.h3  // text-lg md:text-xl lg:text-2xl font-bold
typography.responsive.h4  // text-base md:text-lg lg:text-xl font-bold
```

### Utility Classes

#### Font Weights
```typescript
typography.weights.thin       // font-thin
typography.weights.light      // font-light
typography.weights.normal     // font-normal
typography.weights.medium     // font-medium
typography.weights.semibold   // font-semibold
typography.weights.bold       // font-bold
typography.weights.extrabold  // font-extrabold
typography.weights.black      // font-black
```

#### Text Alignment
```typescript
typography.align.left     // text-left
typography.align.center   // text-center
typography.align.right    // text-right
typography.align.justify  // text-justify
```

#### Text Transforms
```typescript
typography.transform.uppercase    // uppercase
typography.transform.lowercase    // lowercase
typography.transform.capitalize   // capitalize
```

#### Text Overflow
```typescript
typography.overflow.truncate  // truncate (ellipsis for single line)
typography.overflow.ellipsis  // text-ellipsis
typography.overflow.clip      // text-clip
```

---

## 📏 Spacing (`spacing.ts`)

### Usage

```typescript
import { spacing, getPadding, getMargin, getGap } from '@/design-system';

// Use spacing classes
className={spacing.padding.md}      // p-4 (16px)
className={spacing.gap.lg}          // gap-6 (24px)
className={spacing.button.md}       // py-3 px-4 (button padding)

// Use helper functions
className={getPadding('md', 'x')}   // px-4 (horizontal padding)
className={getMargin('lg', 'y')}    // my-6 (vertical margin)
```

### Spacing Scale

#### Base Values (rem)
```typescript
spacing.values.xs    // 0.5rem  (8px)
spacing.values.sm    // 0.75rem (12px)
spacing.values.md    // 1rem    (16px)
spacing.values.lg    // 1.5rem  (24px)
spacing.values.xl    // 2rem    (32px)
spacing.values['2xl'] // 3rem   (48px)
spacing.values['3xl'] // 4rem   (64px)
spacing.values['4xl'] // 6rem   (96px)
```

#### Padding
```typescript
spacing.padding.xs    // p-2  (8px all sides)
spacing.padding.sm    // p-3  (12px all sides)
spacing.padding.md    // p-4  (16px all sides)
spacing.padding.lg    // p-6  (24px all sides)
spacing.padding.xl    // p-8  (32px all sides)
spacing.padding['2xl'] // p-12 (48px all sides)
```

#### Padding X (Horizontal)
```typescript
spacing.paddingX.xs   // px-2  (8px left/right)
spacing.paddingX.sm   // px-3  (12px left/right)
spacing.paddingX.md   // px-4  (16px left/right)
spacing.paddingX.lg   // px-6  (24px left/right)
```

#### Padding Y (Vertical)
```typescript
spacing.paddingY.xs   // py-2  (8px top/bottom)
spacing.paddingY.sm   // py-3  (12px top/bottom)
spacing.paddingY.md   // py-4  (16px top/bottom)
spacing.paddingY.lg   // py-6  (24px top/bottom)
```

#### Gap (Flexbox/Grid)
```typescript
spacing.gap.xs   // gap-2  (8px)
spacing.gap.sm   // gap-3  (12px)
spacing.gap.md   // gap-4  (16px)
spacing.gap.lg   // gap-6  (24px)
spacing.gap.xl   // gap-8  (32px)
```

### Component Spacing

Pre-defined spacing for common UI elements:

```typescript
spacing.component.cardPadding       // p-6
spacing.component.modalPadding      // p-6
spacing.component.panelPadding      // p-4
spacing.component.listItemPadding   // py-3 px-4
spacing.component.inputPadding      // py-2 px-3
spacing.component.buttonGroupGap    // gap-3
spacing.component.formFieldGap      // space-y-4
spacing.component.sectionGap        // space-y-6
```

### Button Padding Variants

```typescript
spacing.button.sm   // py-2 px-3  (Small button)
spacing.button.md   // py-3 px-4  (Medium button - default)
spacing.button.lg   // py-4 px-6  (Large button)
spacing.button.xl   // py-4 px-8  (Extra large button)
```

---

## 🌑 Shadows (`shadows.ts`)

### Usage

```typescript
import { shadows, getShadow } from '@/design-system';

// Use shadow classes
className={shadows.md}              // shadow
className={shadows.card}            // shadow-md hover:shadow-lg

// Use helper function
className={getShadow('lg', true)}   // lg shadow with hover effect
```

### Shadow Scale

```typescript
shadows.none   // shadow-none
shadows.sm     // shadow-sm
shadows.md     // shadow
shadows.lg     // shadow-lg
shadows.xl     // shadow-xl
shadows['2xl'] // shadow-2xl
shadows.inner  // shadow-inner (inset shadow)
```

### Colored Shadows

For emphasis and visual hierarchy:

```typescript
shadows.colored.primary    // shadow-lg shadow-blue-500/50
shadows.colored.secondary  // shadow-lg shadow-purple-500/50
shadows.colored.success    // shadow-lg shadow-green-500/50
shadows.colored.warning    // shadow-lg shadow-yellow-500/50
shadows.colored.error      // shadow-lg shadow-red-500/50
```

### Component Shadows

```typescript
shadows.card      // shadow-md hover:shadow-lg transition-shadow duration-200
shadows.modal     // shadow-2xl
shadows.button    // shadow hover:shadow-md transition-shadow duration-200
shadows.dropdown  // shadow-xl
shadows.tooltip   // shadow-lg
```

---

## 📱 Breakpoints (`breakpoints.ts`)

### Usage

```typescript
import { breakpoints, isBreakpoint } from '@/design-system';

// Use breakpoint values
const smBreakpoint = breakpoints.values.sm;  // '640px'

// Use media queries
@media ${breakpoints.up.md} {
  /* Styles for tablets and up */
}

// Check breakpoint in JavaScript
if (isBreakpoint('md')) {
  // Tablet or larger
}
```

### Breakpoint Values

Matches Tailwind CSS defaults:

```typescript
breakpoints.values.sm    // 640px  (Small devices - phones)
breakpoints.values.md    // 768px  (Medium devices - tablets)
breakpoints.values.lg    // 1024px (Large devices - desktops)
breakpoints.values.xl    // 1280px (Extra large - large desktops)
breakpoints.values['2xl'] // 1536px (2X Extra large - larger desktops)
```

### Media Query Helpers

#### Min-width (Mobile-first)
```typescript
breakpoints.up.sm    // @media (min-width: 640px)
breakpoints.up.md    // @media (min-width: 768px)
breakpoints.up.lg    // @media (min-width: 1024px)
breakpoints.up.xl    // @media (min-width: 1280px)
breakpoints.up['2xl'] // @media (min-width: 1536px)
```

#### Max-width (Desktop-first)
```typescript
breakpoints.down.sm    // @media (max-width: 639px)
breakpoints.down.md    // @media (max-width: 767px)
breakpoints.down.lg    // @media (max-width: 1023px)
breakpoints.down.xl    // @media (max-width: 1279px)
breakpoints.down['2xl'] // @media (max-width: 1535px)
```

### Responsive Visibility

Hide/show elements based on screen size:

```typescript
// Hide
breakpoints.hide.mobile   // hidden sm:block (Hide on mobile)
breakpoints.hide.tablet   // hidden md:block (Hide on tablet)
breakpoints.hide.desktop  // block lg:hidden (Hide on desktop)

// Show
breakpoints.show.mobile   // block sm:hidden (Show on mobile only)
breakpoints.show.tablet   // hidden sm:block md:hidden (Show on tablet only)
breakpoints.show.desktop  // hidden lg:block (Show on desktop only)
```

---

## 🔧 Helper Functions

### Colors

```typescript
getGradient(variant, hover?)
// Example: getGradient('primary', true)
// Returns: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'

getTeamColor(teamId, shade?)
// Example: getTeamColor(1, 600)
// Returns: '#ea580c' (Team 1 orange)

getSemanticColor(type, shade?)
// Example: getSemanticColor('success', 600)
// Returns: '#16a34a' (Success green)
```

### Typography

```typescript
getTypography(variant, additionalClasses?)
// Example: getTypography('h1', 'text-gray-900')
// Returns: 'text-4xl font-bold leading-tight text-gray-900'

getHeading(level, colorClass?)
// Example: getHeading('h1', 'text-white')
// Returns: 'text-4xl font-bold leading-tight text-white'

getResponsiveHeading(level, colorClass?)
// Example: getResponsiveHeading('h1')
// Returns: 'text-2xl md:text-3xl lg:text-4xl font-bold leading-tight'
```

### Spacing

```typescript
getSpacing(size)
// Example: getSpacing('md')
// Returns: '1rem'

getPadding(size, direction?)
// Example: getPadding('md', 'x')
// Returns: 'px-4'

getMargin(size, direction?)
// Example: getMargin('lg', 'y')
// Returns: 'my-6'

getGap(size)
// Example: getGap('md')
// Returns: 'gap-4'
```

### Shadows

```typescript
getShadow(size, hover?)
// Example: getShadow('lg', true)
// Returns: 'shadow-lg hover:shadow-lg transition-shadow duration-200'
```

### Breakpoints

```typescript
isBreakpoint(breakpoint)
// Example: isBreakpoint('md')
// Returns: true if viewport >= 768px
```

---

## 📝 Migration Guide

### Before (Inline Tailwind Classes)

```tsx
<button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-bold shadow hover:shadow-md transition-all duration-200">
  Click Me
</button>
```

### After (Design Tokens)

```tsx
import { colors, spacing, shadows } from '@/design-system';

<button className={`bg-gradient-to-r ${colors.gradients.primary} hover:${colors.gradients.primaryHover} text-white ${spacing.button.md} rounded-lg font-bold ${shadows.button} transition-all duration-200`}>
  Click Me
</button>
```

### Even Better (Component with Tokens)

```tsx
import { getGradient, spacing, shadows } from '@/design-system';

<button className={`${getGradient('primary', true)} text-white ${spacing.button.md} rounded-lg font-bold ${shadows.button} transition-all duration-200`}>
  Click Me
</button>
```

---

## 🎯 Benefits

### Consistency
- **Before**: 15+ gradient variations across codebase
- **After**: 5 standardized gradients with hover states

### Maintainability
- **Before**: Change color in 50+ files
- **After**: Change color in 1 file (`colors.ts`)

### Type Safety
- **Before**: Typo in class name = silent failure
- **After**: TypeScript autocomplete + compile-time checks

### Documentation
- **Before**: No central reference
- **After**: Single source of truth in `design-system/`

### Reusability
- **Before**: Copy-paste Tailwind classes
- **After**: Import and use helper functions

---

## 🚀 Next Steps (Sprint 21 Phase 2)

1. **Refactor Button Component**
   - Use `colors.gradients` instead of inline classes
   - Use `spacing.button` for padding variants
   - Use `shadows.button` for elevation

2. **Add Storybook Stories**
   - Card component story
   - Avatar component story
   - Toast component story
   - Quest component stories

3. **Accessibility Audit**
   - Color contrast testing (WCAG AA)
   - Keyboard navigation
   - Screen reader testing

---

**Last Updated**: 2025-11-27
**Sprint**: 21 (UI Improvement & Refactoring)
**Phase**: 1 Complete ✅
