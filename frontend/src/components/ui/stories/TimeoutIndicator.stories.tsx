/**
 * TimeoutIndicator Component Stories
 *
 * Badge-style timeout indicator with color-coded urgency levels.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { UIBadge } from '../UIBadge';
import { Button } from '../Button';

// Note: We can't import TimeoutIndicator directly because it relies on internal state
// and useEffect timers. Instead, we create display versions that show the visual states.

const meta = {
  title: 'Game/TimeoutIndicator',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TimeoutIndicator Component

A compact badge-style timeout indicator with urgency-based color transitions.

## Features
- **Urgency Colors**: Green (> 50%) → Yellow (25-50%) → Red (< 25%)
- **Smooth Transitions**: 500ms color transition animation
- **Compact Design**: Uses UIBadge with emoji timer icon
- **Auto-Hide**: Hidden when not active or never activated
- **Reset Support**: Resets on resetKey change (new turn/player)
- **Timeout Callback**: Optional callback when timer reaches 0

## Props
- \`duration\`: Total duration in milliseconds
- \`isActive\`: Whether timer is counting down
- \`resetKey\`: Key to trigger timer reset (e.g., playerId)
- \`onTimeout\`: Optional callback when timer reaches 0

## Use Cases
- Turn timers in betting/playing phases
- Action countdown displays
- Time-limited prompts
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// URGENCY STATES
// =============================================================================

function TimeoutBadgeDisplay({
  seconds,
  percentage,
}: {
  seconds: number;
  percentage: number;
}) {
  const getBadgeColor = (): 'success' | 'warning' | 'error' => {
    if (percentage > 50) return 'success';
    if (percentage > 25) return 'warning';
    return 'error';
  };

  return (
    <UIBadge variant="solid" color={getBadgeColor()} size="sm" className="transition-colors duration-500">
      ⏱️ {seconds}s
    </UIBadge>
  );
}

export const UrgencyStates: Story = {
  name: 'Urgency States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6 w-[350px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Timeout Urgency Levels</h3>

      <div className="space-y-4">
        {/* Green - Plenty of Time (> 50%) */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <div>
            <p className="text-green-400 text-sm font-medium">Plenty of Time</p>
            <p className="text-[var(--color-text-tertiary)] text-xs">&gt; 50% remaining</p>
          </div>
          <TimeoutBadgeDisplay seconds={45} percentage={75} />
        </div>

        {/* Yellow - Getting Low (25-50%) */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <div>
            <p className="text-yellow-400 text-sm font-medium">Getting Low</p>
            <p className="text-[var(--color-text-tertiary)] text-xs">25-50% remaining</p>
          </div>
          <TimeoutBadgeDisplay seconds={20} percentage={33} />
        </div>

        {/* Red - Critical (< 25%) */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <div>
            <p className="text-red-400 text-sm font-medium">Critical</p>
            <p className="text-[var(--color-text-tertiary)] text-xs">&lt; 25% remaining</p>
          </div>
          <TimeoutBadgeDisplay seconds={8} percentage={13} />
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
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">60s Timer Countdown</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Shows color transitions at different time points
      </p>

      <div className="space-y-2">
        {[
          { seconds: 60, percentage: 100, label: 'Start' },
          { seconds: 45, percentage: 75, label: '' },
          { seconds: 35, percentage: 58, label: '' },
          { seconds: 30, percentage: 50, label: 'Warning threshold' },
          { seconds: 25, percentage: 42, label: '' },
          { seconds: 20, percentage: 33, label: '' },
          { seconds: 15, percentage: 25, label: 'Critical threshold' },
          { seconds: 10, percentage: 17, label: '' },
          { seconds: 5, percentage: 8, label: '' },
          { seconds: 1, percentage: 2, label: 'Almost out!' },
        ].map(({ seconds, percentage, label }) => (
          <div
            key={seconds}
            className="flex items-center gap-4 p-2 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <TimeoutBadgeDisplay seconds={seconds} percentage={percentage} />
            <span className="text-[var(--color-text-tertiary)] text-xs flex-1">
              {label && `← ${label}`}
            </span>
            <span className="text-[var(--color-text-tertiary)] font-mono text-xs">
              {percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// DIFFERENT DURATIONS
// =============================================================================

export const DifferentDurations: Story = {
  name: 'Different Duration Timers',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6 w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Timer Durations</h3>

      <div className="space-y-4">
        {/* 30 second timer */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[var(--color-text-secondary)] font-medium">30s Timer (Fast)</p>
            <TimeoutBadgeDisplay seconds={18} percentage={60} />
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs">
            Warning at 15s, Critical at 7.5s
          </p>
        </div>

        {/* 60 second timer (default) */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[var(--color-text-secondary)] font-medium">60s Timer (Default)</p>
            <TimeoutBadgeDisplay seconds={36} percentage={60} />
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs">
            Warning at 30s, Critical at 15s
          </p>
        </div>

        {/* 120 second timer (beginner mode) */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[var(--color-text-secondary)] font-medium">120s Timer (Beginner)</p>
            <TimeoutBadgeDisplay seconds={72} percentage={60} />
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs">
            Warning at 60s, Critical at 30s
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// IN CONTEXT
// =============================================================================

export const InGameContext: Story = {
  name: 'In Game Context',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Timer in Game UI</h3>

      {/* Player info with timer */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border-2 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <p className="text-[var(--color-text-primary)] font-medium">Alice</p>
                <p className="text-green-400 text-sm">Your Turn</p>
              </div>
            </div>
            <TimeoutBadgeDisplay seconds={42} percentage={70} />
          </div>
        </div>

        {/* Other players waiting */}
        {['Bob', 'Charlie', 'Diana'].map((name, i) => (
          <div key={name} className="p-4 rounded-lg bg-[var(--color-bg-secondary)] opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                {name[0]}
              </div>
              <div>
                <p className="text-[var(--color-text-primary)] font-medium">{name}</p>
                <p className="text-[var(--color-text-tertiary)] text-sm">Waiting...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

// =============================================================================
// LIVE COUNTDOWN DEMO
// =============================================================================

function LiveCountdownDemo() {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const duration = 30;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const percentage = (seconds / duration) * 100;

  const handleStart = () => {
    setSeconds(duration);
    setIsActive(true);
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(duration);
  };

  return (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[350px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Live Countdown Demo</h3>

      <div className="flex items-center justify-center gap-4 mb-6 p-4 rounded-lg bg-[var(--color-bg-secondary)]">
        {isActive ? (
          <TimeoutBadgeDisplay seconds={seconds} percentage={percentage} />
        ) : (
          <span className="text-[var(--color-text-tertiary)]">Timer inactive</span>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          variant="primary"
          size="sm"
          onClick={handleStart}
          disabled={isActive}
        >
          Start Timer
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>

      <p className="text-[var(--color-text-tertiary)] text-xs text-center mt-4">
        Watch the colors change as time runs out!
      </p>
    </div>
  );
}

export const LiveCountdown: Story = {
  name: 'Live Countdown Demo',
  render: () => <LiveCountdownDemo />,
};

// =============================================================================
// BADGE SIZES COMPARISON
// =============================================================================

export const BadgeSizes: Story = {
  name: 'Badge Size Variants',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Badge Size Comparison</h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        TimeoutIndicator uses size="sm" for compact display
      </p>

      <div className="space-y-4">
        {(['xs', 'sm', 'md'] as const).map((size) => (
          <div
            key={size}
            className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <span className="text-[var(--color-text-secondary)] font-mono">{size}</span>
            <UIBadge variant="solid" color="success" size={size}>
              ⏱️ 45s
            </UIBadge>
          </div>
        ))}
      </div>

      <p className="text-[var(--color-text-tertiary)] text-xs mt-4 text-center">
        "sm" provides the best balance of visibility and compactness
      </p>
    </div>
  ),
};

// =============================================================================
// THRESHOLD VISUALIZATION
// =============================================================================

export const ThresholdVisualization: Story = {
  name: 'Color Threshold Visualization',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[450px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Color Thresholds</h3>

      {/* Visual bar */}
      <div className="relative h-8 rounded-lg overflow-hidden mb-4">
        <div className="absolute inset-0 flex">
          <div className="w-1/4 bg-red-500 flex items-center justify-center text-white text-xs font-bold">
            Critical
          </div>
          <div className="w-1/4 bg-yellow-500 flex items-center justify-center text-gray-900 text-xs font-bold">
            Warning
          </div>
          <div className="flex-1 bg-green-500 flex items-center justify-center text-white text-xs font-bold">
            Normal
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mb-6">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      {/* Examples */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <TimeoutBadgeDisplay seconds={5} percentage={8} />
          <p className="text-[var(--color-text-tertiary)] text-xs mt-2">8%</p>
        </div>
        <div className="text-center">
          <TimeoutBadgeDisplay seconds={20} percentage={33} />
          <p className="text-[var(--color-text-tertiary)] text-xs mt-2">33%</p>
        </div>
        <div className="text-center">
          <TimeoutBadgeDisplay seconds={45} percentage={75} />
          <p className="text-[var(--color-text-tertiary)] text-xs mt-2">75%</p>
        </div>
      </div>
    </div>
  ),
};
