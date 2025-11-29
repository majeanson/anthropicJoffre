/**
 * Tabs Component Stories
 * Comprehensive Storybook stories for the Tabs component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs, TabPanel } from '../Tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
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

// Basic Variants
export const Underline: Story = {
  args: {
    variant: 'underline',
    activeTab: 'friends',
    tabs: [
      { id: 'friends', label: 'Friends' },
      { id: 'requests', label: 'Requests' },
      { id: 'search', label: 'Search' },
    ],
    onChange: () => {},
  },
};

export const Pills: Story = {
  args: {
    variant: 'pills',
    activeTab: 'friends',
    tabs: [
      { id: 'friends', label: 'Friends' },
      { id: 'requests', label: 'Requests' },
      { id: 'search', label: 'Search' },
    ],
    onChange: () => {},
  },
};

export const Boxed: Story = {
  args: {
    variant: 'boxed',
    activeTab: 'friends',
    tabs: [
      { id: 'friends', label: 'Friends' },
      { id: 'requests', label: 'Requests' },
      { id: 'search', label: 'Search' },
    ],
    onChange: () => {},
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' },
    ],
    onChange: () => {},
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' },
    ],
    onChange: () => {},
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' },
    ],
    onChange: () => {},
  },
};

// With Icons
export const WithIcons: Story = {
  args: {
    activeTab: 'friends',
    tabs: [
      { id: 'friends', label: 'Friends', icon: '👥' },
      { id: 'requests', label: 'Requests', icon: '📩' },
      { id: 'search', label: 'Search', icon: '🔍' },
    ],
    onChange: () => {},
  },
};

// With Badges
export const WithBadges: Story = {
  args: {
    activeTab: 'friends',
    tabs: [
      { id: 'friends', label: 'Friends', badge: 12 },
      { id: 'requests', label: 'Requests', badge: 3 },
      { id: 'messages', label: 'Messages', badge: 99 },
    ],
    onChange: () => {},
  },
};

// With Icons and Badges
export const WithIconsAndBadges: Story = {
  args: {
    activeTab: 'friends',
    tabs: [
      { id: 'friends', label: 'Friends', icon: '👥', badge: 12 },
      { id: 'requests', label: 'Requests', icon: '📩', badge: 3 },
      { id: 'messages', label: 'Messages', icon: '💬', badge: 150 },
    ],
    onChange: () => {},
  },
};

// Disabled Tab
export const WithDisabledTab: Story = {
  args: {
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Active' },
      { id: 'tab2', label: 'Available' },
      { id: 'tab3', label: 'Locked', disabled: true },
    ],
    onChange: () => {},
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' },
    ],
    onChange: () => {},
  },
};

// Full Width Pills
export const FullWidthPills: Story = {
  args: {
    variant: 'pills',
    fullWidth: true,
    activeTab: 'tab1',
    tabs: [
      { id: 'tab1', label: 'Active' },
      { id: 'tab2', label: 'Recent' },
      { id: 'tab3', label: 'All' },
    ],
    onChange: () => {},
  },
};

// Showcase: All Variants
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
      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Underline</h4>
          <Tabs variant="underline" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Pills</h4>
          <Tabs variant="pills" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Boxed</h4>
          <Tabs variant="boxed" tabs={tabs} activeTab="tab1" onChange={() => {}} />
        </div>
      </div>
    );
  },
};

// Interactive Example
export const Interactive: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('friends');

    return (
      <div className="p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg">
        <Tabs
          tabs={[
            { id: 'friends', label: 'Friends', icon: '👥', badge: 5 },
            { id: 'requests', label: 'Requests', icon: '📩', badge: 2 },
            { id: 'search', label: 'Search', icon: '🔍' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg min-h-[100px]">
          <TabPanel tabId="friends" activeTab={activeTab}>
            <p className="text-umber-800 dark:text-gray-200">
              Your friends list will appear here.
            </p>
          </TabPanel>

          <TabPanel tabId="requests" activeTab={activeTab}>
            <p className="text-umber-800 dark:text-gray-200">
              Friend requests will appear here.
            </p>
          </TabPanel>

          <TabPanel tabId="search" activeTab={activeTab}>
            <p className="text-umber-800 dark:text-gray-200">
              Search for players here.
            </p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// Social Panel Example
export const SocialPanelExample: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('online');

    return (
      <div className="p-4 bg-parchment-200 dark:bg-gray-900 rounded-lg w-80">
        <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">Social</h3>

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
            {['Alice', 'Bob', 'Charlie'].map((name) => (
              <div
                key={name}
                className="p-2 bg-white dark:bg-gray-800 rounded flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-umber-800 dark:text-gray-200">{name}</span>
              </div>
            ))}
          </TabPanel>

          <TabPanel tabId="all" activeTab={activeTab}>
            <p className="text-umber-600 dark:text-gray-400 text-center py-4">
              Showing all friends...
            </p>
          </TabPanel>

          <TabPanel tabId="blocked" activeTab={activeTab}>
            <p className="text-umber-600 dark:text-gray-400 text-center py-4">
              No blocked users
            </p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// Game Mode Selector
export const GameModeSelector: Story = {
  args: {
    tabs: [],
    activeTab: '',
    onChange: () => {},
  },
  render: () => {
    const [activeTab, setActiveTab] = useState('casual');

    return (
      <div className="p-4">
        <Tabs
          variant="boxed"
          fullWidth
          size="lg"
          tabs={[
            { id: 'casual', label: 'Casual', icon: '🎮' },
            { id: 'ranked', label: 'Ranked', icon: '🏆' },
            { id: 'custom', label: 'Custom', icon: '⚙️' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-4 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg text-center">
          {activeTab === 'casual' && (
            <p className="text-umber-800 dark:text-gray-200">
              Play for fun with no rank impact
            </p>
          )}
          {activeTab === 'ranked' && (
            <p className="text-umber-800 dark:text-gray-200">
              Compete to climb the leaderboard
            </p>
          )}
          {activeTab === 'custom' && (
            <p className="text-umber-800 dark:text-gray-200">
              Create a game with custom rules
            </p>
          )}
        </div>
      </div>
    );
  },
};
