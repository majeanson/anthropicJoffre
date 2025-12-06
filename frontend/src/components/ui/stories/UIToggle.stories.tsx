/**
 * UIToggle Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { UIToggle, UIToggleField } from '../UIToggle';

const meta: Meta<typeof UIToggle> = {
  title: 'UI/Form/UIToggle',
  component: UIToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

// Use a wrapper for interactive stories
function ToggleWrapper(props: {
  enabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'blue' | 'amber' | 'purple';
  disabled?: boolean;
  label?: string;
}) {
  const [enabled, setEnabled] = useState(props.enabled ?? false);
  return (
    <UIToggle
      enabled={enabled}
      onChange={setEnabled}
      size={props.size}
      color={props.color}
      disabled={props.disabled}
      label={props.label}
    />
  );
}

export const Default: StoryObj = {
  render: () => <ToggleWrapper label="Toggle" />,
};

export const Enabled: StoryObj = {
  render: () => <ToggleWrapper enabled label="Toggle" />,
};

export const Disabled: StoryObj = {
  render: () => <ToggleWrapper disabled label="Toggle" />,
};

export const DisabledEnabled: StoryObj = {
  render: () => <ToggleWrapper enabled disabled label="Toggle" />,
};

export const SmallSize: StoryObj = {
  render: () => <ToggleWrapper enabled size="sm" label="Small" />,
};

export const MediumSize: StoryObj = {
  render: () => <ToggleWrapper enabled size="md" label="Medium" />,
};

export const LargeSize: StoryObj = {
  render: () => <ToggleWrapper enabled size="lg" label="Large" />,
};

export const GreenColor: StoryObj = {
  render: () => <ToggleWrapper enabled color="green" label="Green" />,
};

export const BlueColor: StoryObj = {
  render: () => <ToggleWrapper enabled color="blue" label="Blue" />,
};

export const AmberColor: StoryObj = {
  render: () => <ToggleWrapper enabled color="amber" label="Amber" />,
};

export const PurpleColor: StoryObj = {
  render: () => <ToggleWrapper enabled color="purple" label="Purple" />,
};

export const AllSizes: StoryObj = {
  render: function AllSizesRender() {
    const [sm, setSm] = useState(true);
    const [md, setMd] = useState(true);
    const [lg, setLg] = useState(true);

    return (
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={sm} onChange={setSm} size="sm" label="Small" />
          <span className="text-xs text-gray-500">Small</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={md} onChange={setMd} size="md" label="Medium" />
          <span className="text-xs text-gray-500">Medium</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={lg} onChange={setLg} size="lg" label="Large" />
          <span className="text-xs text-gray-500">Large</span>
        </div>
      </div>
    );
  },
};

export const AllColors: StoryObj = {
  render: function AllColorsRender() {
    const [green, setGreen] = useState(true);
    const [blue, setBlue] = useState(true);
    const [amber, setAmber] = useState(true);
    const [purple, setPurple] = useState(true);

    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={green} onChange={setGreen} color="green" label="Green" />
          <span className="text-xs text-gray-500">Green</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={blue} onChange={setBlue} color="blue" label="Blue" />
          <span className="text-xs text-gray-500">Blue</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={amber} onChange={setAmber} color="amber" label="Amber" />
          <span className="text-xs text-gray-500">Amber</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={purple} onChange={setPurple} color="purple" label="Purple" />
          <span className="text-xs text-gray-500">Purple</span>
        </div>
      </div>
    );
  },
};

export const ToggleField: StoryObj = {
  render: function ToggleFieldRender() {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="w-80 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <UIToggleField
          enabled={enabled}
          onChange={setEnabled}
          fieldLabel="Enable Feature"
          icon="⚙️"
        />
      </div>
    );
  },
};

export const ToggleFieldWithDescription: StoryObj = {
  render: function ToggleFieldDescRender() {
    const [enabled, setEnabled] = useState(true);

    return (
      <div className="w-80 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <UIToggleField
          enabled={enabled}
          onChange={setEnabled}
          fieldLabel="Beginner Mode"
          description="Tutorial tips + 2x timeout (120s)"
          icon="🎓"
        />
      </div>
    );
  },
};

export const SettingsPanelExample: StoryObj = {
  render: function SettingsExample() {
    const [sound, setSound] = useState(true);
    const [beginner, setBeginner] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);

    return (
      <div className="w-96 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Settings</h3>

        <UIToggleField
          enabled={sound}
          onChange={setSound}
          fieldLabel="Sound"
          icon={sound ? '🔊' : '🔇'}
        />

        <UIToggleField
          enabled={beginner}
          onChange={setBeginner}
          fieldLabel="Beginner Mode"
          description="Tutorial tips + 2x timeout (120s)"
          icon="🎓"
        />

        <UIToggleField
          enabled={darkMode}
          onChange={setDarkMode}
          fieldLabel="Dark Mode"
          icon={darkMode ? '🌙' : '☀️'}
        />

        <UIToggleField
          enabled={notifications}
          onChange={setNotifications}
          fieldLabel="Notifications"
          description="Receive alerts for game events"
          icon="🔔"
        />
      </div>
    );
  },
};

export const InteractiveDemo: StoryObj = {
  render: function InteractiveDemoRender() {
    const [enabled, setEnabled] = useState(false);
    const [count, setCount] = useState(0);

    const handleChange = (newEnabled: boolean) => {
      setEnabled(newEnabled);
      setCount((c) => c + 1);
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <UIToggle enabled={enabled} onChange={handleChange} size="lg" label="Demo Toggle" />
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300">
            State: <strong>{enabled ? 'ON' : 'OFF'}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Toggled {count} times</p>
        </div>
      </div>
    );
  },
};
