/**
 * Checkbox Component Stories
 * Comprehensive Storybook stories for the Checkbox component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../Checkbox';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['checkbox', 'toggle'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Checkbox/toggle size',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state (checkbox only)',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Variants
export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
    variant: 'checkbox',
  },
};

export const Toggle: Story = {
  args: {
    label: 'Enable notifications',
    variant: 'toggle',
  },
};

// Checked States
export const CheckedCheckbox: Story = {
  args: {
    label: 'Remember me',
    variant: 'checkbox',
    checked: true,
  },
};

export const CheckedToggle: Story = {
  args: {
    label: 'Dark Mode',
    variant: 'toggle',
    checked: true,
  },
};

// Sizes - Checkbox
export const SmallCheckbox: Story = {
  args: {
    label: 'Small checkbox',
    variant: 'checkbox',
    size: 'sm',
  },
};

export const MediumCheckbox: Story = {
  args: {
    label: 'Medium checkbox (default)',
    variant: 'checkbox',
    size: 'md',
  },
};

export const LargeCheckbox: Story = {
  args: {
    label: 'Large checkbox',
    variant: 'checkbox',
    size: 'lg',
  },
};

// Sizes - Toggle
export const SmallToggle: Story = {
  args: {
    label: 'Small toggle',
    variant: 'toggle',
    size: 'sm',
  },
};

export const MediumToggle: Story = {
  args: {
    label: 'Medium toggle (default)',
    variant: 'toggle',
    size: 'md',
  },
};

export const LargeToggle: Story = {
  args: {
    label: 'Large toggle',
    variant: 'toggle',
    size: 'lg',
  },
};

// With Description
export const WithDescription: Story = {
  args: {
    label: 'Email notifications',
    description: 'Receive updates about your games via email',
    variant: 'checkbox',
  },
};

export const ToggleWithDescription: Story = {
  args: {
    label: 'Sound Effects',
    description: 'Play sounds when cards are played',
    variant: 'toggle',
  },
};

// States
export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
    variant: 'checkbox',
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled checked',
    disabled: true,
    checked: true,
    variant: 'checkbox',
  },
};

export const DisabledToggle: Story = {
  args: {
    label: 'Disabled toggle',
    disabled: true,
    variant: 'toggle',
  },
};

export const DisabledToggleChecked: Story = {
  args: {
    label: 'Disabled toggle (on)',
    disabled: true,
    checked: true,
    variant: 'toggle',
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all (partial)',
    indeterminate: true,
    variant: 'checkbox',
  },
};

// Without Label
export const WithoutLabel: Story = {
  args: {
    variant: 'checkbox',
    'aria-label': 'Standalone checkbox',
  },
};

export const ToggleWithoutLabel: Story = {
  args: {
    variant: 'toggle',
    'aria-label': 'Standalone toggle',
  },
};

// Showcase: All Checkbox Sizes
export const AllCheckboxSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox size="sm" label="Small checkbox" checked />
      <Checkbox size="md" label="Medium checkbox" checked />
      <Checkbox size="lg" label="Large checkbox" checked />
    </div>
  ),
};

// Showcase: All Toggle Sizes
export const AllToggleSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox variant="toggle" size="sm" label="Small toggle" checked />
      <Checkbox variant="toggle" size="md" label="Medium toggle" checked />
      <Checkbox variant="toggle" size="lg" label="Large toggle" checked />
    </div>
  ),
};

// Showcase: Settings Panel Example
export const SettingsPanelExample: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg w-80">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">Game Settings</h3>

      <Checkbox
        variant="toggle"
        label="Sound Effects"
        description="Play sounds for game events"
        checked
      />

      <Checkbox
        variant="toggle"
        label="Auto-play"
        description="Automatically play when possible"
      />

      <Checkbox
        variant="toggle"
        label="Dark Mode"
        description="Use dark theme"
        checked
      />

      <div className="border-t border-parchment-300 dark:border-gray-600 pt-4 mt-4">
        <h4 className="text-sm font-semibold text-umber-700 dark:text-gray-300 mb-3">Notifications</h4>

        <div className="space-y-2">
          <Checkbox label="Game invites" checked />
          <Checkbox label="Friend requests" checked />
          <Checkbox label="New messages" />
        </div>
      </div>
    </div>
  ),
};

// Showcase: Form Example
export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 p-4 w-80">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100">Create Account</h3>

      <div className="space-y-3">
        <Checkbox
          label="I agree to the Terms of Service"
          description="Required to create an account"
        />

        <Checkbox
          label="Subscribe to newsletter"
          description="Get game tips and updates"
        />

        <Checkbox
          label={
            <span>
              I am at least <strong>13 years old</strong>
            </span>
          }
        />
      </div>

      <button className="w-full py-2 mt-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
        Create Account
      </button>
    </div>
  ),
};
