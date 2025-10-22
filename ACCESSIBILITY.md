# Accessibility Guidelines

## Dark Mode Contrast Ratios

This document tracks WCAG AA/AAA compliance for dark mode color combinations.

### WCAG Standards
- **AA Large Text** (18pt+): Minimum 3:1 contrast ratio
- **AA Normal Text** (< 18pt): Minimum 4.5:1 contrast ratio
- **AAA Large Text** (18pt+): Minimum 4.5:1 contrast ratio
- **AAA Normal Text** (< 18pt): Minimum 7:1 contrast ratio

### Current Dark Mode Combinations

#### Background Colors
- `dark:bg-gray-800` (#1F2937) - Main backgrounds
- `dark:bg-gray-700` (#374151) - Secondary backgrounds
- `dark:bg-gray-600` (#4B5563) - Tertiary backgrounds

#### Text Colors
- `dark:text-gray-100` (#F3F4F6) - Primary text (on gray-800: ~12:1 ✅ AAA)
- `dark:text-gray-200` (#E5E7EB) - Secondary text (on gray-800: ~10:1 ✅ AAA)
- `dark:text-gray-300` (#D1D5DB) - Tertiary text (on gray-800: ~8:1 ✅ AAA)
- `dark:text-gray-400` (#9CA3AF) - Muted text (on gray-800: ~5:1 ✅ AA)

#### Team Colors (with semi-transparency)
- **Team 1 (Orange):**
  - Background: `dark:bg-orange-900/40` (semi-transparent)
  - Text: `dark:text-orange-200` (#FED7AA)
  - Border: `dark:border-orange-600` (#EA580C)
  - Status: ✅ Good contrast when layered

- **Team 2 (Purple):**
  - Background: `dark:bg-purple-900/40` (semi-transparent)
  - Text: `dark:text-purple-200` (#E9D5FF)
  - Border: `dark:border-purple-600` (#9333EA)
  - Status: ✅ Good contrast when layered

### Animation Performance

#### Prefers-Reduced-Motion Support
All animations are disabled for users with `prefers-reduced-motion: reduce` preference:
- Card slide animations reduced to 0.01ms
- Trick collection animations reduced to 0.01ms
- Score pop animations reduced to 0.01ms
- Transitions reduced to 0.01ms

Implementation: `frontend/src/index.css` lines 14-23

### Keyboard Navigation

#### Current Support
- Tab navigation through interactive elements
- Focus visible on buttons and inputs
- Modal dialogs trap focus

#### Recommended Improvements
- [ ] Add skip-to-content link
- [ ] Add keyboard shortcuts (documented in tooltips)
- [ ] Improve focus indicator visibility in dark mode
- [ ] Add aria-labels to icon-only buttons

### Screen Reader Support

#### Current Implementation
- Semantic HTML elements used throughout
- `role="tooltip"` on Tooltip component
- Modal dialogs have proper ARIA attributes

#### Recommended Improvements
- [ ] Add ARIA live regions for game state changes
- [ ] Add screen reader announcements for turn changes
- [ ] Add descriptive labels for card images
- [ ] Add ARIA labels for team scores and round info

### Touch Target Sizes

All interactive elements meet minimum 44x44px touch target size (WCAG 2.1 Level AAA):
- ✅ Buttons: Minimum 44px height with padding
- ✅ Cards: 64px+ width on mobile
- ✅ Toggle switches: 44px+ height

### Color Blind Accessibility

Current considerations:
- ✅ Team colors (orange vs purple) distinguishable by value, not just hue
- ✅ Card colors use symbols in addition to colors
- ✅ Trump suit indicated with text label, not just color
- ⚠️ Warning/error states could use additional indicators beyond color

Recommended improvements:
- [ ] Add patterns/textures to card suits for better differentiation
- [ ] Add icons to warning/error messages
- [ ] Test with color blind simulation tools

### Focus Management

Current implementation:
- ✅ Modal dialogs trap focus
- ✅ Chat panel manages focus on open/close
- ✅ Leaderboard modal manages focus

Recommended improvements:
- [ ] Return focus to trigger element when closing modals
- [ ] Add visible focus ring in dark mode (currently using default)
- [ ] Test keyboard navigation flow through all game phases

### Testing Checklist

- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test keyboard navigation only (no mouse)
- [ ] Test with browser zoom at 200%
- [ ] Test with Windows High Contrast mode
- [ ] Test with prefers-reduced-motion enabled
- [ ] Test with color blind simulation (Deuteranopia, Protanopia, Tritanopia)
- [ ] Validate HTML with aXe DevTools
- [ ] Check contrast ratios with WebAIM Contrast Checker

### References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Tailwind CSS: Dark Mode](https://tailwindcss.com/docs/dark-mode)

---

*Last updated: 2025-01-20*
