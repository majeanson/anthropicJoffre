/**
 * Tabs Component Stories - Midnight Alchemy Edition
 *
 * Mystical navigation tabs for exploring different sections
 * of the alchemist's laboratory and archives.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs, TabPanel } from '../Tabs';

const meta = {
  title: 'Midnight Alchemy/Tabs',
  component: Tabs,
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
# Midnight Alchemy Tabs

Mystical navigation tabs for exploring different sections
of the alchemist's laboratory and archives.

## Features
- **3 variants**: underline, pills, boxed
- **3 sizes**: sm, md, lg
- **Icons**: Alchemical symbols
- **Badges**: Notification counts
- **Full width**: Stretch to fill container

## Alchemical Usage
Navigate between guild members, experiment logs,
and archived formulas.
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
      { id: 'tab1', label: 'Mercury' },
      { id: 'tab2', label: 'Sulfur' },
      { id: 'tab3', label: 'Salt' },
    ];

    return (
      <div className="space-y-8 p-6 bg-[#0B0E14] rounded-xl">
        <div>
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: '#6B7280' }}
          >
            Underline
          </h4>
          <Tabs variant="underline" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
        <div>
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: '#6B7280' }}
          >
            Pills
          </h4>
          <Tabs variant="pills" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
        <div>
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: '#6B7280' }}
          >
            Boxed
          </h4>
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
    const [activeTab, setActiveTab] = useState('guild');

    return (
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'linear-gradient(180deg, #131824 0%, #0B0E14 100%)',
          border: '1px solid #2D3548',
        }}
      >
        <Tabs
          tabs={[
            { id: 'guild', label: 'Guild', icon: '⚗', badge: 5 },
            { id: 'scrolls', label: 'Scrolls', icon: '📜', badge: 2 },
            { id: 'archives', label: 'Archives', icon: '📚' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div
          className="mt-4 p-4 rounded-lg min-h-[100px]"
          style={{ background: '#0B0E14' }}
        >
          <TabPanel tabId="guild" activeTab={activeTab}>
            <p style={{ color: '#E8E4DC' }}>
              Your fellow alchemists await in the guild hall.
            </p>
          </TabPanel>

          <TabPanel tabId="scrolls" activeTab={activeTab}>
            <p style={{ color: '#E8E4DC' }}>
              Unread scrolls containing new discoveries.
            </p>
          </TabPanel>

          <TabPanel tabId="archives" activeTab={activeTab}>
            <p style={{ color: '#E8E4DC' }}>
              Ancient formulas preserved for eternity.
            </p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// ============================================================================
// GUILD PANEL
// ============================================================================

export const GuildPanel: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('online');

    return (
      <div
        className="p-4 rounded-xl w-80"
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
          Guild Members
        </h3>

        <Tabs
          variant="pills"
          fullWidth
          tabs={[
            { id: 'online', label: 'Active', badge: 8 },
            { id: 'all', label: 'All Members' },
            { id: 'blocked', label: 'Exiled' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-4 space-y-2">
          <TabPanel tabId="online" activeTab={activeTab}>
            {['Aurelia', 'Magnus', 'Isolde'].map((name) => (
              <div
                key={name}
                className="p-2 rounded flex items-center gap-2"
                style={{ background: '#0B0E14' }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#10B981' }}
                />
                <span style={{ color: '#E8E4DC' }}>{name}</span>
              </div>
            ))}
          </TabPanel>

          <TabPanel tabId="all" activeTab={activeTab}>
            <p
              className="text-center py-4"
              style={{ color: '#6B7280' }}
            >
              Showing all guild members...
            </p>
          </TabPanel>

          <TabPanel tabId="blocked" activeTab={activeTab}>
            <p
              className="text-center py-4"
              style={{ color: '#6B7280' }}
            >
              No exiled members
            </p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// ============================================================================
// EXPERIMENT MODE SELECTOR
// ============================================================================

export const ExperimentModeSelector: Story = {
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
            { id: 'practice', label: 'Practice', icon: '⚗' },
            { id: 'ranked', label: 'Ranked', icon: '🏆' },
            { id: 'custom', label: 'Custom', icon: '☿' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div
          className="mt-4 p-4 rounded-lg text-center"
          style={{
            background: '#0B0E14',
            border: '1px solid #2D3548',
          }}
        >
          {activeTab === 'practice' && (
            <p style={{ color: '#E8E4DC' }}>
              Experiment freely with no guild standing impact
            </p>
          )}
          {activeTab === 'ranked' && (
            <p style={{ color: '#E8E4DC' }}>
              Compete to climb the Grand Alchemist rankings
            </p>
          )}
          {activeTab === 'custom' && (
            <p style={{ color: '#E8E4DC' }}>
              Configure custom experiment parameters
            </p>
          )}
        </div>
      </div>
    );
  },
};

// ============================================================================
// ELEMENTAL TABS
// ============================================================================

export const ElementalTabs: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('fire');

    const elementColors: Record<string, string> = {
      fire: '#EF4444',
      water: '#3B82F6',
      earth: '#84CC16',
      air: '#E8E4DC',
    };

    return (
      <div
        className="p-6 rounded-xl"
        style={{
          background: '#0B0E14',
          border: '1px solid #2D3548',
        }}
      >
        <h3
          className="text-lg font-bold mb-4 text-center"
          style={{
            fontFamily: '"Cinzel", Georgia, serif',
            color: '#D4A574',
          }}
        >
          Choose Your Element
        </h3>

        <Tabs
          variant="pills"
          fullWidth
          tabs={[
            { id: 'fire', label: '△ Fire' },
            { id: 'water', label: '▽ Water' },
            { id: 'earth', label: '◇ Earth' },
            { id: 'air', label: '○ Air' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div
          className="mt-4 p-4 rounded-lg text-center transition-colors"
          style={{
            background: '#131824',
            borderLeft: `3px solid ${elementColors[activeTab]}`,
          }}
        >
          <span
            className="text-3xl block mb-2"
          >
            {activeTab === 'fire' && '🔥'}
            {activeTab === 'water' && '💧'}
            {activeTab === 'earth' && '🌿'}
            {activeTab === 'air' && '💨'}
          </span>
          <p
            className="italic"
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              color: '#9CA3AF',
            }}
          >
            {activeTab === 'fire' && 'The flame of transformation'}
            {activeTab === 'water' && 'The flow of purification'}
            {activeTab === 'earth' && 'The foundation of stability'}
            {activeTab === 'air' && 'The breath of inspiration'}
          </p>
        </div>
      </div>
    );
  },
};
