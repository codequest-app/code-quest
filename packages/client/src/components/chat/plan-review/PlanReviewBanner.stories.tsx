import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { withStoryChannel } from '../../../test/story-decorator';
import { PlanReviewBanner } from './PlanReviewBanner';

const meta: Meta<typeof PlanReviewBanner> = {
  component: PlanReviewBanner,
  tags: ['autodocs'],
  args: { onRespond: fn() },
  decorators: [withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' })],
} satisfies Meta<typeof PlanReviewBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pending: { requestId: 'r1', subtype: 'exit_plan_mode' },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /approve plan/i }));
    await expect(args.onRespond).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'allow' }),
    );
  },
};

export const WithAllowedPrompts: Story = {
  args: {
    pending: {
      requestId: 'r1',
      subtype: 'exit_plan_mode',
      input: {
        allowedPrompts: [
          { tool: 'Bash', prompt: 'run tests' },
          { tool: 'Bash', prompt: 'install dependencies' },
        ],
      },
    },
  },
};

export const NoPermissions: Story = {
  args: {
    pending: {
      requestId: 'r1',
      subtype: 'exit_plan_mode',
      input: { allowedPrompts: [] },
    },
  },
};

export const WithPlanContent: Story = {
  name: 'With Plan Preview',
  args: {
    pending: {
      requestId: 'r1',
      subtype: 'exit_plan_mode',
      input: {
        plan: '# Plan: Add User Authentication\n\n## Context\nThe app needs login/logout functionality.\n\n## Steps\n1. Add login form component\n2. Implement JWT token handling\n3. Add protected route wrapper\n\n## Files\n| File | Change |\n|------|--------|\n| `src/Login.tsx` | New login form |\n| `src/auth.ts` | JWT utilities |\n\n```tsx\nfunction LoginForm() {\n  return <form>...</form>;\n}\n```',
        allowedPrompts: [
          { tool: 'Bash', prompt: 'run tests' },
          { tool: 'Bash', prompt: 'install dependencies' },
        ],
      },
    },
  },
};

export const WithComment: Story = {
  name: 'With Feedback Comment',
  args: {
    pending: {
      requestId: 'r1',
      subtype: 'exit_plan_mode',
      input: {
        allowedPrompts: [{ tool: 'Bash', prompt: 'run tests' }],
      },
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByPlaceholderText(/add feedback/i), 'Please add error handling');
    await userEvent.click(canvas.getByRole('button', { name: /continue planning/i }));
    await expect(args.onRespond).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'deny' }),
    );
  },
};
