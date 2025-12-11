/**
 * Tabs Component Stories
 *
 * Navigation tabs for exploring different sections.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs, TabPanel } from '../Tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Tabs Component

Navigation tabs for exploring different sections.

## Features
- **3 variants**: underline, pills, boxed
- **3 sizes**: sm, md, lg
- **Icons**: Icon support
- **Badges**: Notification counts
- **Full width**: Stretch to fill container

Use the skin selector in the toolbar to see how tabs adapt to different themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'pills', 'boxed'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tab size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Stretch tabs to fill container',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// BASIC VARIANTS
// ============================================================================

export const Underline: Story = {
  args: {
    variant: 'underline',
    activeTab: 'guild',
    tabs: [
      { id: 'guild', label: 'Guild' },
      { id: 'scrolls', label: 'Scrolls' },
      { id: 'archives', label: 'Archives' },
    ],
    onChange: () => {},
  },
};

export const Pills: Story = {
  args: {
    variant: 'pills',
    activeTab: 'guild',
    tabs: [
      { id: 'guild', label: 'Guild' },
      { id: 'scrolls', label: 'Scrolls' },
      { id: 'archives', label: 'Archives' },
    ],
    onChange: () => {},
  },
};

export const Boxed: Story = {
  args: {
    variant: 'boxed',
    activeTab: 'guild',
    tabs: [
      { id: 'guild', label: 'Guild' },
      { id: 'scrolls', label: 'Scrolls' },
      { id: 'archives', label: 'Archives' },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// SIZES
// ============================================================================

export const Small: Story = {
  args: {
    size: 'sm',
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Formulas' },
      { id: 'tab2', label: 'Catalysts' },
      { id: 'tab3', label: 'Results' },
    ],
    onChange: () => {},
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Formulas' },
      { id: 'tab2', label: 'Catalysts' },
      { id: 'tab3', label: 'Results' },
    ],
    onChange: () => {},
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Formulas' },
      { id: 'tab2', label: 'Catalysts' },
      { id: 'tab3', label: 'Results' },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// WITH ICONS (Alchemical Symbols)
// ============================================================================

export const WithIcons: Story = {
  args: {
    activeTab: 'guild',
    tabs: [
      { id: 'guild', label: 'Guild', icon: '⚗' },
      { id: 'scrolls', label: 'Scrolls', icon: '📜' },
      { id: 'archives', label: 'Archives', icon: '📚' },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// WITH BADGES
// ============================================================================

export const WithBadges: Story = {
  args: {
    activeTab: 'guild',
    tabs: [
      { id: 'guild', label: 'Guild', badge: 12 },
      { id: 'scrolls', label: 'Scrolls', badge: 3 },
      { id: 'formulas', label: 'Formulas', badge: 99 },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// WITH ICONS AND BADGES
// ============================================================================

export const WithIconsAndBadges: Story = {
  args: {
    activeTab: 'guild',
    tabs: [
      { id: 'guild', label: 'Guild', icon: '⚗', badge: 12 },
      { id: 'scrolls', label: 'Scrolls', icon: '📜', badge: 3 },
      { id: 'formulas', label: 'Formulas', icon: '☿', badge: 150 },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// DISABLED TAB
// ============================================================================

export const WithDisabledTab: Story = {
  args: {
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Unlocked' },
      { id: 'tab2', label: 'Available' },
      { id: 'tab3', label: 'Forbidden', disabled: true },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// FULL WIDTH
// ============================================================================

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Fire △' },
      { id: 'tab2', label: 'Water ▽' },
      { id: 'tab3', label: 'Earth ◇' },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// FULL WIDTH PILLS
// ============================================================================

export const FullWidthPills: Story = {
  args: {
    variant: 'pills',
    fullWidth: true,
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Active' },
      { id: 'tab2', label: 'Recent' },
      { id: 'tab3', label: 'Archived' },
    ],
    onChange: () => {},
  },
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const tabs = [
      { id: 'tab1', label: 'First' },
      { id: 'tab2', label: 'Second' },
      { id: 'tab3', label: 'Third' },
    ];

    return (
      <div className="space-y-8 p-6 bg-skin-primary rounded-xl border border-skin-default">
        <div>
          <h4 className="text-sm font-medium mb-2 text-skin-muted">Underline</h4>
          <Tabs variant="underline" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2 text-skin-muted">Pills</h4>
          <Tabs variant="pills" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2 text-skin-muted">Boxed</h4>
          <Tabs variant="boxed" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
      </div>
    );
  },
};

// ============================================================================
// INTERACTIVE EXAMPLE
// ============================================================================

export const Interactive: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('friends');

    return (
      <div className="p-4 rounded-xl bg-skin-secondary border border-skin-default">
        <Tabs
          tabs={[
            { id: 'friends', label: 'Friends', icon: '👥', badge: 5 },
            { id: 'messages', label: 'Messages', icon: '💬', badge: 2 },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-4 p-4 rounded-lg min-h-[100px] bg-skin-primary">
          <TabPanel tabId="friends" activeTab={activeTab}>
            <p className="text-skin-primary">Your friends list appears here.</p>
          </TabPanel>

          <TabPanel tabId="messages" activeTab={activeTab}>
            <p className="text-skin-primary">Your messages appear here.</p>
          </TabPanel>

          <TabPanel tabId="settings" activeTab={activeTab}>
            <p className="text-skin-primary">Your settings appear here.</p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// ============================================================================
// FRIENDS PANEL
// ============================================================================

export const FriendsPanel: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('online');

    return (
      <div className="p-4 rounded-xl w-80 bg-skin-secondary border border-skin-default">
        <h3 className="text-lg font-bold mb-4 text-skin-accent">Friends</h3>

        <Tabs
          variant="pills"
          fullWidth
          tabs={[
            { id: 'online', label: 'Online', badge: 8 },
            { id: 'all', label: 'All Friends' },
            { id: 'blocked', label: 'Blocked' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-4 space-y-2">
          <TabPanel tabId="online" activeTab={activeTab}>
            {['Player1', 'Player2', 'Player3'].map((name) => (
              <div key={name} className="p-2 rounded flex items-center gap-2 bg-skin-primary">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-skin-primary">{name}</span>
              </div>
            ))}
          </TabPanel>

          <TabPanel tabId="all" activeTab={activeTab}>
            <p className="text-center py-4 text-skin-muted">Showing all friends...</p>
          </TabPanel>

          <TabPanel tabId="blocked" activeTab={activeTab}>
            <p className="text-center py-4 text-skin-muted">No blocked users</p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// ============================================================================
// GAME MODE SELECTOR
// ============================================================================

export const GameModeSelector: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('practice');

    return (
      <div className="p-4">
        <Tabs
          variant="boxed"
          fullWidth
          size="lg"
          tabs={[
            { id: 'practice', label: 'Practice', icon: '🎮' },
            { id: 'ranked', label: 'Ranked', icon: '🏆' },
            { id: 'custom', label: 'Custom', icon: '⚙️' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-4 p-4 rounded-lg text-center bg-skin-primary border border-skin-default">
          {activeTab === 'practice' && (
            <p className="text-skin-primary">Play casually without affecting your rank</p>
          )}
          {activeTab === 'ranked' && (
            <p className="text-skin-primary">Compete to climb the leaderboard</p>
          )}
          {activeTab === 'custom' && (
            <p className="text-skin-primary">Configure custom game settings</p>
          )}
        </div>
      </div>
    );
  },
};

// ============================================================================
// SUIT SELECTOR TABS
// ============================================================================

export const SuitSelectorTabs: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('red');

    const suitColors: Record<string, string> = {
      red: 'border-red-500',
      blue: 'border-blue-500',
      green: 'border-green-500',
      brown: 'border-yellow-700',
    };

    return (
      <div className="p-6 rounded-xl bg-skin-primary border border-skin-default">
        <h3 className="text-lg font-bold mb-4 text-center text-skin-accent">Choose Your Suit</h3>

        <Tabs
          variant="pills"
          fullWidth
          tabs={[
            { id: 'red', label: '♥ Red' },
            { id: 'blue', label: '♠ Blue' },
            { id: 'green', label: '♣ Green' },
            { id: 'brown', label: '♦ Brown' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div
          className={`mt-4 p-4 rounded-lg text-center bg-skin-secondary border-l-4 ${suitColors[activeTab]}`}
        >
          <span className="text-3xl block mb-2">
            {activeTab === 'red' && '♥️'}
            {activeTab === 'blue' && '♠️'}
            {activeTab === 'green' && '♣️'}
            {activeTab === 'brown' && '♦️'}
          </span>
          <p className="italic text-skin-muted">
            {activeTab === 'red' && 'The red suit'}
            {activeTab === 'blue' && 'The blue suit'}
            {activeTab === 'green' && 'The green suit'}
            {activeTab === 'brown' && 'The brown suit (trump)'}
          </p>
        </div>
      </div>
    );
  },
};
