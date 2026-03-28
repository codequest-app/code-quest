import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { AskUserQuestionBanner } from './AskUserQuestionBanner';

const meta = {
  component: AskUserQuestionBanner,
  tags: ['autodocs'],
  args: { onRespond: fn(), input: {} },
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AskUserQuestionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSelect: Story = {
  args: {
    questions: [
      {
        question: 'Which database should we use?',
        header: 'Database',
        multiSelect: false,
        options: [
          { label: 'PostgreSQL', description: 'Relational database with strong ACID compliance' },
          { label: 'MongoDB', description: 'Document-oriented NoSQL database' },
          { label: 'SQLite', description: 'Lightweight embedded database' },
        ],
      },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: /PostgreSQL/i }));
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
    await expect(args.onRespond).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'allow' }),
    );
  },
};

export const MultiSelect: Story = {
  args: {
    questions: [
      {
        question: 'Which features do you want to enable?',
        header: 'Features',
        multiSelect: true,
        options: [
          { label: 'Authentication', description: 'User login and signup' },
          { label: 'Rate limiting', description: 'API request throttling' },
          { label: 'Logging', description: 'Request/response logging' },
        ],
      },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('checkbox', { name: /Authentication/i }));
    await userEvent.click(canvas.getByRole('checkbox', { name: /Logging/i }));
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
    await expect(args.onRespond).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'allow' }),
    );
  },
};

export const MultipleQuestions: Story = {
  args: {
    questions: [
      {
        question: 'Which framework?',
        header: 'Framework',
        multiSelect: false,
        options: [
          { label: 'Express', description: 'Minimal and flexible' },
          { label: 'Fastify', description: 'High performance' },
        ],
      },
      {
        question: 'Which test runner?',
        header: 'Testing',
        multiSelect: false,
        options: [
          { label: 'Vitest', description: 'Fast Vite-native testing' },
          { label: 'Jest', description: 'Widely used testing framework' },
        ],
      },
    ],
  },
};
