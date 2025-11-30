/**
 * Card Component Stories - Retro Gaming Edition
 *
 * Showcases the playing card component with distinctive neon glow effects
 * for each suit color, pixel-perfect borders, and arcade-style animations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardBack, CardStack } from '../../Card';
import { CardColor, CardValue, Card as CardType } from '../../../types/game';

const meta = {
  title: 'Game/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Playing card component with retro arcade aesthetics and neon glow effects.

## Features
- **4 suit colors**: Red, Brown, Green, Blue - each with unique neon glow
- **4 sizes**: tiny, small, medium, large
- **Special cards**: Red 0 (+5 points), Brown 0 (-2 points)
- **Playable state**: Glowing pulse animation for valid plays
- **Keyboard navigation**: Focus ring support for accessibility
- **Card back**: Patterned design for opponent hands
- **Card stack**: Deck visualization component
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['tiny', 'small', 'medium', 'large'],
      description: 'Card size variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state (cannot be played)',
    },
    isPlayable: {
      control: 'boolean',
      description: 'Show playable glow animation',
    },
    isKeyboardSelected: {
      control: 'boolean',
      description: 'Keyboard selection ring',
    },
    faceDown: {
      control: 'boolean',
      description: 'Show card back instead of face',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;
type RenderOnlyStory = StoryObj<typeof Card>; // For render-only stories without args

// ============================================================================
// SUIT COLORS
// ============================================================================

export const RedCard: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Red suit card with pink neon glow effect.',
      },
    },
  },
};

export const BrownCard: Story = {
  args: {
    card: { color: 'brown', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Brown suit card with amber neon glow effect.',
      },
    },
  },
};

export const GreenCard: Story = {
  args: {
    card: { color: 'green', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Green suit card with mint neon glow effect.',
      },
    },
  },
};

export const BlueCard: Story = {
  args: {
    card: { color: 'blue', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Blue suit card with cyan neon glow effect.',
      },
    },
  },
};

// ============================================================================
// ALL COLORS SHOWCASE
// ============================================================================

export const AllColors: Story = {
  args: {
    card: { color: 'red', value: 7 },
  },
  render: () => {
    const colors: CardColor[] = ['red', 'brown', 'green', 'blue'];
    return (
      <div className="flex gap-6 p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
        {colors.map((color) => (
          <Card key={color} card={{ color, value: 7 }} size="medium" />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All four suit colors with their unique neon glow effects.',
      },
    },
  },
};

// ============================================================================
// SPECIAL CARDS
// ============================================================================

export const RedSpecial: Story = {
  args: {
    card: { color: 'red', value: 0 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Red 0 - Special card that awards +5 bonus points when won in a trick.',
      },
    },
  },
};

export const BrownSpecial: Story = {
  args: {
    card: { color: 'brown', value: 0 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Brown 0 - Special card that deducts -2 points when won in a trick.',
      },
    },
  },
};

export const SpecialCards: Story = {
  args: {
    card: { color: 'red', value: 0 },
  },
  render: () => (
    <div className="flex gap-8 p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <div className="flex flex-col items-center gap-3">
        <Card card={{ color: 'red', value: 0 }} size="large" />
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[var(--color-warning)] text-black text-xs font-display rounded-full shadow-[0_0_10px_var(--color-warning)]">
            +5 Points
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Card card={{ color: 'brown', value: 0 }} size="large" />
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[var(--color-error)] text-white text-xs font-display rounded-full shadow-[0_0_10px_var(--color-error)]">
            -2 Points
          </span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Both special cards with their point value indicators.',
      },
    },
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const TinySize: Story = {
  args: {
    card: { color: 'blue', value: 5 },
    size: 'tiny',
  },
};

export const SmallSize: Story = {
  args: {
    card: { color: 'green', value: 5 },
    size: 'small',
  },
};

export const MediumSize: Story = {
  args: {
    card: { color: 'red', value: 5 },
    size: 'medium',
  },
};

export const LargeSize: Story = {
  args: {
    card: { color: 'brown', value: 5 },
    size: 'large',
  },
};

export const AllSizes: RenderOnlyStory = {
  render: () => (
    <div className="flex items-end gap-4 p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <div className="flex flex-col items-center gap-2">
        <Card card={{ color: 'blue', value: 5 }} size="tiny" />
        <span className="text-[var(--color-text-muted)] text-xs font-display">Tiny</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Card card={{ color: 'green', value: 5 }} size="small" />
        <span className="text-[var(--color-text-muted)] text-xs font-display">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Card card={{ color: 'red', value: 5 }} size="medium" />
        <span className="text-[var(--color-text-muted)] text-xs font-display">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Card card={{ color: 'brown', value: 5 }} size="large" />
        <span className="text-[var(--color-text-muted)] text-xs font-display">Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All card size variants from tiny to large.',
      },
    },
  },
};

// ============================================================================
// STATES
// ============================================================================

export const Playable: Story = {
  args: {
    card: { color: 'green', value: 5 },
    size: 'medium',
    isPlayable: true,
    onClick: () => console.log('Card played!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Playable state with pulsing glow animation - indicates the card can be played this turn.',
      },
    },
  },
};

export const KeyboardSelected: Story = {
  args: {
    card: { color: 'blue', value: 6 },
    size: 'medium',
    isKeyboardSelected: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Keyboard selection ring for accessibility - used during keyboard navigation.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
    disabled: true,
    onClick: () => console.log('Card clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with X overlay - cannot be played (e.g., wrong suit).',
      },
    },
  },
};

export const FaceDown: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
    faceDown: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Face-down card showing the back pattern.',
      },
    },
  },
};

// ============================================================================
// ALL VALUES
// ============================================================================

export const AllValues: RenderOnlyStory = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <h3 className="font-display text-[var(--color-text-primary)] text-sm uppercase tracking-wider mb-4">
        Blue Suit (0-7)
      </h3>
      <div className="flex flex-wrap gap-2">
        {([0, 1, 2, 3, 4, 5, 6, 7] as const).map((value) => (
          <Card key={value} card={{ color: 'blue', value }} size="small" />
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All card values (0-7) for a single suit.',
      },
    },
  },
};

// ============================================================================
// CARD BACK COMPONENT
// ============================================================================

export const CardBackDefault: RenderOnlyStory = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <CardBack size="medium" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default card back design for opponent hands.',
      },
    },
  },
};

export const CardBackTeamColors: RenderOnlyStory = {
  render: () => (
    <div className="flex gap-6 p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <div className="flex flex-col items-center gap-2">
        <CardBack size="medium" teamColor={1} />
        <span className="text-[var(--color-team1-primary)] text-xs font-display">Team 1</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CardBack size="medium" teamColor={2} />
        <span className="text-[var(--color-team2-primary)] text-xs font-display">Team 2</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card backs with team color tinting.',
      },
    },
  },
};

// ============================================================================
// CARD STACK COMPONENT
// ============================================================================

export const CardStackDefault: RenderOnlyStory = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <CardStack count={8} size="medium" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card stack showing deck with count indicator.',
      },
    },
  },
};

export const CardStackSizes: RenderOnlyStory = {
  render: () => (
    <div className="flex gap-12 items-end p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <div className="flex flex-col items-center gap-4">
        <CardStack count={12} size="small" />
        <span className="text-[var(--color-text-muted)] text-xs font-display">Small</span>
      </div>
      <div className="flex flex-col items-center gap-4">
        <CardStack count={24} size="medium" />
        <span className="text-[var(--color-text-muted)] text-xs font-display">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-4">
        <CardStack count={32} size="large" />
        <span className="text-[var(--color-text-muted)] text-xs font-display">Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card stacks in different sizes.',
      },
    },
  },
};

// ============================================================================
// INTERACTIVE EXAMPLES
// ============================================================================

export const Interactive: Story = {
  args: {
    card: { color: 'green', value: 5 },
    size: 'large',
    onClick: () => alert('Card clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with click handler - hover for glow effect.',
      },
    },
  },
};

// ============================================================================
// GAME UI EXAMPLES
// ============================================================================

export const PlayerHand: RenderOnlyStory = {
  render: () => {
    const hand: CardType[] = [
      { color: 'red', value: 3 as CardValue },
      { color: 'blue', value: 5 as CardValue },
      { color: 'green', value: 7 as CardValue },
      { color: 'brown', value: 2 as CardValue },
      { color: 'red', value: 0 as CardValue },
      { color: 'blue', value: 4 as CardValue },
      { color: 'green', value: 1 as CardValue },
      { color: 'brown', value: 6 as CardValue },
    ];
    const playableIndices = [1, 5]; // Blue cards are playable (led suit)

    return (
      <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[var(--color-text-accent)] text-sm font-display uppercase">
            Led Suit: Blue
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {hand.map((card, i) => (
            <Card
              key={i}
              card={card}
              size="small"
              isPlayable={playableIndices.includes(i)}
              disabled={!playableIndices.includes(i)}
              onClick={() => console.log(`Played ${card.color} ${card.value}`)}
            />
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example player hand showing playable cards (following suit rule).',
      },
    },
  },
};

export const TrickInProgress: RenderOnlyStory = {
  render: () => {
    const trick: { card: CardType; player: string }[] = [
      { card: { color: 'blue', value: 5 as CardValue }, player: 'Player 1' },
      { card: { color: 'blue', value: 7 as CardValue }, player: 'Player 2' },
      { card: { color: 'green', value: 3 as CardValue }, player: 'Player 3' },
    ];

    return (
      <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
        <h3 className="font-display text-[var(--color-text-primary)] text-sm uppercase tracking-wider mb-4 text-center">
          Current Trick
        </h3>
        <div className="flex justify-center gap-4">
          {trick.map(({ card, player }, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Card card={card} size="medium" />
              <span className="text-[var(--color-text-muted)] text-xs">{player}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 opacity-50">
            <div className="w-24 h-36 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-default)] flex items-center justify-center">
              <span className="text-[var(--color-text-muted)] text-2xl">?</span>
            </div>
            <span className="text-[var(--color-text-muted)] text-xs">Waiting...</span>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example trick in progress showing played cards.',
      },
    },
  },
};

export const OpponentHand: RenderOnlyStory = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[var(--color-text-primary)] font-display text-sm">
          Opponent (Team 2)
        </span>
        <span className="text-[var(--color-text-muted)] text-xs">
          5 cards
        </span>
      </div>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <CardBack key={i} size="small" teamColor={2} />
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Opponent hand display with team-colored card backs.',
      },
    },
  },
};
