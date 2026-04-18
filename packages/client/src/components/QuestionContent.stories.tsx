import type { Question } from '@code-quest/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { QuestionContent } from './QuestionContent';

const questions: Question[] = [
  {
    header: 'Framework',
    question: 'Which frontend framework?',
    multiSelect: false,
    options: [
      { label: 'React', description: 'JSX + hooks' },
      { label: 'Vue', description: 'SFCs' },
      { label: 'Svelte', description: 'Compiled' },
    ],
  },
  {
    header: 'Tools',
    question: 'Pick all testing tools you use.',
    multiSelect: true,
    options: [
      { label: 'Vitest', description: '' },
      { label: 'Jest', description: '' },
      { label: 'Playwright', description: '' },
    ],
  },
];

const meta = {
  component: QuestionContent,
  tags: ['autodocs'],
  args: { onAnswersChange: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuestionContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { questions } };
export const SingleQuestion: Story = { args: { questions: [questions[0]] } };
export const MultiSelect: Story = { args: { questions: [questions[1]] } };
