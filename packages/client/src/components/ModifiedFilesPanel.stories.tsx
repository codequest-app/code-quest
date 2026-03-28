import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ModifiedFilesPanel } from './ModifiedFilesPanel';

const meta = {
  component: ModifiedFilesPanel,
  tags: ['autodocs'],
  args: { onAccept: fn(), onRewind: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-surface text-text p-6 font-mono">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ModifiedFilesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    files: [
      {
        path: 'src/app.ts',
        status: 'modified',
        oldContent: 'const a = 1;\nconst b = 2;\n',
        newContent: 'const a = 42;\nconst b = 2;\n',
      },
      {
        path: 'src/new-file.ts',
        status: 'added',
        newContent: 'export function hello() {\n  return "world";\n}\n',
      },
      { path: 'src/removed.ts', status: 'deleted', oldContent: 'export const gone = true;\n' },
    ],
  },
};

export const SingleFile: Story = {
  args: {
    files: [
      {
        path: 'config.json',
        status: 'modified',
        oldContent: '{"key": "old"}',
        newContent: '{"key": "new"}',
      },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('config.json'));
    await userEvent.click(canvas.getByRole('button', { name: /accept/i }));
    await expect(args.onAccept).toHaveBeenCalledWith('config.json');
  },
};

export const RewindFile: Story = {
  args: {
    files: [
      {
        path: 'src/app.ts',
        status: 'modified',
        oldContent: 'const a = 1;\n',
        newContent: 'const a = 42;\n',
      },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('src/app.ts'));
    await userEvent.click(canvas.getByRole('button', { name: /rewind/i }));
    await expect(args.onRewind).toHaveBeenCalledWith('src/app.ts');
  },
};
