/**
 * ThemedBackground Component Stories
 *
 * Showcases ambient visual effects for each skin theme.
 * Effects include floating candles, sparkles, digital rain, bubbles, etc.
 *
 * Use the skin selector in the toolbar to see different theme effects.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ThemedBackground } from '../../ThemedBackground';
import { SettingsProvider } from '../../../contexts/SettingsContext';
import { SkinProvider } from '../../../contexts/SkinContext';

const meta = {
  title: 'Effects/ThemedBackground',
  component: ThemedBackground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Themed Background Effects

Ambient visual effects that adapt to the current skin theme. These decorative elements add atmosphere to the game without affecting gameplay.

## Effects by Theme

| Theme | Effect |
|-------|--------|
| **Tavern Noir** | Floating candle flames with warm flickering glow |
| **Midnight Alchemy** | Rising mystical particles (purple/violet orbs) |
| **Luxury Casino** | Golden star sparkles appearing and fading |
| **Cyberpunk Neon** | Digital rain falling (cyan, magenta, yellow) |
| **Ocean Depths** | Rising bubbles with subtle wobble |
| **Forest Enchanted** | Floating fireflies with pulsing glow |
| **Sakura Spring** | Falling cherry blossom petals |
| **Classic Parchment** | Drifting dust motes |
| **Modern Minimal** | Subtle geometric shapes drifting |

## Features

- **Performance Optimized**: Uses CSS animations for smooth 60fps
- **Accessibility**: Respects \`prefers-reduced-motion\`
- **Toggle**: Users can disable via Settings > Ambient Effects
- **Non-intrusive**: Fixed position, pointer-events disabled
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SkinProvider>
        <SettingsProvider>
          <div className="min-h-screen bg-skin-primary relative">
            <Story />
            <div className="relative z-10 flex items-center justify-center min-h-screen">
              <div className="p-8 rounded-lg bg-skin-secondary/80 backdrop-blur-sm border border-skin-default max-w-md text-center">
                <h2 className="text-2xl font-display text-skin-primary mb-4">
                  Themed Background Effects
                </h2>
                <p className="text-skin-secondary text-sm">
                  Use the skin selector in the toolbar to see how effects change per theme.
                  The floating particles adapt to each skin's aesthetic.
                </p>
              </div>
            </div>
          </div>
        </SettingsProvider>
      </SkinProvider>
    ),
  ],
} satisfies Meta<typeof ThemedBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view with effects enabled
 */
export const Default: Story = {
  args: {},
};

/**
 * Effects can be disabled via props
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Effects disabled via the `disabled` prop. No particles render.',
      },
    },
  },
};

/**
 * Shows all themes side by side (preview only - use skin selector for live demo)
 */
export const ThemeShowcase: Story = {
  render: () => (
    <SkinProvider>
      <SettingsProvider>
        <div className="min-h-screen bg-skin-primary p-8">
          <ThemedBackground />
          <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-display text-skin-primary text-center mb-8">
              Theme Effects Reference
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Tavern Noir', effect: 'Candle flames', icon: '🕯️', color: 'amber' },
                { name: 'Midnight Alchemy', effect: 'Mystical orbs', icon: '🔮', color: 'violet' },
                { name: 'Luxury Casino', effect: 'Golden sparkles', icon: '✨', color: 'yellow' },
                { name: 'Cyberpunk Neon', effect: 'Digital rain', icon: '🌧️', color: 'cyan' },
                { name: 'Ocean Depths', effect: 'Rising bubbles', icon: '🫧', color: 'blue' },
                { name: 'Forest Enchanted', effect: 'Fireflies', icon: '✨', color: 'lime' },
                { name: 'Sakura Spring', effect: 'Cherry petals', icon: '🌸', color: 'pink' },
                { name: 'Classic Parchment', effect: 'Dust motes', icon: '📜', color: 'amber' },
                { name: 'Modern Minimal', effect: 'Geometric drift', icon: '⬜', color: 'gray' },
              ].map((theme) => (
                <div
                  key={theme.name}
                  className="p-4 rounded-lg bg-skin-secondary border border-skin-default"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{theme.icon}</span>
                    <div>
                      <h3 className="font-display text-skin-primary text-sm">{theme.name}</h3>
                      <p className="text-skin-muted text-xs">{theme.effect}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-lg bg-skin-tertiary border border-skin-default text-center">
              <p className="text-skin-secondary text-sm">
                Select different skins from the toolbar dropdown to see live effects
              </p>
            </div>
          </div>
        </div>
      </SettingsProvider>
    </SkinProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference of all themed effects. Use the skin selector in the toolbar to see live effects.',
      },
    },
  },
};

/**
 * With game content overlay
 */
export const WithGameContent: Story = {
  render: () => (
    <SkinProvider>
      <SettingsProvider>
        <div className="min-h-screen bg-skin-primary relative">
          <ThemedBackground />
          <div className="relative z-10 p-6">
            {/* Mock game header */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-skin-secondary border border-skin-default mb-6">
              <span className="text-skin-primary font-display">Round 3</span>
              <div className="flex gap-4">
                <span className="text-team1">Team 1: 24</span>
                <span className="text-skin-muted">-</span>
                <span className="text-team2">Team 2: 18</span>
              </div>
            </div>

            {/* Mock card area */}
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-16 h-24 rounded-lg bg-skin-tertiary border-2 border-skin-default flex items-center justify-center"
                >
                  <span className="text-skin-muted text-2xl font-display">{i}</span>
                </div>
              ))}
            </div>

            {/* Mock trick area */}
            <div className="mx-auto w-64 h-40 rounded-lg bg-skin-tertiary/50 border border-skin-default flex items-center justify-center">
              <span className="text-skin-muted">Trick Area</span>
            </div>
          </div>
        </div>
      </SettingsProvider>
    </SkinProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how effects appear behind game content. Effects are purely decorative and don\'t interfere with gameplay.',
      },
    },
  },
};
