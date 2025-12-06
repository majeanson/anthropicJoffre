/**
 * Checkbox Component Stories - Midnight Alchemy Edition
 *
 * Mystical toggles and rune-inscribed checkboxes for
 * controlling the arcane mechanisms of the laboratory.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../Checkbox';

const meta = {
  title: 'Midnight Alchemy/Checkbox',
  component: Checkbox,
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
# Midnight Alchemy Checkboxes

Mystical toggles and rune-inscribed checkboxes for controlling
the arcane mechanisms of the laboratory.

## Features
- **2 variants**: checkbox, toggle
- **3 sizes**: sm, md, lg
- **Indeterminate state**: Partial selection
- **Descriptions**: Helper text support

## Alchemical Usage
Use toggles for binary states (on/off, active/inactive)
and checkboxes for selections and agreements.
        `,
      },
    },
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

// ============================================================================
// BASIC VARIANTS
// ============================================================================

export const Default: Story = {
  args: {
    label: "Accept the Alchemist's Oath",
    variant: 'checkbox',
  },
};

export const Toggle: Story = {
  args: {
    label: 'Channel Ethereal Energy',
    variant: 'toggle',
  },
};

// ============================================================================
// CHECKED STATES
// ============================================================================

export const CheckedCheckbox: Story = {
  args: {
    label: 'Remember my sigil',
    variant: 'checkbox',
    checked: true,
  },
};

export const CheckedToggle: Story = {
  args: {
    label: 'Midnight Illumination',
    variant: 'toggle',
    checked: true,
  },
};

// ============================================================================
// SIZES - CHECKBOX
// ============================================================================

export const SmallCheckbox: Story = {
  args: {
    label: 'Small rune',
    variant: 'checkbox',
    size: 'sm',
  },
};

export const MediumCheckbox: Story = {
  args: {
    label: 'Medium rune (default)',
    variant: 'checkbox',
    size: 'md',
  },
};

export const LargeCheckbox: Story = {
  args: {
    label: 'Large rune',
    variant: 'checkbox',
    size: 'lg',
  },
};

// ============================================================================
// SIZES - TOGGLE
// ============================================================================

export const SmallToggle: Story = {
  args: {
    label: 'Small mechanism',
    variant: 'toggle',
    size: 'sm',
  },
};

export const MediumToggle: Story = {
  args: {
    label: 'Medium mechanism (default)',
    variant: 'toggle',
    size: 'md',
  },
};

export const LargeToggle: Story = {
  args: {
    label: 'Large mechanism',
    variant: 'toggle',
    size: 'lg',
  },
};

// ============================================================================
// WITH DESCRIPTION
// ============================================================================

export const WithDescription: Story = {
  args: {
    label: 'Scroll notifications',
    description: 'Receive parchment updates about your experiments',
    variant: 'checkbox',
  },
};

export const ToggleWithDescription: Story = {
  args: {
    label: 'Resonance Effects',
    description: 'Play sounds when catalysts interact',
    variant: 'toggle',
  },
};

// ============================================================================
// STATES
// ============================================================================

export const Disabled: Story = {
  args: {
    label: 'Sealed rune',
    disabled: true,
    variant: 'checkbox',
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Sealed rune (activated)',
    disabled: true,
    checked: true,
    variant: 'checkbox',
  },
};

export const DisabledToggle: Story = {
  args: {
    label: 'Locked mechanism',
    disabled: true,
    variant: 'toggle',
  },
};

export const DisabledToggleChecked: Story = {
  args: {
    label: 'Locked mechanism (on)',
    disabled: true,
    checked: true,
    variant: 'toggle',
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all formulas (partial)',
    indeterminate: true,
    variant: 'checkbox',
  },
};

// ============================================================================
// WITHOUT LABEL
// ============================================================================

export const WithoutLabel: Story = {
  args: {
    variant: 'checkbox',
    'aria-label': 'Standalone rune',
  },
};

export const ToggleWithoutLabel: Story = {
  args: {
    variant: 'toggle',
    'aria-label': 'Standalone mechanism',
  },
};

// ============================================================================
// ALL CHECKBOX SIZES
// ============================================================================

export const AllCheckboxSizes: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
      <Checkbox size="sm" label="Small inscribed rune" checked />
      <Checkbox size="md" label="Medium inscribed rune" checked />
      <Checkbox size="lg" label="Large inscribed rune" checked />
    </div>
  ),
};

// ============================================================================
// ALL TOGGLE SIZES
// ============================================================================

export const AllToggleSizes: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl">
      <Checkbox variant="toggle" size="sm" label="Small brass lever" checked />
      <Checkbox variant="toggle" size="md" label="Medium brass lever" checked />
      <Checkbox variant="toggle" size="lg" label="Large brass lever" checked />
    </div>
  ),
};

// ============================================================================
// LABORATORY SETTINGS
// ============================================================================

export const LaboratorySettings: Story = {
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
        Laboratory Settings
      </h3>

      <Checkbox
        variant="toggle"
        label="Resonance Effects"
        description="Audible feedback during reactions"
        checked
      />

      <Checkbox
        variant="toggle"
        label="Auto-catalyze"
        description="Automatically proceed when only one option"
      />

      <Checkbox
        variant="toggle"
        label="Midnight Mode"
        description="Dim the ethereal lamps"
        checked
      />

      <div className="pt-4 mt-4" style={{ borderTop: '1px solid #2D3548' }}>
        <h4
          className="text-sm font-semibold mb-3"
          style={{
            fontFamily: '"Cinzel", Georgia, serif',
            color: '#9CA3AF',
          }}
        >
          Notifications
        </h4>

        <div className="space-y-2">
          <Checkbox label="Experiment invitations" checked />
          <Checkbox label="Guild requests" checked />
          <Checkbox label="Scroll messages" />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// ALCHEMIST REGISTRATION
// ============================================================================

export const AlchemistRegistration: Story = {
  render: () => (
    <div
      className="space-y-4 p-6 w-80 rounded-xl"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg font-bold"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#E8E4DC',
        }}
      >
        Join the Guild
      </h3>

      <div className="space-y-3">
        <Checkbox
          label="I accept the Alchemist's Code"
          description="Required for guild membership"
        />

        <Checkbox label="Subscribe to the Chronicle" description="Receive wisdom and discoveries" />

        <Checkbox
          label={
            <span style={{ color: '#E8E4DC' }}>
              I have practiced for at least <strong style={{ color: '#D4A574' }}>13 moons</strong>
            </span>
          }
        />
      </div>

      <button
        className="w-full py-3 rounded-lg font-semibold uppercase tracking-widest mt-4"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          background: 'linear-gradient(180deg, #C17F59 0%, rgba(193, 127, 89, 0.8) 100%)',
          color: '#0B0E14',
          boxShadow: '0 4px 20px rgba(193, 127, 89, 0.4)',
        }}
      >
        Begin Initiation
      </button>
    </div>
  ),
};

// ============================================================================
// EXPERIMENT OPTIONS
// ============================================================================

export const ExperimentOptions: Story = {
  render: () => (
    <div
      className="p-6 rounded-xl"
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
        }}
      >
        Experiment Configuration
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>
            Elements
          </h4>
          <Checkbox label="△ Fire" checked />
          <Checkbox label="▽ Water" checked />
          <Checkbox label="◇ Earth" />
          <Checkbox label="○ Air" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>
            Catalysts
          </h4>
          <Checkbox label="☿ Mercury" checked />
          <Checkbox label="♄ Lead" />
          <Checkbox label="☉ Gold" checked />
          <Checkbox label="☽ Silver" />
        </div>
      </div>

      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: '1px solid #2D3548' }}
      >
        <Checkbox variant="toggle" label="Lock configuration" size="sm" />
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: '#C17F59',
            color: '#0B0E14',
          }}
        >
          Begin
        </button>
      </div>
    </div>
  ),
};
