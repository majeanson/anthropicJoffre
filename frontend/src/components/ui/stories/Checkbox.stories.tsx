/**
 * Checkbox Component Stories
 *
 * Toggles and checkboxes for controlling various settings.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../Checkbox';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Checkbox Component

Toggles and checkboxes for controlling various settings.

## Features
- **2 variants**: checkbox, toggle
- **3 sizes**: sm, md, lg
- **Indeterminate state**: Partial selection
- **Descriptions**: Helper text support

Use the skin selector in the toolbar to see how checkboxes adapt to different themes.
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
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <Checkbox size="sm" label="Small checkbox" checked />
      <Checkbox size="md" label="Medium checkbox" checked />
      <Checkbox size="lg" label="Large checkbox" checked />
    </div>
  ),
};

// ============================================================================
// ALL TOGGLE SIZES
// ============================================================================

export const AllToggleSizes: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default">
      <Checkbox variant="toggle" size="sm" label="Small toggle" checked />
      <Checkbox variant="toggle" size="md" label="Medium toggle" checked />
      <Checkbox variant="toggle" size="lg" label="Large toggle" checked />
    </div>
  ),
};

// ============================================================================
// SETTINGS PANEL
// ============================================================================

export const SettingsPanel: Story = {
  render: () => (
    <div className="space-y-4 p-6 rounded-xl w-80 bg-skin-secondary border border-skin-default">
      <h3 className="text-lg font-bold mb-4 text-skin-accent">Game Settings</h3>

      <Checkbox
        variant="toggle"
        label="Sound Effects"
        description="Play sounds during game"
        checked
      />

      <Checkbox
        variant="toggle"
        label="Auto-play"
        description="Automatically play when only one option"
      />

      <Checkbox variant="toggle" label="Dark Mode" description="Use dark theme" checked />

      <div className="pt-4 mt-4 border-t border-skin-subtle">
        <h4 className="text-sm font-semibold mb-3 text-skin-muted">Notifications</h4>

        <div className="space-y-2">
          <Checkbox label="Game invitations" checked />
          <Checkbox label="Friend requests" checked />
          <Checkbox label="Messages" />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// REGISTRATION FORM
// ============================================================================

export const RegistrationForm: Story = {
  render: () => (
    <div className="space-y-4 p-6 w-80 rounded-xl bg-skin-primary border border-skin-default">
      <h3 className="text-lg font-bold text-skin-primary">Create Account</h3>

      <div className="space-y-3">
        <Checkbox label="I accept the Terms of Service" description="Required for registration" />

        <Checkbox label="Subscribe to newsletter" description="Receive updates and news" />

        <Checkbox
          label={
            <span className="text-skin-primary">
              I am at least <strong className="text-skin-accent">13 years old</strong>
            </span>
          }
        />
      </div>

      <button className="w-full py-3 rounded-lg font-semibold uppercase tracking-widest mt-4 bg-skin-accent text-skin-on-accent hover:opacity-90 transition-opacity">
        Register
      </button>
    </div>
  ),
};

// ============================================================================
// GAME OPTIONS
// ============================================================================

export const GameOptions: Story = {
  render: () => (
    <div className="p-6 rounded-xl bg-skin-secondary border border-skin-default">
      <h3 className="text-lg font-bold mb-4 text-skin-accent">Game Configuration</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-skin-muted">Game Modes</h4>
          <Checkbox label="Quick Play" checked />
          <Checkbox label="Ranked" checked />
          <Checkbox label="Custom" />
          <Checkbox label="Practice" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-skin-muted">Features</h4>
          <Checkbox label="Timer" checked />
          <Checkbox label="Chat" />
          <Checkbox label="Spectators" checked />
          <Checkbox label="Replays" />
        </div>
      </div>

      <div className="mt-4 pt-4 flex items-center justify-between border-t border-skin-subtle">
        <Checkbox variant="toggle" label="Save settings" size="sm" />
        <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-skin-accent text-skin-on-accent">
          Start Game
        </button>
      </div>
    </div>
  ),
};
