/**
 * AvatarSelector Component Stories
 *
 * Interactive avatar picker with category filtering and grid display.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AvatarSelector } from '../../AvatarSelector';
import Avatar from '../../Avatar';

const meta = {
  title: 'UI/AvatarSelector',
  component: AvatarSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Avatar Selector Component

An interactive grid-based avatar picker with category filtering.

## Features
- **Category Filtering**: Filter by Animals, Characters, Objects, Nature, Food, Sports
- **Visual Selection**: Ring highlight on selected avatar
- **Scrollable Grid**: Compact display with overflow scrolling
- **Hover Effects**: Scale animation on hover
- **Selection Info**: Shows selected avatar name

## Avatar Categories
- 🐾 Animals (20 avatars)
- 🧙 Characters (15 avatars)
- 💎 Objects (15 avatars)
- 🌿 Nature (10 avatars)
- 🍕 Food (10 avatars)
- ⚽ Sports (10 avatars)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selectedAvatarId: {
      control: 'text',
      description: 'Currently selected avatar ID',
    },
    onSelect: {
      action: 'selected',
      description: 'Callback when an avatar is selected',
    },
  },
} satisfies Meta<typeof AvatarSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// INTERACTIVE WRAPPER
// =============================================================================

function InteractiveAvatarSelector({ initialAvatarId }: { initialAvatarId?: string }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialAvatarId);

  return (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">Choose Your Avatar</h3>
      <AvatarSelector selectedAvatarId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

// =============================================================================
// STORIES
// =============================================================================

export const Default: Story = {
  render: () => <InteractiveAvatarSelector />,
};

export const WithPreselected: Story = {
  name: 'With Pre-selected Avatar',
  render: () => <InteractiveAvatarSelector initialAvatarId="dragon" />,
};

export const InProfileEditor: Story = {
  name: 'Profile Editor Context',
  render: () => {
    const [avatarId, setAvatarId] = useState<string>('fox');
    const [username] = useState('DragonSlayer99');

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px] space-y-6">
        <h3 className="text-[var(--color-text-primary)] font-semibold">Edit Profile</h3>

        {/* Current Avatar Preview */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-bg-secondary)]">
          <Avatar username={username} avatarUrl={avatarId} size="xl" />
          <div>
            <p className="text-[var(--color-text-primary)] font-medium">{username}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Click an avatar below to change
            </p>
          </div>
        </div>

        {/* Avatar Selector */}
        <AvatarSelector selectedAvatarId={avatarId} onSelect={setAvatarId} />
      </div>
    );
  },
};

export const CompactView: Story = {
  name: 'Compact View (Modal Context)',
  render: () => {
    const [avatarId, setAvatarId] = useState<string | undefined>();

    return (
      <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] w-[400px] border border-[var(--color-border-primary)]">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[var(--color-text-primary)] font-medium">Select Avatar</h4>
          {avatarId && (
            <div className="flex items-center gap-2">
              <Avatar username="User" avatarUrl={avatarId} size="sm" />
              <span className="text-sm text-[var(--color-text-secondary)]">Selected</span>
            </div>
          )}
        </div>
        <AvatarSelector selectedAvatarId={avatarId} onSelect={setAvatarId} />
      </div>
    );
  },
};

export const CategoryShowcase: Story = {
  name: 'Category Showcase',
  render: () => (
    <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px] space-y-4">
      <h3 className="text-[var(--color-text-primary)] font-semibold mb-2">
        80 Unique Avatars Across 6 Categories
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4">
        Use the category buttons to filter avatars by type
      </p>
      <AvatarSelector selectedAvatarId="crown" onSelect={() => {}} />
    </div>
  ),
};

export const RegistrationFlow: Story = {
  name: 'Registration Flow Context',
  render: () => {
    const [avatarId, setAvatarId] = useState<string | undefined>();
    const [step, setStep] = useState(1);

    return (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--color-text-secondary)] text-sm">Step {step} of 3</span>
            <span className="text-[var(--color-text-tertiary)] text-sm">
              {step === 1 ? 'Choose Avatar' : step === 2 ? 'Enter Username' : 'Complete'}
            </span>
          </div>
          <div className="h-1 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent-primary)] transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <>
            <h3 className="text-[var(--color-text-primary)] font-semibold mb-4">
              Choose Your Avatar
            </h3>
            <AvatarSelector
              selectedAvatarId={avatarId}
              onSelect={(id) => {
                setAvatarId(id);
                setTimeout(() => setStep(2), 500);
              }}
            />
          </>
        )}

        {step === 2 && (
          <div className="text-center py-8">
            <Avatar username="NewUser" avatarUrl={avatarId} size="xl" className="mx-auto mb-4" />
            <p className="text-[var(--color-text-primary)]">Avatar selected!</p>
            <button
              onClick={() => setStep(1)}
              className="text-[var(--color-accent-primary)] text-sm mt-2 hover:underline"
            >
              Change avatar
            </button>
          </div>
        )}
      </div>
    );
  },
};

// =============================================================================
// STATIC STORY FOR CONTROLS
// =============================================================================

export const Interactive: Story = {
  args: {
    selectedAvatarId: 'fox',
  },
  decorators: [
    (Story) => (
      <div className="p-6 rounded-lg bg-[var(--color-bg-primary)] w-[500px]">
        <Story />
      </div>
    ),
  ],
};
