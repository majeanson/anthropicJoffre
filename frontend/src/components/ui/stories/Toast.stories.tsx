/**
 * Toast Component Stories - Multi-Skin Edition
 *
 * Notification toasts with proper CSS variable support for all themes.
 * Switch skins using the paintbrush icon in the Storybook toolbar.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '../Toast';
import { useState } from 'react';

const meta = {
  title: 'UI/Toast',
  component: Toast,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Toast Component

Notification toasts with proper CSS variable support for all themes.

## Features
- **4 variants**: success, warning, error, info
- **Auto-dismiss** with progress bar
- **Manual close** button
- **Custom icons**
- **Slide-in animation**

## Multi-Skin Support
Switch skins using the paintbrush icon in the Storybook toolbar to preview
how the component looks across all available themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info'],
      description: 'Visual style variant',
    },
    autoDismiss: {
      control: 'number',
      description: 'Auto-dismiss after milliseconds (0 = no auto-dismiss)',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button',
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

// Success variant
export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    message: 'Quest completed successfully.',
    onClose: () => console.log('Toast closed'),
  },
};

export const SuccessSimple: Story = {
  args: {
    variant: 'success',
    message: 'Changes saved!',
    onClose: () => console.log('Toast closed'),
  },
};

// Warning variant
export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    message: 'Connection quality is low. Game may lag.',
    onClose: () => console.log('Toast closed'),
  },
};

// Error variant
export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    message: 'Failed to submit bet. Please try again.',
    onClose: () => console.log('Toast closed'),
  },
};

// Info variant
export const Info: Story = {
  args: {
    variant: 'info',
    title: 'New Feature',
    message: 'Check out the new daily quests system!',
    onClose: () => console.log('Toast closed'),
  },
};

// Auto-dismiss variants
export const AutoDismiss: Story = {
  args: {
    variant: 'success',
    message: 'This toast will auto-dismiss in 3 seconds',
    autoDismiss: 3000,
    onClose: () => console.log('Toast auto-dismissed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Toast with auto-dismiss after 3 seconds with progress bar',
      },
    },
  },
};

// No close button
export const NoCloseButton: Story = {
  args: {
    variant: 'info',
    message: 'This toast has no close button',
    showCloseButton: false,
    onClose: () => console.log('Toast closed'),
  },
};

// Custom icon
export const CustomIcon: Story = {
  args: {
    variant: 'success',
    title: 'Achievement Unlocked!',
    message: 'You won 10 games in a row',
    icon: <span>🏆</span>,
    onClose: () => console.log('Toast closed'),
  },
};

// Long message
export const LongMessage: Story = {
  args: {
    variant: 'info',
    title: 'Update Available',
    message:
      'A new version of the game is available with bug fixes, performance improvements, and new features. Please refresh the page to update.',
    onClose: () => console.log('Toast closed'),
  },
};

// All variants showcase
export const AllVariants: Story = {
  args: {
    message: 'Example message',
    onClose: () => console.log('Closed'),
  },
  render: () => {
    const [toasts, setToasts] = useState([
      { id: 1, variant: 'success' as const, message: 'Quest completed!' },
      { id: 2, variant: 'warning' as const, message: 'Low connection quality' },
      { id: 3, variant: 'error' as const, message: 'Failed to load game' },
      { id: 4, variant: 'info' as const, message: 'New feature available' },
    ]);

    return (
      <div className="space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            message={toast.message}
            onClose={() => setToasts(toasts.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All toast variants displayed together',
      },
    },
  },
};

// Interactive example with manual dismiss
export const Interactive: Story = {
  args: {
    message: 'Click the close button to dismiss',
    onClose: () => console.log('Closed'),
  },
  render: () => {
    const [showToast, setShowToast] = useState(true);

    return (
      <div className="space-y-4">
        {!showToast && (
          <button
            onClick={() => setShowToast(true)}
            className="px-4 py-2 bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded-lg hover:bg-blue-500/40"
          >
            Show Toast
          </button>
        )}
        {showToast && (
          <Toast
            variant="success"
            title="Interactive Toast"
            message="Click the close button to dismiss"
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive toast with show/hide button',
      },
    },
  },
};

// Quest-related toasts
export const QuestToasts: Story = {
  args: {
    message: 'Quest example',
    onClose: () => console.log('Closed'),
  },
  render: () => {
    const [toasts, setToasts] = useState([
      {
        id: 1,
        variant: 'success' as const,
        title: 'Quest Complete!',
        message: 'Play 5 Games - Reward: 100 points',
        icon: '📋',
      },
      {
        id: 2,
        variant: 'info' as const,
        title: 'Daily Bonus',
        message: 'Login streak: 7 days - Multiplier: 1.5x',
        icon: '🔥',
      },
      {
        id: 3,
        variant: 'success' as const,
        title: 'Reward Claimed!',
        message: 'Day 7 reward: 150 points',
        icon: '🎁',
      },
    ]);

    return (
      <div className="space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            icon={<span>{toast.icon}</span>}
            onClose={() => setToasts(toasts.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Quest-related toast notifications',
      },
    },
  },
};
