/**
 * UnreadBadge Component Stories
 * Sprint 20 - Storybook Integration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UnreadBadge } from '../UnreadBadge';

const meta = {
  title: 'UI/Social/UnreadBadge',
  component: UnreadBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: 'number',
    },
    variant: {
      control: 'select',
      options: ['blue', 'red', 'green', 'purple'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    position: {
      control: 'select',
      options: ['inline', 'absolute'],
    },
    max: {
      control: 'number',
    },
  },
} satisfies Meta<typeof UnreadBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 5,
  },
};

export const Blue: Story = {
  args: {
    count: 3,
    variant: 'blue',
  },
};

export const Red: Story = {
  args: {
    count: 7,
    variant: 'red',
  },
};

export const Green: Story = {
  args: {
    count: 2,
    variant: 'green',
  },
};

export const Purple: Story = {
  args: {
    count: 10,
    variant: 'purple',
  },
};

export const Small: Story = {
  args: {
    count: 5,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    count: 5,
    size: 'lg',
  },
};

export const OverMax: Story = {
  args: {
    count: 150,
    max: 99,
  },
};

export const ZeroCount: Story = {
  args: {
    count: 0,
  },
};

export const AbsolutePosition: Story = {
  args: {
    count: 5,
    position: 'absolute',
  },
  render: () => (
    <div className="relative inline-block p-4 bg-gray-700 rounded">
      <span className="text-white">Notifications</span>
      <UnreadBadge count={5} position="absolute" />
    </div>
  ),
};

export const AllVariants: Story = {
  args: {
    count: 3,
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-white w-24">Blue:</span>
        <UnreadBadge count={3} variant="blue" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white w-24">Red:</span>
        <UnreadBadge count={5} variant="red" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white w-24">Green:</span>
        <UnreadBadge count={2} variant="green" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white w-24">Purple:</span>
        <UnreadBadge count={7} variant="purple" />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  args: {
    count: 5,
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-white w-24">Small:</span>
        <UnreadBadge count={5} size="sm" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white w-24">Medium:</span>
        <UnreadBadge count={5} size="md" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white w-24">Large:</span>
        <UnreadBadge count={5} size="lg" />
      </div>
    </div>
  ),
};
