/**
 * SmartValidationMessage Component Stories
 *
 * Priority-based validation message display showing the most important message.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SmartValidationMessage } from '../../SmartValidationMessage';

const meta = {
  title: 'UI/SmartValidationMessage',
  component: SmartValidationMessage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# SmartValidationMessage Component

Displays validation messages with automatic priority handling.

## Priority Order (highest to lowest)
1. **Error** (red) - Critical issues that block action
2. **Warning** (yellow) - Important warnings but not blocking
3. **Info** (blue) - Helpful information
4. **Success** (green) - Confirmation of successful action

## Features
- Automatically shows highest priority message
- Fixed height (h-14) for consistent UI
- Accessible with ARIA live region
- Color-coded gradients
- Icon indicators for each type

## Use Cases
- Form validation feedback
- Game rule violations
- Betting constraints
- Turn requirements
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SmartValidationMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export const AllMessageTypes: Story = {
  name: 'All Message Types',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-4 w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Message Types</h3>

      <div className="space-y-3">
        <div>
          <p className="text-red-400 text-sm mb-1">Error</p>
          <SmartValidationMessage
            messages={[{ type: 'error', text: 'You must follow suit if you have it!' }]}
          />
        </div>

        <div>
          <p className="text-yellow-400 text-sm mb-1">Warning</p>
          <SmartValidationMessage
            messages={[{ type: 'warning', text: 'Playing this card will lose the trick' }]}
          />
        </div>

        <div>
          <p className="text-blue-400 text-sm mb-1">Info</p>
          <SmartValidationMessage
            messages={[{ type: 'info', text: 'You can play any card - no suit to follow' }]}
          />
        </div>

        <div>
          <p className="text-green-400 text-sm mb-1">Success</p>
          <SmartValidationMessage
            messages={[{ type: 'success', text: 'Great choice! This card wins the trick' }]}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// PRIORITY HANDLING
// =============================================================================

export const PriorityHandling: Story = {
  name: 'Priority Handling',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6 w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Priority Handling</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        When multiple messages exist, the highest priority is shown
      </p>

      <div className="space-y-4">
        {/* Error wins */}
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">
            Messages: info + warning + error → Error wins
          </p>
          <SmartValidationMessage
            messages={[
              { type: 'info', text: 'You can play trump cards' },
              { type: 'warning', text: 'Consider saving your high cards' },
              { type: 'error', text: 'Must follow the led suit!' },
            ]}
          />
        </div>

        {/* Warning wins (no error) */}
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">
            Messages: info + success + warning → Warning wins
          </p>
          <SmartValidationMessage
            messages={[
              { type: 'info', text: 'Normal play' },
              { type: 'success', text: 'Good card!' },
              { type: 'warning', text: 'Low on trump cards' },
            ]}
          />
        </div>

        {/* Info wins (no error/warning) */}
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-xs mb-2">
            Messages: success + info → Info wins
          </p>
          <SmartValidationMessage
            messages={[
              { type: 'success', text: 'Play recorded' },
              { type: 'info', text: 'Waiting for other players' },
            ]}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// GAME SCENARIOS
// =============================================================================

export const BettingValidation: Story = {
  name: 'Betting Validation',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-4 w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Betting Phase Messages</h3>

      <div className="space-y-3">
        <SmartValidationMessage
          messages={[{ type: 'error', text: 'Bet must be higher than 8. Minimum: 9' }]}
        />

        <SmartValidationMessage
          messages={[{ type: 'warning', text: 'You are the dealer - you must bet if everyone skips' }]}
        />

        <SmartValidationMessage
          messages={[{ type: 'info', text: 'Dealer privilege: You can match or raise' }]}
        />

        <SmartValidationMessage
          messages={[{ type: 'success', text: 'Valid bet - you can proceed' }]}
        />
      </div>
    </div>
  ),
};

export const PlayingValidation: Story = {
  name: 'Playing Phase Validation',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-4 w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Playing Phase Messages</h3>

      <div className="space-y-3">
        <SmartValidationMessage
          messages={[{ type: 'error', text: 'You must follow red - you have red cards in hand!' }]}
        />

        <SmartValidationMessage
          messages={[{ type: 'warning', text: 'This card won\'t beat the current leader' }]}
        />

        <SmartValidationMessage
          messages={[{ type: 'info', text: 'Led suit: Brown. Play brown if you have it' }]}
        />

        <SmartValidationMessage
          messages={[{ type: 'success', text: 'You won the trick! +6 points (red zero bonus)' }]}
        />
      </div>
    </div>
  ),
};

// =============================================================================
// FIXED HEIGHT DEMO
// =============================================================================

export const FixedHeight: Story = {
  name: 'Fixed Height (h-14)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Fixed Height Consistency</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        All messages have the same height for stable UI
      </p>

      <div className="space-y-2">
        <SmartValidationMessage
          messages={[{ type: 'error', text: 'Short error' }]}
        />
        <SmartValidationMessage
          messages={[{ type: 'warning', text: 'This is a medium length warning message for testing' }]}
        />
        <SmartValidationMessage
          messages={[{ type: 'info', text: 'Very long informational message that demonstrates text handling in the component' }]}
        />
      </div>
    </div>
  ),
};

// =============================================================================
// EMPTY STATE
// =============================================================================

export const EmptyState: Story = {
  name: 'Empty State (No Messages)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Empty State</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Component returns null when no messages
      </p>

      <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border-primary)]">
        <SmartValidationMessage messages={[]} />
        <p className="text-[var(--color-text-tertiary)] text-sm text-center">
          (Nothing rendered above - empty messages array)
        </p>
      </div>
    </div>
  ),
};

// =============================================================================
// INTERACTIVE
// =============================================================================

export const Error: Story = {
  args: {
    messages: [{ type: 'error', text: 'You must follow suit if you have it!' }],
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const Warning: Story = {
  args: {
    messages: [{ type: 'warning', text: 'Playing this card may not be optimal' }],
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const Info: Story = {
  args: {
    messages: [{ type: 'info', text: 'You can play any card from your hand' }],
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const Success: Story = {
  args: {
    messages: [{ type: 'success', text: 'Perfect play! You won the trick!' }],
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
        <Story />
      </div>
    ),
  ],
};
