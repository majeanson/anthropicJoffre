/**
 * Spinner Component Stories
 *
 * Loading indicators with various sizes and variants.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../Spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Spinner Component

Loading indicators with various sizes and variants.

## Features
- **4 sizes**: xs, sm, md, lg
- **3 variants**: default (ring), dots, pulse
- **6 colors**: primary, white, gray, success, warning, error

Use the skin selector in the toolbar to see how spinners adapt to different themes.
        `,
      },
    },
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

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

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

// ============================================================================
// VARIANTS
// ============================================================================

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

// ============================================================================
// COLORS
// ============================================================================

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
      <div className="p-8 rounded-lg bg-skin-secondary">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// ALL SIZES
// ============================================================================

export const AllSizes: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-6 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <div className="text-center">
        <Spinner size="xs" />
        <p className="text-xs mt-2 text-skin-muted">xs</p>
      </div>
      <div className="text-center">
        <Spinner size="sm" />
        <p className="text-xs mt-2 text-skin-muted">sm</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="text-xs mt-2 text-skin-muted">md</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-xs mt-2 text-skin-muted">lg</p>
      </div>
    </div>
  ),
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-8 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <div className="text-center">
        <Spinner variant="default" size="lg" />
        <p className="text-xs mt-3 text-skin-muted">Ring</p>
      </div>
      <div className="text-center">
        <Spinner variant="dots" size="lg" />
        <p className="text-xs mt-3 text-skin-muted">Dots</p>
      </div>
      <div className="text-center">
        <Spinner variant="pulse" size="lg" />
        <p className="text-xs mt-3 text-skin-muted">Pulse</p>
      </div>
    </div>
  ),
};

// ============================================================================
// ALL COLORS
// ============================================================================

export const AllColors: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap items-center gap-6 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <div className="text-center">
        <Spinner color="primary" size="md" />
        <p className="text-xs mt-2 text-skin-muted">Primary</p>
      </div>
      <div className="text-center">
        <Spinner color="success" size="md" />
        <p className="text-xs mt-2 text-skin-muted">Success</p>
      </div>
      <div className="text-center">
        <Spinner color="warning" size="md" />
        <p className="text-xs mt-2 text-skin-muted">Warning</p>
      </div>
      <div className="text-center">
        <Spinner color="error" size="md" />
        <p className="text-xs mt-2 text-skin-muted">Error</p>
      </div>
      <div className="text-center">
        <Spinner color="gray" size="md" />
        <p className="text-xs mt-2 text-skin-muted">Gray</p>
      </div>
      <div className="text-center p-3 rounded-lg bg-skin-secondary">
        <Spinner color="white" size="md" />
        <p className="text-xs mt-2 text-skin-secondary">White</p>
      </div>
    </div>
  ),
};

// ============================================================================
// IN BUTTON
// ============================================================================

export const InButton: Story = {
  args: {},
  render: () => (
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-skin-accent text-skin-on-accent">
        <Spinner size="xs" color="gray" />
        <span>Loading...</span>
      </button>
      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-skin-tertiary border border-skin-default text-skin-primary">
        <Spinner size="xs" color="white" variant="dots" />
        <span>Processing...</span>
      </button>
    </div>
  ),
};

// ============================================================================
// LOADING CARD
// ============================================================================

export const LoadingCard: Story = {
  args: {},
  render: () => (
    <div className="p-8 rounded-xl text-center bg-skin-secondary border-2 border-skin-accent">
      <Spinner size="lg" color="primary" />
      <p className="mt-4 italic text-skin-accent">Loading...</p>
    </div>
  ),
};

// ============================================================================
// RECONNECTING STATE
// ============================================================================

export const ReconnectingState: Story = {
  args: {},
  render: () => (
    <div className="p-4 rounded-lg flex items-center gap-3 bg-yellow-500/10 border border-yellow-500">
      <Spinner size="sm" color="warning" />
      <span className="font-medium text-yellow-500">Reconnecting...</span>
    </div>
  ),
};

// ============================================================================
// FULL PAGE LOADING
// ============================================================================

export const FullPageLoading: Story = {
  args: {},
  render: () => (
    <div className="w-80 h-48 rounded-xl flex flex-col items-center justify-center bg-skin-secondary border border-skin-default">
      <Spinner size="lg" color="primary" />
      <p className="mt-4 text-sm text-skin-muted">Loading data...</p>
    </div>
  ),
};

// ============================================================================
// INLINE WITH TEXT
// ============================================================================

export const InlineWithText: Story = {
  args: {},
  render: () => (
    <div className="space-y-3 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <p className="text-skin-primary">
        <Spinner size="xs" className="mr-2" />
        Fetching profiles...
      </p>
      <p className="text-skin-primary">
        <Spinner size="xs" variant="dots" className="mr-2" />
        Searching...
      </p>
      <p className="text-skin-primary">
        <Spinner size="xs" variant="pulse" className="mr-2" />
        Analyzing...
      </p>
    </div>
  ),
};

// ============================================================================
// PROCESSING STATE
// ============================================================================

export const ProcessingState: Story = {
  args: {},
  render: () => (
    <div className="p-6 rounded-xl text-center bg-skin-primary border border-skin-default">
      <div className="relative inline-block w-20 h-20">
        <Spinner size="lg" color="primary" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
      </div>
      <h3 className="text-lg font-bold mt-4 text-skin-accent">Processing</h3>
      <p className="text-sm mt-2 italic text-skin-muted">Please wait...</p>
    </div>
  ),
};
