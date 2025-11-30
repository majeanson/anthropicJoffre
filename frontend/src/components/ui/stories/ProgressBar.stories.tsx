/**
 * ProgressBar Component Stories - Midnight Alchemy Edition
 *
 * Mystical progress indicators showing transmutation completion,
 * essence collection, and the advancement of the Great Work.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from '../ProgressBar';

const meta = {
  title: 'Midnight Alchemy/ProgressBar',
  component: ProgressBar,
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
# Midnight Alchemy Progress Bars

Mystical progress indicators showing transmutation completion,
essence collection, and the advancement of the Great Work.

## Features
- **3 variants**: default, gradient, striped
- **3 sizes**: sm, md, lg
- **6 colors**: primary, success, warning, error, info, gray
- **Custom formatting**: Display values in any format
- **Animation**: Smooth transitions

## Alchemical Usage
Track the progress of experiments, quests, and achievements.
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
      options: ['default', 'gradient', 'striped'],
      description: 'Progress bar variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Progress bar size',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error', 'info', 'gray'],
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
    <div className="space-y-6 p-6 bg-[#0B0E14] rounded-xl">
      <ProgressBar value={60} size="sm" label="Minor Essence" showValue />
      <ProgressBar value={60} size="md" label="Standard Essence" showValue />
      <ProgressBar value={60} size="lg" label="Grand Essence" showValue />
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
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
      <ProgressBar value={70} color="primary" label="Copper" showValue />
      <ProgressBar value={70} color="success" label="Emerald" showValue />
      <ProgressBar value={70} color="warning" label="Amber" showValue />
      <ProgressBar value={70} color="error" label="Ruby" showValue />
      <ProgressBar value={70} color="info" label="Sapphire" showValue />
      <ProgressBar value={70} color="gray" label="Quicksilver" showValue />
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
    <div className="space-y-6 p-6 bg-[#0B0E14] rounded-xl">
      <ProgressBar value={65} variant="default" label="Standard" showValue />
      <ProgressBar value={65} variant="gradient" label="Ethereal" showValue />
      <ProgressBar value={65} variant="striped" label="Flowing" showValue />
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
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg font-bold mb-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#D4A574',
          textShadow: '0 0 10px rgba(212, 165, 116, 0.3)',
        }}
      >
        Daily Rituals
      </h3>
      <ProgressBar
        value={3}
        max={5}
        label="Win 5 Experiments"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="primary"
      />
      <ProgressBar
        value={10}
        max={10}
        label="Use 10 Catalysts"
        showValue
        valueFormatter={(v, m) => `${v}/${m}`}
        color="success"
      />
      <ProgressBar
        value={1}
        max={3}
        label="Collect All Elements"
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
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg font-bold mb-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#D4A574',
        }}
      >
        Mastery Progress
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚗</span>
          <div className="flex-1">
            <ProgressBar
              value={75}
              label="Master Alchemist"
              showValue
              variant="gradient"
              color="warning"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">☉</span>
          <div className="flex-1">
            <ProgressBar
              value={100}
              label="First Transmutation"
              showValue
              color="success"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">☿</span>
          <div className="flex-1">
            <ProgressBar
              value={40}
              label="Mercury Master"
              showValue
              color="primary"
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

export const EssenceStrength: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div
      className="space-y-4 p-6 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg font-bold mb-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#E8E4DC',
        }}
      >
        Essence Potency Levels
      </h3>
      <ProgressBar
        value={25}
        label="Diluted"
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
        label="Concentrated"
        showValue
        color="info"
        size="sm"
      />
      <ProgressBar
        value={100}
        label="Pure Essence"
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
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg font-bold mb-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#9CA3AF',
        }}
      >
        Establishing Connection
      </h3>
      <ProgressBar
        value={30}
        variant="striped"
        label="Binding ethereal link..."
        color="info"
      />
      <ProgressBar
        value={60}
        variant="striped"
        label="Channeling ancient knowledge..."
        color="primary"
      />
      <ProgressBar
        value={90}
        variant="gradient"
        label="The laboratory awakens..."
        color="success"
      />
    </div>
  ),
};

// ============================================================================
// LABORATORY HEALTH
// ============================================================================

export const LaboratoryHealth: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div
      className="space-y-3 p-6 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-sm font-bold uppercase mb-2"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#6B7280',
          letterSpacing: '0.1em',
        }}
      >
        Laboratory Status
      </h3>
      <ProgressBar
        value={45}
        label="Essence Reserves"
        showValue
        valueFormatter={(v) => `${v} units`}
        color={45 > 80 ? 'error' : 45 > 60 ? 'warning' : 'success'}
        size="sm"
      />
      <ProgressBar
        value={72}
        label="Catalyst Purity"
        showValue
        valueFormatter={(v) => `${v}%`}
        color={72 > 80 ? 'error' : 72 > 60 ? 'warning' : 'success'}
        size="sm"
      />
      <ProgressBar
        value={23}
        label="Ethereal Flow"
        showValue
        valueFormatter={(v) => `${v}%`}
        color="info"
        size="sm"
      />
    </div>
  ),
};
