import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { DiffViewer } from './DiffViewer';

const meta = {
  component: DiffViewer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DiffViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const diff =
  '--- a/src/app.ts\n+++ b/src/app.ts\n@@ -1,3 +1,3 @@\n-const old = true;\n+const updated = true;\n const unchanged = 1;';

export const ReadOnly: Story = { args: { content: diff } };

export const Editable: Story = {
  args: {
    content: diff,
    editable: true,
    onAccept: fn(),
    onReject: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /accept/i }));
    await expect(args.onAccept).toHaveBeenCalledOnce();
  },
};

export const EditableReject: Story = {
  args: {
    content: diff,
    editable: true,
    onAccept: fn(),
    onReject: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /reject/i }));
    await expect(args.onReject).toHaveBeenCalledOnce();
  },
};

export const EditMode: Story = {
  args: {
    content: diff,
    editable: true,
    onAccept: fn(),
    onReject: fn(),
    onAcceptEdited: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /edit/i }));
    const textarea = canvas.getByRole('textbox');
    await expect(textarea).toBeInTheDocument();
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'const updated = true;\nconst unchanged = 1;');
    await userEvent.click(canvas.getByRole('button', { name: /apply edit/i }));
    await expect(args.onAcceptEdited).toHaveBeenCalledOnce();
  },
};

export const NoFileName: Story = {
  args: {
    content: '@@ -1,3 +1,3 @@\n-const old = true;\n+const updated = true;\n const unchanged = 1;',
    editable: true,
    onAccept: fn(),
    onReject: fn(),
  },
};
