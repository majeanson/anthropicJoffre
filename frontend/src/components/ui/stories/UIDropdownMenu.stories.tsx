import type { Meta, StoryObj } from '@storybook/react';
import { UIDropdownMenu } from '../UIDropdownMenu';
import { Button } from '../Button';

const meta = {
  title: 'UI/UIDropdownMenu',
  component: UIDropdownMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
UIDropdownMenu is a reusable dropdown menu component for navigation and action menus.

### Features
- Multiple position options (bottom-left, bottom-right, top-left, top-right)
- Click-outside to close
- Keyboard navigation (Escape to close)
- Menu items with icons, dividers, and danger states
- Accessible with ARIA attributes
- Both controlled and uncontrolled modes

### Usage
\`\`\`tsx
import { UIDropdownMenu } from '@/components/ui';

<UIDropdownMenu
  trigger={<Button>Menu</Button>}
  items={[
    { label: 'Profile', icon: '👤', onClick: () => {} },
    { type: 'divider' },
    { label: 'Logout', icon: '🚪', onClick: () => {}, danger: true },
  ]}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
    },
    width: {
      control: 'select',
      options: ['auto', 'sm', 'md', 'lg'],
    },
    closeOnItemClick: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof UIDropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems = [
  { label: 'View Profile', icon: '👤', onClick: () => console.log('View Profile') },
  { label: 'Settings', icon: '⚙️', onClick: () => console.log('Settings') },
  { label: 'Help', icon: '❓', onClick: () => console.log('Help') },
  { type: 'divider' as const },
  { label: 'Logout', icon: '🚪', onClick: () => console.log('Logout'), danger: true },
];

export const Default: Story = {
  args: {
    trigger: <Button variant="primary">Open Menu</Button>,
    items: defaultItems,
    position: 'bottom-right',
    width: 'md',
  },
};

export const ProfileDropdown: Story = {
  args: {
    trigger: (
      <Button variant="secondary" className="flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
          JD
        </span>
        <span>John Doe</span>
        <span>▼</span>
      </Button>
    ),
    items: [
      { label: 'View Profile', icon: '👤', onClick: () => {} },
      { label: 'Edit Profile', icon: '✏️', onClick: () => {} },
      { type: 'divider' as const },
      { label: 'Logout', icon: '🚪', onClick: () => {}, danger: true },
    ],
    position: 'bottom-right',
    width: 'md',
  },
};

export const BottomLeft: Story = {
  args: {
    trigger: <Button variant="secondary">Bottom Left Menu</Button>,
    items: defaultItems,
    position: 'bottom-left',
    width: 'md',
  },
};

export const TopRight: Story = {
  args: {
    trigger: <Button variant="secondary">Top Right Menu</Button>,
    items: defaultItems,
    position: 'top-right',
    width: 'md',
  },
  decorators: [
    (Story) => (
      <div style={{ paddingTop: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

export const SmallWidth: Story = {
  args: {
    trigger: <Button variant="secondary">Small Menu</Button>,
    items: [
      { label: 'Edit', icon: '✏️', onClick: () => {} },
      { label: 'Delete', icon: '🗑️', onClick: () => {}, danger: true },
    ],
    position: 'bottom-right',
    width: 'sm',
  },
};

export const LargeWidth: Story = {
  args: {
    trigger: <Button variant="secondary">Large Menu</Button>,
    items: [
      { label: 'View Full Profile Details', icon: '👤', onClick: () => {} },
      { label: 'Account Settings & Preferences', icon: '⚙️', onClick: () => {} },
      { label: 'Privacy & Security Options', icon: '🔒', onClick: () => {} },
      { type: 'divider' as const },
      { label: 'Sign Out of Account', icon: '🚪', onClick: () => {}, danger: true },
    ],
    position: 'bottom-right',
    width: 'lg',
  },
};

export const WithDisabledItems: Story = {
  args: {
    trigger: <Button variant="secondary">Menu with Disabled</Button>,
    items: [
      { label: 'Available Action', icon: '✅', onClick: () => {} },
      { label: 'Disabled Action', icon: '🚫', onClick: () => {}, disabled: true },
      { type: 'divider' as const },
      { label: 'Another Action', icon: '⭐', onClick: () => {} },
    ],
    position: 'bottom-right',
    width: 'md',
  },
};

export const IconButton: Story = {
  args: {
    trigger: (
      <button className="p-2 rounded-full hover:bg-skin-tertiary transition-colors">
        <span className="text-xl">⋮</span>
      </button>
    ),
    items: [
      { label: 'Edit', icon: '✏️', onClick: () => {} },
      { label: 'Duplicate', icon: '📋', onClick: () => {} },
      { label: 'Archive', icon: '📦', onClick: () => {} },
      { type: 'divider' as const },
      { label: 'Delete', icon: '🗑️', onClick: () => {}, danger: true },
    ],
    position: 'bottom-right',
    width: 'sm',
  },
};

export const ActionMenu: Story = {
  args: {
    trigger: <Button variant="ghost">Actions ▼</Button>,
    items: [
      { label: 'Start Game', icon: '▶️', onClick: () => {} },
      { label: 'Pause Game', icon: '⏸️', onClick: () => {} },
      { type: 'divider' as const },
      { label: 'Reset Game', icon: '🔄', onClick: () => {} },
      { label: 'End Game', icon: '⏹️', onClick: () => {}, danger: true },
    ],
    position: 'bottom-left',
    width: 'md',
  },
};
