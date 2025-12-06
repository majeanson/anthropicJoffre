/**
 * GameTooltip Stories
 * Storybook stories for the GameTooltip component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GameTooltip, GameTooltipTrigger } from './GameTooltip';

const meta: Meta<typeof GameTooltip> = {
  title: 'UI/GameTooltip',
  component: GameTooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A toggle-based tooltip/half-modal for in-game information.

**Behavior:**
- **Mobile**: Displays as a bottom sheet / half-modal
- **Desktop**: Displays centered in viewport

**Use cases:**
- Move suggestions (beginner mode)
- Bot thinking indicators
- Any in-game contextual information

**Features:**
- Click to toggle (not hover)
- Closes on click outside or Escape
- High z-index (10500) to appear above game elements
- Gradient variants for different contexts
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GameTooltip>;

// Interactive wrapper for controlled state
function InteractiveWrapper({
  variant = 'info',
  title = 'Suggestion',
  icon = '💡',
  children,
}: {
  variant?: 'info' | 'success' | 'warning' | 'bot';
  title?: string;
  icon?: string;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <GameTooltipTrigger
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        icon={icon}
        label={`Toggle ${title.toLowerCase()}`}
      />

      <GameTooltip
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        icon={icon}
        variant={variant}
      >
        {children}
      </GameTooltip>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        Click the button above to toggle the tooltip
      </p>
    </div>
  );
}

/**
 * Move suggestion tooltip for beginner mode
 */
export const MoveSuggestion: Story = {
  render: () => (
    <InteractiveWrapper variant="success" title="Suggested Move" icon="💡">
      <div className="space-y-3">
        <div className="text-lg font-bold">Play: 7 🔴</div>
        <p className="text-sm">
          This is the highest card you can play that still follows suit. It gives you a good chance
          of winning this trick.
        </p>
        <div className="pt-2 border-t border-white/20">
          <div className="text-xs font-semibold mb-1 flex items-center gap-1">
            <span>💭</span>
            <span>Alternative:</span>
          </div>
          <p className="text-xs">You could also play 3 🔴 to save your high card for later.</p>
        </div>
      </div>
    </InteractiveWrapper>
  ),
};

/**
 * Bot thinking indicator
 */
export const BotThinking: Story = {
  render: () => (
    <InteractiveWrapper variant="bot" title="Bot Thinking" icon="🤖">
      <div className="space-y-2">
        <div className="text-sm font-medium">Claude (Hard)</div>
        <p className="text-base font-bold">Analyzing opponent's remaining cards...</p>
        <p className="text-sm text-white/80">
          Considering trump conservation strategy for endgame.
        </p>
      </div>
    </InteractiveWrapper>
  ),
};

/**
 * Info variant
 */
export const InfoVariant: Story = {
  render: () => (
    <InteractiveWrapper variant="info" title="Game Info" icon="ℹ️">
      <p className="text-sm">
        This is an informational tooltip with the default blue theme. Great for general game
        information and tips.
      </p>
    </InteractiveWrapper>
  ),
};

/**
 * Warning variant
 */
export const WarningVariant: Story = {
  render: () => (
    <InteractiveWrapper variant="warning" title="Warning" icon="⚠️">
      <p className="text-sm">
        You must follow suit! You have red cards in your hand but are trying to play a different
        color.
      </p>
    </InteractiveWrapper>
  ),
};

/**
 * Multiple tooltips demo
 */
export const MultipleTooltips: Story = {
  render: () => {
    const [suggestionOpen, setSuggestionOpen] = useState(false);
    const [botOpen, setBotOpen] = useState(false);

    return (
      <div className="flex gap-8 items-center">
        <div className="flex flex-col items-center gap-2">
          <GameTooltipTrigger
            isOpen={suggestionOpen}
            onToggle={() => {
              setSuggestionOpen(!suggestionOpen);
              setBotOpen(false);
            }}
            icon="💡"
            label="Toggle suggestion"
          />
          <span className="text-xs text-gray-500">Suggestion</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <GameTooltipTrigger
            isOpen={botOpen}
            onToggle={() => {
              setBotOpen(!botOpen);
              setSuggestionOpen(false);
            }}
            icon="🤖"
            label="Toggle bot thinking"
          />
          <span className="text-xs text-gray-500">Bot</span>
        </div>

        <GameTooltip
          isOpen={suggestionOpen}
          onClose={() => setSuggestionOpen(false)}
          title="Suggested Move"
          icon="💡"
          variant="success"
        >
          <div className="text-lg font-bold mb-2">Play: 10 🔵</div>
          <p className="text-sm">Lead with your strongest blue card to control the trick.</p>
        </GameTooltip>

        <GameTooltip
          isOpen={botOpen}
          onClose={() => setBotOpen(false)}
          title="Bot Analysis"
          icon="🤖"
          variant="bot"
        >
          <p className="text-sm font-medium mb-1">Easy Bot</p>
          <p className="text-base font-bold">Playing a random valid card...</p>
        </GameTooltip>
      </div>
    );
  },
};

/**
 * Always open (for visual testing)
 */
export const AlwaysOpen: Story = {
  render: () => (
    <div className="h-[400px] flex items-center justify-center">
      <GameTooltip
        isOpen={true}
        onClose={() => {}}
        title="Always Visible"
        icon="👀"
        variant="success"
      >
        <p className="text-sm">
          This tooltip is always visible for visual testing purposes. In production, it would be
          controlled by user interaction.
        </p>
      </GameTooltip>
    </div>
  ),
};
