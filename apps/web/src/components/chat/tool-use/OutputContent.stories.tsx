import type { Meta, StoryObj } from '@storybook/react-vite';
import { OutputContent } from '../renderers/primitives.tsx';

const meta: Meta<typeof OutputContent> = {
  component: OutputContent,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 max-w-lg font-mono text-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OutputContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {
  args: {
    content: 'Build succeeded in 1.2s\n3 files compiled.',
  },
};

export const WithFilePaths: Story = {
  args: {
    content: 'Error in /src/auth/login.ts:42\n  Cannot find module ./session',
  },
};

export const ErrorOutput: Story = {
  args: {
    content: "TypeError: Cannot read property 'id' of undefined",
    isError: true,
  },
};

export const AnsiColored: Story = {
  args: {
    content: '[32m✓ Tests passed[0m\n[31m✗ 1 failed[0m',
  },
};
