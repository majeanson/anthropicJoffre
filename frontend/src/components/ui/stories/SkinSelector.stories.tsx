/**
 * SkinSelector Component Stories - Retro Gaming Edition
 *
 * Showcases the skin/theme selection system with multiple
 * display options: grid, dropdown, modal, and quick toggle.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  SkinSelectorGrid,
  SkinSelectorDropdown,
  SkinSelectorModal,
  QuickSkinToggle,
} from '../../SkinSelector';
import { Button, ElegantButton } from '../Button';

const meta = {
  title: 'UI/SkinSelector',
  component: SkinSelectorGrid,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Skin/theme selection component with multiple display modes.

## Components
- **SkinSelectorGrid**: Full grid view of all available skins
- **SkinSelectorDropdown**: Compact dropdown selector
- **SkinSelectorModal**: Modal-based skin picker
- **QuickSkinToggle**: Minimal toggle for toolbars/headers

## Available Skins
- Retro Gaming (default dark)
- Luxury Casino (dark)
- Modern Minimal (light)
- Cyberpunk Neon (dark)
- Classic Historic (light)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SkinSelectorGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// GRID SELECTOR
// ============================================================================

export const GridSelector: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] min-w-[600px]">
      <h2 className="font-display text-[var(--color-text-primary)] text-lg uppercase tracking-wider mb-6">
        Choose Your Skin
      </h2>
      <SkinSelectorGrid columns={2} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full grid view showing all available skins with previews and descriptions.',
      },
    },
  },
};

export const GridSingleColumn: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] max-w-sm">
      <h2 className="font-display text-[var(--color-text-primary)] text-lg uppercase tracking-wider mb-6">
        Select Theme
      </h2>
      <SkinSelectorGrid columns={1} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Single column layout for narrow containers.',
      },
    },
  },
};

export const GridThreeColumns: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] min-w-[900px]">
      <h2 className="font-display text-[var(--color-text-primary)] text-lg uppercase tracking-wider mb-6">
        Visual Themes
      </h2>
      <SkinSelectorGrid columns={3} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three column layout for wide containers.',
      },
    },
  },
};

// ============================================================================
// DROPDOWN SELECTOR
// ============================================================================

export const DropdownSelector: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] min-w-[320px]">
      <label className="block font-display text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2">
        Current Theme
      </label>
      <SkinSelectorDropdown />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact dropdown for settings pages or sidebars.',
      },
    },
  },
};

// ============================================================================
// MODAL SELECTOR
// ============================================================================

export const ModalSelector: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <ElegantButton onClick={() => setIsOpen(true)} glow>
          Open Skin Selector
        </ElegantButton>
        <SkinSelectorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal-based skin picker with full preview and description.',
      },
    },
  },
};

// ============================================================================
// QUICK TOGGLE
// ============================================================================

export const QuickToggleDefault: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <div className="flex items-center gap-4">
        <span className="text-[var(--color-text-secondary)] text-sm">Theme:</span>
        <QuickSkinToggle />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Minimal toggle button for headers and toolbars.',
      },
    },
  },
};

export const QuickToggleWithLabel: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)]">
      <QuickSkinToggle showLabel />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Quick toggle with skin name label.',
      },
    },
  },
};

// ============================================================================
// INTEGRATION EXAMPLES
// ============================================================================

export const SettingsPageExample: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-secondary)] rounded-[var(--radius-xl)] min-w-[500px] space-y-8">
      <div>
        <h2 className="font-display text-[var(--color-text-primary)] text-xl uppercase tracking-wider mb-2">
          Settings
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm font-body">
          Customize your game experience
        </p>
      </div>

      {/* Appearance Section */}
      <div className="space-y-4">
        <h3 className="font-display text-[var(--color-text-secondary)] text-sm uppercase tracking-wider border-b border-[var(--color-border-subtle)] pb-2">
          Appearance
        </h3>

        <div className="space-y-2">
          <label className="block text-[var(--color-text-primary)] text-sm font-display">
            Visual Theme
          </label>
          <SkinSelectorDropdown />
        </div>
      </div>

      {/* Audio Section (Example) */}
      <div className="space-y-4">
        <h3 className="font-display text-[var(--color-text-secondary)] text-sm uppercase tracking-wider border-b border-[var(--color-border-subtle)] pb-2">
          Audio
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-primary)] text-sm">Sound Effects</span>
          <div className="w-12 h-6 bg-[var(--color-success)] rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="ghost" fullWidth>
          Reset
        </Button>
        <Button variant="primary" fullWidth>
          Save
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example settings page with skin selector integration.',
      },
    },
  },
};

export const HeaderToolbarExample: Story = {
  render: () => (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-[var(--radius-lg)] min-w-[600px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕹️</span>
          <span className="font-display text-[var(--color-text-primary)] uppercase tracking-wider">
            Jaffre
          </span>
        </div>

        <div className="flex items-center gap-3">
          <QuickSkinToggle showLabel />
          <div className="w-px h-6 bg-[var(--color-border-default)]" />
          <button className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <span className="text-lg">⚙️</span>
          </button>
          <button className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <span className="text-lg">👤</span>
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example header toolbar with quick skin toggle.',
      },
    },
  },
};

export const WelcomeScreenExample: Story = {
  render: () => {
    const [showModal, setShowModal] = useState(false);

    return (
      <div className="p-8 bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] min-w-[400px] text-center space-y-8">
        <div>
          <span className="text-6xl block mb-4">🎮</span>
          <h1 className="font-display text-[var(--color-text-primary)] text-2xl uppercase tracking-wider mb-2">
            Welcome to Jaffre
          </h1>
          <p className="text-[var(--color-text-muted)] font-body">Multiplayer trick card game</p>
        </div>

        <div className="space-y-3">
          <ElegantButton fullWidth glow size="lg" onClick={() => setShowModal(true)}>
            Choose Your Style
          </ElegantButton>
          <p className="text-[var(--color-text-muted)] text-xs">
            You can change this anytime in settings
          </p>
        </div>

        <SkinSelectorModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example welcome screen with skin selection prompt.',
      },
    },
  },
};
