/**
 * UISlider Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { UISlider, UISliderField, SliderSize, SliderColor } from '../UISlider';

const meta: Meta<typeof UISlider> = {
  title: 'UI/Form/UISlider',
  component: UISlider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

// Use a wrapper for interactive stories
function SliderWrapper(props: {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  color?: SliderColor;
  disabled?: boolean;
  label?: string;
}) {
  const [value, setValue] = useState(props.value ?? 50);
  return (
    <div className="w-64">
      <UISlider
        value={value}
        onChange={setValue}
        min={props.min}
        max={props.max}
        step={props.step}
        size={props.size}
        color={props.color}
        disabled={props.disabled}
        label={props.label}
      />
      <p className="text-center mt-2 text-sm text-gray-600">{value}</p>
    </div>
  );
}

export const Default: StoryObj = {
  render: () => <SliderWrapper label="Slider" />,
};

export const Disabled: StoryObj = {
  render: () => <SliderWrapper disabled label="Disabled Slider" />,
};

export const SmallSize: StoryObj = {
  render: () => <SliderWrapper size="sm" label="Small" />,
};

export const MediumSize: StoryObj = {
  render: () => <SliderWrapper size="md" label="Medium" />,
};

export const LargeSize: StoryObj = {
  render: () => <SliderWrapper size="lg" label="Large" />,
};

export const AmberColor: StoryObj = {
  render: () => <SliderWrapper value={75} color="amber" label="Amber" />,
};

export const BlueColor: StoryObj = {
  render: () => <SliderWrapper value={75} color="blue" label="Blue" />,
};

export const GreenColor: StoryObj = {
  render: () => <SliderWrapper value={75} color="green" label="Green" />,
};

export const PurpleColor: StoryObj = {
  render: () => <SliderWrapper value={75} color="purple" label="Purple" />,
};

export const AllSizes: StoryObj = {
  render: function AllSizesRender() {
    const [sm, setSm] = useState(50);
    const [md, setMd] = useState(50);
    const [lg, setLg] = useState(50);

    return (
      <div className="w-64 space-y-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">Small</p>
          <UISlider value={sm} onChange={setSm} size="sm" label="Small" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Medium</p>
          <UISlider value={md} onChange={setMd} size="md" label="Medium" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Large</p>
          <UISlider value={lg} onChange={setLg} size="lg" label="Large" />
        </div>
      </div>
    );
  },
};

export const AllColors: StoryObj = {
  render: function AllColorsRender() {
    const [amber, setAmber] = useState(75);
    const [blue, setBlue] = useState(75);
    const [green, setGreen] = useState(75);
    const [purple, setPurple] = useState(75);

    return (
      <div className="w-64 space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Amber</p>
          <UISlider value={amber} onChange={setAmber} color="amber" label="Amber" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Blue</p>
          <UISlider value={blue} onChange={setBlue} color="blue" label="Blue" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Green</p>
          <UISlider value={green} onChange={setGreen} color="green" label="Green" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Purple</p>
          <UISlider value={purple} onChange={setPurple} color="purple" label="Purple" />
        </div>
      </div>
    );
  },
};

export const SliderField: StoryObj = {
  render: function SliderFieldRender() {
    const [value, setValue] = useState(50);

    return (
      <div className="w-64 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <UISliderField
          value={value}
          onChange={setValue}
          fieldLabel="Volume"
          formatValue={(v) => `${v}%`}
        />
      </div>
    );
  },
};

export const SliderFieldValueBelow: StoryObj = {
  render: function SliderFieldBelowRender() {
    const [value, setValue] = useState(75);

    return (
      <div className="w-64 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <UISliderField
          value={value}
          onChange={setValue}
          fieldLabel="Brightness"
          valueLabelPosition="below"
          formatValue={(v) => `${v}%`}
        />
      </div>
    );
  },
};

export const SliderFieldNoLabel: StoryObj = {
  render: function SliderFieldNoLabelRender() {
    const [value, setValue] = useState(30);

    return (
      <div className="w-64 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <UISliderField
          value={value}
          onChange={setValue}
          fieldLabel="Speed"
          showValueLabel={false}
        />
      </div>
    );
  },
};

export const CustomRange: StoryObj = {
  render: function CustomRangeRender() {
    const [betAmount, setBetAmount] = useState(7);

    return (
      <div className="w-64 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <UISliderField
          value={betAmount}
          onChange={setBetAmount}
          min={7}
          max={12}
          step={1}
          fieldLabel="Bet Amount"
          formatValue={(v) => `${v} points`}
          color="purple"
        />
      </div>
    );
  },
};

export const DecimalStep: StoryObj = {
  render: function DecimalStepRender() {
    const [value, setValue] = useState(1.5);

    return (
      <div className="w-64 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <UISliderField
          value={value}
          onChange={setValue}
          min={0}
          max={3}
          step={0.1}
          fieldLabel="Speed Multiplier"
          formatValue={(v) => `${v.toFixed(1)}x`}
          color="blue"
        />
      </div>
    );
  },
};

export const SettingsPanelExample: StoryObj = {
  render: function SettingsExample() {
    const [volume, setVolume] = useState(80);
    const [brightness, setBrightness] = useState(100);
    const [gameSpeed, setGameSpeed] = useState(1.0);

    return (
      <div className="w-80 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Audio & Display</h3>

        <UISliderField
          value={volume}
          onChange={setVolume}
          fieldLabel="Master Volume"
          formatValue={(v) => `${v}%`}
          color="amber"
        />

        <UISliderField
          value={brightness}
          onChange={setBrightness}
          fieldLabel="Brightness"
          formatValue={(v) => `${v}%`}
          color="blue"
        />

        <UISliderField
          value={gameSpeed}
          onChange={setGameSpeed}
          min={0.5}
          max={2}
          step={0.1}
          fieldLabel="Animation Speed"
          formatValue={(v) => `${v.toFixed(1)}x`}
          color="green"
        />
      </div>
    );
  },
};

export const InteractiveDemo: StoryObj = {
  render: function InteractiveDemoRender() {
    const [value, setValue] = useState(50);

    return (
      <div className="flex flex-col items-center gap-6 w-80">
        <div className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <UISliderField
            value={value}
            onChange={setValue}
            fieldLabel="Adjust Value"
            size="lg"
            color="purple"
          />
        </div>

        <div className="text-center">
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
            {value}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Current Value
          </p>
        </div>

        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-200"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  },
};
