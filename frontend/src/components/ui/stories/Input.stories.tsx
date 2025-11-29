/**
 * Input Component Stories
 * Comprehensive Storybook stories for the Input component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input',
    },
    showPasswordToggle: {
      control: 'boolean',
      description: 'Show password visibility toggle (password inputs only)',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Variants
export const Default: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    variant: 'default',
  },
};

export const Filled: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    variant: 'filled',
  },
};

export const Outlined: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
    variant: 'outlined',
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Input',
    placeholder: 'Medium size (default)',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

// Input Types
export const Email: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    leftIcon: <span>📧</span>,
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    showPasswordToggle: true,
  },
};

export const Search: Story = {
  args: {
    label: 'Search',
    type: 'search',
    placeholder: 'Search players...',
    leftIcon: <span>🔍</span>,
  },
};

export const Number: Story = {
  args: {
    label: 'Age',
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 120,
  },
};

// States
export const WithHelperText: Story = {
  args: {
    label: 'Player Name',
    placeholder: 'Enter name',
    helperText: 'This will be displayed to other players',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    value: 'Disabled value',
    disabled: true,
  },
};

// Icons
export const WithLeftIcon: Story = {
  args: {
    label: 'Game ID',
    placeholder: 'Enter game ID',
    leftIcon: <span>🎮</span>,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Points',
    type: 'number',
    placeholder: '0',
    rightIcon: <span>pts</span>,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Amount',
    type: 'number',
    placeholder: '0.00',
    leftIcon: <span>$</span>,
    rightIcon: <span>USD</span>,
  },
};

// Password with Toggle
export const PasswordWithToggle: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    showPasswordToggle: true,
    helperText: 'Click the eye icon to show/hide password',
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    label: 'Full Width Input',
    placeholder: 'Takes up full container width',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

// No Label
export const WithoutLabel: Story = {
  args: {
    placeholder: 'Input without label',
  },
};

// Showcase: All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Input variant="default" label="Default Variant" placeholder="Default styling" />
      <Input variant="filled" label="Filled Variant" placeholder="Filled background" />
      <Input variant="outlined" label="Outlined Variant" placeholder="Border only" />
    </div>
  ),
};

// Showcase: All Sizes
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input size="sm" label="Small" placeholder="Small input" />
      <Input size="md" label="Medium" placeholder="Medium input" />
      <Input size="lg" label="Large" placeholder="Large input" />
    </div>
  ),
};

// Showcase: Form Example
export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">Join Game</h3>
      <Input
        label="Player Name"
        placeholder="Enter your name"
        leftIcon={<span>👤</span>}
        helperText="2-16 characters"
      />
      <Input
        label="Game Code"
        placeholder="ABC123"
        leftIcon={<span>🎮</span>}
        helperText="6-character game code"
      />
      <button className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
        Join Game
      </button>
    </div>
  ),
};
