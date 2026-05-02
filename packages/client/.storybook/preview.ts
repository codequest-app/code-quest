import '../src/App.css';
import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { TooltipProvider } from '../src/components/ui/Tooltip.tsx';

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(TooltipProvider, { delayDuration: 400 }, React.createElement(Story)),
  ],
  parameters: {
    // Phase 0 refactor-protection scope: report a11y violations but don't fail tests.
    // Flip to 'error' once the a11y debt follow-up lands.
    a11y: { test: 'todo' },
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1e1e1e' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
