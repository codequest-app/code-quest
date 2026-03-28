import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { RewindPreview } from './RewindPreview';

const meta = {
  component: RewindPreview,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RewindPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFileDiffs: Story = {
  args: {
    data: {
      fileDiffs: {
        'src/index.ts': { oldContent: 'const x = 1;', newContent: 'const x = 2;' },
        'src/utils.ts': { oldContent: 'export {}', newContent: null },
        'src/new-feature.ts': { oldContent: null, newContent: 'export const feature = true;' },
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('src/index.ts'));
    const oldContent = await canvas.findByText('Old content');
    await expect(oldContent).toBeInTheDocument();
  },
};

export const RawJson: Story = {
  args: {
    data: {
      message: 'Rewind to message abc-123',
      messagesRemoved: 5,
      tokensFreed: 12000,
    },
  },
};

export const EmptyFileDiffs: Story = {
  args: {
    data: { fileDiffs: {} },
  },
};
