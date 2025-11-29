/**
 * UIDivider Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UIDivider } from '../UIDivider';

const meta: Meta<typeof UIDivider> = {
  title: 'UI/Layout/UIDivider',
  component: UIDivider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="w-64">
      <p className="text-gray-700 dark:text-gray-300 mb-4">Content above</p>
      <UIDivider />
      <p className="text-gray-700 dark:text-gray-300 mt-4">Content below</p>
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="w-64 space-y-8">
      <div>
        <p className="text-xs text-gray-500 mb-2">Small</p>
        <UIDivider size="sm" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Medium</p>
        <UIDivider size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Large</p>
        <UIDivider size="lg" />
      </div>
    </div>
  ),
};

export const Variants: StoryObj = {
  render: () => (
    <div className="w-64 space-y-8">
      <div>
        <p className="text-xs text-gray-500 mb-2">Solid</p>
        <UIDivider variant="solid" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Dashed</p>
        <UIDivider variant="dashed" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Dotted</p>
        <UIDivider variant="dotted" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Gradient</p>
        <UIDivider variant="gradient" />
      </div>
    </div>
  ),
};

export const Colors: StoryObj = {
  render: () => (
    <div className="w-64 space-y-8">
      <div>
        <p className="text-xs text-gray-500 mb-2">Default</p>
        <UIDivider color="default" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Muted</p>
        <UIDivider color="muted" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Amber</p>
        <UIDivider color="amber" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Gray</p>
        <UIDivider color="gray" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Team 1 (Orange)</p>
        <UIDivider color="team1" size="md" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Team 2 (Purple)</p>
        <UIDivider color="team2" size="md" />
      </div>
    </div>
  ),
};

export const WithLabel: StoryObj = {
  render: () => (
    <div className="w-80">
      <p className="text-gray-700 dark:text-gray-300 mb-4">Content above</p>
      <UIDivider label="OR" />
      <p className="text-gray-700 dark:text-gray-300 mt-4">Content below</p>
    </div>
  ),
};

export const GradientVariants: StoryObj = {
  render: () => (
    <div className="w-64 space-y-8">
      <div>
        <p className="text-xs text-gray-500 mb-2">Default Gradient</p>
        <UIDivider variant="gradient" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Amber Gradient</p>
        <UIDivider variant="gradient" color="amber" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Team 1 Gradient</p>
        <UIDivider variant="gradient" color="team1" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2">Team 2 Gradient</p>
        <UIDivider variant="gradient" color="team2" />
      </div>
    </div>
  ),
};

export const SpacingOptions: StoryObj = {
  render: () => (
    <div className="w-64 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div>
        <p className="text-xs text-gray-500">None spacing</p>
        <UIDivider spacing="none" />
        <p className="text-xs text-gray-500">Content</p>
      </div>
      <div className="mt-4">
        <p className="text-xs text-gray-500">Small spacing</p>
        <UIDivider spacing="sm" />
        <p className="text-xs text-gray-500">Content</p>
      </div>
      <div className="mt-4">
        <p className="text-xs text-gray-500">Medium spacing (default)</p>
        <UIDivider spacing="md" />
        <p className="text-xs text-gray-500">Content</p>
      </div>
      <div className="mt-4">
        <p className="text-xs text-gray-500">Large spacing</p>
        <UIDivider spacing="lg" />
        <p className="text-xs text-gray-500">Content</p>
      </div>
    </div>
  ),
};

export const InSettingsPanel: StoryObj = {
  render: () => (
    <div className="w-80 p-4 bg-parchment-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Settings</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300">Sound</span>
          <span className="text-gray-500">On</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
          <span className="text-gray-500">Off</span>
        </div>
      </div>

      <UIDivider color="amber" />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300">Volume</span>
          <span className="text-gray-500">80%</span>
        </div>
      </div>

      <UIDivider label="Advanced" />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300">Debug Mode</span>
          <span className="text-gray-500">Off</span>
        </div>
      </div>
    </div>
  ),
};

export const VerticalDivider: StoryObj = {
  render: () => (
    <div className="flex items-center h-16 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <span className="text-gray-700 dark:text-gray-300">Left</span>
      <UIDivider orientation="vertical" size="md" spacing="md" className="h-8" />
      <span className="text-gray-700 dark:text-gray-300">Right</span>
    </div>
  ),
};
