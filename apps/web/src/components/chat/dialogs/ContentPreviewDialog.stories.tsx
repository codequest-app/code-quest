import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { ContentPreviewDialog } from './ContentPreviewDialog.tsx';

const meta: Meta<typeof ContentPreviewDialog> = {
  component: ContentPreviewDialog,
  tags: ['autodocs'],
  args: { onClose: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="h-150 w-80 bg-surface text-text flex">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContentPreviewDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MarkdownContent: Story = {
  args: {
    content:
      '# Hello\n\nThis is a **markdown** preview with `code` and lists:\n\n- Item A\n- Item B',
  },
};

export const WithTitle: Story = {
  args: {
    content: '## Plan\n\nImplement the new feature.',
    title: 'Plan Preview',
  },
};

export const WithDiffs: Story = {
  args: {
    content: '',
    title: 'File Changes',
    diffs: [
      {
        filePath: 'src/index.ts',
        oldContent: 'const x = 1;\n',
        newContent: 'const x = 2;\n',
      },
    ],
  },
};

export const Close: Story = {
  args: { content: '# Hello', title: 'Preview' },
  play: async ({ args, userEvent }) => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole('button', { name: /close/i }));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};
