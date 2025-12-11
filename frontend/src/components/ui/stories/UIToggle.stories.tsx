/**
 * UIToggle Component Stories
 *
 * Toggle switches with multiple sizes and colors.
 * Adapts to the currently selected skin theme.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { UIToggle, UIToggleField } from '../UIToggle';

const meta: Meta<typeof UIToggle> = {
  title: 'UI/Form/UIToggle',
  component: UIToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# UI Toggle Component

Toggle switch with multiple sizes and colors. Adapts to the selected skin theme.

## Features
- **3 sizes**: Small, medium, large
- **4 colors**: Green, blue, amber, purple
- **Field variant**: With label and description

Use the skin selector in the toolbar to see how toggles adapt to different themes.
        `,
      },
    },
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
      <div className="flex items-center gap-6 p-4 rounded-lg bg-skin-primary">
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={sm} onChange={setSm} size="sm" label="Small" />
          <span className="text-xs text-skin-muted">Small</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={md} onChange={setMd} size="md" label="Medium" />
          <span className="text-xs text-skin-muted">Medium</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={lg} onChange={setLg} size="lg" label="Large" />
          <span className="text-xs text-skin-muted">Large</span>
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
      <div className="flex items-center gap-4 p-4 rounded-lg bg-skin-primary">
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={green} onChange={setGreen} color="green" label="Green" />
          <span className="text-xs text-skin-muted">Green</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={blue} onChange={setBlue} color="blue" label="Blue" />
          <span className="text-xs text-skin-muted">Blue</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={amber} onChange={setAmber} color="amber" label="Amber" />
          <span className="text-xs text-skin-muted">Amber</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UIToggle enabled={purple} onChange={setPurple} color="purple" label="Purple" />
          <span className="text-xs text-skin-muted">Purple</span>
        </div>
      </div>
    );
  },
};

export const ToggleField: StoryObj = {
  render: function ToggleFieldRender() {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="w-80 p-4 rounded-lg bg-skin-secondary border border-skin-default">
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
      <div className="w-80 p-4 rounded-lg bg-skin-secondary border border-skin-default">
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
      <div className="w-96 p-6 rounded-lg shadow-lg space-y-4 bg-skin-secondary border border-skin-default">
        <h3 className="text-lg font-bold text-skin-primary mb-4">Settings</h3>

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
      <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-skin-primary">
        <UIToggle enabled={enabled} onChange={handleChange} size="lg" label="Demo Toggle" />
        <div className="text-center">
          <p className="text-skin-primary">
            State: <strong>{enabled ? 'ON' : 'OFF'}</strong>
          </p>
          <p className="text-sm text-skin-muted">Toggled {count} times</p>
        </div>
      </div>
    );
  },
};
