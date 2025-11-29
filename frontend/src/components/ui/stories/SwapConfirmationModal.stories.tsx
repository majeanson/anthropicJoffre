import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SwapConfirmationModal } from '../../SwapConfirmationModal';

/**
 * Wrapper component to handle state for interactive stories
 */
function InteractiveSwapModal(props: {
  fromPlayerName: string;
  willChangeTeams: boolean;
  initialOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(props.initialOpen ?? true);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Open Swap Request
      </button>
      <SwapConfirmationModal
        isOpen={isOpen}
        fromPlayerName={props.fromPlayerName}
        willChangeTeams={props.willChangeTeams}
        onAccept={() => {
          alert('Swap accepted!');
          setIsOpen(false);
        }}
        onReject={() => {
          alert('Swap rejected');
          setIsOpen(false);
        }}
      />
    </>
  );
}

const meta: Meta<typeof InteractiveSwapModal> = {
  title: 'Game/SwapConfirmationModal',
  component: InteractiveSwapModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InteractiveSwapModal>;

// Standard swap request (same team)
export const SameTeam: Story = {
  args: {
    fromPlayerName: 'Alice',
    willChangeTeams: false,
    initialOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard swap request from a teammate - position changes but team stays the same',
      },
    },
  },
};

// Swap that changes teams
export const CrossTeam: Story = {
  args: {
    fromPlayerName: 'Bob',
    willChangeTeams: true,
    initialOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Swap request from opposing team - shows warning that accepting will change your team',
      },
    },
  },
};

// Long player name
export const LongName: Story = {
  args: {
    fromPlayerName: 'SuperLongPlayerName123',
    willChangeTeams: false,
    initialOpen: true,
  },
};

// Closed state (for demo)
export const ClosedState: Story = {
  args: {
    fromPlayerName: 'Charlie',
    willChangeTeams: false,
    initialOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the button to open the modal',
      },
    },
  },
};
