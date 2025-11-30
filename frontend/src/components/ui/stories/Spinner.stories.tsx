/**
 * Spinner Component Stories - Midnight Alchemy Edition
 *
 * Mystical loading indicators showing alchemical processes,
 * ethereal channeling, and transmutation in progress.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../Spinner';

const meta = {
  title: 'Midnight Alchemy/Spinner',
  component: Spinner,
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
# Midnight Alchemy Spinners

Mystical loading indicators showing alchemical processes,
ethereal channeling, and transmutation in progress.

## Features
- **4 sizes**: xs, sm, md, lg
- **3 variants**: default (ring), dots, pulse
- **6 colors**: primary, white, gray, success, warning, error

## Alchemical Usage
Indicates active transmutation, essence channeling,
or connection to the ethereal realm.
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
      <div
        className="p-8 rounded-lg"
        style={{ background: '#131824' }}
      >
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
    <div className="flex items-center gap-6 p-6 bg-[#0B0E14] rounded-xl">
      <div className="text-center">
        <Spinner size="xs" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          xs
        </p>
      </div>
      <div className="text-center">
        <Spinner size="sm" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          sm
        </p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          md
        </p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          lg
        </p>
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
    <div className="flex items-center gap-8 p-6 bg-[#0B0E14] rounded-xl">
      <div className="text-center">
        <Spinner variant="default" size="lg" />
        <p
          className="text-xs mt-3"
          style={{ color: '#6B7280' }}
        >
          Ring
        </p>
      </div>
      <div className="text-center">
        <Spinner variant="dots" size="lg" />
        <p
          className="text-xs mt-3"
          style={{ color: '#6B7280' }}
        >
          Essence
        </p>
      </div>
      <div className="text-center">
        <Spinner variant="pulse" size="lg" />
        <p
          className="text-xs mt-3"
          style={{ color: '#6B7280' }}
        >
          Pulse
        </p>
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
    <div className="flex flex-wrap items-center gap-6 p-6 bg-[#0B0E14] rounded-xl">
      <div className="text-center">
        <Spinner color="primary" size="md" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          Copper
        </p>
      </div>
      <div className="text-center">
        <Spinner color="success" size="md" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          Emerald
        </p>
      </div>
      <div className="text-center">
        <Spinner color="warning" size="md" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          Amber
        </p>
      </div>
      <div className="text-center">
        <Spinner color="error" size="md" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          Ruby
        </p>
      </div>
      <div className="text-center">
        <Spinner color="gray" size="md" />
        <p
          className="text-xs mt-2"
          style={{ color: '#6B7280' }}
        >
          Mercury
        </p>
      </div>
      <div
        className="text-center p-3 rounded-lg"
        style={{ background: '#131824' }}
      >
        <Spinner color="white" size="md" />
        <p
          className="text-xs mt-2"
          style={{ color: '#9CA3AF' }}
        >
          Moonlight
        </p>
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
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
      <button
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold"
        style={{
          background: 'linear-gradient(180deg, #C17F59 0%, rgba(193, 127, 89, 0.8) 100%)',
          color: '#0B0E14',
          fontFamily: '"Cinzel", Georgia, serif',
        }}
      >
        <Spinner size="xs" color="gray" />
        <span>Transmuting...</span>
      </button>
      <button
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
        style={{
          background: '#1A1F2E',
          border: '1px solid #2D3548',
          color: '#E8E4DC',
        }}
      >
        <Spinner size="xs" color="white" variant="dots" />
        <span>Channeling...</span>
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
    <div
      className="p-8 rounded-xl text-center"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '2px solid #C17F59',
        boxShadow: '0 0 30px rgba(193, 127, 89, 0.15)',
      }}
    >
      <Spinner size="lg" color="primary" />
      <p
        className="mt-4"
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          color: '#D4A574',
          fontStyle: 'italic',
        }}
      >
        Consulting the ancient tomes...
      </p>
    </div>
  ),
};

// ============================================================================
// RECONNECTING STATE
// ============================================================================

export const ReconnectingState: Story = {
  args: {},
  render: () => (
    <div
      className="p-4 rounded-lg flex items-center gap-3"
      style={{
        background: 'rgba(217, 119, 6, 0.1)',
        border: '1px solid #D97706',
      }}
    >
      <Spinner size="sm" color="warning" />
      <span
        className="font-medium"
        style={{ color: '#FBBF24' }}
      >
        Restoring ethereal connection...
      </span>
    </div>
  ),
};

// ============================================================================
// FULL PAGE LOADING
// ============================================================================

export const FullPageLoading: Story = {
  args: {},
  render: () => (
    <div
      className="w-80 h-48 rounded-xl flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #0B0E14 0%, #131824 100%)',
        border: '1px solid #2D3548',
      }}
    >
      <Spinner size="lg" color="primary" />
      <p
        className="mt-4 text-sm"
        style={{ color: '#6B7280' }}
      >
        Loading experiment data...
      </p>
    </div>
  ),
};

// ============================================================================
// INLINE WITH TEXT
// ============================================================================

export const InlineWithText: Story = {
  args: {},
  render: () => (
    <div className="space-y-3 p-6 bg-[#0B0E14] rounded-xl">
      <p style={{ color: '#E8E4DC' }}>
        <Spinner size="xs" className="mr-2" />
        Fetching alchemist profiles...
      </p>
      <p style={{ color: '#E8E4DC' }}>
        <Spinner size="xs" variant="dots" className="mr-2" />
        Searching the archives...
      </p>
      <p style={{ color: '#E8E4DC' }}>
        <Spinner size="xs" variant="pulse" className="mr-2" />
        Analyzing formula stability...
      </p>
    </div>
  ),
};

// ============================================================================
// TRANSMUTATION PROGRESS
// ============================================================================

export const TransmutationProgress: Story = {
  args: {},
  render: () => (
    <div
      className="p-6 rounded-xl text-center"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <div
        className="relative inline-block"
        style={{ width: '80px', height: '80px' }}
      >
        <Spinner size="lg" color="primary" />
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl"
        >
          ⚗
        </div>
      </div>
      <h3
        className="text-lg font-bold mt-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#D4A574',
        }}
      >
        Transmutation in Progress
      </h3>
      <p
        className="text-sm mt-2 italic"
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          color: '#6B7280',
        }}
      >
        The elements are aligning...
      </p>
    </div>
  ),
};
