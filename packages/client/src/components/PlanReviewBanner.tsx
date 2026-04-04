import type { ControlPermissionResponse, PlanCommentData } from '@code-quest/shared';
import { useLayoutEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useChannelMessages } from '../contexts/channel';
import type { PendingControl } from '../types/chat';
import { pluralize } from '../utils/pluralize';
import { MarkdownContent } from './MarkdownContent';
import { PlanCommentOverlay } from './PlanCommentOverlay';

const planInputSchema = z.object({
  plan: z.string().optional(),
  allowedPrompts: z.array(z.record(z.string(), z.unknown())).optional(),
});

const formatComment = (c: PlanCommentData) => `[On "${c.selectedText}"]: ${c.comment}`;

interface PlanReviewBannerProps {
  pending: PendingControl;
  onRespond: (response: ControlPermissionResponse) => void;
}

export function PlanReviewBanner({ pending, onRespond }: PlanReviewBannerProps) {
  const parsed = planInputSchema.safeParse(pending.input);
  const plan = parsed.data?.plan;
  const allowedPrompts = parsed.data?.allowedPrompts;
  const [comment, setComment] = useState('');
  const lastRequestId = useRef<string | null>(null);
  const planContentRef = useRef<HTMLDivElement>(null);
  const { planComments, addPlanComment, clearPlanComments } = useChannelMessages();

  useLayoutEffect(() => {
    if (pending.requestId !== lastRequestId.current) {
      lastRequestId.current = pending.requestId;
      if (comment) setComment('');
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

  const handleReject = () => {
    const trimmedComment = comment.trim();
    const commentParts = [
      ...(trimmedComment ? [trimmedComment] : []),
      ...planComments.map(formatComment),
    ];
    clearPlanComments();
    onRespond({
      behavior: 'deny',
      message: commentParts.join('\n') || 'User chose to stay in plan mode and continue planning',
      interrupt: false,
    });
  };

  return (
    <div className="flex flex-col gap-3 bg-assistant/10 border border-assistant/20 rounded-md px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-assistant">📋 Plan Review</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            className="px-3 py-1.5 bg-success text-white rounded-md cursor-pointer text-[13px] font-medium transition-all hover:opacity-80"
          >
            Approve Plan
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="px-3 py-1.5 bg-warning text-white rounded-md cursor-pointer text-[13px] font-medium transition-all hover:opacity-80"
          >
            Continue Planning
          </button>
        </div>
      </div>
      {plan && (
        <details open>
          <summary className="cursor-pointer select-none text-sm text-text-muted hover:text-text transition-colors">
            Plan Content
            {planComments.length > 0 && (
              <span className="ml-2 text-xs text-accent">
                ({pluralize(planComments.length, 'comment')})
              </span>
            )}
          </summary>
          <div
            ref={planContentRef}
            className="relative mt-2 bg-black/20 rounded-lg px-4 py-3 border border-white/10 prose prose-invert prose-sm max-w-none"
          >
            <MarkdownContent content={plan} />
            <PlanCommentOverlay containerRef={planContentRef} onAddComment={addPlanComment} />
          </div>
        </details>
      )}
      <textarea
        placeholder="Add feedback..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="text-sm bg-black/20 rounded px-2 py-1 text-text border border-white/10 resize-y"
      />
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
    </div>
  );
}
