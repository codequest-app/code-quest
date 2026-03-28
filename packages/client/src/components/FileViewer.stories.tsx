import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileViewer } from './FileViewer';

const meta = {
  component: FileViewer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScript: Story = {
  args: {
    filePath: '/src/App.tsx',
    content:
      'import { useState } from "react";\n\nexport function App() {\n  return <div>Hello</div>;\n}',
  },
};
export const Loading: Story = { args: { filePath: '/src/utils.ts', loading: true } };
export const FileError: Story = { args: { filePath: '/nonexistent.ts', error: 'File not found' } };
