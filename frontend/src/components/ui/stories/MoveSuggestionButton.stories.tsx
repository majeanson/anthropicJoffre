/**
 * MoveSuggestionButton Component Stories
 * Toggle button for beginner mode move suggestions
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MoveSuggestionButton } from '../../MoveSuggestionButton';

// Interactive wrapper component for controlled stories
function InteractiveMoveSuggestion(props: {
  suggestion?: string;
  details?: string;
  alternatives?: string;
  initialOpen?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showTutorial?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(props.initialOpen ?? false);
  return (
    <MoveSuggestionButton
      suggestion={props.suggestion ?? 'Play the Red 7'}
      details={
        props.details ?? 'This card follows suit and has a good chance of winning the trick.'
      }
      alternatives={props.alternatives}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      position={props.position ?? 'bottom'}
      showTutorial={props.showTutorial ?? false}
    />
  );
}

const meta: Meta<typeof InteractiveMoveSuggestion> = {
  title: 'Game/MoveSuggestionButton',
  component: InteractiveMoveSuggestion,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A toggle button that shows move suggestions for beginner mode. Click to show/hide the suggestion tooltip.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    suggestion: {
      control: 'text',
      description: 'The main suggestion text',
    },
    details: {
      control: 'text',
      description: 'Detailed explanation of the suggestion',
    },
    alternatives: {
      control: 'text',
      description: 'Optional alternative moves',
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
    showTutorial: {
      control: 'boolean',
      description: 'Show first-time tutorial tooltip',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-20 flex items-center justify-center min-h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InteractiveMoveSuggestion>;

// Default closed state
export const Default: Story = {
  args: {
    suggestion: 'Play the Red 7',
    details: 'This card follows suit and has a good chance of winning the trick.',
    initialOpen: false,
    position: 'bottom',
  },
};

// Open state showing tooltip
export const Open: Story = {
  args: {
    suggestion: 'Play the Red 7',
    details: 'This card follows suit and has a good chance of winning the trick.',
    initialOpen: true,
    position: 'bottom',
  },
};

// With alternatives
export const WithAlternatives: Story = {
  args: {
    suggestion: 'Play the Brown 5',
    details: 'Trump card - guaranteed to win this trick.',
    alternatives: 'If you want to save trump, consider playing Red 3 instead.',
    initialOpen: true,
    position: 'bottom',
  },
};

// Position top
export const PositionTop: Story = {
  args: {
    suggestion: 'Play the Yellow 9',
    details: 'Highest card in your hand for this suit.',
    initialOpen: true,
    position: 'top',
  },
};

// Position left
export const PositionLeft: Story = {
  args: {
    suggestion: 'Play the Green 4',
    details: 'Safe discard when you cannot follow suit.',
    initialOpen: true,
    position: 'left',
  },
};

// Position right
export const PositionRight: Story = {
  args: {
    suggestion: 'Play the Brown 0',
    details: 'Special card - gives -2 points to trick winner!',
    initialOpen: true,
    position: 'right',
  },
};

// With tutorial tooltip
export const WithTutorial: Story = {
  args: {
    suggestion: 'Play the Red 7',
    details: 'This is your first suggestion!',
    initialOpen: false,
    showTutorial: true,
    position: 'bottom',
  },
};

// Long suggestion text
export const LongText: Story = {
  args: {
    suggestion: 'Play the Red 0 (Special +5 points card)',
    details:
      'This special card will give 5 bonus points to whoever wins this trick. Since your team is currently behind, winning this trick could help close the gap.',
    alternatives:
      'Alternatively, you could save this card for a later trick when you are more confident of winning.',
    initialOpen: true,
    position: 'bottom',
  },
};

// All positions showcase
export const AllPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-20 p-10">
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Top</span>
        <InteractiveMoveSuggestion
          suggestion="Position: Top"
          details="Tooltip appears above the button"
          initialOpen={true}
          position="top"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Bottom</span>
        <InteractiveMoveSuggestion
          suggestion="Position: Bottom"
          details="Tooltip appears below the button"
          initialOpen={true}
          position="bottom"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Left</span>
        <InteractiveMoveSuggestion
          suggestion="Position: Left"
          details="Tooltip appears to the left"
          initialOpen={true}
          position="left"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-skin-muted">Right</span>
        <InteractiveMoveSuggestion
          suggestion="Position: Right"
          details="Tooltip appears to the right"
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
