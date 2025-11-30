/**
 * Card Component Stories - Midnight Alchemy Edition
 *
 * Showcases the playing card component with alchemical aesthetics,
 * elemental color theming, and ethereal glow effects.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardBack, CardStack, ElegantCardDisplay } from '../../Card';
import { CardColor, CardValue, Card as CardType } from '../../../types/game';

const meta = {
  title: 'Midnight Alchemy/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'midnight',
      values: [
        { name: 'midnight', value: '#0B0E14' },
        { name: 'chamber', value: '#131824' },
      ],
    },
    docs: {
      description: {
        component: `
# Midnight Alchemy Playing Cards

Mystical playing cards with alchemical aesthetics and elemental color theming.

## Features
- **4 elemental suits**: Fire (Red), Earth (Brown), Nature (Green), Water (Blue)
- **4 sizes**: tiny, small, medium, large
- **Special cards**: Fire Zero (+5 essence), Earth Zero (-2 essence)
- **Playable state**: Ethereal pulse animation for valid plays
- **Keyboard navigation**: Sacred geometry focus ring
- **Card back**: Alchemical circle pattern
- **Card stack**: Mystical deck visualization

## Elemental Correspondences
- 🔥 **Fire (Red)**: Passion, transformation, energy
- 🌍 **Earth (Brown)**: Stability, grounding, material
- 🌿 **Nature (Green)**: Growth, harmony, life force
- 💧 **Water (Blue)**: Intuition, emotion, flow
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
        story: 'Fire element card (Red) - Represents passion and transformation with crimson ethereal glow.',
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
      <div
        className="p-8 rounded-xl"
        style={{
          background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
          border: '2px solid #C17F59',
          boxShadow: '0 0 40px rgba(193, 127, 89, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        }}
      >
        <h3
          className="text-center uppercase tracking-[0.15em] mb-6"
          style={{
            fontFamily: '"Cinzel Decorative", Georgia, serif',
            color: '#D4A574',
            textShadow: '0 0 15px rgba(212, 165, 116, 0.5)',
          }}
        >
          The Four Elements
        </h3>
        <div className="flex gap-6">
          {elements.map(({ color, symbol, name }) => (
            <div key={color} className="flex flex-col items-center gap-3">
              <Card card={{ color, value: 7 }} size="medium" />
              <div className="text-center">
                <div className="text-2xl mb-1">{symbol}</div>
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: '#9CA3AF', fontFamily: '"Cinzel", Georgia, serif' }}
                >
                  {name}
                </span>
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

export const ArcanaCards: Story = {
  args: {
    card: { color: 'red', value: 0 },
  },
  render: () => (
    <div
      className="p-8 rounded-xl"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '2px solid #C17F59',
        boxShadow: '0 0 40px rgba(193, 127, 89, 0.15)',
      }}
    >
      <h3
        className="text-center uppercase tracking-[0.15em] mb-6"
        style={{
          fontFamily: '"Cinzel Decorative", Georgia, serif',
          color: '#D4A574',
          textShadow: '0 0 15px rgba(212, 165, 116, 0.5)',
        }}
      >
        The Arcana
      </h3>
      <div className="flex gap-12 justify-center">
        <div className="flex flex-col items-center gap-4">
          <ElegantCardDisplay card={{ color: 'red', value: 0 }} size="large" spotlight />
          <div className="text-center">
            <div
              className="text-sm uppercase tracking-wider mb-1"
              style={{ color: '#D4A574', fontFamily: '"Cinzel", Georgia, serif' }}
            >
              The Phoenix
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs inline-block"
              style={{
                backgroundColor: '#4A9C6D',
                color: '#0B0E14',
                fontFamily: '"Cinzel", Georgia, serif',
                boxShadow: '0 2px 10px rgba(74, 156, 109, 0.4)',
              }}
            >
              +5 Essence
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <ElegantCardDisplay card={{ color: 'brown', value: 0 }} size="large" spotlight />
          <div className="text-center">
            <div
              className="text-sm uppercase tracking-wider mb-1"
              style={{ color: '#D4A574', fontFamily: '"Cinzel", Georgia, serif' }}
            >
              The Void
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs inline-block"
              style={{
                backgroundColor: '#A63D3D',
                color: '#E8E4DC',
                fontFamily: '"Cinzel", Georgia, serif',
                boxShadow: '0 2px 10px rgba(166, 61, 61, 0.4)',
              }}
            >
              -2 Essence
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
    <div
      className="p-8 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <div className="flex items-end gap-6">
        {(['tiny', 'small', 'medium', 'large'] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-3">
            <Card card={{ color: 'blue', value: 5 }} size={size} />
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: '#6B7280', fontFamily: '"Cinzel", Georgia, serif' }}
            >
              {size}
            </span>
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
        story: 'Playable state with ethereal pulse animation - indicates the card can be channeled this turn.',
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
    <div
      className="p-8 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="uppercase tracking-wider mb-4"
        style={{
          color: '#4682B4',
          fontFamily: '"Cinzel", Georgia, serif',
          textShadow: '0 0 10px rgba(70, 130, 180, 0.5)',
        }}
      >
        Water Suit (0-7)
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
        story: 'All card values (0-7) for the Water (Blue) suit.',
      },
    },
  },
};

// ============================================================================
// CARD BACK COMPONENT
// ============================================================================

export const AlchemicalBack: RenderOnlyStory = {
  render: () => (
    <div
      className="p-8 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-center uppercase tracking-wider mb-4"
        style={{
          color: '#D4A574',
          fontFamily: '"Cinzel", Georgia, serif',
        }}
      >
        Alchemical Seal
      </h3>
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

export const GuildCards: RenderOnlyStory = {
  render: () => (
    <div
      className="p-8 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-center uppercase tracking-wider mb-4"
        style={{
          color: '#D4A574',
          fontFamily: '"Cinzel", Georgia, serif',
        }}
      >
        Guild Allegiances
      </h3>
      <div className="flex gap-8 justify-center">
        <div className="flex flex-col items-center gap-3">
          <CardBack size="medium" teamColor={1} />
          <span
            className="text-xs uppercase"
            style={{ color: '#d97706', fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Solar Guild
          </span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <CardBack size="medium" teamColor={2} />
          <span
            className="text-xs uppercase"
            style={{ color: '#7c3aed', fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Lunar Guild
          </span>
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

export const MysticalDeck: RenderOnlyStory = {
  render: () => (
    <div
      className="p-8 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-center uppercase tracking-wider mb-4"
        style={{
          color: '#D4A574',
          fontFamily: '"Cinzel", Georgia, serif',
        }}
      >
        The Deck
      </h3>
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
    <div
      className="p-8 rounded-xl"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '2px solid #C17F59',
        boxShadow: '0 0 40px rgba(193, 127, 89, 0.15)',
      }}
    >
      <h3
        className="text-center uppercase tracking-[0.15em] mb-6"
        style={{
          fontFamily: '"Cinzel Decorative", Georgia, serif',
          color: '#D4A574',
          textShadow: '0 0 15px rgba(212, 165, 116, 0.5)',
        }}
      >
        Featured Artifact
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

export const AlchemistHand: RenderOnlyStory = {
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
      <div
        className="p-8 rounded-xl"
        style={{
          background: '#0B0E14',
          border: '1px solid #2D3548',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-sm uppercase tracking-wider"
            style={{
              color: '#4682B4',
              fontFamily: '"Cinzel", Georgia, serif',
              textShadow: '0 0 10px rgba(70, 130, 180, 0.5)',
            }}
          >
            Led Element: Water ▽
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
              onClick={() => console.log(`Channeled ${card.color} ${card.value}`)}
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

export const RitualInProgress: RenderOnlyStory = {
  render: () => {
    const ritual: { card: CardType; player: string }[] = [
      { card: { color: 'blue', value: 5 as CardValue }, player: 'Sage' },
      { card: { color: 'blue', value: 7 as CardValue }, player: 'Mystic' },
      { card: { color: 'green', value: 3 as CardValue }, player: 'Oracle' },
    ];

    return (
      <div
        className="p-8 rounded-xl"
        style={{
          background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
          border: '2px solid #C17F59',
          boxShadow: '0 0 40px rgba(193, 127, 89, 0.15)',
        }}
      >
        <h3
          className="text-center uppercase tracking-[0.15em] mb-6"
          style={{
            fontFamily: '"Cinzel Decorative", Georgia, serif',
            color: '#D4A574',
            textShadow: '0 0 15px rgba(212, 165, 116, 0.5)',
          }}
        >
          Current Ritual
        </h3>
        <div className="flex justify-center gap-4">
          {ritual.map(({ card, player }, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Card card={card} size="medium" />
              <span
                className="text-xs"
                style={{ color: '#6B7280', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {player}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-3 opacity-50">
            <div
              className="w-24 h-36 rounded-lg border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: '#C17F59' }}
            >
              <span style={{ color: '#6B7280' }} className="text-2xl">?</span>
            </div>
            <span
              className="text-xs"
              style={{ color: '#6B7280', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              Awaiting...
            </span>
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
// MIDNIGHT ALCHEMY SHOWCASE
// ============================================================================

export const MidnightAlchemyShowcase: RenderOnlyStory = {
  render: () => (
    <div
      className="p-10 rounded-xl relative"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '2px solid #C17F59',
        boxShadow: '0 0 60px rgba(193, 127, 89, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Sacred geometry corners */}
      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-[#C17F59] opacity-60" />
      <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-[#C17F59] opacity-60" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-[#C17F59] opacity-60" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-[#C17F59] opacity-60" />

      <h2
        className="text-2xl text-center uppercase tracking-[0.2em] mb-8"
        style={{
          fontFamily: '"Cinzel Decorative", Georgia, serif',
          color: '#D4A574',
          textShadow: '0 0 20px rgba(212, 165, 116, 0.5)',
        }}
      >
        The Alchemist's Deck
      </h2>

      {/* Feature cards with spotlight */}
      <div className="flex justify-center gap-8 mb-8">
        <ElegantCardDisplay card={{ color: 'red', value: 0 }} size="large" spotlight />
        <ElegantCardDisplay card={{ color: 'green', value: 7 }} size="large" spotlight />
        <ElegantCardDisplay card={{ color: 'brown', value: 0 }} size="large" spotlight />
      </div>

      {/* Decorative divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-[#C17F59] opacity-40"></div>
        <span
          className="text-sm"
          style={{
            color: '#D4A574',
            fontFamily: '"Cinzel Decorative", Georgia, serif',
          }}
        >
          △ ▽ ◇ ○
        </span>
        <div className="flex-1 h-px bg-[#C17F59] opacity-40"></div>
      </div>

      {/* All elements row */}
      <div className="flex justify-center gap-4">
        {(['red', 'brown', 'green', 'blue'] as CardColor[]).map((color) => (
          <Card key={color} card={{ color, value: 5 }} size="small" />
        ))}
      </div>

      {/* Quote */}
      <p
        className="text-center mt-8 italic"
        style={{
          color: '#6B7280',
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '0.875rem',
        }}
      >
        "In the dance of elements, the wise alchemist finds truth."
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full Midnight Alchemy showcase demonstrating the mystical card design system.',
      },
    },
  },
};
