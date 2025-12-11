/**
 * ConnectionQualityIndicator Component Stories
 *
 * Real-time connection quality display with ping latency.
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  ConnectionQualityIndicator,
  ConnectionQualityBadge,
} from '../../ConnectionQualityIndicator';
import type { ConnectionStats } from '../../hooks/useConnectionQuality';

const meta = {
  title: 'UI/ConnectionQualityIndicator',
  component: ConnectionQualityIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ConnectionQualityIndicator Component

Displays real-time connection status with visual quality indicators and ping latency.

## Quality Levels
- 🟢 **Excellent**: < 50ms latency
- 🔵 **Good**: 50-100ms latency
- 🟡 **Fair**: 100-200ms latency
- 🔴 **Poor**: > 200ms latency
- ⚫ **Offline**: No connection

## Components
- **ConnectionQualityIndicator**: Full card with label and ping display
- **ConnectionQualityBadge**: Compact inline version for in-game use

## Features
- Color-coded gradient backgrounds
- Real-time ping display
- Toast notifications for poor/offline states
- Hover tooltip with details
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConnectionQualityIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// QUALITY STATES
// =============================================================================

export const AllQualityStates: Story = {
  name: 'All Quality States',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Connection Quality States
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Excellent */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-green-400 text-sm mb-3">Excellent (&lt;50ms)</p>
          <ConnectionQualityIndicator
            stats={{ ping: 23, quality: 'excellent', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>

        {/* Good */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-blue-400 text-sm mb-3">Good (50-100ms)</p>
          <ConnectionQualityIndicator
            stats={{ ping: 78, quality: 'good', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>

        {/* Fair */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-yellow-400 text-sm mb-3">Fair (100-200ms)</p>
          <ConnectionQualityIndicator
            stats={{ ping: 156, quality: 'fair', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>

        {/* Poor */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <p className="text-red-400 text-sm mb-3">Poor (&gt;200ms)</p>
          <ConnectionQualityIndicator
            stats={{ ping: 342, quality: 'poor', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>

        {/* Offline */}
        <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] col-span-2">
          <p className="text-skin-muted text-sm mb-3">Offline (Disconnected)</p>
          <ConnectionQualityIndicator
            stats={{ ping: null, quality: 'offline', isConnected: false, lastPingTime: null }}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// BADGE VERSION
// =============================================================================

export const BadgeVersion: Story = {
  name: 'Compact Badge Version',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] space-y-6">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Compact Badge (for in-game use)
      </h3>

      <div className="flex flex-wrap gap-6">
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <ConnectionQualityBadge
            stats={{ ping: 23, quality: 'excellent', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <ConnectionQualityBadge
            stats={{ ping: 78, quality: 'good', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <ConnectionQualityBadge
            stats={{ ping: 156, quality: 'fair', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <ConnectionQualityBadge
            stats={{ ping: 342, quality: 'poor', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>
        <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
          <ConnectionQualityBadge
            stats={{ ping: null, quality: 'offline', isConnected: false, lastPingTime: null }}
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// USE CASE EXAMPLES
// =============================================================================

export const InGameHeader: Story = {
  name: 'In Game Header Context',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[600px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Game Header Integration
      </h3>

      {/* Mock game header */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
        <div className="flex items-center gap-4">
          <span className="text-[var(--color-text-primary)] font-bold">Round 3</span>
          <span className="text-[var(--color-text-secondary)]">|</span>
          <span className="text-orange-400">Team 1: 24</span>
          <span className="text-[var(--color-text-secondary)]">-</span>
          <span className="text-purple-400">Team 2: 18</span>
        </div>
        <ConnectionQualityBadge
          stats={{ ping: 45, quality: 'excellent', isConnected: true, lastPingTime: Date.now() }}
        />
      </div>
    </div>
  ),
};

export const InSettingsPanel: Story = {
  name: 'In Settings Panel Context',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[400px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Connection Settings</h3>

      <div className="space-y-4 p-4 rounded-lg bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-primary)]">Connection Status</span>
          <ConnectionQualityIndicator
            stats={{ ping: 67, quality: 'good', isConnected: true, lastPingTime: Date.now() }}
          />
        </div>

        <div className="pt-3 border-t border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Server</span>
            <span className="text-[var(--color-text-primary)]">US-East</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-[var(--color-text-secondary)]">Protocol</span>
            <span className="text-[var(--color-text-primary)]">WebSocket</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ConnectionStatesSimulation: Story = {
  name: 'Connection States Over Time',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Typical Connection Journey
      </h3>

      <div className="space-y-3">
        {[
          {
            time: '0:00',
            stats: {
              ping: null,
              quality: 'offline' as const,
              isConnected: false,
              lastPingTime: null,
            },
            label: 'Connecting...',
          },
          {
            time: '0:02',
            stats: {
              ping: 234,
              quality: 'poor' as const,
              isConnected: true,
              lastPingTime: Date.now(),
            },
            label: 'Initial connection',
          },
          {
            time: '0:05',
            stats: {
              ping: 145,
              quality: 'fair' as const,
              isConnected: true,
              lastPingTime: Date.now(),
            },
            label: 'Stabilizing',
          },
          {
            time: '0:10',
            stats: {
              ping: 78,
              quality: 'good' as const,
              isConnected: true,
              lastPingTime: Date.now(),
            },
            label: 'Normal operation',
          },
          {
            time: '0:30',
            stats: {
              ping: 32,
              quality: 'excellent' as const,
              isConnected: true,
              lastPingTime: Date.now(),
            },
            label: 'Optimal',
          },
        ].map((state, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]"
          >
            <span className="text-[var(--color-text-tertiary)] font-mono text-sm w-12">
              {state.time}
            </span>
            <ConnectionQualityIndicator stats={state.stats} />
            <span className="text-[var(--color-text-secondary)] text-sm">{state.label}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const ComparisonSideBySide: Story = {
  name: 'Full vs Compact Comparison',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
        Indicator vs Badge Comparison
      </h3>

      <div className="grid grid-cols-2 gap-8">
        {/* Full Indicator */}
        <div>
          <h4 className="text-[var(--color-text-secondary)] text-sm mb-3">
            Full Indicator (settings, lobby)
          </h4>
          <div className="space-y-3">
            <ConnectionQualityIndicator
              stats={{
                ping: 45,
                quality: 'excellent',
                isConnected: true,
                lastPingTime: Date.now(),
              }}
            />
            <ConnectionQualityIndicator
              stats={{ ping: 156, quality: 'fair', isConnected: true, lastPingTime: Date.now() }}
            />
          </div>
        </div>

        {/* Compact Badge */}
        <div>
          <h4 className="text-[var(--color-text-secondary)] text-sm mb-3">
            Compact Badge (in-game)
          </h4>
          <div className="space-y-3">
            <div className="p-2 rounded bg-[var(--color-bg-secondary)] inline-block">
              <ConnectionQualityBadge
                stats={{
                  ping: 45,
                  quality: 'excellent',
                  isConnected: true,
                  lastPingTime: Date.now(),
                }}
              />
            </div>
            <div className="p-2 rounded bg-[var(--color-bg-secondary)] inline-block ml-3">
              <ConnectionQualityBadge
                stats={{ ping: 156, quality: 'fair', isConnected: true, lastPingTime: Date.now() }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// INTERACTIVE
// =============================================================================

export const Excellent: Story = {
  args: {
    stats: { ping: 23, quality: 'excellent', isConnected: true, lastPingTime: Date.now() },
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

export const Good: Story = {
  args: {
    stats: { ping: 78, quality: 'good', isConnected: true, lastPingTime: Date.now() },
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

export const Fair: Story = {
  args: {
    stats: { ping: 156, quality: 'fair', isConnected: true, lastPingTime: Date.now() },
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

export const Poor: Story = {
  args: {
    stats: { ping: 342, quality: 'poor', isConnected: true, lastPingTime: Date.now() },
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};

export const Offline: Story = {
  args: {
    stats: { ping: null, quality: 'offline', isConnected: false, lastPingTime: null },
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)]">
        <Story />
      </div>
    ),
  ],
};
