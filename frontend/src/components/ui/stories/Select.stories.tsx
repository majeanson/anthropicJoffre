/**
 * Select Component Stories - Midnight Alchemy Edition
 *
 * Mystical dropdown menus for choosing elements, catalysts,
 * and configurations in the alchemist's laboratory.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../Select';

const meta = {
  title: 'Midnight Alchemy/Select',
  component: Select,
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
# Midnight Alchemy Select

Mystical dropdown menus for choosing elements, catalysts,
and configurations in the alchemist's laboratory.

## Features
- **3 variants**: default, filled, outlined
- **3 sizes**: sm, md, lg
- **Icon support**: Left-positioned alchemical symbols
- **Helper text**: Guidance for selections
- **Error states**: Validation feedback

## Alchemical Usage
Perfect for element selection, difficulty settings,
and experiment configurations.
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
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
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
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
      <Select size="sm" label="Small" options={difficultyOptions} value="apprentice" />
      <Select size="md" label="Medium" options={difficultyOptions} value="journeyman" />
      <Select size="lg" label="Large" options={difficultyOptions} value="master" />
    </div>
  ),
};

// ============================================================================
// EXPERIMENT SETTINGS
// ============================================================================

export const ExperimentSettings: Story = {
  args: {
    options: [],
  },
  render: () => (
    <div
      className="space-y-4 p-6 rounded-xl w-80"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg font-bold mb-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#D4A574',
          textShadow: '0 0 10px rgba(212, 165, 116, 0.3)',
        }}
      >
        Experiment Settings
      </h3>

      <Select
        label="Experiment Mode"
        options={[
          { value: 'practice', label: 'Practice' },
          { value: 'ranked', label: 'Ranked' },
        ]}
        value="practice"
        leftIcon={<span>⚗</span>}
      />

      <Select
        label="Familiar Difficulty"
        options={difficultyOptions}
        value="journeyman"
        helperText="Affects the skill of spirit companions"
        leftIcon={<span>🔮</span>}
      />

      <Select
        label="Realm"
        options={realmOptions}
        placeholder="Select realm"
        leftIcon={<span>🌙</span>}
      />

      <button
        className="w-full py-3 rounded-lg font-semibold uppercase tracking-widest mt-2"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          background: 'linear-gradient(180deg, #C17F59 0%, rgba(193, 127, 89, 0.8) 100%)',
          color: '#0B0E14',
          boxShadow: '0 4px 20px rgba(193, 127, 89, 0.4)',
        }}
      >
        Begin Experiment
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
    <div className="space-y-4 w-80 p-6 bg-[#0B0E14] rounded-xl">
      <Select label="Normal" options={difficultyOptions} placeholder="Select..." />
      <Select label="With Value" options={difficultyOptions} value="journeyman" />
      <Select
        label="With Helper"
        options={difficultyOptions}
        value="master"
        helperText="This affects experiment challenge"
      />
      <Select
        label="With Error"
        options={difficultyOptions}
        error="Selection is required by the Council"
      />
      <Select label="Sealed" options={difficultyOptions} value="apprentice" disabled />
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
    <div
      className="p-6 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg font-bold mb-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#E8E4DC',
        }}
      >
        Choose Your Element
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Primary"
          options={elementOptions}
          value="fire"
          leftIcon={<span style={{ color: '#EF4444' }}>△</span>}
        />
        <Select
          label="Secondary"
          options={elementOptions}
          placeholder="Optional"
          leftIcon={<span style={{ color: '#3B82F6' }}>▽</span>}
        />
      </div>

      <p
        className="text-sm mt-4 italic"
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          color: '#6B7280',
        }}
      >
        Your elemental affinity shapes your transmutation abilities.
      </p>
    </div>
  ),
};
