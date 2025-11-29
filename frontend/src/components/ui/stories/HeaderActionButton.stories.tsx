import type { Meta, StoryObj } from '@storybook/react';
import { HeaderActionButton } from '../HeaderActionButton';

const meta: Meta<typeof HeaderActionButton> = {
  title: 'UI/HeaderActionButton',
  component: HeaderActionButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'header',
      values: [
        { name: 'header', value: 'linear-gradient(to right, #b45309, #c2410c)' },
        { name: 'dark-header', value: 'linear-gradient(to right, #374151, #111827)' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    label: { control: 'text' },
    badgeCount: { control: 'number' },
    size: { control: 'select', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderActionButton>;

export const Default: Story = {
  args: {
    icon: '💬',
    label: 'Chat',
    onClick: () => alert('Clicked!'),
  },
};

export const WithBadge: Story = {
  args: {
    icon: '🔔',
    label: 'Notifications',
    badgeCount: 5,
    onClick: () => alert('Clicked!'),
  },
};

export const IconOnly: Story = {
  args: {
    icon: '⚙️',
    onClick: () => alert('Clicked!'),
  },
};

export const SmallSize: Story = {
  args: {
    icon: '💬',
    size: 'sm',
    onClick: () => alert('Clicked!'),
  },
};

export const Disabled: Story = {
  args: {
    icon: '🔔',
    label: 'Notifications',
    disabled: true,
  },
};

export const HighBadgeCount: Story = {
  args: {
    icon: '💬',
    label: 'Chat',
    badgeCount: 99,
    onClick: () => alert('Clicked!'),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <HeaderActionButton icon="💬" label="Chat" onClick={() => {}} />
      <HeaderActionButton icon="🏆" label="Stats" onClick={() => {}} />
      <HeaderActionButton icon="🏅" label="Achievements" onClick={() => {}} />
      <HeaderActionButton icon="👥" label="Friends" badgeCount={3} onClick={() => {}} />
      <HeaderActionButton icon="🔔" label="Notifications" badgeCount={12} onClick={() => {}} />
      <HeaderActionButton icon="⚙️" label="Settings" onClick={() => {}} />
    </div>
  ),
};

export const MobileStyle: Story = {
  render: () => (
    <div className="flex flex-wrap gap-1 p-4">
      <HeaderActionButton icon="💬" size="sm" className="p-1.5" badgeCount={2} onClick={() => {}} />
      <HeaderActionButton icon="🏆" size="sm" className="p-1.5" onClick={() => {}} />
      <HeaderActionButton icon="🏅" size="sm" className="p-1.5" onClick={() => {}} />
      <HeaderActionButton icon="👥" size="sm" className="p-1.5" onClick={() => {}} />
      <HeaderActionButton icon="⚙️" size="sm" className="p-1.5" onClick={() => {}} />
    </div>
  ),
};
