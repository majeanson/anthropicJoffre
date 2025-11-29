/**
 * Alert Component Stories
 * Comprehensive Storybook stories for the Alert component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../Alert';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error', 'neutral'],
      description: 'Alert variant',
    },
    dismissible: {
      control: 'boolean',
      description: 'Show dismiss button',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Variants
export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully!',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your settings before continuing.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'An error occurred. Please try again.',
  },
};

export const Neutral: Story = {
  args: {
    variant: 'neutral',
    children: 'This is a neutral notification message.',
  },
};

// With Title
export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Did you know?',
    children: 'You can customize your game settings at any time.',
  },
};

export const ErrorWithTitle: Story = {
  args: {
    variant: 'error',
    title: 'Login Failed',
    children: 'Invalid username or password. Please check your credentials and try again.',
  },
};

export const SuccessWithTitle: Story = {
  args: {
    variant: 'success',
    title: 'Game Created!',
    children: 'Share the game code with your friends to start playing.',
  },
};

export const WarningWithTitle: Story = {
  args: {
    variant: 'warning',
    title: 'Connection Unstable',
    children: 'Your connection appears to be slow. This may affect gameplay.',
  },
};

// Dismissible
export const Dismissible: Story = {
  args: {
    variant: 'success',
    children: 'Click the X to dismiss this alert.',
    dismissible: true,
    onDismiss: () => console.log('Alert dismissed'),
  },
};

export const DismissibleWithTitle: Story = {
  args: {
    variant: 'info',
    title: 'New Feature',
    children: 'We\'ve added dark mode! Try it in settings.',
    dismissible: true,
    onDismiss: () => console.log('Alert dismissed'),
  },
};

// Custom Icon
export const CustomIcon: Story = {
  args: {
    variant: 'info',
    icon: <span>🎮</span>,
    title: 'Game Tip',
    children: 'Remember to follow suit if you have a matching card!',
  },
};

export const TrophyIcon: Story = {
  args: {
    variant: 'success',
    icon: <span>🏆</span>,
    title: 'Achievement Unlocked!',
    children: 'You\'ve won 10 games in a row!',
  },
};

// Long Content
export const LongContent: Story = {
  args: {
    variant: 'info',
    title: 'Game Rules',
    children: 'In this trick-taking game, players must follow suit if possible. The highest card of the led suit wins the trick, unless a trump card is played. Points are scored based on tricks won and special cards collected.',
  },
};

// Showcase: All Variants
export const AllVariants: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4">
      <Alert variant="info">
        Info: This is an informational message.
      </Alert>
      <Alert variant="success">
        Success: Operation completed successfully!
      </Alert>
      <Alert variant="warning">
        Warning: Please proceed with caution.
      </Alert>
      <Alert variant="error">
        Error: Something went wrong.
      </Alert>
      <Alert variant="neutral">
        Neutral: This is a neutral message.
      </Alert>
    </div>
  ),
};

// Showcase: All With Titles
export const AllWithTitles: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4">
      <Alert variant="info" title="Information">
        Here's some helpful information for you.
      </Alert>
      <Alert variant="success" title="Success!">
        Your action was completed successfully.
      </Alert>
      <Alert variant="warning" title="Warning">
        Please be aware of this important notice.
      </Alert>
      <Alert variant="error" title="Error">
        An error occurred while processing your request.
      </Alert>
      <Alert variant="neutral" title="Note">
        This is a general notification.
      </Alert>
    </div>
  ),
};

// Showcase: Dismissible Alerts
export const AllDismissible: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4">
      <Alert variant="info" title="Update Available" dismissible>
        A new version is available. Refresh to update.
      </Alert>
      <Alert variant="success" title="Saved" dismissible>
        Your preferences have been saved.
      </Alert>
      <Alert variant="warning" title="Session Expiring" dismissible>
        Your session will expire in 5 minutes.
      </Alert>
    </div>
  ),
};

// Showcase: Game Notifications
export const GameNotifications: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4">
      <Alert
        variant="info"
        icon={<span>🎯</span>}
        title="Your Turn"
      >
        It's your turn to play. Select a card to continue.
      </Alert>

      <Alert
        variant="success"
        icon={<span>🏆</span>}
        title="Trick Won!"
      >
        You won the trick and earned 6 points!
      </Alert>

      <Alert
        variant="warning"
        icon={<span>⏱️</span>}
        title="Time Running Low"
      >
        You have 10 seconds to make your move.
      </Alert>

      <Alert
        variant="error"
        icon={<span>❌</span>}
        title="Invalid Move"
      >
        You must follow suit if you have a matching card.
      </Alert>
    </div>
  ),
};

// Showcase: System Messages
export const SystemMessages: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4">
      <Alert
        variant="warning"
        icon={<span>🔌</span>}
        title="Connection Lost"
        dismissible
      >
        Attempting to reconnect... Please wait.
      </Alert>

      <Alert
        variant="success"
        icon={<span>✓</span>}
        title="Reconnected"
        dismissible
      >
        Connection restored. You're back in the game!
      </Alert>

      <Alert
        variant="info"
        icon={<span>👥</span>}
        title="Player Joined"
        dismissible
      >
        Alice has joined the game lobby.
      </Alert>
    </div>
  ),
};

// Showcase: Form Validation
export const FormValidation: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="space-y-4 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">
        Create Account
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-umber-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg"
            defaultValue="ab"
          />
        </div>

        <Alert variant="error">
          Username must be at least 3 characters long.
        </Alert>

        <div>
          <label className="block text-sm font-medium text-umber-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border rounded-lg"
            defaultValue="user@example.com"
          />
        </div>

        <Alert variant="success" icon={<span>✓</span>}>
          Email format is valid.
        </Alert>
      </div>
    </div>
  ),
};

// Showcase: Inline Usage
export const InlineAlerts: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
      <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-4">
        Betting Phase
      </h3>

      <Alert variant="info" className="mb-4">
        Place your bet. Minimum is 7 points.
      </Alert>

      <div className="flex gap-2 mb-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">7</button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">8</button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">9</button>
      </div>

      <Alert variant="warning">
        You must raise the bet. Current highest is 8.
      </Alert>
    </div>
  ),
};
