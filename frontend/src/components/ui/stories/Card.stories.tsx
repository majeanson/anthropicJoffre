/**
 * Card Component Stories
 * Sprint 21 - Game card component showcase
 *
 * Displays the various card types, colors, sizes, and states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../../Card';
import { CardColor } from '../../../types/game';

const meta = {
  title: 'Game/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'game-table',
      values: [
        { name: 'game-table', value: '#1a472a' },
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1a1a1a' },
      ],
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
      description: 'Disabled state',
    },
    isPlayable: {
      control: 'boolean',
      description: 'Show playable glow animation',
    },
    isKeyboardSelected: {
      control: 'boolean',
      description: 'Keyboard selection ring',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Regular cards (all colors, value 5)
export const RedCard: Story = {
  args: {
    card: { color: 'red', value: 5 },
    size: 'medium',
  },
};

export const BrownCard: Story = {
  args: {
    card: { color: 'brown', value: 5 },
    size: 'medium',
  },
};

export const GreenCard: Story = {
  args: {
    card: { color: 'green', value: 5 },
    size: 'medium',
  },
};

export const BlueCard: Story = {
  args: {
    card: { color: 'blue', value: 5 },
    size: 'medium',
  },
};

// Special cards (Red 0 and Brown 0)
export const RedSpecial: Story = {
  args: {
    card: { color: 'red', value: 0 },
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Red 0 card - Special card worth +5 points when won in a trick',
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
        story: 'Brown 0 card - Special card worth -2 points when won in a trick',
      },
    },
  },
};

// Size variants
export const TinySize: Story = {
  args: {
    card: { color: 'blue', value: 7 },
    size: 'tiny',
  },
};

export const SmallSize: Story = {
  args: {
    card: { color: 'green', value: 7 },
    size: 'small',
  },
};

export const MediumSize: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
  },
};

export const LargeSize: Story = {
  args: {
    card: { color: 'brown', value: 7 },
    size: 'large',
  },
};

// States
export const Playable: Story = {
  args: {
    card: { color: 'green', value: 5 },
    size: 'medium',
    isPlayable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with playable glow animation - indicates card can be played this turn',
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
        story: 'Card with keyboard selection ring - for keyboard navigation',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    card: { color: 'red', value: 7 },
    size: 'medium',
    disabled: true,
  },
};

// Value showcase
export const AllValues: Story = {
  args: {
    card: { color: 'blue', value: 1 },
  },
  render: () => (
    <div className="flex gap-2 flex-wrap max-w-2xl">
      {([0, 1, 2, 3, 4, 5, 6, 7] as const).map((value) => (
        <Card key={value} card={{ color: 'blue', value }} size="small" />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All card values (0-7) in blue color',
      },
    },
  },
};

// Color showcase
export const AllColors: Story = {
  args: {
    card: { color: 'red', value: 7 },
  },
  render: () => {
    const colors: CardColor[] = ['red', 'brown', 'green', 'blue'];
    return (
      <div className="flex gap-4">
        {colors.map((color) => (
          <Card key={color} card={{ color, value: 7 }} size="medium" />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All four card colors with value 7',
      },
    },
  },
};

// Special cards showcase
export const SpecialCards: Story = {
  args: {
    card: { color: 'red', value: 0 },
  },
  render: () => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <Card card={{ color: 'red', value: 0 }} size="medium" />
        <span className="text-xs text-white bg-green-600 px-2 py-1 rounded">+5 Points</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Card card={{ color: 'brown', value: 0 }} size="medium" />
        <span className="text-xs text-white bg-red-600 px-2 py-1 rounded">-2 Points</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Special cards: Red 0 (+5 points) and Brown 0 (-2 points)',
      },
    },
  },
};

// Interactive example
export const Interactive: Story = {
  args: {
    card: { color: 'green', value: 5 },
    size: 'large',
    onClick: () => alert('Card clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with click handler',
      },
    },
  },
};
