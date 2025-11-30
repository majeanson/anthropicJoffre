/**
 * Modal Component Stories - Midnight Alchemy Edition
 *
 * Showcases the mystical modal system with ethereal glows,
 * sacred geometry corners, and alchemical theme presets.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Modal,
  ArcaneModal,
  MidnightModal,
  EmberModal,
  TealModal,
} from '../Modal';
import { Button, ArcaneButton, DangerButton, SuccessButton } from '../Button';

const meta = {
  title: 'Midnight Alchemy/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
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
# Midnight Alchemy Modals

Mystical modal dialogs with brass frame aesthetics and ethereal glow effects.
Each theme evokes a different aspect of the alchemist's study.

## Themes
- **arcane**: Copper/rose gold glow (default mystical style)
- **midnight**: Deep blue chamber aesthetic
- **ember**: Warm fire-like orange glow
- **void**: Dark cosmic purple essence
- **parchment**: Ancient manuscript style
- **teal**: Ethereal teal/cyan glow

## Features
- 5 sizes: sm, md, lg, xl, full
- Sacred geometry corner decorations
- Ethereal glow animation
- Mobile full-screen optimization
- ESC to close, backdrop click to close
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'select',
      options: ['arcane', 'midnight', 'ember', 'void', 'parchment', 'teal'],
      description: 'Visual theme preset',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Modal size',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show X button in header',
    },
    closeOnBackdrop: {
      control: 'boolean',
      description: 'Allow closing by clicking backdrop',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Allow closing with ESC key',
    },
    mobileFullScreen: {
      control: 'boolean',
      description: 'Make modal full-screen on mobile',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;
type RenderOnlyStory = StoryObj<typeof Modal>;

// Wrapper component to handle modal state
const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0B0E14] p-8">
      <ArcaneButton onClick={() => setIsOpen(true)} glow>
        Open Modal
      </ArcaneButton>
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {args.children}
      </Modal>
    </div>
  );
};

// ============================================================================
// THEMES
// ============================================================================

export const ArcaneTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Arcane Mysteries',
    subtitle: 'The signature alchemical style',
    icon: '⚗',
    theme: 'arcane',
    children: (
      <div className="space-y-4">
        <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          This is the default arcane theme with copper and rose gold ethereal glow effects.
          Perfect for that mystical alchemist's study aesthetic.
        </p>
        <div className="flex gap-2">
          <span
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: 'rgba(193, 127, 89, 0.2)',
              color: '#D4A574',
              fontFamily: '"Cinzel", Georgia, serif',
            }}
          >
            Copper Glow
          </span>
          <span
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: 'rgba(212, 165, 116, 0.2)',
              color: '#D4A574',
              fontFamily: '"Cinzel", Georgia, serif',
            }}
          >
            Rose Gold
          </span>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default arcane theme with copper/rose gold ethereal glow - the signature mystical style.',
      },
    },
  },
};

export const MidnightTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Midnight Chamber',
    subtitle: 'Deep within the laboratory',
    icon: '☽',
    theme: 'midnight',
    children: (
      <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        The midnight theme evokes the depths of the alchemist's laboratory,
        with deep blue accents and subtle silver highlights.
      </p>
    ),
  },
};

export const EmberTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Ember Crucible',
    subtitle: 'Forged in flame',
    icon: '△',
    theme: 'ember',
    children: (
      <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        The ember theme brings the warmth of the alchemist's furnace,
        with fiery orange and gold accents.
      </p>
    ),
  },
};

export const VoidTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Void Essence',
    subtitle: 'Beyond the veil',
    icon: '☿',
    theme: 'void',
    children: (
      <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        The void theme represents the cosmic mysteries,
        with deep purple gradients and otherworldly energy.
      </p>
    ),
  },
};

export const ParchmentTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Ancient Tome',
    subtitle: 'Knowledge of the ages',
    icon: '📜',
    theme: 'parchment',
    children: (
      <p style={{ color: '#6B7280', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        The parchment theme channels ancient manuscripts,
        with warm cream tones and weathered aesthetics.
      </p>
    ),
  },
};

export const TealTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Ethereal Waters',
    subtitle: 'Element of transformation',
    icon: '▽',
    theme: 'teal',
    children: (
      <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        The teal theme represents the water element,
        with ethereal cyan glow and transformative energy.
      </p>
    ),
  },
};

// ============================================================================
// ALL THEMES SHOWCASE
// ============================================================================

export const AllThemes: RenderOnlyStory = {
  render: () => {
    const [activeTheme, setActiveTheme] = useState<string | null>(null);

    const themes = [
      { id: 'arcane', label: 'Arcane', icon: '⚗', color: '#C17F59' },
      { id: 'midnight', label: 'Midnight', icon: '☽', color: '#4682B4' },
      { id: 'ember', label: 'Ember', icon: '△', color: '#D97706' },
      { id: 'void', label: 'Void', icon: '☿', color: '#7C3AED' },
      { id: 'parchment', label: 'Parchment', icon: '📜', color: '#D4A574' },
      { id: 'teal', label: 'Teal', icon: '▽', color: '#2DD4BF' },
    ] as const;

    return (
      <div className="min-h-screen bg-[#0B0E14] p-8">
        <h2
          className="text-xl uppercase tracking-[0.15em] mb-6"
          style={{
            fontFamily: '"Cinzel Decorative", Georgia, serif',
            color: '#D4A574',
            textShadow: '0 0 15px rgba(212, 165, 116, 0.5)',
          }}
        >
          Modal Themes
        </h2>
        <div className="flex flex-wrap gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id)}
              className="px-6 py-4 rounded-lg border-2 bg-[#131824] uppercase tracking-wider transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: '"Cinzel", Georgia, serif',
                borderColor: theme.color,
                boxShadow: `0 0 20px ${theme.color}40`,
              }}
            >
              <span className="text-2xl block mb-2">{theme.icon}</span>
              <span style={{ color: '#E8E4DC' }}>{theme.label}</span>
            </button>
          ))}
        </div>

        {activeTheme && (
          <Modal
            isOpen={true}
            onClose={() => setActiveTheme(null)}
            title={`${activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1)} Theme`}
            subtitle="Click X or backdrop to close"
            icon={themes.find(t => t.id === activeTheme)?.icon}
            theme={activeTheme as any}
          >
            <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              This is the {activeTheme} theme modal. Each theme has its own
              unique color palette and ethereal glow effect.
            </p>
          </Modal>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive showcase of all available modal themes.',
      },
    },
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const SmallSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Small Modal',
    size: 'sm',
    theme: 'arcane',
    children: (
      <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        A compact modal for simple confirmations or brief messages.
      </p>
    ),
  },
};

export const LargeSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Large Modal',
    subtitle: 'More space for complex rituals',
    size: 'lg',
    theme: 'arcane',
    children: (
      <div className="space-y-4">
        <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          Large modals provide ample space for complex content,
          detailed formulae, or comprehensive displays.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#1A1F2E' }}
          >
            <div
              className="text-2xl"
              style={{ color: '#D4A574', fontFamily: '"Cinzel Decorative", Georgia, serif' }}
            >
              42
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>Transmutations</div>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#1A1F2E' }}
          >
            <div
              className="text-2xl"
              style={{ color: '#4A9C6D', fontFamily: '"Cinzel Decorative", Georgia, serif' }}
            >
              1337
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>Essence Points</div>
          </div>
        </div>
      </div>
    ),
  },
};

// ============================================================================
// WITH FOOTER
// ============================================================================

export const WithFooter: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Confirm Transmutation',
    icon: '⚠',
    theme: 'arcane',
    children: (
      <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        Are you sure you want to begin this transmutation?
        The process cannot be reversed once started.
      </p>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <DangerButton>Begin Transmutation</DangerButton>
      </>
    ),
  },
};

export const ConfirmationDialog: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Begin the Great Work?',
    icon: '⚗',
    theme: 'arcane',
    size: 'sm',
    children: (
      <p
        className="text-center"
        style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      >
        Ready to embark on your alchemical journey?
      </p>
    ),
    footer: (
      <>
        <Button variant="secondary" fullWidth>Retreat</Button>
        <SuccessButton fullWidth>Begin</SuccessButton>
      </>
    ),
  },
};

// ============================================================================
// PRESET MODAL COMPONENTS
// ============================================================================

export const PresetModals: RenderOnlyStory = {
  render: () => {
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const presets = [
      { id: 'arcane', Component: ArcaneModal, label: 'Arcane Modal' },
      { id: 'midnight', Component: MidnightModal, label: 'Midnight Modal' },
      { id: 'ember', Component: EmberModal, label: 'Ember Modal' },
      { id: 'teal', Component: TealModal, label: 'Teal Modal' },
    ];

    return (
      <div className="min-h-screen bg-[#0B0E14] p-8">
        <h2
          className="text-xl uppercase tracking-[0.15em] mb-6"
          style={{
            fontFamily: '"Cinzel Decorative", Georgia, serif',
            color: '#D4A574',
            textShadow: '0 0 15px rgba(212, 165, 116, 0.5)',
          }}
        >
          Preset Modal Components
        </h2>
        <div className="flex flex-wrap gap-4">
          {presets.map((preset) => (
            <ArcaneButton key={preset.id} onClick={() => setActivePreset(preset.id)}>
              {preset.label}
            </ArcaneButton>
          ))}
        </div>

        {presets.map((preset) => (
          <preset.Component
            key={preset.id}
            isOpen={activePreset === preset.id}
            onClose={() => setActivePreset(null)}
            title={preset.label}
            subtitle="Pre-configured component"
            icon="⚗"
          >
            <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              This is a pre-configured {preset.label.toLowerCase()} with optimal
              settings for the {preset.id} theme.
            </p>
          </preset.Component>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured modal components with optimal settings for each theme.',
      },
    },
  },
};

// ============================================================================
// GAME UI EXAMPLES
// ============================================================================

export const VictoryModal: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Transmutation Complete!',
    subtitle: 'The Great Work Succeeds',
    icon: '☉',
    theme: 'arcane',
    size: 'md',
    children: (
      <div className="text-center space-y-6">
        <div className="text-6xl animate-bounce">🏆</div>
        <div className="space-y-2">
          <div
            className="text-4xl"
            style={{
              color: '#D4A574',
              fontFamily: '"Cinzel Decorative", Georgia, serif',
              textShadow: '0 0 20px rgba(212, 165, 116, 0.5)',
            }}
          >
            41 - 28
          </div>
          <div
            className="text-sm uppercase tracking-wider"
            style={{ color: '#6B7280' }}
          >
            Final Score
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#1A1F2E' }}>
            <div style={{ color: '#4A9C6D', fontFamily: '"Cinzel", Georgia, serif' }}>+15</div>
            <div style={{ color: '#6B7280' }}>Essence Gained</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#1A1F2E' }}>
            <div style={{ color: '#D4A574', fontFamily: '"Cinzel", Georgia, serif' }}>5</div>
            <div style={{ color: '#6B7280' }}>Win Streak</div>
          </div>
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost">Return to Laboratory</Button>
        <SuccessButton glow>Begin Anew</SuccessButton>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Victory screen modal showing game results with alchemical theming.',
      },
    },
  },
};

export const DefeatModal: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Transmutation Failed',
    subtitle: 'The mixture was unstable',
    icon: '☠',
    theme: 'arcane',
    size: 'md',
    children: (
      <div className="text-center space-y-6">
        <div
          className="text-4xl"
          style={{
            color: '#A63D3D',
            fontFamily: '"Cinzel Decorative", Georgia, serif',
          }}
        >
          28 - 41
        </div>
        <p style={{ color: '#9CA3AF', fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          Even the greatest alchemists face setbacks. Study your failures,
          for they contain the seeds of future success.
        </p>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost">Retreat</Button>
        <ArcaneButton glow>Try Again</ArcaneButton>
      </>
    ),
  },
};

export const AlchemistProfile: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Alchemist Profile',
    subtitle: 'MysticSage42',
    icon: '☿',
    theme: 'arcane',
    size: 'lg',
    children: (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#1A1F2E' }}>
            <div
              className="text-2xl"
              style={{ color: '#4A9C6D', fontFamily: '"Cinzel Decorative", Georgia, serif' }}
            >
              156
            </div>
            <div
              className="text-xs uppercase"
              style={{ color: '#6B7280', fontFamily: '"Cinzel", Georgia, serif' }}
            >
              Victories
            </div>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#1A1F2E' }}>
            <div
              className="text-2xl"
              style={{ color: '#A63D3D', fontFamily: '"Cinzel Decorative", Georgia, serif' }}
            >
              89
            </div>
            <div
              className="text-xs uppercase"
              style={{ color: '#6B7280', fontFamily: '"Cinzel", Georgia, serif' }}
            >
              Defeats
            </div>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#1A1F2E' }}>
            <div
              className="text-2xl"
              style={{ color: '#D4A574', fontFamily: '"Cinzel Decorative", Georgia, serif' }}
            >
              64%
            </div>
            <div
              className="text-xs uppercase"
              style={{ color: '#6B7280', fontFamily: '"Cinzel", Georgia, serif' }}
            >
              Success Rate
            </div>
          </div>
        </div>

        {/* Recent Transmutations */}
        <div>
          <h3
            className="text-sm uppercase tracking-wider mb-3"
            style={{ color: '#D4A574', fontFamily: '"Cinzel", Georgia, serif' }}
          >
            Recent Transmutations
          </h3>
          <div className="space-y-2">
            {['W', 'W', 'L', 'W', 'W'].map((result, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: '#1A1F2E' }}
              >
                <span
                  style={{
                    fontFamily: '"Cinzel", Georgia, serif',
                    color: result === 'W' ? '#4A9C6D' : '#A63D3D',
                  }}
                >
                  {result === 'W' ? 'Success' : 'Failure'}
                </span>
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  {41 - i * 3} - {28 + i * 2}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    footer: (
      <Button variant="secondary" fullWidth>Close Tome</Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Player profile modal with statistics and game history.',
      },
    },
  },
};

// ============================================================================
// ALCHEMIST'S STUDY SHOWCASE
// ============================================================================

export const AlchemistStudy: RenderOnlyStory = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="min-h-screen bg-[#0B0E14] p-8">
        <ArcaneButton onClick={() => setIsOpen(true)} glow>
          Enter the Study
        </ArcaneButton>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="The Alchemist's Study"
          subtitle="Where mysteries unfold"
          icon="⚗"
          theme="arcane"
          size="lg"
        >
          <div className="space-y-6">
            <p
              className="text-center italic"
              style={{
                color: '#9CA3AF',
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.125rem',
              }}
            >
              "As above, so below. As within, so without."
            </p>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-4xl mb-2">△</div>
                <div style={{ color: '#A63D3D', fontFamily: '"Cinzel", Georgia, serif', fontSize: '0.75rem' }}>Fire</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">▽</div>
                <div style={{ color: '#4682B4', fontFamily: '"Cinzel", Georgia, serif', fontSize: '0.75rem' }}>Water</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">◇</div>
                <div style={{ color: '#4A9C6D', fontFamily: '"Cinzel", Georgia, serif', fontSize: '0.75rem' }}>Earth</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">○</div>
                <div style={{ color: '#E8E4DC', fontFamily: '"Cinzel", Georgia, serif', fontSize: '0.75rem' }}>Air</div>
              </div>
            </div>

            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: '#0B0E14',
                border: '1px solid #C17F59',
              }}
            >
              <div
                className="text-lg uppercase tracking-wider"
                style={{
                  color: '#D4A574',
                  fontFamily: '"Cinzel Decorative", Georgia, serif',
                }}
              >
                The Great Work Awaits
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Full Midnight Alchemy showcase demonstrating the mystical modal design.',
      },
    },
  },
};
