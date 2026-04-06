import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withStoryChannel } from '../test/story-decorator';
import { ReviewUpsellBanner } from './ReviewUpsellBanner';

const meta = {
  component: ReviewUpsellBanner,
  tags: ['autodocs'],
  decorators: [withStoryChannel({ className: 'max-w-2xl bg-surface text-text p-4' })],
} satisfies Meta<typeof ReviewUpsellBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('review-upsell-banner')).toBeInTheDocument();
    await expect(canvas.getByText(/try the new code review feature/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  },
};
