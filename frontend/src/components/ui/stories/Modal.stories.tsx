/**
 * Modal Component Stories - Retro Gaming Edition
 *
 * Showcases the arcade-inspired modal system with neon borders,
 * scanline effects, and multiple theme presets.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Modal,
  NeonModal,
  ArcadeModal,
  TerminalModal,
  HologramModal,
  ClassicModal,
} from '../Modal';
import { Button, NeonButton, SuccessButton, DangerButton } from '../Button';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Arcade-inspired modal component with multiple themes and special effects.

## Themes
- **neon**: Cyan/pink neon glow (default retro gaming style)
- **arcade**: Classic arcade cabinet aesthetic
- **terminal**: Green terminal/hacker style
- **hologram**: Futuristic holographic effect
- **classic**: Traditional parchment style

## Features
- 5 sizes: sm, md, lg, xl, full
- Scanline overlay effect
- Glow animation
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
      options: ['neon', 'arcade', 'terminal', 'hologram', 'classic'],
      description: 'Visual theme preset',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Modal size',
    },
    scanlines: {
      control: 'boolean',
      description: 'Enable CRT scanline effect',
    },
    glowAnimation: {
      control: 'boolean',
      description: 'Enable glow animation on border',
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
type RenderOnlyStory = StoryObj<typeof Modal>; // For render-only stories without args

// Wrapper component to handle modal state
const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <Button onClick={() => setIsOpen(true)} variant="neon" glow>
        Open Modal
      </Button>
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

export const NeonTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Neon Theme',
    subtitle: 'The signature retro gaming style',
    icon: '🕹️',
    theme: 'neon',
    glowAnimation: true,
    children: (
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)] font-body">
          This is the default neon theme with cyan and pink glow effects.
          Perfect for that retro arcade aesthetic.
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-[var(--color-bg-accent)]/20 rounded-full text-[var(--color-text-accent)] text-sm font-display">
            Neon Glow
          </span>
          <span className="px-3 py-1 bg-[var(--color-team2-primary)]/20 rounded-full text-[var(--color-team2-primary)] text-sm font-display">
            Pink Accents
          </span>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default neon theme with cyan/pink glow - the signature retro gaming style.',
      },
    },
  },
};

export const ArcadeTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Arcade Theme',
    subtitle: 'Classic cabinet style',
    icon: '🎮',
    theme: 'arcade',
    glowAnimation: true,
    children: (
      <p className="text-gray-300 font-body">
        The arcade theme brings back memories of classic arcade cabinets
        with warm orange and gold accents.
      </p>
    ),
  },
};

export const TerminalTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Terminal Theme',
    subtitle: 'Access granted',
    icon: '>_',
    theme: 'terminal',
    scanlines: true,
    children: (
      <div className="font-mono text-[#00ff00] space-y-2">
        <p>&gt; Initializing system...</p>
        <p>&gt; Loading game data...</p>
        <p>&gt; Connection established.</p>
        <p className="animate-pulse">&gt; _</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Terminal/hacker theme with green monospace text and scanlines.',
      },
    },
  },
};

export const HologramTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Hologram Theme',
    subtitle: 'Futuristic interface',
    icon: '💠',
    theme: 'hologram',
    glowAnimation: true,
    children: (
      <p className="text-gray-300 font-body">
        The hologram theme offers a futuristic aesthetic with
        cyan to purple gradients and ethereal glow effects.
      </p>
    ),
  },
};

export const ClassicTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Classic Theme',
    subtitle: 'Traditional style',
    icon: '📜',
    theme: 'classic',
    children: (
      <p className="text-gray-700 dark:text-gray-300 font-body">
        The classic theme provides a more traditional parchment-style
        appearance for a different aesthetic.
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
      { id: 'neon', label: 'Neon', icon: '🕹️', color: '#00fff5' },
      { id: 'arcade', label: 'Arcade', icon: '🎮', color: '#ffbe0b' },
      { id: 'terminal', label: 'Terminal', icon: '>_', color: '#00ff00' },
      { id: 'hologram', label: 'Hologram', icon: '💠', color: '#00d4ff' },
      { id: 'classic', label: 'Classic', icon: '📜', color: '#d4a373' },
    ] as const;

    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
        <h2 className="font-display text-[var(--color-text-primary)] text-xl uppercase tracking-wider mb-6">
          Modal Themes
        </h2>
        <div className="flex flex-wrap gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id)}
              className="
                px-6 py-4
                rounded-[var(--radius-lg)]
                border-2
                bg-[var(--color-bg-secondary)]
                font-display uppercase tracking-wider
                transition-all duration-[var(--duration-fast)]
                hover:scale-105
              "
              style={{
                borderColor: theme.color,
                boxShadow: `0 0 15px ${theme.color}40`,
              }}
            >
              <span className="text-2xl block mb-2">{theme.icon}</span>
              <span className="text-[var(--color-text-primary)]">{theme.label}</span>
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
            glowAnimation
            scanlines={activeTheme === 'terminal'}
          >
            <p className="text-[var(--color-text-secondary)] font-body">
              This is the {activeTheme} theme modal. Each theme has its own
              unique color palette and visual style.
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
    theme: 'neon',
    children: (
      <p className="text-[var(--color-text-secondary)] font-body">
        A compact modal for simple confirmations.
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
    subtitle: 'More space for content',
    size: 'lg',
    theme: 'neon',
    children: (
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)] font-body">
          Large modals provide ample space for complex content,
          forms, or detailed information displays.
        </p>
        <p className="text-[var(--color-text-secondary)] font-body">
          They maintain readability while allowing for more
          comprehensive layouts.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)]">
            <div className="text-[var(--color-text-accent)] text-2xl font-display">42</div>
            <div className="text-[var(--color-text-muted)] text-sm">Games Won</div>
          </div>
          <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)]">
            <div className="text-[var(--color-team2-primary)] text-2xl font-display">1337</div>
            <div className="text-[var(--color-text-muted)] text-sm">Total Points</div>
          </div>
        </div>
      </div>
    ),
  },
};

export const ExtraLargeSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Extra Large Modal',
    size: 'xl',
    theme: 'neon',
    children: (
      <p className="text-[var(--color-text-secondary)] font-body">
        XL modals are great for detailed content like game statistics,
        leaderboards, or complex forms.
      </p>
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
    icon: '⚠️',
    theme: 'neon',
    children: (
      <p className="text-[var(--color-text-secondary)] font-body">
        Are you sure you want to leave the current game?
        Your progress will be lost.
      </p>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <DangerButton>Leave Game</DangerButton>
      </>
    ),
  },
};

export const ConfirmationDialog: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Start New Game?',
    icon: '🎮',
    theme: 'neon',
    size: 'sm',
    children: (
      <p className="text-[var(--color-text-secondary)] font-body text-center">
        Ready to begin a new adventure?
      </p>
    ),
    footer: (
      <>
        <Button variant="secondary" fullWidth>Cancel</Button>
        <SuccessButton fullWidth>Start Game</SuccessButton>
      </>
    ),
  },
};

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

export const WithScanlines: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'CRT Effect',
    subtitle: 'Old school vibes',
    icon: '📺',
    theme: 'neon',
    scanlines: true,
    children: (
      <p className="text-[var(--color-text-secondary)] font-body">
        The scanline effect adds a retro CRT monitor aesthetic
        to the modal for extra nostalgia.
      </p>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with CRT scanline overlay effect.',
      },
    },
  },
};

export const WithGlowAnimation: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Glowing Border',
    icon: '✨',
    theme: 'neon',
    glowAnimation: true,
    children: (
      <p className="text-[var(--color-text-secondary)] font-body">
        The glow animation adds a pulsing neon effect to the
        modal border for extra visual appeal.
      </p>
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
      { id: 'neon', Component: NeonModal, label: 'Neon Modal' },
      { id: 'arcade', Component: ArcadeModal, label: 'Arcade Modal' },
      { id: 'terminal', Component: TerminalModal, label: 'Terminal Modal' },
      { id: 'hologram', Component: HologramModal, label: 'Hologram Modal' },
      { id: 'classic', Component: ClassicModal, label: 'Classic Modal' },
    ];

    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
        <h2 className="font-display text-[var(--color-text-primary)] text-xl uppercase tracking-wider mb-6">
          Preset Modal Components
        </h2>
        <div className="flex flex-wrap gap-4">
          {presets.map((preset) => (
            <NeonButton key={preset.id} onClick={() => setActivePreset(preset.id)}>
              {preset.label}
            </NeonButton>
          ))}
        </div>

        {presets.map((preset) => (
          <preset.Component
            key={preset.id}
            isOpen={activePreset === preset.id}
            onClose={() => setActivePreset(null)}
            title={preset.label}
            subtitle="Pre-configured component"
            icon="🎯"
          >
            <p className="text-[var(--color-text-secondary)] font-body">
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
    title: 'Victory!',
    subtitle: 'Team 1 Wins!',
    icon: '🏆',
    theme: 'neon',
    glowAnimation: true,
    size: 'md',
    children: (
      <div className="text-center space-y-6">
        <div className="text-6xl animate-bounce">🎉</div>
        <div className="space-y-2">
          <div className="text-[var(--color-text-accent)] text-4xl font-display">
            41 - 28
          </div>
          <div className="text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
            Final Score
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)]">
            <div className="text-[var(--color-success)] font-display">+15</div>
            <div className="text-[var(--color-text-muted)]">Points Earned</div>
          </div>
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)]">
            <div className="text-[var(--color-warning)] font-display">5</div>
            <div className="text-[var(--color-text-muted)]">Win Streak</div>
          </div>
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost">Back to Lobby</Button>
        <SuccessButton glow>Play Again</SuccessButton>
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

export const GameOverModal: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Game Over',
    subtitle: 'Better luck next time!',
    icon: '💀',
    theme: 'neon',
    size: 'md',
    children: (
      <div className="text-center space-y-6">
        <div className="text-[var(--color-error)] text-4xl font-display">
          28 - 41
        </div>
        <p className="text-[var(--color-text-secondary)] font-body">
          Don't give up! Every loss is a chance to learn and improve.
        </p>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost">Quit</Button>
        <NeonButton>Rematch</NeonButton>
      </>
    ),
  },
};

export const PlayerStatsModal: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Player Stats',
    subtitle: 'RetroGamer42',
    icon: '📊',
    theme: 'neon',
    size: 'lg',
    children: (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)] text-center">
            <div className="text-[var(--color-success)] text-2xl font-display">156</div>
            <div className="text-[var(--color-text-muted)] text-xs uppercase">Wins</div>
          </div>
          <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)] text-center">
            <div className="text-[var(--color-error)] text-2xl font-display">89</div>
            <div className="text-[var(--color-text-muted)] text-xs uppercase">Losses</div>
          </div>
          <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)] text-center">
            <div className="text-[var(--color-text-accent)] text-2xl font-display">64%</div>
            <div className="text-[var(--color-text-muted)] text-xs uppercase">Win Rate</div>
          </div>
        </div>

        {/* Recent Games */}
        <div>
          <h3 className="text-[var(--color-text-primary)] font-display text-sm uppercase tracking-wider mb-3">
            Recent Games
          </h3>
          <div className="space-y-2">
            {['W', 'W', 'L', 'W', 'W'].map((result, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)]"
              >
                <span className={`font-display ${result === 'W' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                  {result === 'W' ? 'Victory' : 'Defeat'}
                </span>
                <span className="text-[var(--color-text-muted)] text-sm">
                  {41 - i * 3} - {28 + i * 2}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    footer: (
      <Button variant="secondary" fullWidth>Close</Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Player statistics modal with game history.',
      },
    },
  },
};
