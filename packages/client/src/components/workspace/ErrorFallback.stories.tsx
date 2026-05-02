import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { withStoryChannel } from '@/test/story-decorator';
import { ErrorFallback } from './ErrorFallback.tsx';

const meta: Meta<typeof ErrorFallback> = {
  component: ErrorFallback,
  tags: ['autodocs'],
  args: { resetErrorBoundary: fn() },
  decorators: [
    withStoryChannel({ className: 'h-100 bg-bg text-text flex items-center justify-center' }),
  ],
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { error: new Error('Failed to load component') },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText(/failed to load component/i)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /try again/i }));
    await expect(args.resetErrorBoundary).toHaveBeenCalledOnce();
  },
};

export const LongMessage: Story = {
  args: {
    error: new Error(
      'TypeError: Failed to access property "map" on undefined value at MessageList.tsx:42:18',
    ),
  },
};

export const UnknownError: Story = {
  args: { error: 'Something went wrong unexpectedly' },
};
