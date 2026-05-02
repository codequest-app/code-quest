import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { fn } from 'storybook/test';
import { PlanCommentPopover } from './PlanCommentPopover.tsx';

const meta: Meta<typeof PlanCommentPopover> = {
  component: PlanCommentPopover,
  tags: ['autodocs'],
} satisfies Meta<typeof PlanCommentPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlanCommentDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="bg-surface text-text p-6 relative" ref={containerRef}>
      <p className="text-sm leading-relaxed select-text">
        Select any text in this paragraph to trigger the comment overlay. The overlay appears
        anchored to your selection and lets you add a comment before approving the plan.
      </p>
      <PlanCommentPopover containerRef={containerRef} onAddComment={fn()} />
    </div>
  );
}

export const Interactive: Story = {
  args: { containerRef: { current: null }, onAddComment: fn() },
  render: () => <PlanCommentDemo />,
};

function PlanCommentMultiParagraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="bg-surface text-text p-6 relative max-w-lg" ref={containerRef}>
      <p className="text-sm leading-relaxed select-text mb-3">
        First paragraph: The system will read all files in the repository and index them.
      </p>
      <p className="text-sm leading-relaxed select-text mb-3">
        Second paragraph: Then it will run static analysis to detect potential issues.
      </p>
      <p className="text-sm leading-relaxed select-text">
        Third paragraph: Finally it will generate a summary report with recommendations.
      </p>
      <PlanCommentPopover containerRef={containerRef} onAddComment={fn()} />
    </div>
  );
}

export const MultiParagraph: Story = {
  args: { containerRef: { current: null }, onAddComment: fn() },
  render: () => <PlanCommentMultiParagraph />,
};
