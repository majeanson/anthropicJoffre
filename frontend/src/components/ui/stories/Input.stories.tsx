/**
 * Input Component Stories - Midnight Alchemy Edition
 *
 * Showcases mystical input fields with brass frame aesthetics,
 * ethereal focus states, and arcane corner decorations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Input, SearchInput, PasswordInput, ArcaneInput, ElegantInput } from '../Input';

const meta = {
  title: 'Midnight Alchemy/Input',
  component: Input,
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
# Midnight Alchemy Inputs

Mystical input fields with brass frame aesthetics and ethereal focus states.
Each keystroke feels like inscribing ancient runes.

## Features
- **4 variants**: default, filled, elegant, arcane
- **3 sizes**: sm, md, lg
- **Ethereal glow**: Copper glow on focus
- **Arcane corners**: Sacred geometry decorations
- **Icon support**: Left and right icons
- **Password toggle**: Eye of Seeing reveal

## Typography
Uses **Cormorant Garamond** for elegant italic placeholders.
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
    <div className="space-y-6 p-6 bg-[#0B0E14] rounded-xl min-w-96">
      <Input
        variant="default"
        label="Default"
        placeholder="Standard input field..."
      />
      <Input
        variant="filled"
        label="Filled"
        placeholder="Filled background variant..."
      />
      <Input
        variant="elegant"
        label="Elegant"
        placeholder="With focus underline..."
      />
      <Input
        variant="arcane"
        label="Arcane"
        placeholder="Sacred geometry corners..."
      />
    </div>
  ),
};

// ============================================================================
// SIZES
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-[#0B0E14] rounded-xl min-w-96">
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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
    <div className="p-6 bg-[#0B0E14] rounded-xl min-w-96">
      <SearchInput label="Search the Archives" />
    </div>
  ),
};

export const PasswordInputExample: Story = {
  render: () => (
    <div className="p-6 bg-[#0B0E14] rounded-xl min-w-96">
      <PasswordInput label="Secret Passphrase" placeholder="Enter the hidden word..." />
    </div>
  ),
};

export const ArcaneInputExample: Story = {
  render: () => (
    <div className="p-6 bg-[#0B0E14] rounded-xl min-w-96">
      <ArcaneInput
        label="Arcane Inscription"
        placeholder="Channel the mystical energy..."
        helperText="Focus your intent as you type."
      />
    </div>
  ),
};

// ============================================================================
// ALCHEMIST'S WORKBENCH
// ============================================================================

export const AlchemistForm: Story = {
  render: () => (
    <div
      className="p-8 rounded-xl space-y-6 min-w-[400px] relative"
      style={{
        background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
        border: '2px solid #C17F59',
        boxShadow: '0 0 50px rgba(193, 127, 89, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Sacred geometry corners */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#C17F59] opacity-60" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#C17F59] opacity-60" />

      <h2
        className="text-xl text-center uppercase tracking-[0.15em]"
        style={{
          fontFamily: '"Cinzel Decorative", Georgia, serif',
          color: '#D4A574',
          textShadow: '0 0 15px rgba(212, 165, 116, 0.5)',
        }}
      >
        Register as Alchemist
      </h2>

      <div className="space-y-4">
        <Input
          variant="arcane"
          label="Alchemist Name"
          placeholder="Your mystical identity..."
          leftIcon={<span>☿</span>}
        />
        <Input
          variant="arcane"
          label="Realm of Study"
          placeholder="Transmutation, Potions, etc..."
          leftIcon={<span>⚗</span>}
        />
        <PasswordInput
          label="Secret Passphrase"
          placeholder="Guard it well..."
        />
        <Input
          variant="arcane"
          label="Years of Practice"
          type="number"
          placeholder="How long have you studied?"
          helperText="Apprentices welcome."
        />
      </div>

      <button
        className="w-full py-4 rounded-lg text-center uppercase tracking-widest font-semibold"
        style={{
          fontFamily: '"Cinzel Decorative", Georgia, serif',
          background: 'linear-gradient(180deg, #C17F59 0%, rgba(193, 127, 89, 0.8) 100%)',
          color: '#0B0E14',
          boxShadow: '0 4px 20px rgba(193, 127, 89, 0.4)',
        }}
      >
        Begin the Great Work
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete form example with the Midnight Alchemy aesthetic.',
      },
    },
  },
};

// ============================================================================
// DARK LABORATORY
// ============================================================================

export const DarkLaboratory: Story = {
  render: () => (
    <div
      className="p-8 rounded-xl space-y-6 min-w-[450px]"
      style={{
        background: '#0B0E14',
        border: '1px solid #2D3548',
      }}
    >
      <h3
        className="text-lg uppercase tracking-widest text-center mb-6"
        style={{
          fontFamily: '"Cinzel", Georgia, serif',
          color: '#9CA3AF',
        }}
      >
        Ingredient Search
      </h3>

      <SearchInput placeholder="Search for ingredients..." fullWidth />

      <div className="grid grid-cols-2 gap-4">
        <Input
          variant="filled"
          label="Element Type"
          placeholder="Fire, Water..."
          size="sm"
        />
        <Input
          variant="filled"
          label="Potency Level"
          placeholder="1-10"
          type="number"
          size="sm"
        />
      </div>

      <ElegantInput
        label="Notes"
        placeholder="Additional observations about the ingredient..."
        helperText="Describe any unusual properties."
      />
    </div>
  ),
};

// ============================================================================
// VALIDATION STATES
// ============================================================================

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-[#0B0E14] rounded-xl min-w-96">
      <Input
        variant="arcane"
        label="Valid Formula"
        value="Aqua Vitae + Sulfur"
        helperText="✓ Formula verified by the Council"
      />
      <Input
        variant="arcane"
        label="Invalid Formula"
        value="Mercury + ??? "
        error="Unknown ingredient detected. The mixture is unstable."
      />
      <Input
        variant="arcane"
        label="Required Field"
        placeholder="This field cannot be empty..."
        error="The Great Work cannot proceed without this ingredient."
      />
    </div>
  ),
};
