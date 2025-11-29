/**
 * Modal Component Stories
 * Sprint 20 - Storybook Integration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'select',
      options: ['parchment', 'blue', 'purple', 'green', 'orange', 'red'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    showCloseButton: {
      control: 'boolean',
    },
    closeOnBackdrop: {
      control: 'boolean',
    },
    closeOnEscape: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle modal state
const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {args.children}
      </Modal>
    </div>
  );
};

export const Basic: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Basic Modal',
    children: (
      <div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This is a basic modal with default settings.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          You can close it by clicking the X button, clicking outside, or pressing ESC.
        </p>
      </div>
    ),
  },
};

export const WithSubtitle: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Modal with Subtitle',
    subtitle: 'This is a helpful subtitle',
    children: (
      <p className="text-gray-700 dark:text-gray-300">
        The subtitle provides additional context about the modal.
      </p>
    ),
  },
};

export const WithIcon: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Victory!',
    subtitle: 'Team 1 Wins!',
    icon: <span className="text-4xl">🏆</span>,
    theme: 'green',
    children: (
      <p className="text-gray-700 dark:text-gray-300">
        Congratulations on your victory!
      </p>
    ),
  },
};

export const WithFooter: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Confirm Action',
    children: (
      <p className="text-gray-700 dark:text-gray-300">
        Are you sure you want to proceed with this action?
      </p>
    ),
    footer: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </>
    ),
  },
};

export const BlueTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Blue Theme',
    icon: <span className="text-4xl">💬</span>,
    theme: 'blue',
    children: (
      <p className="text-gray-700 dark:text-gray-300">
        This modal uses the blue theme.
      </p>
    ),
  },
};

export const PurpleTheme: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Purple Theme',
    icon: <span className="text-4xl">👥</span>,
    theme: 'purple',
    children: (
      <p className="text-gray-700 dark:text-gray-300">
        This modal uses the purple theme.
      </p>
    ),
  },
};

export const SmallSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Small Modal',
    size: 'sm',
    children: (
      <p className="text-gray-700 dark:text-gray-300">
        This is a small modal.
      </p>
    ),
  },
};

export const LargeSize: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Large Modal',
    size: 'lg',
    children: (
      <div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This is a large modal with more content space.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Large modals are useful for displaying more complex content.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          They maintain readability while providing ample space for content.
        </p>
      </div>
    ),
  },
};

export const NoCloseButton: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'No Close Button',
    showCloseButton: false,
    children: (
      <div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This modal has no close button.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You can still close it by clicking outside or pressing ESC.
        </p>
        <Button variant="primary" onClick={() => {}}>
          Custom Close
        </Button>
      </div>
    ),
  },
};

export const NoBackdropClose: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'No Backdrop Close',
    closeOnBackdrop: false,
    children: (
      <p className="text-gray-700 dark:text-gray-300">
        This modal cannot be closed by clicking the backdrop.
        Use the X button or ESC key.
      </p>
    ),
  },
};
