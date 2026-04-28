import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SideQuestionDialog } from './SideQuestionDialog';

const meta: Meta<typeof SideQuestionDialog> = {
  component: SideQuestionDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onClose: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="relative h-screen bg-bg text-text">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SideQuestionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { question: 'What is the capital of France?', answer: null, loading: true, error: null },
};
export const WithAnswer: Story = {
  args: {
    question: 'What is TypeScript?',
    answer:
      'TypeScript is **JavaScript with syntax for types**. It compiles to plain JavaScript and adds optional static typing.',
    loading: false,
    error: null,
  },
};
export const ErrorState: Story = {
  args: {
    question: 'Will this work?',
    answer: null,
    loading: false,
    error: 'Request failed: network unreachable',
  },
};
export const Closed: Story = {
  args: { open: false, question: '', answer: null, loading: false, error: null },
};
