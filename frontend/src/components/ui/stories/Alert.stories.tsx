/**
 * Alert Component Stories
 *
 * Notification alerts with various variants and states.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../Alert';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Alert Component

Notification alerts for conveying important messages.
Each alert type represents a different state.

## Features
- **5 variants**: info, success, warning, error, neutral
- **Dismissible**: Optional close button
- **Custom icons**: Custom icon support
- **Title support**: For formal headings

Use the skin selector in the toolbar to see how alerts adapt to different themes.
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
    children:
      'In this sacred art, practitioners must follow the cardinal rule: equivalent exchange. Points are scored based on successful reactions and special catalysts discovered. The red catalyst grants +5 points while the brown catalyst deducts -2 points.',
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
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <Alert variant="info">Information alert message.</Alert>
      <Alert variant="success">Success! The operation completed.</Alert>
      <Alert variant="warning">Warning: Please proceed with caution.</Alert>
      <Alert variant="error">Error: Something went wrong.</Alert>
      <Alert variant="neutral">Neutral notification message.</Alert>
    </div>
  ),
};

// ============================================================================
// GAME NOTIFICATIONS
// ============================================================================

export const GameNotifications: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4 p-6 rounded-xl min-w-[400px] bg-skin-secondary border border-skin-default">
      <h3 className="text-lg uppercase tracking-widest text-center mb-4 text-skin-accent">
        Game Notifications
      </h3>

      <Alert variant="info" icon={<span>🎮</span>} title="Your Turn">
        It's your turn to play a card.
      </Alert>

      <Alert variant="success" icon={<span>🏆</span>} title="Trick Won!">
        You won the trick! +6 points collected!
      </Alert>

      <Alert variant="warning" icon={<span>⏳</span>} title="Timer">
        10 seconds remaining.
      </Alert>

      <Alert variant="error" icon={<span>✕</span>} title="Invalid Move">
        You must follow suit if you have it.
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
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <Alert variant="warning" icon={<span>⚠️</span>} title="Connection Lost" dismissible>
        Attempting to reconnect... Please wait.
      </Alert>

      <Alert variant="success" icon={<span>✓</span>} title="Connected" dismissible>
        Connection has been restored. Continue playing!
      </Alert>

      <Alert variant="info" icon={<span>👤</span>} title="Player Joined" dismissible>
        Player3 has joined the game.
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
    <div className="space-y-4 p-6 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-lg font-bold mb-4 text-skin-primary">Register Account</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-skin-muted">Username</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg bg-skin-secondary border border-skin-default text-skin-primary"
            defaultValue="Al"
          />
        </div>

        <Alert variant="error">Username must be at least 3 characters.</Alert>

        <div>
          <label className="block text-sm font-medium mb-1 text-skin-muted">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded-lg bg-skin-secondary border border-skin-default text-skin-primary"
            defaultValue="user@example.com"
          />
        </div>

        <Alert variant="success" icon={<span>✓</span>}>
          Email format is valid.
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
    <div className="p-6 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-lg font-bold mb-4 text-skin-accent">Place Your Bet</h3>

      <Alert variant="info" className="mb-4">
        Place your bet. Minimum is 7 points.
      </Alert>

      <div className="flex gap-2 mb-4">
        {[7, 8, 9, 10, 11, 12].map((n) => (
          <button
            key={n}
            className={`px-4 py-2 rounded transition-colors border border-skin-default ${
              n === 9
                ? 'bg-skin-accent text-skin-on-accent'
                : 'bg-skin-tertiary text-skin-muted hover:bg-skin-secondary'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <Alert variant="warning">You must raise the bet. Current highest is 8.</Alert>
    </div>
  ),
};
