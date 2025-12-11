/**
 * Modal Component Stories
 *
 * Showcases the modal system with various themes and sizes.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, ArcaneModal, MidnightModal, EmberModal, TealModal, MinimalModal } from '../Modal';
import { Button, ArcaneButton, DangerButton, SuccessButton } from '../Button';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Modal Component

Modal dialogs with multiple theme presets. Use the 'minimal' theme for automatic skin compatibility.

## Themes
- **arcane**: Copper/rose gold glow
- **midnight**: Deep blue aesthetic
- **ember**: Warm orange glow
- **void**: Purple/violet essence
- **parchment**: Light manuscript style
- **teal**: Cyan glow
- **minimal**: Uses CSS variables (skin-compatible)

## Features
- 5 sizes: sm, md, lg, xl, full
- Corner decorations
- Glow animation
- Mobile optimization
- ESC to close, backdrop click to close

Use the skin selector in the toolbar to see how modals adapt.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'select',
      options: ['arcane', 'midnight', 'ember', 'void', 'parchment', 'teal', 'minimal'],
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
    <div className="min-h-screen bg-skin-primary p-8">
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
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
    title: 'Arcane Theme',
    subtitle: 'Copper and rose gold accents',
    icon: '⚗',
    theme: 'arcane',
    children: (
      <div className="space-y-4">
        <p className="text-skin-secondary">
          This is the arcane theme with copper and rose gold glow effects.
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full text-sm bg-skin-tertiary text-skin-accent">
            Copper Glow
          </span>
          <span className="px-3 py-1 rounded-full text-sm bg-skin-tertiary text-skin-accent">
            Rose Gold
          </span>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default arcane theme with copper/rose gold ethereal glow - the signature mystical style.',
      },
    },
  },
};

export const MidnightTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Midnight Theme',
    subtitle: 'Deep blue aesthetic',
    icon: '☽',
    theme: 'midnight',
    children: (
      <p className="text-skin-secondary">
        The midnight theme with deep blue accents and subtle silver highlights.
      </p>
    ),
  },
};

export const EmberTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Ember Theme',
    subtitle: 'Warm fire-like glow',
    icon: '△',
    theme: 'ember',
    children: (
      <p className="text-skin-secondary">
        The ember theme with fiery orange and gold accents.
      </p>
    ),
  },
};

export const VoidTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Void Theme',
    subtitle: 'Deep purple essence',
    icon: '☿',
    theme: 'void',
    children: (
      <p className="text-skin-secondary">
        The void theme with deep purple gradients and cosmic energy.
      </p>
    ),
  },
};

export const ParchmentTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Parchment Theme',
    subtitle: 'Light manuscript style',
    icon: '📜',
    theme: 'parchment',
    children: (
      <p className="text-skin-secondary">
        The parchment theme with warm cream tones for light mode.
      </p>
    ),
  },
};

export const TealTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Teal Theme',
    subtitle: 'Cyan glow aesthetic',
    icon: '▽',
    theme: 'teal',
    children: (
      <p className="text-skin-secondary">
        The teal theme with ethereal cyan glow effects.
      </p>
    ),
  },
};

export const MinimalTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Minimal Style',
    subtitle: 'Uses CSS variables for skin compatibility',
    icon: '◯',
    theme: 'minimal',
    children: (
      <p className="text-skin-secondary">
        The minimal theme uses CSS variables, making it automatically compatible with all skin
        themes including light and dark Modern Minimal.
      </p>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal theme that uses CSS variables for automatic skin compatibility.',
      },
    },
  },
};

// ============================================================================
// ALL THEMES SHOWCASE
// ============================================================================

export const AllThemes: RenderOnlyStory = {
  render: () => {
    const [activeTheme, setActiveTheme] = useState<string | null>(null);

    const themes = [
      { id: 'arcane', label: 'Arcane', icon: '⚗' },
      { id: 'midnight', label: 'Midnight', icon: '☽' },
      { id: 'ember', label: 'Ember', icon: '△' },
      { id: 'void', label: 'Void', icon: '☿' },
      { id: 'parchment', label: 'Parchment', icon: '📜' },
      { id: 'teal', label: 'Teal', icon: '▽' },
      { id: 'minimal', label: 'Minimal', icon: '◯' },
    ] as const;

    return (
      <div className="min-h-screen bg-skin-primary p-8">
        <h2 className="text-xl uppercase tracking-[0.15em] mb-6 text-skin-accent">Modal Themes</h2>
        <div className="flex flex-wrap gap-4">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              variant="secondary"
              onClick={() => setActiveTheme(theme.id)}
              className="flex flex-col items-center px-6 py-4"
            >
              <span className="text-2xl block mb-2">{theme.icon}</span>
              <span>{theme.label}</span>
            </Button>
          ))}
        </div>

        {activeTheme && (
          <Modal
            isOpen={true}
            onClose={() => setActiveTheme(null)}
            title={`${activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1)} Theme`}
            subtitle="Click X or backdrop to close"
            icon={themes.find((t) => t.id === activeTheme)?.icon}
            theme={activeTheme as any}
          >
            <p className="text-skin-secondary">
              This is the {activeTheme} theme modal with its unique color palette and glow effect.
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
    theme: 'minimal',
    children: (
      <p className="text-skin-secondary">A compact modal for simple confirmations or messages.</p>
    ),
  },
};

export const LargeSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Large Modal',
    subtitle: 'More space for complex content',
    size: 'lg',
    theme: 'minimal',
    children: (
      <div className="space-y-4">
        <p className="text-skin-secondary">
          Large modals provide ample space for complex content and detailed displays.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-lg bg-skin-tertiary">
            <div className="text-2xl text-skin-accent">42</div>
            <div className="text-sm text-skin-muted">Games Won</div>
          </div>
          <div className="p-4 rounded-lg bg-skin-tertiary">
            <div className="text-2xl text-green-500">1337</div>
            <div className="text-sm text-skin-muted">Total Points</div>
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
    title: 'Confirm Action',
    icon: '⚠',
    theme: 'minimal',
    children: (
      <p className="text-skin-secondary">
        Are you sure you want to proceed? This action cannot be reversed.
      </p>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <DangerButton>Confirm</DangerButton>
      </>
    ),
  },
};

export const ConfirmationDialog: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Start Game?',
    icon: '🎮',
    theme: 'minimal',
    size: 'sm',
    children: <p className="text-center text-skin-secondary">Ready to begin?</p>,
    footer: (
      <>
        <Button variant="secondary" fullWidth>
          Cancel
        </Button>
        <SuccessButton fullWidth>Start</SuccessButton>
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
      { id: 'minimal', Component: MinimalModal, label: 'Minimal Modal' },
    ];

    return (
      <div className="min-h-screen bg-skin-primary p-8">
        <h2 className="text-xl uppercase tracking-[0.15em] mb-6 text-skin-accent">
          Preset Modal Components
        </h2>
        <div className="flex flex-wrap gap-4">
          {presets.map((preset) => (
            <Button key={preset.id} variant="secondary" onClick={() => setActivePreset(preset.id)}>
              {preset.label}
            </Button>
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
            <p className="text-skin-secondary">
              This is a pre-configured {preset.label.toLowerCase()} with optimal settings.
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
    title: 'Victory!',
    subtitle: 'You won the game',
    icon: '🏆',
    theme: 'minimal',
    size: 'md',
    children: (
      <div className="text-center space-y-6">
        <div className="text-6xl animate-bounce">🏆</div>
        <div className="space-y-2">
          <div className="text-4xl text-skin-accent">41 - 28</div>
          <div className="text-sm uppercase tracking-wider text-skin-muted">Final Score</div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-skin-tertiary">
            <div className="text-green-500">+15</div>
            <div className="text-skin-muted">Points Gained</div>
          </div>
          <div className="p-3 rounded-lg bg-skin-tertiary">
            <div className="text-skin-accent">5</div>
            <div className="text-skin-muted">Win Streak</div>
          </div>
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost">Return to Lobby</Button>
        <SuccessButton>Play Again</SuccessButton>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Victory screen modal showing game results.',
      },
    },
  },
};

export const DefeatModal: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Defeat',
    subtitle: 'Better luck next time',
    icon: '😔',
    theme: 'minimal',
    size: 'md',
    children: (
      <div className="text-center space-y-6">
        <div className="text-4xl text-red-500">28 - 41</div>
        <p className="text-skin-secondary">
          Don't give up! Every loss is a learning opportunity.
        </p>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost">Leave</Button>
        <Button variant="primary">Try Again</Button>
      </>
    ),
  },
};

export const PlayerProfile: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Player Profile',
    subtitle: 'MysticSage42',
    icon: '☿',
    theme: 'minimal',
    size: 'lg',
    children: (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg text-center bg-skin-tertiary">
            <div className="text-2xl text-green-500">156</div>
            <div className="text-xs uppercase text-skin-muted">Victories</div>
          </div>
          <div className="p-4 rounded-lg text-center bg-skin-tertiary">
            <div className="text-2xl text-red-500">89</div>
            <div className="text-xs uppercase text-skin-muted">Defeats</div>
          </div>
          <div className="p-4 rounded-lg text-center bg-skin-tertiary">
            <div className="text-2xl text-skin-accent">64%</div>
            <div className="text-xs uppercase text-skin-muted">Win Rate</div>
          </div>
        </div>

        {/* Recent Games */}
        <div>
          <h3 className="text-sm uppercase tracking-wider mb-3 text-skin-accent">Recent Games</h3>
          <div className="space-y-2">
            {['W', 'W', 'L', 'W', 'W'].map((result, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-skin-tertiary"
              >
                <span className={result === 'W' ? 'text-green-500' : 'text-red-500'}>
                  {result === 'W' ? 'Victory' : 'Defeat'}
                </span>
                <span className="text-sm text-skin-muted">
                  {41 - i * 3} - {28 + i * 2}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    footer: (
      <Button variant="secondary" fullWidth>
        Close
      </Button>
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
// THEMED MODAL SHOWCASE
// ============================================================================

export const ThemedShowcase: RenderOnlyStory = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="min-h-screen bg-skin-primary p-8">
        <ArcaneButton onClick={() => setIsOpen(true)} glow>
          Open Showcase
        </ArcaneButton>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Themed Showcase"
          subtitle="Demonstrating skin compatibility"
          icon="⚗"
          theme="minimal"
          size="lg"
        >
          <div className="space-y-6">
            <p className="text-center italic text-skin-secondary text-lg">
              "This modal adapts to your selected skin theme."
            </p>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-4xl mb-2">△</div>
                <div className="text-xs text-red-500">Fire</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">▽</div>
                <div className="text-xs text-blue-500">Water</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">◇</div>
                <div className="text-xs text-green-500">Earth</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">○</div>
                <div className="text-xs text-skin-primary">Air</div>
              </div>
            </div>

            <div className="p-4 rounded-lg text-center bg-skin-tertiary border border-skin-accent">
              <div className="text-lg uppercase tracking-wider text-skin-accent">
                Ready to Play
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
        story: 'Full showcase demonstrating skin-compatible modal design.',
      },
    },
  },
};
