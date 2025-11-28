/**
 * Skeleton Component Stories
 * Sprint 21 - Loading state skeletons showcase
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  StatsGridSkeleton,
  TextBlockSkeleton,
  AvatarTextSkeleton,
  ButtonSkeleton,
} from '../Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: 'text',
      description: 'Skeleton width (CSS value)',
    },
    height: {
      control: 'text',
      description: 'Skeleton height (CSS value)',
    },
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
      description: 'Visual variant',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base skeleton variants
export const Rectangular: Story = {
  args: {
    width: '300px',
    height: '40px',
    variant: 'rectangular',
  },
};

export const Circular: Story = {
  args: {
    width: '48px',
    height: '48px',
    variant: 'circular',
  },
};

export const Text: Story = {
  args: {
    width: '200px',
    height: '16px',
    variant: 'text',
  },
};

// Table skeleton
export const Table: Story = {
  render: () => <TableSkeleton rows={5} columns={3} showHeader={true} />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for loading tables (leaderboard, stats)',
      },
    },
  },
};

export const TableNoHeader: Story = {
  render: () => <TableSkeleton rows={3} columns={4} showHeader={false} />,
  parameters: {
    docs: {
      description: {
        story: 'Table skeleton without header',
      },
    },
  },
};

// Card skeleton
export const Cards: Story = {
  render: () => <CardSkeleton count={3} hasAvatar={true} />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for loading card components with avatars',
      },
    },
  },
};

export const CardsNoAvatar: Story = {
  render: () => <CardSkeleton count={2} hasAvatar={false} />,
  parameters: {
    docs: {
      description: {
        story: 'Card skeleton without avatars',
      },
    },
  },
};

// List skeleton
export const List: Story = {
  render: () => <ListSkeleton count={5} hasAvatar={true} hasSecondaryText={true} />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for loading lists (messages, conversations)',
      },
    },
  },
};

export const ListSimple: Story = {
  render: () => <ListSkeleton count={3} hasAvatar={false} hasSecondaryText={false} />,
  parameters: {
    docs: {
      description: {
        story: 'Simple list skeleton without avatar and secondary text',
      },
    },
  },
};

// Stats grid skeleton
export const StatsGrid: Story = {
  render: () => <StatsGridSkeleton columns={2} rows={4} />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for loading stats grids',
      },
    },
  },
};

export const StatsGrid3Columns: Story = {
  render: () => <StatsGridSkeleton columns={3} rows={3} />,
  parameters: {
    docs: {
      description: {
        story: 'Stats grid with 3 columns',
      },
    },
  },
};

// Text block skeleton
export const TextBlock: Story = {
  render: () => <TextBlockSkeleton lines={3} />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for loading text paragraphs',
      },
    },
  },
};

export const TextBlockLong: Story = {
  render: () => <TextBlockSkeleton lines={5} />,
  parameters: {
    docs: {
      description: {
        story: 'Longer text block skeleton',
      },
    },
  },
};

// Avatar with text skeleton
export const AvatarText: Story = {
  render: () => <AvatarTextSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for avatar with text (player profiles)',
      },
    },
  },
};

// Button skeleton
export const Button: Story = {
  render: () => <ButtonSkeleton width="120px" />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton for loading buttons',
      },
    },
  },
};

export const ButtonFullWidth: Story = {
  render: () => <ButtonSkeleton fullWidth={true} />,
  parameters: {
    docs: {
      description: {
        story: 'Full width button skeleton',
      },
    },
  },
};

// Real-world examples
export const LeaderboardLoading: Story = {
  render: () => (
    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl">
      <div className="mb-4">
        <Skeleton width="200px" height="28px" className="mb-2" />
        <Skeleton width="300px" height="16px" />
      </div>
      <TableSkeleton rows={10} columns={4} showHeader={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete leaderboard loading state',
      },
    },
  },
};

export const PlayerStatsLoading: Story = {
  render: () => (
    <div className="bg-gray-800 rounded-lg p-6 max-w-3xl space-y-6">
      {/* Player header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
        <Skeleton variant="circular" width="80px" height="80px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="200px" height="28px" />
          <Skeleton width="150px" height="16px" />
        </div>
      </div>

      {/* Stats grid */}
      <StatsGridSkeleton columns={3} rows={2} />

      {/* Recent games */}
      <div>
        <Skeleton width="150px" height="24px" className="mb-4" />
        <TableSkeleton rows={5} columns={3} showHeader={false} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Player statistics page loading state',
      },
    },
  },
};

export const MessagesLoading: Story = {
  render: () => (
    <div className="bg-gray-800 rounded-lg p-4 max-w-md">
      <div className="mb-4">
        <Skeleton width="150px" height="24px" />
      </div>
      <ListSkeleton count={8} hasAvatar={true} hasSecondaryText={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Messages/conversations list loading state',
      },
    },
  },
};

export const QuestPanelLoading: Story = {
  render: () => (
    <div className="bg-gray-800 rounded-lg p-6 max-w-md space-y-4">
      <Skeleton width="150px" height="28px" className="mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton width="120px" height="20px" />
            <Skeleton width="60px" height="24px" variant="text" />
          </div>
          <Skeleton width="100%" height="8px" variant="rectangular" />
          <Skeleton width="100px" height="36px" />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Daily quests panel loading state',
      },
    },
  },
};

export const CalendarLoading: Story = {
  render: () => (
    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl space-y-4">
      <Skeleton width="200px" height="28px" className="mb-4" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <Skeleton key={i} width="100%" height="60px" variant="rectangular" />
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Rewards calendar loading state',
      },
    },
  },
};
