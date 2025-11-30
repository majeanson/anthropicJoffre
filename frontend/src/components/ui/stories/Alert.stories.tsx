/**
 * Alert Component Stories - Midnight Alchemy Edition
 *
 * Mystical notification scrolls with alchemical warnings,
 * arcane discoveries, and transmutation results.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../Alert';

const meta = {
  title: 'Midnight Alchemy/Alert',
  component: Alert,
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
# Midnight Alchemy Alerts

Mystical notification scrolls for conveying important messages.
Each alert type represents a different alchemical state.

## Features
- **5 variants**: info, success, warning, error, neutral
- **Dismissible**: Optional close button
- **Custom icons**: Alchemical symbols
- **Title support**: For formal proclamations

## Alchemical Meanings
- **Info**: Arcane knowledge revealed
- **Success**: Transmutation complete
- **Warning**: Volatile mixture detected
- **Error**: Failed experiment
- **Neutral**: Ancient inscription
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error', 'neutral'],
      description: 'Alert variant',
    },
    dismissible: {
      control: 'boolean',
      description: 'Show dismiss button',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// VARIANTS
// ============================================================================

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'The ancient texts speak of a hidden ingredient.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'The transmutation was successful! Gold has been created.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Caution: This mixture is highly volatile.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'The experiment has failed. Check your calculations.',
  },
};

export const Neutral: Story = {
  args: {
    variant: 'neutral',
    children: 'An inscription on weathered parchment.',
  },
};

// ============================================================================
// WITH TITLE
// ============================================================================

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Arcane Discovery',
    children: 'A new formula has been uncovered in the ancient manuscripts.',
  },
};

export const ErrorWithTitle: Story = {
  args: {
    variant: 'error',
    title: 'Transmutation Failed',
    children: 'The base metals rejected the philosophers stone. Review your technique.',
  },
};

export const SuccessWithTitle: Story = {
  args: {
    variant: 'success',
    title: 'The Great Work Complete!',
    children: 'Share this elixir recipe with your fellow alchemists.',
  },
};

export const WarningWithTitle: Story = {
  args: {
    variant: 'warning',
    title: 'Essence Instability',
    children: 'The ethereal connection wavers. This may affect your experiments.',
  },
};

// ============================================================================
// DISMISSIBLE
// ============================================================================

export const Dismissible: Story = {
  args: {
    variant: 'success',
    children: 'Seal this scroll to dismiss.',
    dismissible: true,
    onDismiss: () => console.log('Scroll sealed'),
  },
};

export const DismissibleWithTitle: Story = {
  args: {
    variant: 'info',
    title: 'New Technique Discovered',
    children: 'The Council has approved a new distillation method.',
    dismissible: true,
    onDismiss: () => console.log('Scroll sealed'),
  },
};

// ============================================================================
// CUSTOM ICONS (Alchemical Symbols)
// ============================================================================

export const CustomIcon: Story = {
  args: {
    variant: 'info',
    icon: <span>☿</span>,
    title: 'Mercury Rising',
    children: 'The quicksilver responds to lunar influence tonight.',
  },
};

export const TrophyIcon: Story = {
  args: {
    variant: 'success',
    icon: <span>⚗</span>,
    title: 'Mastery Achieved!',
    children: 'You have completed 10 successful transmutations in succession!',
  },
};

// ============================================================================
// LONG CONTENT
// ============================================================================

export const LongContent: Story = {
  args: {
    variant: 'info',
    title: 'The Laws of Transmutation',
    children: 'In this sacred art, practitioners must follow the cardinal rule: equivalent exchange. Points are scored based on successful reactions and special catalysts discovered. The red catalyst grants +5 points while the brown catalyst deducts -2 points.',
  },
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
      <Alert variant="info">
        ☿ Mercury: Knowledge flows like quicksilver.
      </Alert>
      <Alert variant="success">
        ☉ Gold: The transmutation is complete!
      </Alert>
      <Alert variant="warning">
        △ Fire: Proceed with extreme caution.
      </Alert>
      <Alert variant="error">
        ☠ Void: The mixture has destabilized.
      </Alert>
      <Alert variant="neutral">
        ◇ Salt: An observation recorded.
      </Alert>
    </div>
  ),
};

// ============================================================================
// ALCHEMIST'S LABORATORY
// ============================================================================

export const LaboratoryNotifications: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div
      className="space-y-4 p-6 rounded-xl min-w-[400px]"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg uppercase tracking-widest text-center mb-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#D4A574',
          textShadow: '0 0 10px rgba(212, 165, 116, 0.3)',
        }}
      >
        Laboratory Scrolls
      </h3>

      <Alert
        variant="info"
        icon={<span>⚗</span>}
        title="Your Turn"
      >
        The Great Work awaits your contribution. Select a catalyst.
      </Alert>

      <Alert
        variant="success"
        icon={<span>☉</span>}
        title="Reaction Won!"
      >
        Your formula prevailed. +6 points of pure essence collected!
      </Alert>

      <Alert
        variant="warning"
        icon={<span>⏳</span>}
        title="Time Flows"
      >
        10 seconds remain before the mixture settles.
      </Alert>

      <Alert
        variant="error"
        icon={<span>✕</span>}
        title="Invalid Catalyst"
      >
        You must use the same element if you possess one.
      </Alert>
    </div>
  ),
};

// ============================================================================
// SYSTEM MESSAGES
// ============================================================================

export const SystemMessages: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
      <Alert
        variant="warning"
        icon={<span>🔮</span>}
        title="Ethereal Link Severed"
        dismissible
      >
        Attempting to restore connection... Please wait.
      </Alert>

      <Alert
        variant="success"
        icon={<span>✓</span>}
        title="Bond Restored"
        dismissible
      >
        The ethereal link has been reestablished. Continue your work!
      </Alert>

      <Alert
        variant="info"
        icon={<span>👤</span>}
        title="Alchemist Arrived"
        dismissible
      >
        Aurelia has entered the laboratory.
      </Alert>
    </div>
  ),
};

// ============================================================================
// FORM VALIDATION
// ============================================================================

export const FormValidation: Story = {
  args: {
    children: '',
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
        Register as Alchemist
      </h3>

      <div className="space-y-3">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: '#9CA3AF' }}
          >
            Alchemist Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg"
            style={{
              background: '#131824',
              border: '1px solid #2D3548',
              color: '#E8E4DC',
            }}
            defaultValue="Al"
          />
        </div>

        <Alert variant="error">
          Name must contain at least 3 runes.
        </Alert>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: '#9CA3AF' }}
          >
            Sigil of Contact
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded-lg"
            style={{
              background: '#131824',
              border: '1px solid #2D3548',
              color: '#E8E4DC',
            }}
            defaultValue="alchemist@guild.arcane"
          />
        </div>

        <Alert variant="success" icon={<span>✓</span>}>
          Sigil format is valid.
        </Alert>
      </div>
    </div>
  ),
};

// ============================================================================
// BETTING PHASE
// ============================================================================

export const BettingPhaseAlerts: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div
      className="p-6 rounded-xl"
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
        Wager Your Essence
      </h3>

      <Alert variant="info" className="mb-4">
        Declare your wager. Minimum is 7 essence points.
      </Alert>

      <div className="flex gap-2 mb-4">
        {[7, 8, 9, 10, 11, 12].map((n) => (
          <button
            key={n}
            className="px-4 py-2 rounded transition-colors"
            style={{
              background: n === 9 ? '#C17F59' : '#1A1F2E',
              color: n === 9 ? '#0B0E14' : '#9CA3AF',
              border: '1px solid #2D3548',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <Alert variant="warning">
        You must raise the wager. Current highest is 8.
      </Alert>
    </div>
  ),
};
