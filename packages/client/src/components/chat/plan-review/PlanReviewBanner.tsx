import type {
  ControlPermissionResponse,
  PendingControl,
  PlanCommentData,
} from '@code-quest/shared';
import { planInputSchema } from '@code-quest/shared';
import { useLayoutEffect, useRef, useState } from 'react';
import { useChannelMessages } from '../../../contexts/channel';
import { pluralize } from '../../../utils/pluralize';
import { Button } from '../../ui/Button';
import { MarkdownContent } from '../renderers/MarkdownContent';
import { PlanCommentPopover } from './PlanCommentPopover';

const formatComment = (c: PlanCommentData) => `[On "${c.selectedText}"]: ${c.comment}`;

interface PlanReviewBannerProps {
  pending: PendingControl;
  onRespond: (response: ControlPermissionResponse) => void;
}

export function PlanReviewBanner({ pending, onRespond }: PlanReviewBannerProps): React.JSX.Element {
  const parsed = planInputSchema.safeParse(pending.input);
  const plan = parsed.data?.plan;
  const allowedPrompts = parsed.data?.allowedPrompts;
  const [comment, setComment] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const lastRequestId = useRef<string | null>(null);
  const planContentRef = useRef<HTMLDivElement>(null);
  const { planComments, addPlanComment, clearPlanComments } = useChannelMessages();

  useLayoutEffect(() => {
    if (pending.requestId !== lastRequestId.current) {
      lastRequestId.current = pending.requestId;
      if (comment) setComment('');
      if (feedbackOpen) setFeedbackOpen(false);
    }
  });

  const handleApprove = () => {
    const userFeedback =
      planComments.length > 0 ? planComments.map(formatComment).join('\n') : undefined;
    clearPlanComments();
    onRespond({
      behavior: 'allow',
      updatedInput: pending.input ?? {},
      ...(userFeedback !== undefined ? { userFeedback } : {}),
    });
  };

  const handleSendFeedback = () => {
    const trimmedComment = comment.trim();
    const commentParts = [
      ...(trimmedComment ? [trimmedComment] : []),
      ...planComments.map(formatComment),
    ];
    clearPlanComments();
    setFeedbackOpen(false);
    onRespond({
      behavior: 'deny',
      message: commentParts.join('\n') || 'User chose to stay in plan mode and continue planning',
      interrupt: false,
    });
  };

  return (
    <div className="flex flex-col gap-3 bg-assistant/10 border border-assistant/20 rounded-md px-4 py-3">
      <div className="flex items-center">
        <span className="text-sm font-medium text-assistant">
          📋 Plan Review
          {planComments.length > 0 && (
            <span className="ml-2 text-xs text-accent font-normal">
              ({pluralize(planComments.length, 'comment')})
            </span>
          )}
        </span>
      </div>

      {plan && (
        <div
          ref={planContentRef}
          className="relative bg-input-overlay rounded-lg px-4 py-3 border border-white/10 prose prose-invert prose-sm max-w-none"
        >
          <MarkdownContent content={plan} />
          <PlanCommentPopover containerRef={planContentRef} onAddComment={addPlanComment} />
        </div>
      )}

      {allowedPrompts && allowedPrompts.length > 0 && (
        <div className="text-xs text-text-muted">
          <span className="font-medium">Requested permissions: </span>
          {allowedPrompts.map((p) => {
            const label = String(p.prompt ?? p.tool ?? JSON.stringify(p));
            return (
              <span
                key={label}
                className="inline-block bg-white/5 rounded px-1.5 py-0.5 mr-1 mt-0.5"
              >
                {label}
              </span>
            );
          })}
        </div>
      )}

      {feedbackOpen && (
        <textarea
          placeholder="Add feedback..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="text-sm bg-input-overlay rounded px-2 py-1 text-text border border-white/10 resize-y"
          // biome-ignore lint/a11y/noAutofocus: focus is intentional when expanding inline
          autoFocus
        />
      )}

      <div className="flex justify-end gap-2">
        {feedbackOpen ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md"
              onClick={() => {
                setComment('');
                setFeedbackOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-md font-medium"
              onClick={handleSendFeedback}
            >
              Send Feedback
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-md font-medium"
              onClick={() => setFeedbackOpen(true)}
            >
              Continue Planning
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-md font-medium"
              onClick={handleApprove}
            >
              Approve Plan
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
