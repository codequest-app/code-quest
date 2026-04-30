import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withStoryChannel } from '../../../test/story-decorator';
import { PlanReviewBanner } from './PlanReviewBanner';

const PLAN_CONTENT =
  '# Plan: Add User Authentication\n\n## Context\nThe app needs login/logout functionality.\n\n## Steps\n1. Add login form component\n2. Implement JWT token handling\n3. Add protected route wrapper\n\n## Files\n| File | Change |\n|------|--------|\n| `src/Login.tsx` | New login form |\n| `src/auth.ts` | JWT utilities |';

const meta: Meta<typeof PlanReviewBanner> = {
  component: PlanReviewBanner,
  tags: ['autodocs'],
  args: { onRespond: fn() },
  decorators: [withStoryChannel({ className: 'max-w-3xl bg-surface text-text p-6' })],
} satisfies Meta<typeof PlanReviewBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state: plan fully visible, Approve + Continue Planning at the bottom */
export const Default: Story = {
  name: 'Default (plan visible)',
  args: {
    pending: {
      requestId: 'r1',
      subtype: 'exit_plan_mode',
      input: { plan: PLAN_CONTENT },
    },
  },
};

/** Scenario: textarea expanded after clicking Continue Planning */
export const ContinuePlanningExpanded: Story = {
  name: 'Continue Planning (expanded)',
  args: {
    pending: {
      requestId: 'r1',
      subtype: 'exit_plan_mode',
      input: { plan: PLAN_CONTENT },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /continue planning/i }));
    await expect(canvas.getByPlaceholderText(/add feedback/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /send feedback/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  },
};

/** Interactive: click through the full approve and continue-planning flows */
export const Interactive: Story = {
  name: 'Interactive',
  args: {
    pending: {
      requestId: 'r1',
      subtype: 'exit_plan_mode',
      input: {
        plan: PLAN_CONTENT,
        allowedPrompts: [{ tool: 'Bash', prompt: 'run tests' }],
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Expand feedback, type, then cancel
    await userEvent.click(canvas.getByRole('button', { name: /continue planning/i }));
    await userEvent.type(canvas.getByPlaceholderText(/add feedback/i), 'Please add error handling');
    await userEvent.click(canvas.getByRole('button', { name: /cancel/i }));
    await expect(canvas.queryByPlaceholderText(/add feedback/i)).not.toBeInTheDocument();

    // Expand again, send feedback
    await userEvent.click(canvas.getByRole('button', { name: /continue planning/i }));
    await userEvent.type(canvas.getByPlaceholderText(/add feedback/i), 'Please add tests');
    await userEvent.click(canvas.getByRole('button', { name: /send feedback/i }));
    await expect(args.onRespond).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'deny', message: 'Please add tests' }),
    );
  },
};

/** With allowed prompts but no plan content */
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
