/**
 * Button Component Stories - Retro Gaming Edition
 *
 * Showcases the arcade-inspired button system with neon glows,
 * pixel-perfect borders, and satisfying press effects.
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  DangerButton,
  NeonButton,
  GhostButton,
} from '../Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Arcade-inspired button component with multiple variants, sizes, and special effects.

## Features
- **8 variants**: primary, secondary, success, warning, danger, ghost, link, neon
- **5 sizes**: xs, sm, md, lg, xl
- **Arcade mode**: Press-down effect like real arcade buttons
- **Glow mode**: Pulsing neon glow animation
- **Icon support**: Left and right icon slots
- **Loading state**: Retro-styled spinner
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'ghost', 'link', 'neon'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
    },
    arcade: {
      control: 'boolean',
      description: 'Enable arcade-style press effect',
    },
    glow: {
      control: 'boolean',
      description: 'Enable pulsing glow animation',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner',
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
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success Button',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning Button',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
};

export const Neon: Story = {
  args: {
    children: 'Neon Button',
    variant: 'neon',
  },
};

// ============================================================================
// ALL VARIANTS SHOWCASE
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="neon">Neon</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants with their unique neon glow effects.',
      },
    },
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-4">
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

export const ArcadeMode: Story = {
  args: {
    children: 'Press Me!',
    variant: 'primary',
    arcade: true,
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Arcade mode adds a satisfying press-down effect like real arcade cabinet buttons.',
      },
    },
  },
};

export const GlowingButton: Story = {
  args: {
    children: 'Glowing',
    variant: 'neon',
    glow: true,
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Glow mode adds a pulsing neon glow animation to draw attention.',
      },
    },
  },
};

// ============================================================================
// WITH ICONS
// ============================================================================

export const WithLeftIcon: Story = {
  args: {
    children: 'Play Now',
    leftIcon: <span>🎮</span>,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Continue',
    rightIcon: <span>→</span>,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: 'Start Game',
    leftIcon: <span>🎮</span>,
    rightIcon: <span>→</span>,
    variant: 'success',
  },
};

// ============================================================================
// STATES
// ============================================================================

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const DisabledVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-4">
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="neon" disabled>Neon</Button>
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
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
    <div className="flex flex-wrap gap-4 items-center p-4">
      <PrimaryButton>Primary</PrimaryButton>
      <SecondaryButton>Secondary</SecondaryButton>
      <SuccessButton>Success</SuccessButton>
      <DangerButton>Danger</DangerButton>
      <NeonButton>Neon</NeonButton>
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
// GAME UI EXAMPLE
// ============================================================================

export const GameMenuExample: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] space-y-6 min-w-80">
      <h2 className="font-display text-[var(--color-text-primary)] text-xl uppercase tracking-wider text-center">
        Game Menu
      </h2>

      <div className="space-y-3">
        <Button variant="primary" fullWidth arcade size="lg">
          Quick Play
        </Button>
        <Button variant="secondary" fullWidth size="lg">
          Create Game
        </Button>
        <Button variant="neon" fullWidth size="lg" glow>
          Join Game
        </Button>
      </div>

      <div className="flex gap-3 justify-center pt-4 border-t border-[var(--color-border-default)]">
        <Button variant="ghost" size="sm">Settings</Button>
        <Button variant="ghost" size="sm">Help</Button>
        <Button variant="link" size="sm">Logout</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of buttons used in a game menu context with the retro gaming skin.',
      },
    },
  },
};
