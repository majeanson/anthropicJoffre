/**
 * ProgressBar Component Stories - Multi-Skin Edition
 *
 * Progress indicators with proper CSS variable support for all themes.
 * Switch skins using the paintbrush icon in the Storybook toolbar.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from '../ProgressBar';

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ProgressBar Component

Progress indicators with proper CSS variable support for all themes.

## Features
- **4 variants**: default, gradient, arcane, striped
- **3 sizes**: sm, md, lg
- **8 colors**: accent, primary, success, warning, error, info, muted, gray
- **Custom formatting**: Display values in any format
- **Animation**: Smooth transitions

## Multi-Skin Support
Switch skins using the paintbrush icon in the Storybook toolbar to preview
how the component looks across all available themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Current progress value',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Maximum value',
    },
    variant: {
      control: 'select',
      options: ['default', 'gradient', 'arcane', 'striped'],
      description: 'Progress bar variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Progress bar size',
    },
    color: {
      control: 'select',
      options: ['accent', 'primary', 'success', 'warning', 'error', 'info', 'muted', 'gray'],
      description: 'Color theme',
    },
    showValue: {
      control: 'boolean',
      description: 'Show percentage value',
    },
    animated: {
      control: 'boolean',
      description: 'Animate progress changes',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

export const Default: Story = {
  args: {
    value: 65,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    label: 'Distilling essence...',
    showValue: true,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    label: 'Transmutation Complete!',
    showValue: true,
    color: 'success',
  },
};

// ============================================================================
// VARIANTS
// ============================================================================

export const GradientVariant: Story = {
  args: {
    value: 60,
    variant: 'gradient',
    label: 'Ethereal Flow',
    showValue: true,
  },
};

export const StripedVariant: Story = {
  args: {
    value: 45,
    variant: 'striped',
    label: 'Catalyzing Mixture',
    showValue: true,
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const SmallSize: Story = {
  args: {
    value: 50,
    size: 'sm',
    label: 'Minor Reaction',
    showValue: true,
  },
};

export const MediumSize: Story = {
  args: {
    value: 50,
    size: 'md',
    label: 'Standard Experiment',
    showValue: true,
  },
};

export const LargeSize: Story = {
  args: {
    value: 50,
    size: 'lg',
    label: 'Grand Transmutation',
    showValue: true,
  },
};

// ============================================================================
// COLORS
// ============================================================================

export const PrimaryColor: Story = {
  args: {
    value: 70,
    color: 'primary',
    showValue: true,
  },
};

export const SuccessColor: Story = {
  args: {
    value: 70,
    color: 'success',
    showValue: true,
  },
};

export const WarningColor: Story = {
  args: {
    value: 70,
    color: 'warning',
    showValue: true,
  },
};

export const ErrorColor: Story = {
  args: {
    value: 70,
    color: 'error',
    showValue: true,
  },
};

export const InfoColor: Story = {
  args: {
    value: 70,
    color: 'info',
    showValue: true,
  },
};

export const GrayColor: Story = {
  args: {
    value: 70,
    color: 'gray',
    showValue: true,
  },
};

// ============================================================================
// CUSTOM FORMATTER
// ============================================================================

export const CustomValueFormat: Story = {
  args: {
    value: 5,
    max: 10,
    label: 'Catalyst Collection',
    showValue: true,
    valueFormatter: (value, max) => `${value}/${max}`,
  },
};

// ============================================================================
// ALL SIZES
// ============================================================================

export const AllSizes: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-6 p-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <ProgressBar value={60} size="sm" label="Small" showValue />
      <ProgressBar value={60} size="md" label="Medium" showValue />
      <ProgressBar value={60} size="lg" label="Large" showValue />
    </div>
  ),
};

// ============================================================================
// ALL COLORS
// ============================================================================

export const AllColors: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-4 p-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <ProgressBar value={70} color="accent" label="Accent" showValue />
      <ProgressBar value={70} color="primary" label="Primary" showValue />
      <ProgressBar value={70} color="success" label="Success" showValue />
      <ProgressBar value={70} color="warning" label="Warning" showValue />
      <ProgressBar value={70} color="error" label="Error" showValue />
      <ProgressBar value={70} color="info" label="Info" showValue />
      <ProgressBar value={70} color="muted" label="Muted" showValue />
    </div>
  ),
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-6 p-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <ProgressBar value={65} variant="default" label="Default" showValue />
      <ProgressBar value={65} variant="gradient" label="Gradient" showValue />
      <ProgressBar value={65} variant="arcane" label="Arcane" showValue />
    </div>
  ),
};

// ============================================================================
// DAILY QUESTS
// ============================================================================

export const DailyQuests: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div
      className="space-y-4 p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <h3
        className="text-lg font-bold mb-4 font-display"
        style={{
          color: 'var(--color-text-accent)',
          textShadow: '0 0 10px color-mix(in srgb, var(--color-text-accent) 30%, transparent)',
        }}
      >
        Daily Quests
      </h3>
      <ProgressBar
        value={3}
        max={5}
        label="Win 5 Games"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="accent"
      />
      <ProgressBar
        value={10}
        max={10}
        label="Play 10 Rounds"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="success"
      />
      <ProgressBar
        value={1}
        max={3}
        label="Win a Bet"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="warning"
      />
    </div>
  ),
};

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export const AchievementProgress: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div
      className="space-y-4 p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <h3
        className="text-lg font-bold mb-4 font-display"
        style={{ color: 'var(--color-text-accent)' }}
      >
        Achievement Progress
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div className="flex-1">
            <ProgressBar
              value={75}
              label="Veteran Player"
              showValue
              variant="gradient"
              color="warning"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div className="flex-1">
            <ProgressBar
              value={100}
              label="First Win"
              showValue
              color="success"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <ProgressBar
              value={40}
              label="Sharpshooter"
              showValue
              color="accent"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// ESSENCE STRENGTH
// ============================================================================

export const HealthLevels: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div
      className="space-y-4 p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <h3
        className="text-lg font-bold mb-4 font-display"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Health Levels
      </h3>
      <ProgressBar
        value={25}
        label="Critical"
        showValue
        color="error"
        size="sm"
      />
      <ProgressBar
        value={50}
        label="Moderate"
        showValue
        color="warning"
        size="sm"
      />
      <ProgressBar
        value={75}
        label="Good"
        showValue
        color="info"
        size="sm"
      />
      <ProgressBar
        value={100}
        label="Full Health"
        showValue
        color="success"
        size="sm"
      />
    </div>
  ),
};

// ============================================================================
// LOADING STATES
// ============================================================================

export const LoadingStates: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div
      className="space-y-6 p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <h3
        className="text-lg font-bold mb-4 font-display"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Loading Progress
      </h3>
      <ProgressBar
        value={30}
        variant="arcane"
        label="Connecting..."
        color="info"
      />
      <ProgressBar
        value={60}
        variant="arcane"
        label="Loading assets..."
        color="accent"
      />
      <ProgressBar
        value={90}
        variant="gradient"
        label="Almost ready..."
        color="success"
      />
    </div>
  ),
};

// ============================================================================
// GAME STATUS
// ============================================================================

export const GameStatus: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div
      className="space-y-3 p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <h3
        className="text-sm font-bold uppercase mb-2 font-display"
        style={{
          color: 'var(--color-text-muted)',
          letterSpacing: '0.1em',
        }}
      >
        Game Status
      </h3>
      <ProgressBar
        value={45}
        label="Team Score"
        showValue
        valueFormatter={(v) => `${v} pts`}
        color="success"
        size="sm"
      />
      <ProgressBar
        value={72}
        label="Round Progress"
        showValue
        valueFormatter={(v) => `${v}%`}
        color="warning"
        size="sm"
      />
      <ProgressBar
        value={23}
        label="XP Progress"
        showValue
        valueFormatter={(v) => `${v}%`}
        color="info"
        size="sm"
      />
    </div>
  ),
};
