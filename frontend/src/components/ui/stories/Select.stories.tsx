/**
 * Select Component Stories
 *
 * Dropdown menus for choosing options and configurations.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../Select';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Select Component

Dropdown menus for choosing options and configurations.

## Features
- **3 variants**: default, filled, outlined
- **3 sizes**: sm, md, lg
- **Icon support**: Left-positioned icons
- **Helper text**: Guidance for selections
- **Error states**: Validation feedback

Use the skin selector in the toolbar to see how selects adapt to different themes.
        `,
      },
    },
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
  { value: 'apprentice', label: 'Apprentice' },
  { value: 'journeyman', label: 'Journeyman' },
  { value: 'master', label: 'Master Alchemist' },
];

const elementOptions = [
  { value: 'fire', label: '△ Fire' },
  { value: 'water', label: '▽ Water' },
  { value: 'earth', label: '◇ Earth' },
  { value: 'air', label: '○ Air' },
];

const realmOptions = [
  { value: 'arcane', label: 'Arcane Academy' },
  { value: 'ember', label: 'Ember Forge' },
  { value: 'void', label: 'The Void' },
  { value: 'crystal', label: 'Crystal Sanctum' },
];

// ============================================================================
// BASIC VARIANTS
// ============================================================================

export const Default: Story = {
  args: {
    label: 'Mastery Level',
    options: difficultyOptions,
    placeholder: 'Select your level...',
    variant: 'default',
  },
};

export const Filled: Story = {
  args: {
    label: 'Mastery Level',
    options: difficultyOptions,
    placeholder: 'Select your level...',
    variant: 'filled',
  },
};

export const Outlined: Story = {
  args: {
    label: 'Mastery Level',
    options: difficultyOptions,
    placeholder: 'Select your level...',
    variant: 'outlined',
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const Small: Story = {
  args: {
    label: 'Small Selection',
    options: difficultyOptions,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium Selection',
    options: difficultyOptions,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Selection',
    options: difficultyOptions,
    size: 'lg',
  },
};

// ============================================================================
// WITH PLACEHOLDER
// ============================================================================

export const WithPlaceholder: Story = {
  args: {
    label: 'Realm',
    options: realmOptions,
    placeholder: 'Choose your realm...',
  },
};

// ============================================================================
// WITH HELPER TEXT
// ============================================================================

export const WithHelperText: Story = {
  args: {
    label: 'Experiment Mode',
    options: [
      { value: 'practice', label: 'Practice' },
      { value: 'ranked', label: 'Ranked' },
      { value: 'tournament', label: 'Grand Tournament' },
    ],
    helperText: 'Ranked experiments affect your guild standing',
  },
};

// ============================================================================
// WITH ERROR
// ============================================================================

export const WithError: Story = {
  args: {
    label: 'Guild Allegiance',
    options: [
      { value: 'guild1', label: 'Order of the Phoenix' },
      { value: 'guild2', label: 'Brotherhood of Mercury' },
    ],
    placeholder: 'Select your guild',
    error: 'You must pledge allegiance to continue',
  },
};

// ============================================================================
// WITH ICON
// ============================================================================

export const WithIcon: Story = {
  args: {
    label: 'Primary Element',
    options: elementOptions,
    leftIcon: <span>⚗</span>,
  },
};

// ============================================================================
// DISABLED
// ============================================================================

export const Disabled: Story = {
  args: {
    label: 'Sealed Selection',
    options: difficultyOptions,
    value: 'journeyman',
    disabled: true,
  },
};

// ============================================================================
// WITH DISABLED OPTION
// ============================================================================

export const WithDisabledOption: Story = {
  args: {
    label: 'Experiment Type',
    options: [
      { value: 'transmutation', label: 'Transmutation' },
      { value: 'distillation', label: 'Distillation' },
      { value: 'forbidden', label: 'Forbidden Arts (Sealed)', disabled: true },
    ],
  },
};

// ============================================================================
// PRE-SELECTED VALUE
// ============================================================================

export const WithValue: Story = {
  args: {
    label: 'Familiar Difficulty',
    options: difficultyOptions,
    value: 'master',
  },
};

// ============================================================================
// FULL WIDTH
// ============================================================================

export const FullWidth: Story = {
  args: {
    label: 'Full Width Selection',
    options: realmOptions,
    placeholder: 'Select realm',
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

// ============================================================================
// WITHOUT LABEL
// ============================================================================

export const WithoutLabel: Story = {
  args: {
    options: difficultyOptions,
    placeholder: 'Select mastery level',
  },
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default">
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

// ============================================================================
// ALL SIZES
// ============================================================================

export const AllSizes: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <Select size="sm" label="Small" options={difficultyOptions} value="apprentice" />
      <Select size="md" label="Medium" options={difficultyOptions} value="journeyman" />
      <Select size="lg" label="Large" options={difficultyOptions} value="master" />
    </div>
  ),
};

// ============================================================================
// GAME SETTINGS
// ============================================================================

export const GameSettings: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4 p-6 rounded-xl w-80 bg-skin-secondary border border-skin-default">
      <h3 className="text-lg font-bold mb-4 text-skin-accent">Game Settings</h3>

      <Select
        label="Game Mode"
        options={[
          { value: 'practice', label: 'Practice' },
          { value: 'ranked', label: 'Ranked' },
        ]}
        value="practice"
        leftIcon={<span>🎮</span>}
      />

      <Select
        label="Bot Difficulty"
        options={difficultyOptions}
        value="journeyman"
        helperText="Affects the skill of bot players"
        leftIcon={<span>🤖</span>}
      />

      <Select
        label="Region"
        options={realmOptions}
        placeholder="Select region"
        leftIcon={<span>🌍</span>}
      />

      <button className="w-full py-3 rounded-lg font-semibold uppercase tracking-widest mt-2 bg-skin-accent text-skin-on-accent hover:opacity-90 transition-opacity">
        Start Game
      </button>
    </div>
  ),
};

// ============================================================================
// COMPARISON STATES
// ============================================================================

export const ComparisonStates: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="space-y-4 w-80 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <Select label="Normal" options={difficultyOptions} placeholder="Select..." />
      <Select label="With Value" options={difficultyOptions} value="journeyman" />
      <Select
        label="With Helper"
        options={difficultyOptions}
        value="master"
        helperText="This affects game difficulty"
      />
      <Select label="With Error" options={difficultyOptions} error="Selection is required" />
      <Select label="Disabled" options={difficultyOptions} value="apprentice" disabled />
    </div>
  ),
};

// ============================================================================
// ELEMENT SELECTOR
// ============================================================================

export const ElementSelector: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div className="p-6 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-lg font-bold mb-4 text-skin-primary">Choose Your Element</h3>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Primary"
          options={elementOptions}
          value="fire"
          leftIcon={<span className="text-red-500">△</span>}
        />
        <Select
          label="Secondary"
          options={elementOptions}
          placeholder="Optional"
          leftIcon={<span className="text-blue-500">▽</span>}
        />
      </div>

      <p className="text-sm mt-4 italic text-skin-muted">
        Your selection affects gameplay strategy.
      </p>
    </div>
  ),
};
