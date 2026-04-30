import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { TruncatedContent } from './TruncatedContent';

const meta: Meta<typeof TruncatedContent> = {
  component: TruncatedContent,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text max-w-md p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TruncatedContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const longText = Array.from(
  { length: 50 },
  (_, i) => `Line ${i + 1}: Lorem ipsum dolor sit amet.`,
).join('\n');

const mediumText = Array.from(
  { length: 10 },
  (_, i) => `Line ${i + 1}: Some content that is near the threshold.`,
).join('\n');

export const ShortContent: Story = {
  args: {
    maxHeight: 200,
    children: <pre className="text-sm">{`Line 1: Short content\nLine 2: That fits`}</pre>,
  },
};

export const Overflowing: Story = {
  args: {
    maxHeight: 150,
    children: <pre className="text-sm whitespace-pre-wrap">{longText}</pre>,
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Show more')).toBeInTheDocument();
  },
};

export const CustomMaxHeight: Story = {
  args: {
    maxHeight: 80,
    children: <pre className="text-sm whitespace-pre-wrap">{mediumText}</pre>,
  },
};
