/**
 * Select Component Stories
 * Comprehensive Storybook stories for the Select component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../Select';

const meta = {
  title: 'UI/Select',
  component: Select,
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
      description: 'Select size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width select',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '280px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const regionOptions = [
  { value: 'na', label: 'North America' },
  { value: 'eu', label: 'Europe' },
  { value: 'asia', label: 'Asia Pacific' },
  { value: 'sa', label: 'South America' },
];

// Basic Variants
export const Default: Story = {
  args: {
    label: 'Difficulty',
    options: difficultyOptions,
    placeholder: 'Select difficulty',
    variant: 'default',
  },
};

export const Filled: Story = {
  args: {
    label: 'Difficulty',
    options: difficultyOptions,
    placeholder: 'Select difficulty',
    variant: 'filled',
  },
};

export const Outlined: Story = {
  args: {
    label: 'Difficulty',
    options: difficultyOptions,
    placeholder: 'Select difficulty',
    variant: 'outlined',
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small Select',
    options: difficultyOptions,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Select',
    options: difficultyOptions,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Select',
    options: difficultyOptions,
    size: 'lg',
  },
};

// With Placeholder
export const WithPlaceholder: Story = {
  args: {
    label: 'Region',
    options: regionOptions,
    placeholder: 'Choose your region...',
  },
};

// With Helper Text
export const WithHelperText: Story = {
  args: {
    label: 'Game Mode',
    options: [
      { value: 'casual', label: 'Casual' },
      { value: 'ranked', label: 'Ranked' },
      { value: 'tournament', label: 'Tournament' },
    ],
    helperText: 'Ranked games affect your rating',
  },
};

// With Error
export const WithError: Story = {
  args: {
    label: 'Team',
    options: [
      { value: 'team1', label: 'Team 1' },
      { value: 'team2', label: 'Team 2' },
    ],
    placeholder: 'Select your team',
    error: 'Please select a team to continue',
  },
};

// With Icon
export const WithIcon: Story = {
  args: {
    label: 'Language',
    options: [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'fr', label: 'Français' },
      { value: 'de', label: 'Deutsch' },
    ],
    leftIcon: <span>🌐</span>,
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    options: difficultyOptions,
    value: 'medium',
    disabled: true,
  },
};

// With Disabled Option
export const WithDisabledOption: Story = {
  args: {
    label: 'Game Type',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'blitz', label: 'Blitz' },
      { value: 'tournament', label: 'Tournament (Coming Soon)', disabled: true },
    ],
  },
};

// Pre-selected Value
export const WithValue: Story = {
  args: {
    label: 'Bot Difficulty',
    options: difficultyOptions,
    value: 'hard',
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    label: 'Full Width Select',
    options: regionOptions,
    placeholder: 'Select region',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Without Label
export const WithoutLabel: Story = {
  args: {
    options: difficultyOptions,
    placeholder: 'Select difficulty',
  },
};

// Showcase: All Variants
export const AllVariants: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4">
      <Select
        variant="default"
        label="Default Variant"
        options={difficultyOptions}
        placeholder="Select..."
      />
      <Select
        variant="filled"
        label="Filled Variant"
        options={difficultyOptions}
        placeholder="Select..."
      />
      <Select
        variant="outlined"
        label="Outlined Variant"
        options={difficultyOptions}
        placeholder="Select..."
      />
    </div>
  ),
};

// Showcase: All Sizes
export const AllSizes: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4">
      <Select size="sm" label="Small" options={difficultyOptions} value="easy" />
      <Select size="md" label="Medium" options={difficultyOptions} value="medium" />
      <Select size="lg" label="Large" options={difficultyOptions} value="hard" />
    </div>
  ),
};

// Showcase: Form Example
export const FormExample: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg w-80">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">Game Settings</h3>

      <Select
        label="Game Mode"
        options={[
          { value: 'casual', label: 'Casual' },
          { value: 'ranked', label: 'Ranked' },
        ]}
        value="casual"
        leftIcon={<span>🎮</span>}
      />

      <Select
        label="Bot Difficulty"
        options={difficultyOptions}
        value="medium"
        helperText="Affects AI opponent skill level"
        leftIcon={<span>🤖</span>}
      />

      <Select
        label="Region"
        options={regionOptions}
        placeholder="Select region"
        leftIcon={<span>🌍</span>}
      />

      <button className="w-full py-2 mt-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
        Create Game
      </button>
    </div>
  ),
};

// Showcase: Comparison with States
export const ComparisonStates: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        label="Normal"
        options={difficultyOptions}
        placeholder="Select..."
      />
      <Select
        label="With Value"
        options={difficultyOptions}
        value="medium"
      />
      <Select
        label="With Helper"
        options={difficultyOptions}
        value="hard"
        helperText="This affects game challenge"
      />
      <Select
        label="With Error"
        options={difficultyOptions}
        error="Selection is required"
      />
      <Select
        label="Disabled"
        options={difficultyOptions}
        value="easy"
        disabled
      />
    </div>
  ),
};
