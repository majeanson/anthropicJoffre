/**
 * UIBadge Component Stories - Multi-Skin Edition
 *
 * Badge/tag component with proper CSS variable support for all themes.
 * Switch skins using the paintbrush icon in the Storybook toolbar.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UIBadge } from '../UIBadge';

const meta = {
  title: 'UI/UIBadge',
  component: UIBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# UIBadge Component

Flexible badge component for labels, status indicators, and tags.

## Features
- **5 variants**: solid, outline, subtle, arcane, translucent
- **10 colors**: team1, team2, success, warning, error, info, muted, accent, gray, primary
- **3 sizes**: xs, sm, md
- **2 shapes**: rounded, pill
- **Pulse animation** for status indicators

## Multi-Skin Support
Switch skins using the paintbrush icon in the Storybook toolbar to preview
how the component looks across all available themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'subtle', 'arcane', 'translucent'],
      description: 'Visual style variant',
    },
    color: {
      control: 'select',
      options: ['team1', 'team2', 'success', 'warning', 'error', 'info', 'muted', 'accent', 'gray', 'primary'],
      description: 'Color scheme',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md'],
      description: 'Badge size',
    },
    shape: {
      control: 'select',
      options: ['rounded', 'pill'],
      description: 'Shape style',
    },
    pulse: {
      control: 'boolean',
      description: 'Enable pulse animation (for status indicators)',
    },
  },
} satisfies Meta<typeof UIBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Icon components for examples
const CheckIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

const DotIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="4" />
  </svg>
);

// All Colors (Solid Variant)
export const AllColors: Story = {
  args: { children: null },
  render: () => (
    <div className="flex flex-wrap gap-3">
      <UIBadge color="team1">Team 1</UIBadge>
      <UIBadge color="team2">Team 2</UIBadge>
      <UIBadge color="success">Success</UIBadge>
      <UIBadge color="warning">Warning</UIBadge>
      <UIBadge color="error">Error</UIBadge>
      <UIBadge color="info">Info</UIBadge>
      <UIBadge color="gray">Gray</UIBadge>
      <UIBadge color="primary">Primary</UIBadge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available colors in solid variant (default)',
      },
    },
  },
};

// All Variants
export const AllVariants: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium w-24" style={{ color: 'var(--color-text-secondary)' }}>
          Solid:
        </span>
        <UIBadge variant="solid" color="success">
          Success
        </UIBadge>
        <UIBadge variant="solid" color="info">
          Info
        </UIBadge>
        <UIBadge variant="solid" color="warning">
          Warning
        </UIBadge>
        <UIBadge variant="solid" color="error">
          Error
        </UIBadge>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium w-24" style={{ color: 'var(--color-text-secondary)' }}>
          Outline:
        </span>
        <UIBadge variant="outline" color="success">
          Success
        </UIBadge>
        <UIBadge variant="outline" color="info">
          Info
        </UIBadge>
        <UIBadge variant="outline" color="warning">
          Warning
        </UIBadge>
        <UIBadge variant="outline" color="error">
          Error
        </UIBadge>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium w-24" style={{ color: 'var(--color-text-secondary)' }}>
          Subtle:
        </span>
        <UIBadge variant="subtle" color="success">
          Success
        </UIBadge>
        <UIBadge variant="subtle" color="info">
          Info
        </UIBadge>
        <UIBadge variant="subtle" color="warning">
          Warning
        </UIBadge>
        <UIBadge variant="subtle" color="error">
          Error
        </UIBadge>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium w-24" style={{ color: 'var(--color-text-secondary)' }}>
          Translucent:
        </span>
        <UIBadge variant="translucent" color="success">
          Success
        </UIBadge>
        <UIBadge variant="translucent" color="info">
          Info
        </UIBadge>
        <UIBadge variant="translucent" color="warning">
          Warning
        </UIBadge>
        <UIBadge variant="translucent" color="error">
          Error
        </UIBadge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All available variants: solid (full color), outline (border only), subtle (muted background), translucent (semi-transparent)',
      },
    },
  },
};

// All Sizes
export const AllSizes: Story = {
  args: { children: null },
  render: () => (
    <div className="flex items-center gap-3">
      <UIBadge size="xs" color="primary">
        Extra Small
      </UIBadge>
      <UIBadge size="sm" color="primary">
        Small
      </UIBadge>
      <UIBadge size="md" color="primary">
        Medium
      </UIBadge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available sizes: xs (px-2 py-0.5), sm (px-2 py-1), md (px-3 py-1.5)',
      },
    },
  },
};

// Pill Shape
export const PillShape: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-3">
      <div className="flex gap-3 items-center">
        <span className="text-sm font-medium w-20" style={{ color: 'var(--color-text-secondary)' }}>
          Rounded:
        </span>
        <UIBadge shape="rounded" color="success">
          Active
        </UIBadge>
        <UIBadge shape="rounded" color="warning">
          Pending
        </UIBadge>
        <UIBadge shape="rounded" color="error">
          Inactive
        </UIBadge>
      </div>
      <div className="flex gap-3 items-center">
        <span className="text-sm font-medium w-20" style={{ color: 'var(--color-text-secondary)' }}>
          Pill:
        </span>
        <UIBadge shape="pill" color="success">
          Active
        </UIBadge>
        <UIBadge shape="pill" color="warning">
          Pending
        </UIBadge>
        <UIBadge shape="pill" color="error">
          Inactive
        </UIBadge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shape variants: rounded (default) vs pill (rounded-full)',
      },
    },
  },
};

// With Icons
export const WithIcons: Story = {
  args: { children: null },
  render: () => (
    <div className="flex flex-wrap gap-3">
      <UIBadge color="success" icon={<CheckIcon />}>
        Completed
      </UIBadge>
      <UIBadge color="warning" icon={<AlertIcon />}>
        Warning
      </UIBadge>
      <UIBadge color="info" icon={<InfoIcon />}>
        Information
      </UIBadge>
      <UIBadge color="error" icon={<DotIcon />}>
        Error
      </UIBadge>
      <UIBadge color="team1" variant="outline" icon={<DotIcon />}>
        Team 1
      </UIBadge>
      <UIBadge color="team2" variant="outline" icon={<DotIcon />}>
        Team 2
      </UIBadge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges with icons positioned left of text',
      },
    },
  },
};

// Pulsing Badge (Status Indicators)
export const PulsingBadge: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-3">
        <UIBadge color="success" pulse icon={<DotIcon />}>
          Online
        </UIBadge>
        <UIBadge color="warning" pulse icon={<DotIcon />}>
          Away
        </UIBadge>
        <UIBadge color="error" pulse icon={<DotIcon />}>
          Busy
        </UIBadge>
        <UIBadge color="gray" icon={<DotIcon />}>
          Offline
        </UIBadge>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Pulse animation for live status indicators
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pulsing badges for status indicators (online, away, busy)',
      },
    },
  },
};

// Team Badges
export const TeamBadges: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-3">
        <UIBadge variant="solid" color="team1">
          Team 1
        </UIBadge>
        <UIBadge variant="outline" color="team1">
          Team 1
        </UIBadge>
        <UIBadge variant="subtle" color="team1">
          Team 1
        </UIBadge>
        <UIBadge variant="translucent" color="team1">
          Team 1
        </UIBadge>
      </div>
      <div className="flex gap-3">
        <UIBadge variant="solid" color="team2">
          Team 2
        </UIBadge>
        <UIBadge variant="outline" color="team2">
          Team 2
        </UIBadge>
        <UIBadge variant="subtle" color="team2">
          Team 2
        </UIBadge>
        <UIBadge variant="translucent" color="team2">
          Team 2
        </UIBadge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Team 1 (orange) and Team 2 (purple) badges in all variants',
      },
    },
  },
};

// Status Examples
export const StatusExamples: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      {/* User Status */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          User Status
        </h4>
        <div className="flex flex-wrap gap-2">
          <UIBadge color="success" variant="subtle" icon={<DotIcon />}>
            Online
          </UIBadge>
          <UIBadge color="warning" variant="subtle" icon={<DotIcon />}>
            Away
          </UIBadge>
          <UIBadge color="error" variant="subtle" icon={<DotIcon />}>
            Busy
          </UIBadge>
          <UIBadge color="gray" variant="subtle" icon={<DotIcon />}>
            Offline
          </UIBadge>
        </div>
      </div>

      {/* Game Status */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Game Status
        </h4>
        <div className="flex flex-wrap gap-2">
          <UIBadge color="success" shape="pill">
            Active
          </UIBadge>
          <UIBadge color="warning" shape="pill">
            Waiting
          </UIBadge>
          <UIBadge color="info" shape="pill">
            In Progress
          </UIBadge>
          <UIBadge color="gray" shape="pill">
            Finished
          </UIBadge>
        </div>
      </div>

      {/* Priority Levels */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Priority Levels
        </h4>
        <div className="flex flex-wrap gap-2">
          <UIBadge color="error" size="xs">
            High
          </UIBadge>
          <UIBadge color="warning" size="xs">
            Medium
          </UIBadge>
          <UIBadge color="info" size="xs">
            Low
          </UIBadge>
        </div>
      </div>

      {/* Notification Counts */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Notification Counts
        </h4>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <button
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
            >
              Messages
            </button>
            <UIBadge
              color="error"
              size="xs"
              shape="pill"
              className="absolute -top-2 -right-2"
            >
              3
            </UIBadge>
          </div>
          <div className="relative">
            <button
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
            >
              Notifications
            </button>
            <UIBadge
              color="primary"
              size="xs"
              shape="pill"
              className="absolute -top-2 -right-2"
            >
              12
            </UIBadge>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Real-world status examples: user status, game status, priority levels, notification counts',
      },
    },
  },
};

// Skin Showcase
export const SkinShowcase: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Solid
          </h4>
          <div className="flex flex-wrap gap-2">
            <UIBadge variant="solid" color="success">
              Success
            </UIBadge>
            <UIBadge variant="solid" color="error">
              Error
            </UIBadge>
            <UIBadge variant="solid" color="team1">
              Team 1
            </UIBadge>
            <UIBadge variant="solid" color="team2">
              Team 2
            </UIBadge>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Outline
          </h4>
          <div className="flex flex-wrap gap-2">
            <UIBadge variant="outline" color="success">
              Success
            </UIBadge>
            <UIBadge variant="outline" color="error">
              Error
            </UIBadge>
            <UIBadge variant="outline" color="team1">
              Team 1
            </UIBadge>
            <UIBadge variant="outline" color="team2">
              Team 2
            </UIBadge>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Subtle
          </h4>
          <div className="flex flex-wrap gap-2">
            <UIBadge variant="subtle" color="success">
              Success
            </UIBadge>
            <UIBadge variant="subtle" color="error">
              Error
            </UIBadge>
            <UIBadge variant="subtle" color="team1">
              Team 1
            </UIBadge>
            <UIBadge variant="subtle" color="team2">
              Team 2
            </UIBadge>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Translucent
          </h4>
          <div className="flex flex-wrap gap-2">
            <UIBadge variant="translucent" color="success">
              Success
            </UIBadge>
            <UIBadge variant="translucent" color="error">
              Error
            </UIBadge>
            <UIBadge variant="translucent" color="team1">
              Team 1
            </UIBadge>
            <UIBadge variant="translucent" color="team2">
              Team 2
            </UIBadge>
          </div>
        </div>
      </div>
      <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
        Switch skins using the paintbrush icon in the Storybook toolbar
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All badge variants demonstrating multi-skin support',
      },
    },
  },
};

// Real-world Examples
export const RealWorldExamples: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-6 max-w-2xl">
      {/* Player Card with Status */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full"
              style={{ background: 'linear-gradient(135deg, var(--color-team2-primary), var(--color-team1-primary))' }}
            />
            <div>
              <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                John Doe
              </h4>
              <UIBadge color="success" variant="subtle" size="xs" icon={<DotIcon />}>
                Online
              </UIBadge>
            </div>
          </div>
          <UIBadge color="team1" variant="outline">
            Team 1
          </UIBadge>
        </div>
      </div>

      {/* Game Lobby Card */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Game Room #1234
          </h4>
          <UIBadge color="success" pulse icon={<DotIcon />}>
            Active
          </UIBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <UIBadge variant="subtle" color="info" size="xs">
            3/4 Players
          </UIBadge>
          <UIBadge variant="subtle" color="warning" size="xs">
            Waiting
          </UIBadge>
          <UIBadge variant="subtle" color="gray" size="xs">
            Public
          </UIBadge>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Player Stats
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              28
            </div>
            <UIBadge variant="subtle" color="success" size="xs">
              Wins
            </UIBadge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              15
            </div>
            <UIBadge variant="subtle" color="error" size="xs">
              Losses
            </UIBadge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              2
            </div>
            <UIBadge variant="subtle" color="gray" size="xs">
              Draws
            </UIBadge>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Real-world examples: player cards, game lobbies, and stats dashboards',
      },
    },
  },
};
