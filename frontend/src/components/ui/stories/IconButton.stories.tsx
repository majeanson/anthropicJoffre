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
      options: ['primary', 'secondary', 'danger'],
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

export const Primary: Story = {
  args: {
    icon: '✕',
    'aria-label': 'Close',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    icon: '⚙️',
    'aria-label': 'Settings',
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    icon: '🗑️',
    'aria-label': 'Delete',
    variant: 'danger',
  },
};

export const Small: Story = {
  args: {
    icon: '✕',
    'aria-label': 'Close',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    icon: '⚙️',
    'aria-label': 'Settings',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    icon: '✕',
    'aria-label': 'Close',
    disabled: true,
  },
};
