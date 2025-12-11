/**
 * Input Component Stories
 *
 * Showcases input fields with various variants and states.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Input, SearchInput, PasswordInput, ArcaneInput, ElegantInput } from '../Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Input Component

Input fields with various variants and states.

## Features
- **4 variants**: default, filled, elegant, arcane
- **3 sizes**: sm, md, lg
- **Focus glow**: Visual feedback on focus
- **Corner decorations**: Decorative corners
- **Icon support**: Left and right icons
- **Password toggle**: Show/hide password

Use the skin selector in the toolbar to see how inputs adapt to different themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'elegant', 'arcane'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    helperText: {
      control: 'text',
      description: 'Helper text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    glowOnFocus: {
      control: 'boolean',
      description: 'Enable ethereal glow on focus',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// VARIANTS
// ============================================================================

export const Default: Story = {
  args: {
    placeholder: 'Enter the sacred words...',
    label: 'Incantation',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    placeholder: 'Search the ancient tomes...',
    label: 'Query',
  },
};

export const Elegant: Story = {
  args: {
    variant: 'elegant',
    placeholder: 'Inscribe your name...',
    label: 'Alchemist Name',
  },
};

export const Arcane: Story = {
  args: {
    variant: 'arcane',
    placeholder: 'Whisper the secret...',
    label: 'Arcane Formula',
  },
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-skin-primary rounded-xl border border-skin-default min-w-96">
      <Input variant="default" label="Default" placeholder="Standard input field..." />
      <Input variant="filled" label="Filled" placeholder="Filled background variant..." />
      <Input variant="elegant" label="Elegant" placeholder="With focus underline..." />
      <Input variant="arcane" label="Arcane" placeholder="Decorative corners..." />
    </div>
  ),
};

// ============================================================================
// SIZES
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-skin-primary rounded-xl border border-skin-default min-w-96">
      <Input size="sm" label="Small" placeholder="Compact text..." />
      <Input size="md" label="Medium" placeholder="Standard size..." />
      <Input size="lg" label="Large" placeholder="Prominent input..." />
    </div>
  ),
};

// ============================================================================
// WITH ICONS
// ============================================================================

export const WithLeftIcon: Story = {
  args: {
    label: 'Search Archives',
    placeholder: 'Query the ancient knowledge...',
    leftIcon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    ),
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Ingredient Weight',
    placeholder: 'Enter amount...',
    rightIcon: <span className="text-sm">grams</span>,
  },
};

// ============================================================================
// STATES
// ============================================================================

export const WithError: Story = {
  args: {
    label: 'Forbidden Formula',
    placeholder: 'This field has an error...',
    error: 'The ingredients are volatile. Check your measurements.',
    value: 'Unstable mixture',
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Philosopher's Stone Formula",
    placeholder: 'Enter the secret...',
    helperText: 'Only known to the initiated. Handle with care.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Sealed Knowledge',
    placeholder: 'This input is sealed...',
    disabled: true,
    value: 'Ancient secrets',
  },
};

// ============================================================================
// SPECIALIZED INPUTS
// ============================================================================

export const SearchInputExample: Story = {
  render: () => (
    <div className="p-6 bg-skin-primary rounded-xl border border-skin-default min-w-96">
      <SearchInput label="Search" />
    </div>
  ),
};

export const PasswordInputExample: Story = {
  render: () => (
    <div className="p-6 bg-skin-primary rounded-xl border border-skin-default min-w-96">
      <PasswordInput label="Password" placeholder="Enter password..." />
    </div>
  ),
};

export const ArcaneInputExample: Story = {
  render: () => (
    <div className="p-6 bg-skin-primary rounded-xl border border-skin-default min-w-96">
      <ArcaneInput
        label="Decorated Input"
        placeholder="Type something..."
        helperText="This input has decorative corners."
      />
    </div>
  ),
};

// ============================================================================
// REGISTRATION FORM
// ============================================================================

export const RegistrationForm: Story = {
  render: () => (
    <div className="p-8 rounded-xl space-y-6 min-w-[400px] relative bg-skin-secondary border-2 border-skin-accent">
      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-skin-accent opacity-60" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-skin-accent opacity-60" />

      <h2 className="text-xl text-center uppercase tracking-[0.15em] text-skin-accent">
        Create Account
      </h2>

      <div className="space-y-4">
        <Input
          variant="arcane"
          label="Username"
          placeholder="Choose a username..."
          leftIcon={<span>👤</span>}
        />
        <Input
          variant="arcane"
          label="Email"
          placeholder="your@email.com"
          leftIcon={<span>✉️</span>}
        />
        <PasswordInput label="Password" placeholder="Create a password..." />
        <Input
          variant="arcane"
          label="Display Name"
          placeholder="How others will see you"
          helperText="This can be changed later."
        />
      </div>

      <button className="w-full py-4 rounded-lg text-center uppercase tracking-widest font-semibold bg-skin-accent text-skin-on-accent hover:opacity-90 transition-opacity">
        Register
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete registration form example.',
      },
    },
  },
};

// ============================================================================
// SEARCH PANEL
// ============================================================================

export const SearchPanel: Story = {
  render: () => (
    <div className="p-8 rounded-xl space-y-6 min-w-[450px] bg-skin-primary border border-skin-default">
      <h3 className="text-lg uppercase tracking-widest text-center mb-6 text-skin-muted">
        Search Panel
      </h3>

      <SearchInput placeholder="Search..." fullWidth />

      <div className="grid grid-cols-2 gap-4">
        <Input variant="filled" label="Category" placeholder="Select..." size="sm" />
        <Input variant="filled" label="Amount" placeholder="1-10" type="number" size="sm" />
      </div>

      <ElegantInput
        label="Notes"
        placeholder="Additional notes..."
        helperText="Add any relevant details."
      />
    </div>
  ),
};

// ============================================================================
// VALIDATION STATES
// ============================================================================

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-skin-primary rounded-xl border border-skin-default min-w-96">
      <Input
        variant="arcane"
        label="Valid Input"
        value="user@example.com"
        helperText="✓ Email format is valid"
      />
      <Input
        variant="arcane"
        label="Invalid Input"
        value="not-an-email"
        error="Please enter a valid email address."
      />
      <Input
        variant="arcane"
        label="Required Field"
        placeholder="This field is required..."
        error="This field cannot be empty."
      />
    </div>
  ),
};
