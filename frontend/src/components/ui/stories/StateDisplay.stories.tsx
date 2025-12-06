/**
 * StateDisplay Component Stories
 * Comprehensive Storybook stories for LoadingState, EmptyState, ErrorState, and DataState
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LoadingState, EmptyState, ErrorState, DataState } from '../StateDisplay';

// ============================================
// LoadingState Stories
// ============================================

const loadingMeta = {
  title: 'UI/StateDisplay/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'white', 'gray'],
    },
    card: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof LoadingState>;

export default loadingMeta;
type LoadingStory = StoryObj<typeof loadingMeta>;

export const Default: LoadingStory = {
  args: {
    message: 'Loading...',
  },
};

export const CustomMessage: LoadingStory = {
  args: {
    message: 'Loading game data...',
    size: 'lg',
  },
};

export const NoMessage: LoadingStory = {
  args: {
    message: undefined,
  },
};

export const InCard: LoadingStory = {
  args: {
    message: 'Loading matches...',
    card: true,
  },
};

export const SmallSize: LoadingStory = {
  args: {
    message: 'Loading...',
    size: 'sm',
  },
};

export const WhiteOnDark: LoadingStory = {
  args: {
    message: 'Loading...',
    color: 'white',
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

// ============================================
// EmptyState Stories
// ============================================

export const EmptyDefault: LoadingStory = {
  render: () => (
    <EmptyState title="No items found" description="Try adjusting your search or filters" />
  ),
};

export const EmptyWithAction: LoadingStory = {
  render: () => (
    <EmptyState
      icon="🎮"
      title="No games found"
      description="Create a new game to get started"
      action={{
        label: 'Create Game',
        onClick: () => alert('Creating game!'),
        variant: 'success',
      }}
    />
  ),
};

export const EmptyCompact: LoadingStory = {
  render: () => <EmptyState icon="📭" title="No messages" compact />,
};

export const EmptyInCard: LoadingStory = {
  render: () => (
    <div className="w-80">
      <EmptyState
        icon="👥"
        title="No friends yet"
        description="Search for players to add as friends"
        card
      />
    </div>
  ),
};

export const EmptyCustomIcon: LoadingStory = {
  render: () => (
    <EmptyState
      icon={<span className="text-purple-500">🏆</span>}
      title="No achievements unlocked"
      description="Play more games to earn achievements!"
    />
  ),
};

// ============================================
// ErrorState Stories
// ============================================

export const ErrorDefault: LoadingStory = {
  render: () => (
    <div className="w-96">
      <ErrorState message="Failed to load data. Please try again." />
    </div>
  ),
};

export const ErrorWithRetry: LoadingStory = {
  render: () => (
    <div className="w-96">
      <ErrorState message="Failed to load game history" onRetry={() => alert('Retrying...')} />
    </div>
  ),
};

export const ErrorWithCorrelationId: LoadingStory = {
  render: () => (
    <div className="w-96">
      <ErrorState
        message="An unexpected error occurred"
        correlationId="err-abc123-xyz789"
        onRetry={() => alert('Retrying...')}
      />
    </div>
  ),
};

export const ErrorRetrying: LoadingStory = {
  render: () => (
    <div className="w-96">
      <ErrorState message="Connection failed" onRetry={() => {}} isRetrying={true} />
    </div>
  ),
};

// ============================================
// DataState Stories (Combined)
// ============================================

export const DataStateLoading: LoadingStory = {
  render: () => (
    <DataState
      data={null}
      isLoading={true}
      emptyState={{
        icon: '🎮',
        title: 'No games',
      }}
      loadingMessage="Loading games..."
    >
      <div>Content would go here</div>
    </DataState>
  ),
};

export const DataStateEmpty: LoadingStory = {
  render: () => (
    <DataState
      data={[]}
      isLoading={false}
      emptyState={{
        icon: '🎮',
        title: 'No games found',
        description: 'Create a new game to get started',
        action: {
          label: 'Create Game',
          onClick: () => alert('Create!'),
        },
      }}
    >
      <div>Content would go here</div>
    </DataState>
  ),
};

export const DataStateError: LoadingStory = {
  render: () => (
    <DataState
      data={null}
      isLoading={false}
      error="Failed to fetch games"
      onRetry={() => alert('Retrying...')}
      emptyState={{
        icon: '🎮',
        title: 'No games',
      }}
    >
      <div>Content would go here</div>
    </DataState>
  ),
};

export const DataStateWithData: LoadingStory = {
  render: () => (
    <DataState
      data={['game1', 'game2', 'game3']}
      isLoading={false}
      emptyState={{
        icon: '🎮',
        title: 'No games',
      }}
    >
      <div className="space-y-2">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">Game 1</div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">Game 2</div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">Game 3</div>
      </div>
    </DataState>
  ),
};

// ============================================
// Interactive Demo
// ============================================

export const InteractiveDemo: LoadingStory = {
  render: function InteractiveDemoRender() {
    const [state, setState] = useState<'loading' | 'empty' | 'error' | 'data'>('loading');
    const mockData = ['Item 1', 'Item 2', 'Item 3'];

    return (
      <div className="space-y-4 w-96">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setState('loading')}
            className={`px-3 py-1 rounded ${state === 'loading' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Loading
          </button>
          <button
            onClick={() => setState('empty')}
            className={`px-3 py-1 rounded ${state === 'empty' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Empty
          </button>
          <button
            onClick={() => setState('error')}
            className={`px-3 py-1 rounded ${state === 'error' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Error
          </button>
          <button
            onClick={() => setState('data')}
            className={`px-3 py-1 rounded ${state === 'data' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Data
          </button>
        </div>

        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[200px]">
          <DataState
            data={state === 'data' ? mockData : state === 'empty' ? [] : null}
            isLoading={state === 'loading'}
            error={state === 'error' ? 'Something went wrong!' : null}
            onRetry={() => setState('loading')}
            emptyState={{
              icon: '📦',
              title: 'No items',
              description: 'Add some items to see them here',
            }}
            loadingMessage="Fetching items..."
          >
            <div className="space-y-2">
              {mockData.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700"
                >
                  ✅ {item}
                </div>
              ))}
            </div>
          </DataState>
        </div>
      </div>
    );
  },
};

// ============================================
// All States Showcase
// ============================================

export const AllStatesShowcase: LoadingStory = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">Loading States</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <LoadingState size="sm" message="Small" />
          </div>
          <div className="border rounded-lg p-4">
            <LoadingState size="md" message="Medium" />
          </div>
          <div className="border rounded-lg p-4">
            <LoadingState size="lg" message="Large" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">Empty States</h3>
        <div className="grid grid-cols-2 gap-4">
          <EmptyState
            icon="🎮"
            title="No games"
            description="Create a game to start playing"
            card
          />
          <EmptyState
            icon="👥"
            title="No friends"
            action={{
              label: 'Find Friends',
              onClick: () => {},
            }}
            card
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">Error States</h3>
        <div className="space-y-3">
          <ErrorState message="Simple error message" />
          <ErrorState message="Error with retry option" onRetry={() => {}} />
          <ErrorState
            message="Error with correlation ID"
            correlationId="err-12345"
            onRetry={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};
