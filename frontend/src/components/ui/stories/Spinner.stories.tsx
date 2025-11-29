/**
 * Spinner Component Stories
 * Comprehensive Storybook stories for the Spinner component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../Spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Spinner size',
    },
    variant: {
      control: 'select',
      options: ['default', 'dots', 'pulse'],
      description: 'Spinner variant',
    },
    color: {
      control: 'select',
      options: ['primary', 'white', 'gray', 'success', 'warning', 'error'],
      description: 'Color theme',
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

// Variants
export const RingSpinner: Story = {
  args: {
    variant: 'default',
    size: 'lg',
  },
};

export const DotsSpinner: Story = {
  args: {
    variant: 'dots',
    size: 'lg',
  },
};

export const PulseSpinner: Story = {
  args: {
    variant: 'pulse',
    size: 'lg',
  },
};

// Colors
export const PrimaryColor: Story = {
  args: {
    color: 'primary',
    size: 'lg',
  },
};

export const SuccessColor: Story = {
  args: {
    color: 'success',
    size: 'lg',
  },
};

export const WarningColor: Story = {
  args: {
    color: 'warning',
    size: 'lg',
  },
};

export const ErrorColor: Story = {
  args: {
    color: 'error',
    size: 'lg',
  },
};

export const WhiteColor: Story = {
  args: {
    color: 'white',
    size: 'lg',
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

// Showcase: All Sizes
export const AllSizes: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Spinner size="xs" />
        <p className="text-xs text-gray-500 mt-2">xs</p>
      </div>
      <div className="text-center">
        <Spinner size="sm" />
        <p className="text-xs text-gray-500 mt-2">sm</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="text-xs text-gray-500 mt-2">md</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-xs text-gray-500 mt-2">lg</p>
      </div>
    </div>
  ),
};

// Showcase: All Variants
export const AllVariants: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner variant="default" size="lg" />
        <p className="text-xs text-gray-500 mt-3">Ring</p>
      </div>
      <div className="text-center">
        <Spinner variant="dots" size="lg" />
        <p className="text-xs text-gray-500 mt-3">Dots</p>
      </div>
      <div className="text-center">
        <Spinner variant="pulse" size="lg" />
        <p className="text-xs text-gray-500 mt-3">Pulse</p>
      </div>
    </div>
  ),
};

// Showcase: All Colors
export const AllColors: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <div className="text-center">
        <Spinner color="primary" size="md" />
        <p className="text-xs text-gray-500 mt-2">Primary</p>
      </div>
      <div className="text-center">
        <Spinner color="success" size="md" />
        <p className="text-xs text-gray-500 mt-2">Success</p>
      </div>
      <div className="text-center">
        <Spinner color="warning" size="md" />
        <p className="text-xs text-gray-500 mt-2">Warning</p>
      </div>
      <div className="text-center">
        <Spinner color="error" size="md" />
        <p className="text-xs text-gray-500 mt-2">Error</p>
      </div>
      <div className="text-center">
        <Spinner color="gray" size="md" />
        <p className="text-xs text-gray-500 mt-2">Gray</p>
      </div>
      <div className="text-center bg-gray-800 p-3 rounded-lg">
        <Spinner color="white" size="md" />
        <p className="text-xs text-gray-400 mt-2">White</p>
      </div>
    </div>
  ),
};

// Showcase: Loading Button
export const InButton: Story = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
        <Spinner size="xs" color="white" />
        <span>Loading...</span>
      </button>
      <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg">
        <Spinner size="xs" color="white" variant="dots" />
        <span>Processing...</span>
      </button>
    </div>
  ),
};

// Showcase: Loading Card
export const LoadingCard: Story = {
  args: {},
  render: () => (
    <div className="p-8 bg-parchment-100 dark:bg-gray-800 rounded-lg border-2 border-parchment-300 dark:border-gray-600 text-center">
      <Spinner size="lg" color="primary" />
      <p className="text-umber-700 dark:text-gray-300 mt-4">Loading game data...</p>
    </div>
  ),
};

// Showcase: Reconnecting State
export const ReconnectingState: Story = {
  args: {},
  render: () => (
    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-400 dark:border-yellow-600 flex items-center gap-3">
      <Spinner size="sm" color="warning" />
      <span className="text-yellow-800 dark:text-yellow-200 font-medium">
        Reconnecting to server...
      </span>
    </div>
  ),
};

// Showcase: Full Page Loading
export const FullPageLoading: Story = {
  args: {},
  render: () => (
    <div className="w-80 h-48 bg-gray-900 rounded-lg flex flex-col items-center justify-center">
      <Spinner size="lg" color="white" />
      <p className="text-gray-400 mt-4 text-sm">Loading match stats...</p>
    </div>
  ),
};

// Showcase: Inline with Text
export const InlineWithText: Story = {
  args: {},
  render: () => (
    <div className="space-y-3">
      <p className="text-umber-800 dark:text-gray-200">
        <Spinner size="xs" className="mr-2" />
        Fetching player stats...
      </p>
      <p className="text-umber-800 dark:text-gray-200">
        <Spinner size="xs" variant="dots" className="mr-2" />
        Searching for games...
      </p>
    </div>
  ),
};
