/**
 * BotThinkingIndicator Component Stories
 *
 * Toggle button for bot thinking insights during gameplay.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BotThinkingIndicator } from '../../BotThinkingIndicator';

// Interactive wrapper component for controlled stories
function InteractiveBotThinking(props: {
  botName?: string;
  action?: string;
  initialOpen?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(props.initialOpen ?? false);
  return (
    <BotThinkingIndicator
      botName={props.botName ?? 'Bot Alice'}
      action={props.action ?? 'Considering trump play...'}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      position={props.position ?? 'top'}
    />
  );
}

const meta: Meta<typeof InteractiveBotThinking> = {
  title: 'Game/BotThinkingIndicator',
  component: InteractiveBotThinking,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Bot Thinking Indicator

A toggle button that shows what a bot is thinking during gameplay. Adapts to the selected skin theme.

## Features
- **Tooltip positions**: Top, bottom, left, right
- **Interactive toggle**: Click to show/hide thoughts
- **Bot identification**: Shows bot name and current action

Use the skin selector in the toolbar to see how the indicator adapts to different themes.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    botName: {
      control: 'text',
      description: 'Name of the bot',
    },
    action: {
      control: 'text',
      description: 'Current action/thought the bot is considering',
    },
    initialOpen: {
      control: 'boolean',
      description: 'Whether the tooltip starts visible',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position of tooltip relative to button',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-20 flex items-center justify-center min-h-[300px] bg-skin-primary">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InteractiveBotThinking>;

// Default closed state
export const Default: Story = {
  args: {
    botName: 'Bot Alice',
    action: 'Considering trump play...',
    initialOpen: false,
    position: 'top',
  },
};

// Open state showing tooltip
export const Open: Story = {
  args: {
    botName: 'Bot Alice',
    action: 'Playing Red 7 to follow suit',
    initialOpen: true,
    position: 'top',
  },
};

// Different bot names
export const BotBob: Story = {
  args: {
    botName: 'Bot Bob',
    action: 'Saving trump for later...',
    initialOpen: true,
    position: 'top',
  },
};

export const BotCharlie: Story = {
  args: {
    botName: 'Bot Charlie',
    action: 'Discarding low card',
    initialOpen: true,
    position: 'top',
  },
};

// Different actions
export const ThinkingBet: Story = {
  args: {
    botName: 'Bot Alice',
    action: 'Betting 8 points',
    initialOpen: true,
    position: 'top',
  },
};

export const ThinkingSkip: Story = {
  args: {
    botName: 'Bot Bob',
    action: 'Skipping bet - weak hand',
    initialOpen: true,
    position: 'top',
  },
};

export const ThinkingTrump: Story = {
  args: {
    botName: 'Bot Charlie',
    action: 'Using trump to win trick!',
    initialOpen: true,
    position: 'top',
  },
};

// Position bottom
export const PositionBottom: Story = {
  args: {
    botName: 'Bot Alice',
    action: 'Analyzing hand strength...',
    initialOpen: true,
    position: 'bottom',
  },
};

// Position left
export const PositionLeft: Story = {
  args: {
    botName: 'Bot Bob',
    action: 'Looking at played cards',
    initialOpen: true,
    position: 'left',
  },
};

// Position right
export const PositionRight: Story = {
  args: {
    botName: 'Bot Charlie',
    action: 'Counting remaining cards',
    initialOpen: true,
    position: 'right',
  },
};

// All positions showcase
export const AllPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-20 p-10 bg-skin-primary rounded-xl border border-skin-default">
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Top</span>
        <InteractiveBotThinking
          botName="Top Bot"
          action="Tooltip above"
          initialOpen={true}
          position="top"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Bottom</span>
        <InteractiveBotThinking
          botName="Bottom Bot"
          action="Tooltip below"
          initialOpen={true}
          position="bottom"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Left</span>
        <InteractiveBotThinking
          botName="Left Bot"
          action="Tooltip left"
          initialOpen={true}
          position="left"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Right</span>
        <InteractiveBotThinking
          botName="Right Bot"
          action="Tooltip right"
          initialOpen={true}
          position="right"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Multiple bots scenario
export const MultipleBots: Story = {
  render: () => (
    <div className="flex gap-8 p-10 bg-skin-primary rounded-xl border border-skin-default">
      <div className="flex flex-col items-center gap-2">
        <InteractiveBotThinking
          botName="Bot Alice"
          action="Waiting..."
          initialOpen={false}
          position="top"
        />
        <span className="text-xs text-skin-muted">Alice</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InteractiveBotThinking
          botName="Bot Bob"
          action="Thinking hard..."
          initialOpen={true}
          position="top"
        />
        <span className="text-xs text-skin-accent">Bob (active)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <InteractiveBotThinking
          botName="Bot Charlie"
          action="Waiting..."
          initialOpen={false}
          position="top"
        />
        <span className="text-xs text-skin-muted">Charlie</span>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
