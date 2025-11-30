/**
 * Input Component Stories - Retro Gaming Edition
 *
 * Showcases the arcade-inspired input system with neon borders,
 * glowing focus states, and cyberpunk aesthetics.
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Input,
  SearchInput,
  PasswordInput,
  NeonInput,
} from '../Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Arcade-inspired input component with neon glow effects and retro styling.

## Features
- **3 variants**: default, filled, neon
- **3 sizes**: sm, md, lg
- **Glow on focus**: Neon glow animation when focused
- **Icon support**: Left and right icon slots
- **Password toggle**: Built-in visibility toggle
- **Error states**: Red neon glow for validation errors
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'neon'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input',
    },
    glowOnFocus: {
      control: 'boolean',
      description: 'Enable neon glow on focus',
    },
    showPasswordToggle: {
      control: 'boolean',
      description: 'Show password visibility toggle (password inputs only)',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// VARIANTS
// ============================================================================

export const Default: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    variant: 'default',
  },
};

export const Filled: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    variant: 'filled',
  },
};

export const Neon: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    variant: 'neon',
  },
  parameters: {
    docs: {
      description: {
        story: 'Neon variant with cyan border and glow effects - the signature retro gaming style.',
      },
    },
  },
};

// ============================================================================
// ALL VARIANTS SHOWCASE
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Input variant="default" label="Default" placeholder="Default styling" />
      <Input variant="filled" label="Filled" placeholder="Filled background" />
      <Input variant="neon" label="Neon" placeholder="Neon glow effect" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available input variants with their unique styling.',
      },
    },
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Input',
    placeholder: 'Medium size (default)',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input size="sm" label="Small" placeholder="Small input" />
      <Input size="md" label="Medium" placeholder="Medium input" />
      <Input size="lg" label="Large" placeholder="Large input" />
    </div>
  ),
};

// ============================================================================
// INPUT TYPES
// ============================================================================

export const Email: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'player@arcade.com',
    leftIcon: <span>@</span>,
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    showPasswordToggle: true,
  },
};

export const Search: Story = {
  args: {
    label: 'Search',
    type: 'search',
    placeholder: 'Search players...',
    leftIcon: <span className="text-[var(--color-text-muted)]">🔍</span>,
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Bet Amount',
    type: 'number',
    placeholder: '0',
    min: 7,
    max: 12,
    leftIcon: <span className="text-[var(--color-warning)]">💰</span>,
  },
};

// ============================================================================
// STATES
// ============================================================================

export const WithHelperText: Story = {
  args: {
    label: 'Player Name',
    placeholder: 'Enter name',
    helperText: 'This will be displayed to other players',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state with red neon glow effect.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    value: 'Disabled value',
    disabled: true,
  },
};

export const GlowOnFocus: Story = {
  args: {
    label: 'Click to Focus',
    placeholder: 'Watch the glow!',
    glowOnFocus: true,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input with animated neon glow when focused.',
      },
    },
  },
};

// ============================================================================
// WITH ICONS
// ============================================================================

export const WithLeftIcon: Story = {
  args: {
    label: 'Game ID',
    placeholder: 'Enter game ID',
    leftIcon: <span>🎮</span>,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Points',
    type: 'number',
    placeholder: '0',
    rightIcon: <span className="text-[var(--color-text-muted)] text-xs">PTS</span>,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Bet Amount',
    type: 'number',
    placeholder: '0',
    leftIcon: <span>💎</span>,
    rightIcon: <span className="text-[var(--color-success)] text-xs">CHIPS</span>,
    variant: 'neon',
  },
};

// ============================================================================
// PRESET COMPONENTS
// ============================================================================

export const PresetInputs: Story = {
  render: () => (
    <div className="space-y-4">
      <SearchInput placeholder="Search for games..." />
      <PasswordInput label="Password" placeholder="Enter password" />
      <NeonInput label="Neon Input" placeholder="Glowing input" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured input components for common use cases.',
      },
    },
  },
};

// ============================================================================
// GAME UI EXAMPLE
// ============================================================================

export const JoinGameForm: Story = {
  render: () => (
    <div className="p-6 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] border-2 border-[var(--color-border-accent)] space-y-4 min-w-80">
      <h2 className="font-display text-[var(--color-text-primary)] text-lg uppercase tracking-wider text-center mb-6">
        Join Game
      </h2>

      <Input
        label="Player Name"
        placeholder="Enter your name"
        leftIcon={<span>👤</span>}
        helperText="2-16 characters"
        variant="default"
      />

      <Input
        label="Game Code"
        placeholder="ABC123"
        leftIcon={<span>🎮</span>}
        helperText="6-character game code"
        variant="neon"
        glowOnFocus
      />

      <button
        className="
          w-full py-3 mt-4
          bg-[var(--color-success)]
          text-black font-display
          uppercase tracking-wider
          rounded-[var(--radius-lg)]
          border-2 border-[var(--color-success)]
          shadow-[0_0_20px_var(--color-success)]
          hover:shadow-[0_0_30px_var(--color-success),0_0_60px_var(--color-success)]
          transition-all duration-[var(--duration-normal)]
          active:translate-y-0.5
        "
      >
        Join Game
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of inputs used in a game join form with the retro gaming skin.',
      },
    },
  },
};

// ============================================================================
// LOGIN FORM EXAMPLE
// ============================================================================

export const LoginForm: Story = {
  render: () => (
    <div className="p-6 bg-[var(--color-bg-secondary)] rounded-[var(--radius-xl)] border-2 border-[var(--color-border-default)] space-y-4 min-w-80">
      <div className="text-center mb-6">
        <span className="text-4xl mb-2 block">🕹️</span>
        <h2 className="font-display text-[var(--color-text-primary)] text-lg uppercase tracking-wider">
          Player Login
        </h2>
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="player@arcade.com"
        leftIcon={<span className="text-[var(--color-text-muted)]">@</span>}
        variant="filled"
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        showPasswordToggle
        variant="filled"
      />

      <div className="flex gap-3 pt-4">
        <button
          className="
            flex-1 py-2
            bg-transparent
            text-[var(--color-text-secondary)]
            font-display text-sm
            uppercase tracking-wider
            rounded-[var(--radius-md)]
            border border-[var(--color-border-default)]
            hover:border-[var(--color-border-accent)]
            hover:text-[var(--color-text-primary)]
            transition-all duration-[var(--duration-fast)]
          "
        >
          Register
        </button>
        <button
          className="
            flex-1 py-2
            bg-[var(--color-bg-accent)]
            text-white font-display text-sm
            uppercase tracking-wider
            rounded-[var(--radius-md)]
            border-2 border-[var(--color-bg-accent)]
            shadow-[0_0_15px_var(--color-glow)]
            hover:shadow-[0_0_25px_var(--color-glow)]
            transition-all duration-[var(--duration-fast)]
          "
        >
          Login
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example login form with retro gaming aesthetics.',
      },
    },
  },
};
