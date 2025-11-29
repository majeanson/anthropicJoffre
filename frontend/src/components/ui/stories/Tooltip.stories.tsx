/**
 * Tooltip Component Stories
 * Comprehensive Storybook stories for the Tooltip component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '../Tooltip';
import { Button } from '../Button';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Tooltip position relative to trigger',
    },
    variant: {
      control: 'select',
      options: ['dark', 'light', 'info', 'success', 'warning', 'error'],
      description: 'Visual style variant',
    },
    delay: {
      control: { type: 'number', min: 0, max: 1000 },
      description: 'Delay before showing tooltip (ms)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the tooltip',
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Positions
export const Top: Story = {
  args: {
    content: 'Tooltip on top',
    position: 'top',
    children: <Button>Hover me</Button>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    position: 'bottom',
    children: <Button>Hover me</Button>,
  },
};

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    position: 'left',
    children: <Button>Hover me</Button>,
  },
};

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    position: 'right',
    children: <Button>Hover me</Button>,
  },
};

// Variants
export const Dark: Story = {
  args: {
    content: 'Dark tooltip (default)',
    variant: 'dark',
    children: <Button variant="secondary">Dark</Button>,
  },
};

export const Light: Story = {
  args: {
    content: 'Light tooltip with shadow',
    variant: 'light',
    children: <Button variant="secondary">Light</Button>,
  },
};

export const Info: Story = {
  args: {
    content: 'Informational tooltip',
    variant: 'info',
    children: <Button variant="secondary">Info</Button>,
  },
};

export const Success: Story = {
  args: {
    content: 'Success! Action completed',
    variant: 'success',
    children: <Button variant="success">Success</Button>,
  },
};

export const Warning: Story = {
  args: {
    content: 'Warning: Check this first',
    variant: 'warning',
    children: <Button variant="warning">Warning</Button>,
  },
};

export const Error: Story = {
  args: {
    content: 'Error: Something went wrong',
    variant: 'error',
    children: <Button variant="danger">Error</Button>,
  },
};

// With Delay
export const WithDelay: Story = {
  args: {
    content: 'This tooltip has a 500ms delay',
    delay: 500,
    children: <Button>Hover and wait</Button>,
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    content: 'This will not show',
    disabled: true,
    children: <Button>Tooltip disabled</Button>,
  },
};

// Rich Content
export const RichContent: Story = {
  args: {
    content: (
      <div className="text-center">
        <div className="font-bold">Player Stats</div>
        <div className="text-xs opacity-75">Wins: 42 | Losses: 12</div>
      </div>
    ),
    children: <Button leftIcon={<span>📊</span>}>Stats</Button>,
  },
};

// On Icon
export const OnIcon: Story = {
  args: {
    content: 'Copy game link',
    children: (
      <button className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
        📋
      </button>
    ),
  },
};

// On Text
export const OnText: Story = {
  args: {
    content: 'Click to copy',
    children: (
      <span className="text-blue-500 underline cursor-pointer">
        Game ID: ABC123
      </span>
    ),
  },
};

// Long Content
export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip that contains more detailed information about the feature or action.',
    children: <Button>Long tooltip</Button>,
  },
};

// Showcase: All Positions
export const AllPositions: Story = {
  args: {
    content: '',
    children: null,
  },
  render: () => (
    <div className="flex flex-col items-center gap-16 p-16">
      <Tooltip content="Top position" position="top">
        <Button size="sm">Top</Button>
      </Tooltip>

      <div className="flex gap-16">
        <Tooltip content="Left position" position="left">
          <Button size="sm">Left</Button>
        </Tooltip>

        <Tooltip content="Right position" position="right">
          <Button size="sm">Right</Button>
        </Tooltip>
      </div>

      <Tooltip content="Bottom position" position="bottom">
        <Button size="sm">Bottom</Button>
      </Tooltip>
    </div>
  ),
};

// Showcase: All Variants
export const AllVariants: Story = {
  args: {
    content: '',
    children: null,
  },
  render: () => (
    <div className="flex flex-wrap gap-4 justify-center">
      <Tooltip content="Dark tooltip" variant="dark">
        <Button variant="secondary" size="sm">Dark</Button>
      </Tooltip>

      <Tooltip content="Light tooltip" variant="light">
        <Button variant="secondary" size="sm">Light</Button>
      </Tooltip>

      <Tooltip content="Info tooltip" variant="info">
        <Button variant="secondary" size="sm">Info</Button>
      </Tooltip>

      <Tooltip content="Success tooltip" variant="success">
        <Button variant="secondary" size="sm">Success</Button>
      </Tooltip>

      <Tooltip content="Warning tooltip" variant="warning">
        <Button variant="secondary" size="sm">Warning</Button>
      </Tooltip>

      <Tooltip content="Error tooltip" variant="error">
        <Button variant="secondary" size="sm">Error</Button>
      </Tooltip>
    </div>
  ),
};

// Showcase: Action Bar Example
export const ActionBarExample: Story = {
  args: {
    content: '',
    children: null,
  },
  render: () => (
    <div className="flex items-center gap-2 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg">
      <Tooltip content="Copy game link">
        <button className="p-2 hover:bg-parchment-200 dark:hover:bg-gray-700 rounded">
          📋
        </button>
      </Tooltip>

      <Tooltip content="Invite friends">
        <button className="p-2 hover:bg-parchment-200 dark:hover:bg-gray-700 rounded">
          👥
        </button>
      </Tooltip>

      <Tooltip content="Game settings">
        <button className="p-2 hover:bg-parchment-200 dark:hover:bg-gray-700 rounded">
          ⚙️
        </button>
      </Tooltip>

      <div className="h-6 w-px bg-parchment-300 dark:bg-gray-600 mx-2" />

      <Tooltip content="Leave game" variant="warning">
        <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
          🚪
        </button>
      </Tooltip>
    </div>
  ),
};

// Showcase: Player Info Example
export const PlayerInfoExample: Story = {
  args: {
    content: '',
    children: null,
  },
  render: () => (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <Tooltip
        content={
          <div className="text-left">
            <div className="font-bold">PlayerOne</div>
            <div className="text-xs mt-1">
              <div>Rank: Gold III</div>
              <div>Win Rate: 68%</div>
              <div>Games: 156</div>
            </div>
          </div>
        }
        position="right"
      >
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
          P1
        </div>
      </Tooltip>

      <div>
        <div className="font-semibold text-umber-900 dark:text-gray-100">PlayerOne</div>
        <div className="text-sm text-umber-500 dark:text-gray-400">Online</div>
      </div>
    </div>
  ),
};

// Showcase: Help Icons
export const HelpIconsExample: Story = {
  args: {
    content: '',
    children: null,
  },
  render: () => (
    <div className="space-y-4 p-4 w-80">
      <div className="flex items-center justify-between">
        <span className="text-umber-800 dark:text-gray-200">Sound Effects</span>
        <Tooltip content="Enable or disable in-game sound effects">
          <span className="text-blue-500 cursor-help">ⓘ</span>
        </Tooltip>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-umber-800 dark:text-gray-200">Auto-play</span>
        <Tooltip content="Automatically play cards when there's only one valid option">
          <span className="text-blue-500 cursor-help">ⓘ</span>
        </Tooltip>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-umber-800 dark:text-gray-200">Show hints</span>
        <Tooltip content="Highlight playable cards during your turn">
          <span className="text-blue-500 cursor-help">ⓘ</span>
        </Tooltip>
      </div>
    </div>
  ),
};
