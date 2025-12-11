/**
 * UICard Component Stories
 * Sprint 21 - Reusable card container component
 *
 * Comprehensive showcase of card variants, sizes, gradients, and interactive states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UICard } from '../UICard';

const meta = {
  title: 'UI/UICard',
  component: UICard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Flexible card container component with multiple visual styles. Supports default, elevated, bordered, and gradient variants with full dark mode support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'bordered', 'gradient'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card size (affects default padding)',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Override padding (overrides size-based padding)',
    },
    gradient: {
      control: 'select',
      options: ['team1', 'team2', 'success', 'warning', 'error', 'info', 'primary'],
      description: 'Gradient color scheme (only applies when variant="gradient")',
    },
    onClick: {
      action: 'clicked',
      description: 'Optional click handler (makes card interactive)',
    },
  },
} satisfies Meta<typeof UICard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample content component for consistent examples
const SampleContent = () => (
  <div>
    <h3 className="text-lg font-semibold text-skin-primary mb-2">Card Title</h3>
    <p className="text-skin-secondary">
      This is sample card content. Cards can contain any React elements including text, images,
      buttons, and more.
    </p>
  </div>
);

// Variant Stories
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default card with white/dark background and subtle shadow (shadow-md)',
      },
    },
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    size: 'md',
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Elevated card with higher shadow (shadow-lg) for emphasis',
      },
    },
  },
};

export const Bordered: Story = {
  args: {
    variant: 'bordered',
    size: 'md',
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bordered card with 2px border and subtle shadow',
      },
    },
  },
};

export const Team1Gradient: Story = {
  args: {
    variant: 'gradient',
    gradient: 'team1',
    size: 'md',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-orange-300 mb-2">Team 1</h3>
        <p className="text-orange-200">
          Orange gradient card for Team 1 content
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Team 1 (Orange) gradient card',
      },
    },
  },
};

export const Team2Gradient: Story = {
  args: {
    variant: 'gradient',
    gradient: 'team2',
    size: 'md',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-purple-300 mb-2">Team 2</h3>
        <p className="text-purple-200">
          Purple gradient card for Team 2 content
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Team 2 (Purple) gradient card',
      },
    },
  },
};

// Size Stories
export const AllSizes: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      <UICard variant="default" size="sm">
        <div>
          <h4 className="font-semibold text-skin-primary">Small (p-3)</h4>
          <p className="text-sm text-skin-secondary">Compact card</p>
        </div>
      </UICard>
      <UICard variant="default" size="md">
        <div>
          <h4 className="font-semibold text-skin-primary">Medium (p-4)</h4>
          <p className="text-sm text-skin-secondary">Default size card</p>
        </div>
      </UICard>
      <UICard variant="default" size="lg">
        <div>
          <h4 className="font-semibold text-skin-primary">Large (p-6)</h4>
          <p className="text-sm text-skin-secondary">Spacious card</p>
        </div>
      </UICard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available sizes: sm (p-3), md (p-4), lg (p-6)',
      },
    },
  },
};

// Padding Override
export const NoPadding: Story = {
  args: {
    variant: 'default',
    padding: 'none',
    children: (
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Custom Layout</h3>
        <p>Card with padding="none" allows for custom internal padding and layouts</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with no padding (p-0) for custom layouts and full-width content',
      },
    },
  },
};

// Interactive Card
export const ClickableCard: Story = {
  args: {
    variant: 'elevated',
    size: 'md',
    onClick: () => alert('Card clicked!'),
    children: (
      <div>
        <h3 className="text-lg font-semibold text-skin-primary mb-2">
          Interactive Card
        </h3>
        <p className="text-skin-secondary mb-2">
          Click me! This card has hover effects and is interactive.
        </p>
        <span className="text-blue-400 text-sm">
          Hover: scale + shadow | Active: slight shrink
        </span>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with onClick handler showing hover and active states',
      },
    },
  },
};

// Variant Showcase
export const VariantShowcase: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UICard variant="default">
          <h4 className="font-semibold text-skin-primary mb-1">Default</h4>
          <p className="text-sm text-skin-secondary">Standard card style</p>
        </UICard>
        <UICard variant="elevated">
          <h4 className="font-semibold text-skin-primary mb-1">Elevated</h4>
          <p className="text-sm text-skin-secondary">Higher shadow</p>
        </UICard>
        <UICard variant="bordered">
          <h4 className="font-semibold text-skin-primary mb-1">Bordered</h4>
          <p className="text-sm text-skin-secondary">With border</p>
        </UICard>
        <UICard variant="gradient" gradient="primary">
          <h4 className="font-semibold text-indigo-300 mb-1">Gradient</h4>
          <p className="text-sm text-indigo-200">Semi-transparent</p>
        </UICard>
      </div>
      <p className="text-sm text-skin-muted text-center">
        Use the skin selector in Storybook toolbar to see all variants adapt
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All card variants demonstrating skin theme support',
      },
    },
  },
};

// All Gradient Colors
export const AllGradients: Story = {
  args: { children: null },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UICard variant="gradient" gradient="team1">
        <h4 className="font-semibold text-orange-300 mb-1">Team 1</h4>
        <p className="text-sm text-orange-200">Orange gradient</p>
      </UICard>
      <UICard variant="gradient" gradient="team2">
        <h4 className="font-semibold text-purple-300 mb-1">Team 2</h4>
        <p className="text-sm text-purple-200">Purple gradient</p>
      </UICard>
      <UICard variant="gradient" gradient="success">
        <h4 className="font-semibold text-green-300 mb-1">Success</h4>
        <p className="text-sm text-green-200">Green gradient</p>
      </UICard>
      <UICard variant="gradient" gradient="warning">
        <h4 className="font-semibold text-yellow-300 mb-1">Warning</h4>
        <p className="text-sm text-yellow-200">Yellow gradient</p>
      </UICard>
      <UICard variant="gradient" gradient="error">
        <h4 className="font-semibold text-red-300 mb-1">Error</h4>
        <p className="text-sm text-red-200">Red gradient</p>
      </UICard>
      <UICard variant="gradient" gradient="info">
        <h4 className="font-semibold text-blue-300 mb-1">Info</h4>
        <p className="text-sm text-blue-200">Blue gradient</p>
      </UICard>
      <UICard variant="gradient" gradient="primary">
        <h4 className="font-semibold text-indigo-300 mb-1">Primary</h4>
        <p className="text-sm text-indigo-200">Indigo gradient</p>
      </UICard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available gradient colors with design token integration',
      },
    },
  },
};

// Real-world Examples
export const RealWorldExamples: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4 max-w-2xl">
      {/* User Profile Card */}
      <UICard variant="elevated">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
          <div className="flex-1">
            <h4 className="font-semibold text-skin-primary">John Doe</h4>
            <p className="text-sm text-skin-secondary">john@example.com</p>
          </div>
        </div>
      </UICard>

      {/* Stats Card */}
      <UICard variant="gradient" gradient="success">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-200">+24%</div>
          <p className="text-sm text-green-300 mt-1">Growth this month</p>
        </div>
      </UICard>

      {/* Notification Card */}
      <UICard variant="bordered" size="sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <h5 className="font-medium text-skin-primary">New message</h5>
            <p className="text-sm text-skin-secondary">You have 3 unread messages</p>
          </div>
        </div>
      </UICard>

      {/* Team Score Card */}
      <UICard variant="gradient" gradient="team1" onClick={() => {}}>
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-orange-300">Team 1</h4>
            <p className="text-sm text-orange-200">Orange Team</p>
          </div>
          <div className="text-3xl font-bold text-orange-200">28</div>
        </div>
      </UICard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples: profile cards, stats, notifications, and team scores',
      },
    },
  },
};
