import type { Meta, StoryObj } from '@storybook/react-vite';
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
};
