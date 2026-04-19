import type { PlanCommentData } from '@code-quest/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { fn } from 'storybook/test';
import { PlanCommentPopover } from './PlanCommentPopover';

const meta = {
  component: PlanCommentPopover,
  tags: ['autodocs'],
} satisfies Meta<typeof PlanCommentPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlanCommentDemo({ onAddComment }: { onAddComment: (c: PlanCommentData) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="bg-surface text-text p-6 relative" ref={containerRef}>
      <p className="text-sm leading-relaxed select-text">
        Select any text in this paragraph to trigger the comment overlay. The overlay appears
        anchored to your selection and lets you add a comment before approving the plan.
      </p>
      <PlanCommentPopover containerRef={containerRef} onAddComment={onAddComment} />
    </div>
  );
}

export const Interactive: Story = {
  args: {
    containerRef: { current: null },
    onAddComment: fn(),
  },
  render: () => <PlanCommentDemo onAddComment={fn()} />,
};
