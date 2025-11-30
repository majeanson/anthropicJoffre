/**
 * Button Component Stories - Midnight Alchemy Edition
 *
 * Showcases the mystical button system with ethereal glows,
 * mechanical press effects, and alchemical aesthetics.
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  DangerButton,
  ElegantButton,
  ArcaneButton,
  GhostButton,
} from '../Button';

const meta = {
  title: 'Midnight Alchemy/Button',
  component: Button,
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
# Midnight Alchemy Buttons

Mystical buttons with alchemical aesthetics - copper accents, ethereal glows, and brass mechanical textures.

## Features
- **9 variants**: primary, secondary, success, warning, danger, ghost, link, elegant, arcane
- **5 sizes**: xs, sm, md, lg, xl
- **Mechanical press**: Steampunk-inspired depth effect
- **Ethereal glow**: Pulsing copper/rose gold animation
- **Alchemical shimmer**: Subtle light sweep on hover

## Typography
Uses **Cinzel Decorative** for that mystical manuscript feel with wide letter-spacing.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'ghost', 'link', 'elegant', 'arcane'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
    },
    arcade: {
      control: 'boolean',
      description: 'Enable mechanical press effect',
    },
    glow: {
      control: 'boolean',
      description: 'Enable ethereal pulsing glow',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with alchemical spinner',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// VARIANTS
// ============================================================================

export const Primary: Story = {
  args: {
    children: 'Transmute',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Observe',
    variant: 'secondary',
  },
};

export const Success: Story = {
  args: {
    children: 'Transformation Complete',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Unstable Mixture',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    children: 'Volatile Reaction',
    variant: 'danger',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Whisper',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Ancient Tome',
    variant: 'link',
  },
};

export const Elegant: Story = {
  args: {
    children: 'Refined Elixir',
    variant: 'elegant',
  },
};

export const Arcane: Story = {
  args: {
    children: 'Invoke the Arcane',
    variant: 'arcane',
    glow: true,
  },
};

// ============================================================================
// ALL VARIANTS SHOWCASE
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-6 bg-[#0B0E14] rounded-xl">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="elegant">Elegant</Button>
      <Button variant="arcane" glow>Arcane</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants with their unique ethereal glow effects.',
      },
    },
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-end p-6 bg-[#0B0E14] rounded-xl">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

export const MechanicalPress: Story = {
  args: {
    children: 'Activate Mechanism',
    variant: 'primary',
    arcade: true,
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Mechanical press mode adds a steampunk-inspired depth effect with satisfying tactile feedback.',
      },
    },
  },
};

export const EtherealGlow: Story = {
  args: {
    children: 'Channel Energy',
    variant: 'arcane',
    glow: true,
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ethereal glow adds a pulsing copper/rose gold animation like mystical energy.',
      },
    },
  },
};

// ============================================================================
// WITH ICONS (Alchemical Symbols)
// ============================================================================

export const WithAlchemicalSymbols: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-6 bg-[#0B0E14] rounded-xl">
      <Button variant="primary" leftIcon={<span>△</span>}>
        Fire
      </Button>
      <Button variant="secondary" leftIcon={<span>▽</span>}>
        Water
      </Button>
      <Button variant="success" leftIcon={<span>◇</span>}>
        Earth
      </Button>
      <Button variant="warning" leftIcon={<span>☿</span>}>
        Mercury
      </Button>
      <Button variant="arcane" leftIcon={<span>☉</span>} rightIcon={<span>→</span>} glow>
        Transmute
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with alchemical symbols as icons for thematic consistency.',
      },
    },
  },
};

// ============================================================================
// STATES
// ============================================================================

export const Loading: Story = {
  args: {
    children: 'Transmuting...',
    loading: true,
    variant: 'primary',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Sealed',
    disabled: true,
  },
};

export const DisabledVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-6 bg-[#0B0E14] rounded-xl">
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="arcane" disabled>Arcane</Button>
      <Button variant="success" disabled>Success</Button>
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    children: 'Begin the Great Work',
    fullWidth: true,
    variant: 'arcane',
    glow: true,
    size: 'lg',
  },
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// PRESET COMPONENTS
// ============================================================================

export const PresetButtons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-6 bg-[#0B0E14] rounded-xl">
      <PrimaryButton>Primary</PrimaryButton>
      <SecondaryButton>Secondary</SecondaryButton>
      <SuccessButton>Success</SuccessButton>
      <DangerButton>Danger</DangerButton>
      <ElegantButton>Elegant</ElegantButton>
      <ArcaneButton>Arcane</ArcaneButton>
      <GhostButton>Ghost</GhostButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured button components with optimal settings for each use case.',
      },
    },
  },
};

// ============================================================================
// ALCHEMIST'S LABORATORY
// ============================================================================

export const AlchemistLaboratory: Story = {
  render: () => (
    <div
      className="p-8 rounded-xl space-y-6 min-w-96"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '2px solid #C17F59',
        boxShadow: '0 0 50px rgba(193, 127, 89, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Sacred geometry corners */}
      <div className="relative">
        <div className="absolute -top-6 -left-6 w-4 h-4 border-l-2 border-t-2 border-[#C17F59] opacity-60" />
        <div className="absolute -top-6 -right-6 w-4 h-4 border-r-2 border-t-2 border-[#C17F59] opacity-60" />

        <h2
          className="text-2xl text-center uppercase tracking-[0.2em] mb-2"
          style={{
            fontFamily: '"Cinzel Decorative", Georgia, serif',
            color: '#D4A574',
            textShadow: '0 0 20px rgba(212, 165, 116, 0.5)',
          }}
        >
          The Alchemist's Study
        </h2>
        <p
          className="text-center text-sm italic opacity-70 mb-6"
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            color: '#9CA3AF',
          }}
        >
          Choose your path of transmutation
        </p>
      </div>

      <div className="space-y-3">
        <Button variant="primary" fullWidth arcade size="lg">
          Quick Transmutation
        </Button>
        <Button variant="secondary" fullWidth size="lg">
          Create Experiment
        </Button>
        <Button variant="arcane" fullWidth size="lg" glow>
          Join the Great Work
        </Button>
      </div>

      <div
        className="flex gap-3 justify-center pt-6 mt-6"
        style={{ borderTop: '1px solid #2D3548' }}
      >
        <Button variant="ghost" size="sm">Ancient Texts</Button>
        <Button variant="ghost" size="sm">Ingredients</Button>
        <Button variant="link" size="sm">Philosopher's Notes</Button>
      </div>

      {/* Bottom corners */}
      <div className="relative h-2">
        <div className="absolute -bottom-6 -left-6 w-4 h-4 border-l-2 border-b-2 border-[#C17F59] opacity-60" />
        <div className="absolute -bottom-6 -right-6 w-4 h-4 border-r-2 border-b-2 border-[#C17F59] opacity-60" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of buttons used in a game menu context with the Midnight Alchemy aesthetic.',
      },
    },
  },
};

// ============================================================================
// CARD GAME ACTIONS
// ============================================================================

export const CardGameActions: Story = {
  render: () => (
    <div
      className="p-6 rounded-lg space-y-4"
      style={{
        background: 'linear-gradient(180deg, #1A1F2E 0%, #131824 100%)',
        boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div className="flex gap-3 justify-center">
        <Button variant="primary" size="lg" arcade leftIcon={<span>♠</span>}>
          Place Bet
        </Button>
        <Button variant="warning" size="lg" leftIcon={<span>⏭</span>}>
          Skip Turn
        </Button>
      </div>
      <div className="flex gap-2 justify-center">
        <Button variant="ghost" size="sm">View Rules</Button>
        <Button variant="ghost" size="sm">Chat</Button>
        <Button variant="danger" size="sm">Leave Game</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button combinations for card game betting and actions.',
      },
    },
  },
};

// ============================================================================
// ELEMENTAL QUARTET
// ============================================================================

export const ElementalQuartet: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-6 bg-[#0B0E14] rounded-xl max-w-md">
      <Button
        variant="danger"
        size="lg"
        fullWidth
        leftIcon={<span className="text-xl">🔥</span>}
      >
        Fire
      </Button>
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        leftIcon={<span className="text-xl">💧</span>}
        style={{ borderColor: '#3B82F6' }}
      >
        Water
      </Button>
      <Button
        variant="success"
        size="lg"
        fullWidth
        leftIcon={<span className="text-xl">🌿</span>}
      >
        Earth
      </Button>
      <Button
        variant="ghost"
        size="lg"
        fullWidth
        leftIcon={<span className="text-xl">💨</span>}
        style={{ color: '#E8E4DC' }}
      >
        Air
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The four classical elements represented as action buttons.',
      },
    },
  },
};
