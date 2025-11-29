/**
 * IconButton Component Stories
 * Sprint 20 - Storybook Integration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '../IconButton';

const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['circular', 'square', 'minimal'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Circular: Story = {
  args: {
    icon: '✕',
    ariaLabel: 'Close',
    variant: 'circular',
  },
};

export const Square: Story = {
  args: {
    icon: '⚙️',
    ariaLabel: 'Settings',
    variant: 'square',
  },
};

export const Minimal: Story = {
  args: {
    icon: '🗑️',
    ariaLabel: 'Delete',
    variant: 'minimal',
  },
};

export const Small: Story = {
  args: {
    icon: '✕',
    ariaLabel: 'Close',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    icon: '⚙️',
    ariaLabel: 'Settings',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    icon: '✕',
    ariaLabel: 'Close',
    disabled: true,
  },
};
