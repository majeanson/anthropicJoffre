import type { Preview, Decorator } from '@storybook/react-vite';
import React from 'react';
import '../src/index.css'; // Import Tailwind CSS and skin system

// Import skin system
import { SkinProvider } from '../src/contexts/SkinContext';
import { applySkinToDocument, getSkin, skinList } from '../src/config/skins';

// Apply default skin on load
if (typeof document !== 'undefined') {
  applySkinToDocument(getSkin('midnight-alchemy'));
}

// Decorator to wrap all stories with SkinProvider
const withSkinProvider: Decorator = (Story, context) => {
  const skinId = context.globals.skin || 'midnight-alchemy';

  React.useEffect(() => {
    applySkinToDocument(getSkin(skinId));
  }, [skinId]);

  return React.createElement(
    SkinProvider,
    { defaultSkin: skinId },
    React.createElement(Story)
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // Disable default backgrounds, use skin system instead
    },
    layout: 'centered',
  },
  globalTypes: {
    skin: {
      name: 'Skin',
      description: 'UI Skin/Theme',
      defaultValue: 'midnight-alchemy',
      toolbar: {
        icon: 'paintbrush',
        items: skinList.map(s => ({
          value: s.id,
          title: `${s.name} ${s.isDark ? '(Dark)' : '(Light)'}`,
        })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [withSkinProvider],
};

export default preview;
