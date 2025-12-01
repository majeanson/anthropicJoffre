/**
 * TimeoutCountdown Component Stories
 *
 * Turn timeout countdown display with urgency indicators.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TimeoutCountdown } from '../../TimeoutCountdown';

const meta = {
  title: 'Game/TimeoutCountdown',
  component: TimeoutCountdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TimeoutCountdown Component

Displays turn timeout with visual urgency escalation.

## Time Thresholds
- **> 15 seconds**: Info (blue) - Normal countdown
- **<= 15 seconds**: Warning (yellow) - Urgency indicator
- **<= 5 seconds**: Critical (red) - Immediate action needed

## Features
- Fixed positioning (top center of screen)
- Color transitions based on time remaining
- Special messaging for player's own turn
- Auto-play warning when time is critical
- Hidden when > 60 seconds or 0 seconds

## Use Cases
- Turn timer display during gameplay
- Urgency feedback for players
- Auto-play notification
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    playerName: { control: 'text', description: 'Name of player whose turn it is' },
    secondsRemaining: { control: { type: 'range', min: 0, max: 60, step: 1 }, description: 'Seconds left' },
    isYourTurn: { control: 'boolean', description: 'Is it the current user\'s turn?' },
  },
} satisfies Meta<typeof TimeoutCountdown>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// TIME STATES (Static Display)
// =============================================================================

// Note: The component uses fixed positioning which doesn't work well in Storybook
// These stories show the component content without the fixed positioning wrapper

export const AllTimeStates: Story = {
  name: 'All Time States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6 w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Timeout States</h3>

      <div className="space-y-4">
        {/* Normal (> 15s) */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-blue-400 text-sm mb-2">Normal (&gt; 15 seconds)</p>
          <div className="relative">
            <TimeoutCountdownDisplay playerName="Alice" secondsRemaining={45} isYourTurn={false} />
          </div>
        </div>

        {/* Warning (5-15s) */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-yellow-400 text-sm mb-2">Warning (5-15 seconds)</p>
          <div className="relative">
            <TimeoutCountdownDisplay playerName="Bob" secondsRemaining={12} isYourTurn={false} />
          </div>
        </div>

        {/* Critical (< 5s) */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-red-400 text-sm mb-2">Critical (&lt; 5 seconds)</p>
          <div className="relative">
            <TimeoutCountdownDisplay playerName="Charlie" secondsRemaining={3} isYourTurn={false} />
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// YOUR TURN VS OTHER PLAYER
// =============================================================================

export const TurnComparison: Story = {
  name: 'Your Turn vs Other Player',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6 w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Turn Comparison</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Your Turn */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Your Turn</p>
          <TimeoutCountdownDisplay playerName="You" secondsRemaining={30} isYourTurn={true} />
        </div>

        {/* Other Player */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Other Player</p>
          <TimeoutCountdownDisplay playerName="Alice" secondsRemaining={30} isYourTurn={false} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// AUTO-PLAY WARNING
// =============================================================================

export const AutoPlayWarning: Story = {
  name: 'Auto-Play Warning (Your Turn)',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6 w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Auto-Play Warnings</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Warning message appears when it's your turn and time is running low
      </p>

      <div className="space-y-4">
        {/* Warning threshold (15s) */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-yellow-400 text-sm mb-2">At 15 seconds - Warning starts</p>
          <TimeoutCountdownDisplay playerName="You" secondsRemaining={15} isYourTurn={true} />
        </div>

        {/* Critical */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-red-400 text-sm mb-2">At 5 seconds - Critical urgency</p>
          <TimeoutCountdownDisplay playerName="You" secondsRemaining={5} isYourTurn={true} />
        </div>

        {/* About to auto-play */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-red-400 text-sm mb-2">At 2 seconds - Imminent auto-play</p>
          <TimeoutCountdownDisplay playerName="You" secondsRemaining={2} isYourTurn={true} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// COUNTDOWN SEQUENCE
// =============================================================================

export const CountdownSequence: Story = {
  name: 'Countdown Sequence',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Typical Countdown</h3>

      <div className="space-y-3">
        {[45, 30, 20, 15, 10, 5, 3, 1].map((seconds) => (
          <div
            key={seconds}
            className="flex items-center gap-4 p-2 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <span className="text-[var(--color-text-tertiary)] font-mono w-8">{seconds}s</span>
            <div className="flex-1">
              <TimeoutCountdownDisplay
                playerName="Alice"
                secondsRemaining={seconds}
                isYourTurn={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// HIDDEN STATES
// =============================================================================

export const HiddenStates: Story = {
  name: 'Hidden States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Hidden States</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Component returns null in these cases:
      </p>

      <div className="space-y-4">
        {/* 0 seconds */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border-primary)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">0 seconds (timeout occurred)</p>
          <TimeoutCountdown playerName="Alice" secondsRemaining={0} isYourTurn={false} />
          <p className="text-[var(--color-text-tertiary)] text-xs">(Nothing rendered)</p>
        </div>

        {/* > 60 seconds */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border-primary)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">&gt; 60 seconds (no urgency)</p>
          <TimeoutCountdown playerName="Alice" secondsRemaining={90} isYourTurn={false} />
          <p className="text-[var(--color-text-tertiary)] text-xs">(Nothing rendered)</p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// HELPER COMPONENT (without fixed positioning)
// =============================================================================

function TimeoutCountdownDisplay({
  playerName,
  secondsRemaining,
  isYourTurn
}: {
  playerName: string;
  secondsRemaining: number;
  isYourTurn: boolean;
}) {
  if (secondsRemaining === 0 || secondsRemaining > 60) {
    return null;
  }

  const isWarning = secondsRemaining <= 15;
  const isCritical = secondsRemaining <= 5;

  const bgColor = isCritical
    ? 'bg-red-600'
    : isWarning
    ? 'bg-yellow-600'
    : 'bg-blue-600';

  return (
    <div className={`${bgColor} text-white px-4 py-2 rounded-lg inline-block`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-bold">
            {isYourTurn ? 'Your turn' : playerName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-black">{secondsRemaining}</span>
          <span className="text-sm">sec</span>
        </div>
      </div>
      {isYourTurn && secondsRemaining <= 15 && (
        <div className="text-xs text-center mt-1 opacity-90">
          Hurry! Auto-play will activate soon
        </div>
      )}
    </div>
  );
}

// =============================================================================
// INTERACTIVE
// =============================================================================

export const Default: Story = {
  args: {
    playerName: 'Alice',
    secondsRemaining: 30,
    isYourTurn: false,
  },
  render: (args) => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <TimeoutCountdownDisplay {...args} />
    </div>
  ),
};

export const YourTurnWarning: Story = {
  args: {
    playerName: 'You',
    secondsRemaining: 10,
    isYourTurn: true,
  },
  render: (args) => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <TimeoutCountdownDisplay {...args} />
    </div>
  ),
};

export const CriticalTime: Story = {
  args: {
    playerName: 'You',
    secondsRemaining: 3,
    isYourTurn: true,
  },
  render: (args) => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <TimeoutCountdownDisplay {...args} />
    </div>
  ),
};
