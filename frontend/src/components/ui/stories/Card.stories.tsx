/**
 * Card Component Stories
 *
 * Showcases the playing card component with elemental color theming
 * and various visual states. Adapts to the selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardBack, CardStack, ElegantCardDisplay } from '../../Card';
import { CardColor, CardValue, Card as CardType } from '../../../types/game';

const meta = {
  title: 'Game/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Playing Cards

Playing cards with elemental color theming. Adapts to the selected skin theme.

## Features
- **4 elemental suits**: Fire (Red), Earth (Brown), Nature (Green), Water (Blue)
- **4 sizes**: tiny, small, medium, large
- **Special cards**: Fire Zero (+5 points), Earth Zero (-2 points)
- **Playable state**: Pulse animation for valid plays
- **Keyboard navigation**: Focus ring for accessibility
- **Card back**: Decorative pattern
- **Card stack**: Deck visualization

Use the skin selector in the toolbar to see how cards adapt to different themes.
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
      description: 'Show playable ethereal glow animation',
    },
    isKeyboardSelected: {
      control: 'boolean',
      description: 'Sacred geometry keyboard selection ring',
    },
    faceDown: {
      control: 'boolean',
      description: 'Show alchemical card back',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;
type RenderOnlyStory = StoryObj<typeof Card>;

// ============================================================================
// ELEMENTAL SUITS
// ============================================================================

export const FireElement: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fire element card (Red) - Represents passion and transformation with crimson ethereal glow.',
      },
    },
  },
};

export const EarthElement: Story = {
  args: {
    card: { color: 'brown', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Earth element card (Brown) - Represents stability and grounding with amber glow.',
      },
    },
  },
};

export const NatureElement: Story = {
  args: {
    card: { color: 'green', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Nature element card (Green) - Represents growth and harmony with emerald glow.',
      },
    },
  },
};

export const WaterElement: Story = {
  args: {
    card: { color: 'blue', value: 7 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Water element card (Blue) - Represents intuition and flow with sapphire glow.',
      },
    },
  },
};

// ============================================================================
// ALL ELEMENTS SHOWCASE
// ============================================================================

export const ElementalQuartet: Story = {
  args: {
    card: { color: 'red', value: 7 },
  },
  render: () => {
    const elements: { color: CardColor; symbol: string; name: string }[] = [
      { color: 'red', symbol: '△', name: 'Fire' },
      { color: 'brown', symbol: '◇', name: 'Earth' },
      { color: 'green', symbol: '☘', name: 'Nature' },
      { color: 'blue', symbol: '▽', name: 'Water' },
    ];

    return (
      <div className="p-8 rounded-xl bg-skin-secondary border-2 border-skin-accent shadow-lg">
        <h3 className="text-center uppercase tracking-[0.15em] mb-6 text-skin-accent">
          The Four Elements
        </h3>
        <div className="flex gap-6">
          {elements.map(({ color, symbol, name }) => (
            <div key={color} className="flex flex-col items-center gap-3">
              <Card card={{ color, value: 7 }} size="medium" />
              <div className="text-center">
                <div className="text-2xl mb-1">{symbol}</div>
                <span className="text-xs uppercase tracking-wider text-skin-muted">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All four elemental suits with their alchemical symbols.',
      },
    },
  },
};

// ============================================================================
// SPECIAL CARDS (ARCANA)
// ============================================================================

export const FireArcana: Story = {
  args: {
    card: { color: 'red', value: 0 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Fire Zero (The Phoenix) - Arcana card that awards +5 essence when captured.',
      },
    },
  },
};

export const EarthArcana: Story = {
  args: {
    card: { color: 'brown', value: 0 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Earth Zero (The Void) - Arcana card that deducts -2 essence when captured.',
      },
    },
  },
};

export const SpecialCards: Story = {
  args: {
    card: { color: 'red', value: 0 },
  },
  render: () => (
    <div className="p-8 rounded-xl bg-skin-secondary border-2 border-skin-accent shadow-lg">
      <h3 className="text-center uppercase tracking-[0.15em] mb-6 text-skin-accent">
        Special Cards
      </h3>
      <div className="flex gap-12 justify-center">
        <div className="flex flex-col items-center gap-4">
          <ElegantCardDisplay card={{ color: 'red', value: 0 }} size="large" spotlight />
          <div className="text-center">
            <div className="text-sm uppercase tracking-wider mb-1 text-skin-accent">Red Zero</div>
            <span className="px-3 py-1 rounded-full text-xs inline-block bg-green-500/30 text-green-300 border border-green-500/50">
              +5 Points
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <ElegantCardDisplay card={{ color: 'brown', value: 0 }} size="large" spotlight />
          <div className="text-center">
            <div className="text-sm uppercase tracking-wider mb-1 text-skin-accent">Brown Zero</div>
            <span className="px-3 py-1 rounded-full text-xs inline-block bg-red-500/30 text-red-300 border border-red-500/50">
              -2 Points
            </span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Both Arcana cards with their essence values and mystical spotlight effects.',
      },
    },
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const AllSizes: RenderOnlyStory = {
  render: () => (
    <div className="p-8 rounded-xl bg-skin-primary border border-skin-default">
      <div className="flex items-end gap-6">
        {(['tiny', 'small', 'medium', 'large'] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-3">
            <Card card={{ color: 'blue', value: 5 }} size={size} />
            <span className="text-xs uppercase tracking-wider text-skin-muted">{size}</span>
          </div>
        ))}
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
    onClick: () => console.log('Card channeled!'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Playable state with ethereal pulse animation - indicates the card can be channeled this turn.',
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
        story: 'Sacred geometry keyboard selection ring for accessibility navigation.',
      },
    },
  },
};

export const Sealed: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
    disabled: true,
    onClick: () => console.log('Card is sealed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Sealed state with arcane seal overlay - cannot be played.',
      },
    },
  },
};

export const Hidden: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
    faceDown: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Face-down card showing the alchemical circle pattern.',
      },
    },
  },
};

// ============================================================================
// ALL VALUES
// ============================================================================

export const WaterSuit: RenderOnlyStory = {
  render: () => (
    <div className="p-8 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="uppercase tracking-wider mb-4 text-suit-blue">Water Suit (0-7)</h3>
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
        story: 'All card values (0-7) for the Water (Blue) suit.',
      },
    },
  },
};

// ============================================================================
// CARD BACK COMPONENT
// ============================================================================

export const CardBackDesign: RenderOnlyStory = {
  render: () => (
    <div className="p-8 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-center uppercase tracking-wider mb-4 text-skin-accent">Card Back</h3>
      <div className="flex justify-center">
        <CardBack size="large" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card back with alchemical circle pattern and sacred geometry.',
      },
    },
  },
};

export const TeamCards: RenderOnlyStory = {
  render: () => (
    <div className="p-8 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-center uppercase tracking-wider mb-4 text-skin-accent">Team Cards</h3>
      <div className="flex gap-8 justify-center">
        <div className="flex flex-col items-center gap-3">
          <CardBack size="medium" teamColor={1} />
          <span className="text-xs uppercase text-team1">Team 1</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <CardBack size="medium" teamColor={2} />
          <span className="text-xs uppercase text-team2">Team 2</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card backs with guild (team) color tinting.',
      },
    },
  },
};

// ============================================================================
// CARD STACK COMPONENT
// ============================================================================

export const DeckStack: RenderOnlyStory = {
  render: () => (
    <div className="p-8 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-center uppercase tracking-wider mb-4 text-skin-accent">The Deck</h3>
      <div className="flex justify-center">
        <CardStack count={32} size="medium" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card stack showing deck with ethereal count indicator.',
      },
    },
  },
};

// ============================================================================
// ELEGANT DISPLAY COMPONENT
// ============================================================================

export const SpotlightDisplay: RenderOnlyStory = {
  render: () => (
    <div className="p-8 rounded-xl bg-skin-secondary border-2 border-skin-accent shadow-lg">
      <h3 className="text-center uppercase tracking-[0.15em] mb-6 text-skin-accent">
        Featured Card
      </h3>
      <div className="flex justify-center">
        <ElegantCardDisplay card={{ color: 'red', value: 7 }} size="large" spotlight />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Elegant card display with dramatic ethereal spotlight effect.',
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
    const playableIndices = [1, 5]; // Water cards are playable (led suit)

    return (
      <div className="p-8 rounded-xl bg-skin-primary border border-skin-default">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm uppercase tracking-wider text-suit-blue">
            Led Suit: Blue (Water)
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
        story: 'Example alchemist hand showing playable cards (following element rule).',
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
      <div className="p-8 rounded-xl bg-skin-secondary border-2 border-skin-accent shadow-lg">
        <h3 className="text-center uppercase tracking-[0.15em] mb-6 text-skin-accent">
          Current Trick
        </h3>
        <div className="flex justify-center gap-4">
          {trick.map(({ card, player }, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Card card={card} size="medium" />
              <span className="text-xs text-skin-muted">{player}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-3 opacity-50">
            <div className="w-24 h-36 rounded-lg border-2 border-dashed border-skin-accent flex items-center justify-center">
              <span className="text-2xl text-skin-muted">?</span>
            </div>
            <span className="text-xs text-skin-muted">Awaiting...</span>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example ritual (trick) in progress showing channeled cards.',
      },
    },
  },
};

// ============================================================================
// CARD SHOWCASE
// ============================================================================

export const CardShowcase: RenderOnlyStory = {
  render: () => (
    <div className="p-10 rounded-xl relative bg-skin-secondary border-2 border-skin-accent shadow-xl">
      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-skin-accent opacity-60" />
      <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-skin-accent opacity-60" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-skin-accent opacity-60" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-skin-accent opacity-60" />

      <h2 className="text-2xl text-center uppercase tracking-[0.2em] mb-8 text-skin-accent">
        Card Showcase
      </h2>

      {/* Feature cards with spotlight */}
      <div className="flex justify-center gap-8 mb-8">
        <ElegantCardDisplay card={{ color: 'red', value: 0 }} size="large" spotlight />
        <ElegantCardDisplay card={{ color: 'green', value: 7 }} size="large" spotlight />
        <ElegantCardDisplay card={{ color: 'brown', value: 0 }} size="large" spotlight />
      </div>

      {/* Decorative divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-skin-accent opacity-40"></div>
        <span className="text-sm text-skin-accent">△ ▽ ◇ ○</span>
        <div className="flex-1 h-px bg-skin-accent opacity-40"></div>
      </div>

      {/* All elements row */}
      <div className="flex justify-center gap-4">
        {(['red', 'brown', 'green', 'blue'] as CardColor[]).map((color) => (
          <Card key={color} card={{ color, value: 5 }} size="small" />
        ))}
      </div>

      {/* Tagline */}
      <p className="text-center mt-8 italic text-sm text-skin-muted">
        All four suits displayed with the current skin theme
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full card showcase demonstrating the card design system with the selected skin.',
      },
    },
  },
};
